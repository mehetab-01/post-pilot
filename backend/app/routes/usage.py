"""
Usage tracking & plan upgrade endpoints.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings as cfg
from app.database import get_db
from app.models.models import User
from app.plans import PLAN_CONFIG, build_usage_response, get_plan_config
from app.security import get_current_user
from app.routes.billing import check_plan_expiry


def _require_admin(x_admin_key: str = Header(None)):
    if not cfg.ADMIN_SECRET or x_admin_key != cfg.ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

router = APIRouter(prefix="/api", tags=["usage"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class UpgradeRequest(BaseModel):
    plan: str


class UpgradeResponse(BaseModel):
    message: str
    plan: str
    generations_limit: int


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/usage")
def get_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_plan_expiry(current_user, db)
    return build_usage_response(current_user, db)


@router.post("/upgrade", response_model=UpgradeResponse, dependencies=[Depends(_require_admin)])
def upgrade_plan(
    payload: UpgradeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = payload.plan.lower().strip()
    if plan not in PLAN_CONFIG:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan: {plan}. Options: free, starter, pro",
        )

    cfg = get_plan_config(plan)
    now = datetime.utcnow()

    current_user.plan = plan
    current_user.generations_limit = cfg["generations_limit"]
    current_user.plan_started_at = now
    # Reset billing cycle on upgrade so they get a fresh quota
    current_user.billing_cycle_start = now
    current_user.generations_used = 0
    # For paid plans, set expiry 30 days out (placeholder until real payments)
    current_user.plan_expires_at = None  # no actual payment verification yet

    db.commit()

    return UpgradeResponse(
        message=f"Plan updated to {plan}",
        plan=plan,
        generations_limit=cfg["generations_limit"],
    )
