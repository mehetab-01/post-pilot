"""
Post Ideas Generator — AI-powered content suggestions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Post, User
from app.security import get_current_user
from app.plans import get_plan_config, maybe_reset_cycle
from app.services import ai_router

router = APIRouter(prefix="/api/ideas", tags=["ideas"])


class IdeasRequest(BaseModel):
    niche: Optional[str] = None
    platforms: Optional[list[str]] = None


class IdeaItem(BaseModel):
    title: str
    description: str
    platforms: list[str]
    tone: str


class IdeasResponse(BaseModel):
    ideas: list[IdeaItem]
    used_today: int
    limit_today: int


def _ideas_limit(plan: str) -> int:
    return {"free": 3, "starter": 10, "pro": 999}.get(plan, 3)


def _ideas_used_today(db: Session, user_id: int) -> int:
    from datetime import datetime, timedelta
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    from app.models.models import IdeaLog
    return db.query(IdeaLog).filter(
        IdeaLog.user_id == user_id,
        IdeaLog.created_at >= today_start,
    ).count()


@router.post("", response_model=IdeasResponse)
async def generate_ideas(
    payload: IdeasRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = current_user.plan or "free"
    limit = _ideas_limit(plan)
    used = _ideas_used_today(db, current_user.id)

    if used >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "ideas_limit",
                "message": f"You've used all {limit} idea generations for today.",
                "current_plan": plan,
                "used": used,
                "limit": limit,
            },
        )

    # Fetch recent posts for context (avoid repetition)
    recent = (
        db.query(Post)
        .filter(Post.user_id == current_user.id)
        .order_by(Post.created_at.desc())
        .limit(5)
        .all()
    )
    recent_contexts = [p.context for p in recent if p.context]

    ideas = await ai_router.generate_ideas(
        db=db,
        user_id=current_user.id,
        niche=payload.niche,
        platforms=payload.platforms,
        recent_contexts=recent_contexts,
    )

    # Log usage
    from app.models.models import IdeaLog
    db.add(IdeaLog(user_id=current_user.id))
    db.commit()

    return IdeasResponse(
        ideas=ideas,
        used_today=used + 1,
        limit_today=limit,
    )
