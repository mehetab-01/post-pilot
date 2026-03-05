from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Post, PostMetrics, User
from app.schemas.schemas import HistoryItem, HistoryResponse, PostResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

_PREVIEW_LEN = 100


def _make_preview(post: Post) -> str:
    text = post.final_content or post.generated_content or ""
    return text[:_PREVIEW_LEN] + ("..." if len(text) > _PREVIEW_LEN else "")


@router.get("", response_model=HistoryResponse)
def list_history(
    limit: int = Query(default=20, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Post).filter(Post.user_id == current_user.id).count()

    posts = (
        db.query(Post)
        .filter(Post.user_id == current_user.id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    items = []
    posted_ids = [p.id for p in posts if p.posted]
    metrics_map = {}
    if posted_ids:
        from sqlalchemy import func
        latest = (
            db.query(PostMetrics.post_id, func.max(PostMetrics.fetched_at).label("latest"))
            .filter(PostMetrics.post_id.in_(posted_ids))
            .group_by(PostMetrics.post_id)
            .subquery()
        )
        rows = (
            db.query(PostMetrics)
            .join(latest, (PostMetrics.post_id == latest.c.post_id) & (PostMetrics.fetched_at == latest.c.latest))
            .all()
        )
        for m in rows:
            metrics_map[m.post_id] = {
                "impressions": m.impressions,
                "likes": m.likes,
                "shares": m.shares,
                "comments": m.comments,
                "engagement_rate": m.engagement_rate,
            }

    for p in posts:
        items.append(
            HistoryItem(
                id=p.id,
                platform=p.platform,
                tone=p.tone,
                content_preview=_make_preview(p),
                posted=p.posted,
                post_url=p.post_url,
                created_at=p.created_at,
                metrics=metrics_map.get(p.id),
            )
        )

    return HistoryResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = (
        db.query(Post)
        .filter(Post.id == post_id, Post.user_id == current_user.id)
        .first()
    )
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post {post_id} not found.",
        )
    return post


@router.delete("/{post_id}", status_code=status.HTTP_200_OK)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = (
        db.query(Post)
        .filter(Post.id == post_id, Post.user_id == current_user.id)
        .first()
    )
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post {post_id} not found.",
        )
    db.delete(post)
    db.commit()
    return {"deleted": post_id, "message": f"Post {post_id} deleted."}
