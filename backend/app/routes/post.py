from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import ApiKey, Media, Post, User
from app.models.social_connection import SocialConnection
from app.schemas.schemas import (
    PlatformPostResult,
    PostAllRequest,
    PostAllResponse,
    PostToPlatformRequest,
)
from app.security import get_current_user
from app.services import linkedin_service, reddit_service, twitter_service, bluesky_service, mastodon_service
from app.services.encryption import decrypt_value, encrypt_value
from app.plans import require_plan

router = APIRouter(prefix="/api/post", tags=["post"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_keys(db: Session, user_id: int, platform: str) -> dict:
    rows = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == user_id, ApiKey.platform == platform)
        .all()
    )
    return {row.key_name: decrypt_value(row.encrypted_value) for row in rows}


def _get_social_connection(db: Session, user_id: int, platform: str) -> Optional[SocialConnection]:
    return (
        db.query(SocialConnection)
        .filter(SocialConnection.user_id == user_id, SocialConnection.platform == platform)
        .first()
    )


def _resolve_media_paths(db: Session, user_id: int, media_ids: Optional[list[int]]) -> list[str]:
    if not media_ids:
        return []
    paths = []
    for mid in media_ids:
        media = db.query(Media).filter(Media.id == mid, Media.user_id == user_id).first()
        if media:
            paths.append(media.filepath)
    return paths


def _update_post_record(
    db: Session,
    user_id: int,
    post_id: Optional[int],
    platform: str,
    content: str,
    post_url: str,
) -> None:
    if post_id:
        post = db.query(Post).filter(Post.id == post_id, Post.user_id == user_id).first()
    else:
        post = None

    if post:
        post.final_content = content
        post.posted = True
        post.posted_at = datetime.utcnow()
        post.post_url = post_url
    else:
        post = Post(
            user_id=user_id,
            platform=platform,
            final_content=content,
            posted=True,
            posted_at=datetime.utcnow(),
            post_url=post_url,
            created_at=datetime.utcnow(),
        )
        db.add(post)

    db.commit()


# ── Routes ────────────────────────────────────────────────────────────────────

# NOTE: /all must be defined BEFORE /{platform}
@router.post("/all", response_model=PostAllResponse)
def post_all(
    payload: PostAllRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "starter", "Direct posting")

    results: list[PlatformPostResult] = []
    for platform, post_data in payload.posts.items():
        req = PostToPlatformRequest(
            content=post_data.get("content", ""),
            post_id=post_data.get("post_id"),
            media_ids=post_data.get("media_ids"),
            options=post_data.get("options", {}),
        )
        results.append(_do_post(platform, req, db, current_user))
    return PostAllResponse(results=results)


@router.post("/{platform}", response_model=PlatformPostResult)
def post_to_platform(
    platform: str,
    payload: PostToPlatformRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "starter", "Direct posting")

    result = _do_post(platform, payload, db, current_user)
    if not result.success:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=result.error)
    return result


# ── Dispatch ──────────────────────────────────────────────────────────────────

def _do_post(
    platform: str,
    payload: PostToPlatformRequest,
    db: Session,
    current_user: User,
) -> PlatformPostResult:
    media_paths = _resolve_media_paths(db, current_user.id, payload.media_ids)

    try:
        if platform == "twitter":
            conn = _get_social_connection(db, current_user.id, "twitter")
            if not conn or not conn.access_token_enc:
                return PlatformPostResult(
                    platform=platform, success=False,
                    error="X/Twitter not connected. Click 'Connect with X' in Settings.",
                )
            result_data = _post_twitter_oauth2(conn, payload, media_paths, db)

        elif platform == "linkedin":
            conn = _get_social_connection(db, current_user.id, "linkedin")
            if not conn or not conn.access_token_enc:
                return PlatformPostResult(
                    platform=platform, success=False,
                    error="LinkedIn not connected. Click 'Connect with LinkedIn' in Settings.",
                )
            result_data = _post_linkedin(conn, payload, media_paths)

        elif platform == "reddit":
            conn = _get_social_connection(db, current_user.id, "reddit")
            if not conn or not conn.access_token_enc:
                return PlatformPostResult(
                    platform=platform, success=False,
                    error="Reddit not connected. Click 'Connect with Reddit' in Settings.",
                )
            result_data = _post_reddit(conn, payload, media_paths)

        elif platform == "bluesky":
            conn = _get_social_connection(db, current_user.id, "bluesky")
            if not conn or not conn.access_token_enc:
                return PlatformPostResult(
                    platform=platform, success=False,
                    error="Bluesky not connected. Add your handle & app password in Settings.",
                )
            result_data = _post_bluesky(conn, payload, media_paths)

        elif platform == "mastodon":
            conn = _get_social_connection(db, current_user.id, "mastodon")
            if not conn or not conn.access_token_enc or not conn.instance_url:
                return PlatformPostResult(
                    platform=platform, success=False,
                    error="Mastodon not connected. Click 'Connect with Mastodon' in Settings.",
                )
            result_data = _post_mastodon(conn, payload, media_paths)

        elif platform in ("instagram", "whatsapp"):
            return PlatformPostResult(
                platform=platform, success=False,
                error=(
                    f"{platform.capitalize()} does not support direct API posting. "
                    "Use the copy-to-clipboard or share link in the app instead."
                ),
            )
        else:
            return PlatformPostResult(
                platform=platform, success=False,
                error=f"Unknown platform '{platform}'.",
            )
    except Exception as exc:
        return PlatformPostResult(platform=platform, success=False, error=str(exc))

    post_url = result_data.get("post_url", "")
    _update_post_record(db, current_user.id, payload.post_id, platform, payload.content, post_url)
    return PlatformPostResult(platform=platform, success=True, post_url=post_url)


