"""
Scheduled posting routes — Pro-only.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import ScheduledPost, User
from app.plans import require_plan
from app.schemas.schemas import (
    SchedulePostRequest,
    ScheduledPostResponse,
    RescheduleRequest,
)
from app.security import get_current_user

router = APIRouter(prefix="/api/schedule", tags=["schedule"])


@router.post("", response_model=ScheduledPostResponse, status_code=status.HTTP_201_CREATED)
def create_scheduled_post(
    payload: SchedulePostRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "pro", "Scheduled posting")

    if payload.scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

    sp = ScheduledPost(
        user_id=current_user.id,
        platform=payload.platform,
        content=payload.content,
        media_ids=payload.media_ids,
        options=payload.options,
        scheduled_at=payload.scheduled_at,
        timezone=payload.timezone,
        post_id=payload.post_id,
    )
    db.add(sp)
    db.commit()
    db.refresh(sp)
    return sp


@router.get("", response_model=list[ScheduledPostResponse])
def list_scheduled_posts(
    filter_status: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "pro", "Scheduled posting")

    q = db.query(ScheduledPost).filter(ScheduledPost.user_id == current_user.id)
    if filter_status:
        q = q.filter(ScheduledPost.status == filter_status)
    return q.order_by(ScheduledPost.scheduled_at.desc()).all()


@router.delete("/{post_id}", status_code=status.HTTP_200_OK)
def cancel_scheduled_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sp = db.query(ScheduledPost).filter(
        ScheduledPost.id == post_id, ScheduledPost.user_id == current_user.id
    ).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
    if sp.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending posts can be cancelled")
    sp.status = "cancelled"
    sp.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True}


@router.patch("/{post_id}", response_model=ScheduledPostResponse)
def reschedule_post(
    post_id: int,
    payload: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sp = db.query(ScheduledPost).filter(
        ScheduledPost.id == post_id, ScheduledPost.user_id == current_user.id
    ).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
    if sp.status not in ("pending", "failed"):
        raise HTTPException(status_code=400, detail="Only pending or failed posts can be rescheduled")
    if payload.scheduled_at <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

    sp.scheduled_at = payload.scheduled_at
    sp.status = "pending"
    sp.error = None
    sp.retry_count = 0
    sp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(sp)
    return sp


@router.post("/{post_id}/retry", response_model=ScheduledPostResponse)
def retry_scheduled_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sp = db.query(ScheduledPost).filter(
        ScheduledPost.id == post_id, ScheduledPost.user_id == current_user.id
    ).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
    if sp.status != "failed":
        raise HTTPException(status_code=400, detail="Only failed posts can be retried")

    sp.status = "pending"
    sp.retry_count = 0
    sp.error = None
    sp.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(sp)
    return sp
