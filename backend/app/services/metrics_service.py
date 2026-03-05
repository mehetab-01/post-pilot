"""
Metrics Service — fetch engagement data from platform APIs and store in PostMetrics.
"""

from datetime import datetime, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.models.models import Post, PostMetrics
from app.models.social_connection import SocialConnection
from app.services.encryption import decrypt_value


# ── Platform-specific metric fetchers ─────────────────────────────────────────

def _fetch_twitter_metrics(post_url: str, access_token: str) -> Optional[dict]:
    """Fetch tweet metrics via X API v2."""
    # Extract tweet_id from URL like https://x.com/user/status/12345
    parts = post_url.rstrip("/").split("/")
    tweet_id = parts[-1] if parts else None
    if not tweet_id:
        return None

    try:
        with httpx.Client(timeout=15) as client:
            resp = client.get(
                f"https://api.x.com/2/tweets/{tweet_id}",
                params={"tweet.fields": "public_metrics"},
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                return None
            metrics = resp.json().get("data", {}).get("public_metrics", {})
            return {
                "impressions": metrics.get("impression_count", 0),
                "likes": metrics.get("like_count", 0),
                "shares": metrics.get("retweet_count", 0) + metrics.get("quote_count", 0),
                "comments": metrics.get("reply_count", 0),
            }
    except Exception:
        return None


def _fetch_linkedin_metrics(post_url: str, access_token: str) -> Optional[dict]:
    """Fetch LinkedIn post metrics. Limited — personal API has restricted access."""
    # LinkedIn metrics are very limited for personal accounts
    # Return placeholder to indicate we tried
    return None


def _fetch_reddit_metrics(post_url: str, access_token: str) -> Optional[dict]:
    """Fetch Reddit post metrics."""
    if not post_url:
        return None
    try:
        # Reddit JSON endpoint
        json_url = post_url.rstrip("/") + ".json"
        with httpx.Client(timeout=15) as client:
            resp = client.get(
                json_url,
                headers={
                    "User-Agent": "PostPilot/1.0",
                    "Authorization": f"Bearer {access_token}" if access_token else "",
                },
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            post_data = data[0]["data"]["children"][0]["data"]
            return {
                "impressions": 0,  # Reddit doesn't expose impressions
                "likes": post_data.get("score", 0),
                "shares": 0,
                "comments": post_data.get("num_comments", 0),
            }
    except Exception:
        return None


def _fetch_bluesky_metrics(post_url: str, session_string: str) -> Optional[dict]:
    """Fetch Bluesky post metrics via AT Protocol."""
    if not post_url:
        return None
    try:
        from atproto import Client
        client = Client()
        client.login_with_session_string(session_string)

        # Extract AT URI from post URL
        # URL format: https://bsky.app/profile/did/post/rkey
        parts = post_url.rstrip("/").split("/")
        if len(parts) >= 2:
            did = parts[-3] if len(parts) >= 4 else parts[-2]
            rkey = parts[-1]
            uri = f"at://{did}/app.bsky.feed.post/{rkey}"

            resp = client.get_post_thread({"uri": uri, "depth": 0})
            post_data = resp.thread.post
            return {
                "impressions": 0,
                "likes": post_data.like_count or 0,
                "shares": post_data.repost_count or 0,
                "comments": post_data.reply_count or 0,
            }
    except Exception:
        return None
    return None


def _fetch_mastodon_metrics(post_url: str, instance_url: str, access_token: str) -> Optional[dict]:
    """Fetch Mastodon status metrics."""
    if not post_url:
        return None
    try:
        # Extract status ID from URL like https://mastodon.social/@user/12345
        parts = post_url.rstrip("/").split("/")
        status_id = parts[-1] if parts else None
        if not status_id:
            return None

        with httpx.Client(timeout=15) as client:
            resp = client.get(
                f"{instance_url}/api/v1/statuses/{status_id}",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            return {
                "impressions": 0,
                "likes": data.get("favourites_count", 0),
                "shares": data.get("reblogs_count", 0),
                "comments": data.get("replies_count", 0),
            }
    except Exception:
        return None


# ── Core ──────────────────────────────────────────────────────────────────────

def fetch_metrics_for_post(post: Post, db: Session) -> Optional[PostMetrics]:
    """Fetch current metrics for a post from its platform API and store them."""
    if not post.post_url or not post.posted:
        return None

    platform = post.platform
    user_id = post.user_id

    # Get the user's OAuth connection for this platform
    conn = (
        db.query(SocialConnection)
        .filter(SocialConnection.user_id == user_id, SocialConnection.platform == platform)
        .first()
    )
    if not conn:
        return None

    token = decrypt_value(conn.encrypted_token)
    metrics = None

    if platform == "twitter":
        metrics = _fetch_twitter_metrics(post.post_url, token)
    elif platform == "reddit":
        metrics = _fetch_reddit_metrics(post.post_url, token)
    elif platform == "bluesky":
        metrics = _fetch_bluesky_metrics(post.post_url, token)
    elif platform == "mastodon":
        instance_url = conn.instance_url or "https://mastodon.social"
        metrics = _fetch_mastodon_metrics(post.post_url, instance_url, token)
    elif platform == "linkedin":
        metrics = _fetch_linkedin_metrics(post.post_url, token)

    if not metrics:
        return None

    total_eng = metrics["likes"] + metrics["shares"] + metrics["comments"]
    impressions = metrics["impressions"]
    eng_rate = f"{(total_eng / impressions * 100):.1f}" if impressions > 0 else "0.0"

    pm = PostMetrics(
        post_id=post.id,
        platform=platform,
        impressions=impressions,
        likes=metrics["likes"],
        shares=metrics["shares"],
        comments=metrics["comments"],
        engagement_rate=eng_rate,
    )
    db.add(pm)
    db.commit()
    db.refresh(pm)
    return pm


def fetch_all_due_metrics(db: Session, max_age_days: int = 30) -> int:
    """Fetch metrics for all posted posts within the last max_age_days that
    haven't been fetched in the last 6 hours. Returns count of successful fetches."""
    cutoff = datetime.utcnow() - timedelta(days=max_age_days)
    six_hours_ago = datetime.utcnow() - timedelta(hours=6)

    posts = (
        db.query(Post)
        .filter(
            Post.posted == True,  # noqa: E712
            Post.post_url.isnot(None),
            Post.posted_at >= cutoff,
        )
        .all()
    )

    count = 0
    for post in posts:
        latest = (
            db.query(PostMetrics)
            .filter(PostMetrics.post_id == post.id)
            .order_by(PostMetrics.fetched_at.desc())
            .first()
        )
        if latest and latest.fetched_at >= six_hours_ago:
            continue

        result = fetch_metrics_for_post(post, db)
        if result:
            count += 1

    return count
