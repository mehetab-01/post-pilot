from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Post, User
from app.schemas.schemas import HistoryItem, HistoryResponse, PostResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

_PREVIEW_LEN = 100


def _make_preview(post: Post) -> str:
    text = post.final_content or post.generated_content or ""
    return text[:_PREVIEW_LEN] + ("..." if len(text) > _PREVIEW_LEN else "")


@router.get("", response_model=HistoryResponse)
def list_history(
    limit: int = Query(default=20, ge=1, le=100),
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

    items = [
        HistoryItem(
            id=p.id,
            platform=p.platform,
            tone=p.tone,
            content_preview=_make_preview(p),
            posted=p.posted,
            post_url=p.post_url,
            created_at=p.created_at,
        )
        for p in posts
    ]

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
