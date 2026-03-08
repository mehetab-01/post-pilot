"""
Content Engine — weekly content calendar generator.
POST /api/engine/generate-week   → generate a full week plan (Pro only)
POST /api/engine/regenerate-day  → regenerate one day from a saved plan
POST /api/engine/schedule-week   → schedule all posts from a plan
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import ContentPlan, User
from app.plans import require_plan
from app.security import get_current_user
from app.services import ai_router
from app.services.ai_router import AiRateLimitError

router = APIRouter(prefix="/api/engine", tags=["engine"])

_VALID_STYLES = {"balanced", "aggressive", "educational", "personal-brand"}
_VALID_PLATFORMS = {"twitter", "linkedin", "reddit", "instagram", "bluesky", "mastodon", "whatsapp"}


# ── Schemas ────────────────────────────────────────────────────────────────────

class GenerateWeekRequest(BaseModel):
    context:   str       = Field(min_length=10, max_length=10_000)
    platforms: list[str] = Field(default_factory=list)
    days:      int       = Field(default=7, ge=5, le=7)
    style:     str       = Field(default="balanced")


class RegenerateDayRequest(BaseModel):
    plan_id:  int
    day:      int = Field(ge=1, le=7)


class ScheduleWeekRequest(BaseModel):
    plan_id:    int
    start_date: str   # ISO date string e.g. "2026-03-10"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/generate-week")
async def generate_week(
    payload: GenerateWeekRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "pro", "Content Engine")

    # Sanitize platforms
    platforms = [p for p in payload.platforms if p in _VALID_PLATFORMS]
    if not platforms:
        platforms = ["linkedin", "twitter", "reddit", "instagram"]

    if payload.style not in _VALID_STYLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid style. Choose from: {', '.join(_VALID_STYLES)}",
        )

    try:
        result = await ai_router.generate_week_plan(
            db=db,
            user_id=current_user.id,
            context=payload.context,
            platforms=platforms,
            days=payload.days,
            style=payload.style,
        )
    except AiRateLimitError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    # Persist the plan
    plan = ContentPlan(
        user_id=current_user.id,
        context=payload.context,
        style=payload.style,
        week_plan=result,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return {
        "plan_id": plan.id,
        "week_plan": result.get("week_plan", []),
        "strategy_note": result.get("strategy_note", ""),
        "days": payload.days,
        "style": payload.style,
    }


@router.post("/regenerate-day")
async def regenerate_day(
    payload: RegenerateDayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "pro", "Content Engine")

    plan = db.query(ContentPlan).filter(
        ContentPlan.id == payload.plan_id,
        ContentPlan.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    existing_week = plan.week_plan or {}
    existing_days = existing_week.get("week_plan", [])
    day_entry = next((d for d in existing_days if d.get("day") == payload.day), None)
    if not day_entry:
        raise HTTPException(status_code=404, detail=f"Day {payload.day} not found in plan")

    # Re-generate just this day using the original context with a specific angle hint
    platform = day_entry.get("platform", "linkedin")
    try:
        result = await ai_router.generate_week_plan(
            db=db,
            user_id=current_user.id,
            context=(
                f"{plan.context}\n\n"
                f"REGENERATE ONLY DAY {payload.day} ({day_entry.get('day_name', '')}) "
                f"for {platform}. Use a DIFFERENT angle than: {day_entry.get('angle', '')}. "
                f"Return a week_plan array with ONLY day {payload.day}."
            ),
            platforms=[platform],
            days=1,
            style=plan.style,
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    new_days = result.get("week_plan", [])
    if new_days:
        new_day = new_days[0]
        new_day["day"] = payload.day
        new_day["day_name"] = day_entry.get("day_name", f"Day {payload.day}")

        # Replace the day in the stored plan
        updated = [new_day if d.get("day") == payload.day else d for d in existing_days]
        plan.week_plan = {**existing_week, "week_plan": updated}
        db.commit()
        return {"day": new_day}

    raise HTTPException(status_code=502, detail="Failed to regenerate day")


@router.post("/schedule-week")
def schedule_week(
    payload: ScheduleWeekRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "pro", "Content Engine")

    plan = db.query(ContentPlan).filter(
        ContentPlan.id == payload.plan_id,
        ContentPlan.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    try:
        start = datetime.fromisoformat(payload.start_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD.")

    week_days = (plan.week_plan or {}).get("week_plan", [])
    if not week_days:
        raise HTTPException(status_code=400, detail="Plan has no days to schedule")

    from app.models.models import ScheduledPost

    scheduled = []
    for day_entry in week_days:
        day_num = day_entry.get("day", 1)
        post_date = start + timedelta(days=day_num - 1)

        # Parse best_time hint (e.g. "9:00 AM IST" → 9:00 UTC+5:30 = 3:30 UTC)
        hour = 9  # default
        try:
            time_str = day_entry.get("best_time", "9:00 AM IST")
            time_part = time_str.split()[0]
            h, m = time_part.split(":")
            hour = int(h)
            # Shift from IST to UTC: subtract 5h30m
            ist_minutes = hour * 60 + int(m)
            utc_minutes = ist_minutes - 330
            if utc_minutes < 0:
                utc_minutes += 1440
                post_date -= timedelta(days=1)
            hour = utc_minutes // 60
            minute = utc_minutes % 60
        except Exception:
            minute = 0

        scheduled_at = post_date.replace(hour=hour, minute=minute, second=0, microsecond=0)

        sp = ScheduledPost(
            user_id=current_user.id,
            platform=day_entry.get("platform", "twitter"),
            content=day_entry.get("content", ""),
            scheduled_at=scheduled_at,
            status="pending",
        )
        db.add(sp)
        scheduled.append({
            "day": day_num,
            "platform": sp.platform,
            "scheduled_at": scheduled_at.isoformat(),
        })

    db.commit()
    return {"scheduled": len(scheduled), "posts": scheduled}


@router.get("/plans")
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "pro", "Content Engine")
    plans = (
        db.query(ContentPlan)
        .filter(ContentPlan.user_id == current_user.id)
        .order_by(ContentPlan.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": p.id,
            "context": p.context[:120] + ("..." if len(p.context) > 120 else ""),
            "style": p.style,
            "days": len((p.week_plan or {}).get("week_plan", [])),
            "created_at": p.created_at.isoformat(),
        }
        for p in plans
    ]
