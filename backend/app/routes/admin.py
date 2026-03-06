"""
Internal admin endpoints — protected by X-Admin-Key header.
Set ADMIN_SECRET in .env to enable.
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.models import AiCostLog

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _require_admin(x_admin_key: str = Header(None)):
    if not settings.ADMIN_SECRET or x_admin_key != settings.ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/costs", dependencies=[Depends(_require_admin)])
def get_costs(db: Session = Depends(get_db)):
    """Return AI cost totals grouped by day (last 30 days), week, and month."""
    now = datetime.utcnow()

    def _window(since: datetime):
        rows = (
            db.query(
                AiCostLog.provider,
                func.sum(AiCostLog.tokens_in).label("tokens_in"),
                func.sum(AiCostLog.tokens_out).label("tokens_out"),
                func.sum(AiCostLog.cost_usd).label("cost_usd"),
                func.count(AiCostLog.id).label("calls"),
            )
            .filter(AiCostLog.created_at >= since)
            .group_by(AiCostLog.provider)
            .all()
        )
        return [
            {
                "provider": r.provider,
                "tokens_in": r.tokens_in or 0,
                "tokens_out": r.tokens_out or 0,
                "cost_usd": round(r.cost_usd or 0, 6),
                "calls": r.calls,
            }
            for r in rows
        ]

    # Daily breakdown for last 30 days
    daily = []
    for i in range(30):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        total = (
            db.query(func.sum(AiCostLog.cost_usd))
            .filter(AiCostLog.created_at >= day_start, AiCostLog.created_at < day_end)
            .scalar()
        ) or 0
        daily.append({"date": day_start.date().isoformat(), "cost_usd": round(total, 6)})

    # All-time totals
    all_time = db.query(
        func.sum(AiCostLog.cost_usd),
        func.sum(AiCostLog.tokens_in),
        func.sum(AiCostLog.tokens_out),
        func.count(AiCostLog.id),
    ).first()

    return {
        "all_time": {
            "cost_usd":   round(all_time[0] or 0, 6),
            "tokens_in":  all_time[1] or 0,
            "tokens_out": all_time[2] or 0,
            "calls":      all_time[3] or 0,
        },
        "last_24h":  _window(now - timedelta(hours=24)),
        "last_7d":   _window(now - timedelta(days=7)),
        "last_30d":  _window(now - timedelta(days=30)),
        "daily_30d": daily,
    }
