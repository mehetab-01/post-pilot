"""
Plan definitions and usage-checking helpers for PostPilot freemium.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

# ── Plan definitions ──────────────────────────────────────────────────────────

_BASE_PLATFORMS = ["twitter", "linkedin", "reddit", "instagram", "whatsapp"]
_STARTER_PLATFORMS = _BASE_PLATFORMS + ["bluesky", "mastodon"]
_PRO_PLATFORMS = _STARTER_PLATFORMS + ["threads"]

PLAN_CONFIG = {
    "free": {
        "generations_limit": 10,
        "max_platforms": 3,
        "allowed_tones": {"professional", "casual", "educational"},
        "allowed_platforms": _BASE_PLATFORMS,
        "direct_posting": False,
        "humanizer": False,
        "originality": False,
        "all_tones": False,
        "all_platforms": False,
        "scheduling": False,
        "history_days": None,        # unlimited for viewing, but no premium features
    },
    "starter": {
        "generations_limit": 50,
        "max_platforms": 99,
        "allowed_tones": None,       # all tones
        "allowed_platforms": _STARTER_PLATFORMS,
        "direct_posting": True,
        "humanizer": True,
        "originality": True,
        "all_tones": True,
        "all_platforms": True,
        "scheduling": False,
        "history_days": 30,
    },
    "pro": {
        "generations_limit": 200,
        "max_platforms": 99,
        "allowed_tones": None,
        "allowed_platforms": _PRO_PLATFORMS,
        "direct_posting": True,
        "humanizer": True,
        "originality": True,
        "all_tones": True,
        "all_platforms": True,
        "scheduling": True,
        "history_days": None,        # unlimited
    },
}

ALL_TONES = {
    "professional", "casual", "hype", "storytelling",
    "educational", "witty", "inspirational", "bold",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_plan_config(plan: str) -> dict:
    return PLAN_CONFIG.get(plan, PLAN_CONFIG["free"])


# IST is UTC+5:30
_IST_OFFSET = timedelta(hours=5, minutes=30)


def _utc_now_ist_midnight() -> datetime:
    """Return the most recent IST midnight (00:00) as a UTC datetime."""
    now_utc = datetime.utcnow()
    now_ist = now_utc + _IST_OFFSET
    midnight_ist = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight_ist - _IST_OFFSET   # convert back to UTC


def _next_cycle_reset(user) -> datetime:
    """
    Calculate the next 30-day billing cycle reset point.
    Anchored to the account creation date (or billing_cycle_start).
    The cycle resets every 30 days from the anchor, at 00:00 IST.
    """
    now_utc = datetime.utcnow()
    anchor = user.billing_cycle_start or user.created_at or now_utc

    # Walk forward in 30-day increments from anchor until we pass now
    reset = anchor
    while reset <= now_utc:
        reset = reset + timedelta(days=30)

    # Snap to 00:00 IST on that day
    reset_ist = reset + _IST_OFFSET
    reset_ist = reset_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    return reset_ist - _IST_OFFSET  # back to UTC


def maybe_reset_cycle(user, db: Session) -> None:
    """
    Reset generations_used when the 30-day billing cycle has rolled over.
    Cycles are anchored to account creation date and reset at 00:00 IST.
    """
    now_utc = datetime.utcnow()
    anchor = user.billing_cycle_start or user.created_at or now_utc

    # Find how many full 30-day periods have passed
    elapsed = (now_utc - anchor).total_seconds()
    if elapsed >= 30 * 86400:
        # Advance anchor to the most recent 30-day boundary
        periods = int(elapsed / (30 * 86400))
        new_anchor = anchor + timedelta(days=30 * periods)
        user.generations_used = 0
        user.billing_cycle_start = new_anchor
        db.commit()


def days_until_reset(user) -> int:
    now_utc = datetime.utcnow()
    next_reset = _next_cycle_reset(user)
    delta = (next_reset - now_utc).days
    return max(delta, 0)


def check_generation_limit(user, db: Session) -> None:
    """Raise 403 if user has exhausted their generation quota."""
    maybe_reset_cycle(user, db)
    cfg = get_plan_config(user.plan or "free")
    limit = cfg["generations_limit"]
    used = user.generations_used or 0
    if used >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "limit_reached",
                "message": f"You've used all {limit} {user.plan or 'free'} generations this month",
                "current_plan": user.plan or "free",
                "used": used,
                "limit": limit,
                "upgrade_url": "/pricing",
            },
        )


def increment_generation(user, db: Session, count: int = 1) -> None:
    user.generations_used = (user.generations_used or 0) + count
    db.commit()


def check_platform_limit(user, platforms: dict) -> None:
    """For free users only allow up to max_platforms."""
    cfg = get_plan_config(user.plan or "free")
    max_p = cfg["max_platforms"]
    if len(platforms) > max_p:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "platform_limit",
                "message": f"Free plan allows up to {max_p} platforms. Upgrade to unlock all.",
                "current_plan": user.plan or "free",
                "limit": max_p,
                "upgrade_url": "/pricing",
            },
        )


def check_tone_allowed(user, platforms: dict) -> None:
    """For free users restrict to basic tones only."""
    cfg = get_plan_config(user.plan or "free")
    allowed = cfg["allowed_tones"]
    if allowed is None:
        return  # all tones OK
    for platform, opts in platforms.items():
        tone = opts.get("tone", "professional") if isinstance(opts, dict) else "professional"
        if tone not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "tone_locked",
                    "message": f"The '{tone}' tone requires a Starter or Pro plan.",
                    "current_plan": user.plan or "free",
                    "locked_tone": tone,
                    "upgrade_url": "/pricing",
                },
            )


def check_platform_allowed(user, platforms: dict) -> None:
    """Raise 403 if any requested platform is not in the user's plan tier."""
    cfg = get_plan_config(user.plan or "free")
    allowed = set(cfg["allowed_platforms"])
    for platform in platforms:
        if platform not in allowed:
            # Determine minimum required plan
            min_plan = "starter"
            if platform in ("threads",):
                min_plan = "pro"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "platform_locked",
                    "message": f"{platform.capitalize()} requires a {min_plan.title()} plan or higher.",
                    "current_plan": user.plan or "free",
                    "required_plan": min_plan,
                    "locked_platform": platform,
                    "upgrade_url": "/pricing",
                },
            )


def require_plan(user, minimum: str, feature_name: str) -> None:
    """Ensure user is on at least `minimum` plan (starter or pro)."""
    order = {"free": 0, "starter": 1, "pro": 2}
    user_level = order.get(user.plan or "free", 0)
    required_level = order.get(minimum, 1)
    if user_level < required_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "feature_locked",
                "message": f"{feature_name} requires a {minimum.title()} plan or higher.",
                "current_plan": user.plan or "free",
                "required_plan": minimum,
                "upgrade_url": "/pricing",
            },
        )


def build_usage_response(user, db: Session) -> dict:
    maybe_reset_cycle(user, db)
    cfg = get_plan_config(user.plan or "free")
    return {
        "plan": user.plan or "free",
        "generations_used": user.generations_used or 0,
        "generations_limit": cfg["generations_limit"],
        "days_until_reset": days_until_reset(user),
        "features": {
            "direct_posting": cfg["direct_posting"],
            "humanizer": cfg["humanizer"],
            "originality": cfg["originality"],
            "all_tones": cfg["all_tones"],
            "all_platforms": cfg["all_platforms"],
            "scheduling": cfg["scheduling"],
        },
        "allowed_platforms": cfg["allowed_platforms"],
    }