def _post_twitter_oauth2(
    conn: SocialConnection,
    payload: PostToPlatformRequest,
    media_paths: list[str],
    db: Session,
) -> dict:
    """Post to X/Twitter using OAuth 2.0 user token. Auto-refreshes on 401."""
    from app.config import settings as cfg

    access_token  = decrypt_value(conn.access_token_enc)
    refresh_token = decrypt_value(conn.refresh_token_enc) if conn.refresh_token_enc else None

    thread_tweets: list[str] = payload.options.get("thread_tweets", [])

    def _do_tweet(token: str) -> dict:
        if thread_tweets:
            return twitter_service.post_thread_oauth2(token, thread_tweets, media_paths or None)
        return twitter_service.post_tweet_oauth2(token, payload.content, media_paths or None)

    try:
        return _do_tweet(access_token)
    except ValueError as exc:
        if str(exc) != "TOKEN_EXPIRED" or not refresh_token:
            raise
        # Token expired — refresh and retry once
        new_tokens = twitter_service.refresh_oauth2_token(
            refresh_token, cfg.TWITTER_CLIENT_ID, cfg.TWITTER_CLIENT_SECRET
        )
        conn.access_token_enc = encrypt_value(new_tokens["access_token"])
        conn.refresh_token_enc = encrypt_value(new_tokens["refresh_token"])
        db.commit()
        return _do_tweet(new_tokens["access_token"])


def _post_linkedin(conn: SocialConnection, payload: PostToPlatformRequest, media_paths: list[str]) -> dict:
    access_token = decrypt_value(conn.access_token_enc)
    return linkedin_service.post_to_linkedin(
        access_token=access_token,
        content=payload.content,
        media_paths=media_paths or None,
    )


def _post_reddit(conn: SocialConnection, payload: PostToPlatformRequest, media_paths: list[str]) -> dict:
    from app.config import settings as cfg
    subreddit = payload.options.get("subreddit")
    title = payload.options.get("title")
    if not subreddit:
        raise ValueError("Reddit posting requires 'subreddit' in options.")
    if not title:
        raise ValueError("Reddit posting requires 'title' in options.")

    access_token  = decrypt_value(conn.access_token_enc)
    refresh_token = decrypt_value(conn.refresh_token_enc) if conn.refresh_token_enc else None
    media_path    = media_paths[0] if media_paths else None

    return reddit_service.post_to_reddit_oauth(
        client_id=cfg.REDDIT_CLIENT_ID,
        client_secret=cfg.REDDIT_CLIENT_SECRET,
        access_token=access_token,
        refresh_token=refresh_token,
        subreddit=subreddit,
        title=title,
        content=payload.content,
        media_path=media_path,
    )


def _post_bluesky(conn: SocialConnection, payload: PostToPlatformRequest, media_paths: list[str]) -> dict:
    session_string = decrypt_value(conn.access_token_enc)
    return bluesky_service.post_to_bluesky(
        session_string=session_string,
        content=payload.content,
        media_paths=media_paths or None,
    )


def _post_mastodon(conn: SocialConnection, payload: PostToPlatformRequest, media_paths: list[str]) -> dict:
    access_token = decrypt_value(conn.access_token_enc)
    visibility = payload.options.get("visibility", "public")
    return mastodon_service.post_to_mastodon(
        instance_url=conn.instance_url,
        access_token=access_token,
        content=payload.content,
        media_paths=media_paths or None,
        visibility=visibility,
    )
