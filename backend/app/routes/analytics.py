"""
Analytics routes — engagement data for posted content.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Post, PostMetrics, User
from app.plans import get_plan_config
from app.security import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _analytics_days(plan: str) -> int:
    return {"free": 0, "starter": 7, "pro": 30}.get(plan, 0)


@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = current_user.plan or "free"
    days = _analytics_days(plan)
    if days == 0:
        raise HTTPException(status_code=403, detail={
            "error": "feature_locked",
            "message": "Analytics requires a Starter plan or higher.",
            "required_plan": "starter",
        })

    cutoff = datetime.utcnow() - timedelta(days=days)

    # Get latest metrics per post (the most recent row per post_id)
    from sqlalchemy import distinct
    latest_metrics = (
        db.query(
            PostMetrics.post_id,
            func.max(PostMetrics.fetched_at).label("latest_fetch"),
        )
        .filter(PostMetrics.fetched_at >= cutoff)
        .group_by(PostMetrics.post_id)
        .subquery()
    )

    metrics = (
        db.query(PostMetrics)
        .join(latest_metrics, (PostMetrics.post_id == latest_metrics.c.post_id) & (PostMetrics.fetched_at == latest_metrics.c.latest_fetch))
        .join(Post, Post.id == PostMetrics.post_id)
        .filter(Post.user_id == current_user.id)
        .all()
    )

    if not metrics:
        return {
            "total_impressions": 0,
            "total_likes": 0,
            "total_shares": 0,
            "total_comments": 0,
            "avg_engagement_rate": "0.0",
            "best_post": None,
            "platform_breakdown": {},
            "days": days,
        }

    total_impressions = sum(m.impressions for m in metrics)
    total_likes = sum(m.likes for m in metrics)
    total_shares = sum(m.shares for m in metrics)
    total_comments = sum(m.comments for m in metrics)

    rates = [float(m.engagement_rate or 0) for m in metrics]
    avg_rate = f"{sum(rates) / len(rates):.1f}" if rates else "0.0"

    # Best post by total engagement
    best = max(metrics, key=lambda m: m.likes + m.shares + m.comments)
    best_post_obj = db.query(Post).get(best.post_id)

    # Platform breakdown
    breakdown = {}
    for m in metrics:
        if m.platform not in breakdown:
            breakdown[m.platform] = {"impressions": 0, "likes": 0, "shares": 0, "comments": 0, "count": 0}
        breakdown[m.platform]["impressions"] += m.impressions
        breakdown[m.platform]["likes"] += m.likes
        breakdown[m.platform]["shares"] += m.shares
        breakdown[m.platform]["comments"] += m.comments
        breakdown[m.platform]["count"] += 1

    return {
        "total_impressions": total_impressions,
        "total_likes": total_likes,
        "total_shares": total_shares,
        "total_comments": total_comments,
        "avg_engagement_rate": avg_rate,
        "best_post": {
            "id": best_post_obj.id,
            "platform": best_post_obj.platform,
            "content": (best_post_obj.final_content or best_post_obj.generated_content or "")[:200],
            "post_url": best_post_obj.post_url,
            "likes": best.likes,
            "shares": best.shares,
            "comments": best.comments,
        } if best_post_obj else None,
        "platform_breakdown": breakdown,
        "days": days,
    }


@router.get("/posts")
def get_analytics_posts(
    sort: str = Query("engagement", regex="^(engagement|likes|impressions|recent)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = current_user.plan or "free"
    days = _analytics_days(plan)
    if days == 0:
        raise HTTPException(status_code=403, detail={
            "error": "feature_locked",
            "message": "Analytics requires a Starter plan or higher.",
            "required_plan": "starter",
        })

    cutoff = datetime.utcnow() - timedelta(days=days)

    posts = (
        db.query(Post)
        .filter(
            Post.user_id == current_user.id,
            Post.posted == True,  # noqa: E712
            Post.posted_at >= cutoff,
        )
        .order_by(Post.posted_at.desc())
        .limit(50)
        .all()
    )

    results = []
    for post in posts:
        latest = (
            db.query(PostMetrics)
            .filter(PostMetrics.post_id == post.id)
            .order_by(PostMetrics.fetched_at.desc())
            .first()
        )
        results.append({
            "id": post.id,
            "platform": post.platform,
            "content": (post.final_content or post.generated_content or "")[:200],
            "post_url": post.post_url,
            "posted_at": post.posted_at.isoformat() if post.posted_at else None,
            "metrics": {
                "impressions": latest.impressions if latest else 0,
                "likes": latest.likes if latest else 0,
                "shares": latest.shares if latest else 0,
                "comments": latest.comments if latest else 0,
                "engagement_rate": latest.engagement_rate if latest else "0.0",
                "fetched_at": latest.fetched_at.isoformat() if latest else None,
            },
        })

    # Sort
    if sort == "engagement":
        results.sort(key=lambda r: r["metrics"]["likes"] + r["metrics"]["shares"] + r["metrics"]["comments"], reverse=True)
    elif sort == "likes":
        results.sort(key=lambda r: r["metrics"]["likes"], reverse=True)
    elif sort == "impressions":
        results.sort(key=lambda r: r["metrics"]["impressions"], reverse=True)
    # "recent" already sorted by posted_at desc

    return results


@router.get("/trends")
def get_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = current_user.plan or "free"
    if plan != "pro":
        raise HTTPException(status_code=403, detail={
            "error": "feature_locked",
            "message": "Trends require a Pro plan.",
            "required_plan": "pro",
        })

    days = 30
    cutoff = datetime.utcnow() - timedelta(days=days)

    # Daily aggregates
    metrics = (
        db.query(PostMetrics)
        .join(Post, Post.id == PostMetrics.post_id)
        .filter(Post.user_id == current_user.id, PostMetrics.fetched_at >= cutoff)
        .all()
    )

    daily = {}
    for m in metrics:
        day = m.fetched_at.strftime("%Y-%m-%d")
        if day not in daily:
            daily[day] = {"impressions": 0, "likes": 0, "shares": 0, "comments": 0}
        daily[day]["impressions"] += m.impressions
        daily[day]["likes"] += m.likes
        daily[day]["shares"] += m.shares
        daily[day]["comments"] += m.comments

    # Fill missing days with zeros
    result = []
    for i in range(days):
        d = (datetime.utcnow() - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        result.append({"date": d, **(daily.get(d, {"impressions": 0, "likes": 0, "shares": 0, "comments": 0}))})

    return result
