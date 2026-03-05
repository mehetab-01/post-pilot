"""
Scheduler service — fires due posts every 30 seconds using APScheduler.
"""
from __future__ import annotations

import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.models.models import ScheduledPost, User
from app.schemas.schemas import PostToPlatformRequest

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def start_scheduler():
    """Start the background scheduler. Call once from main.py startup."""
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(_tick, "interval", seconds=30, id="scheduled_posts_tick", replace_existing=True)
    _scheduler.add_job(_metrics_tick, "interval", hours=6, id="metrics_tick", replace_existing=True)
    _scheduler.start()
    logger.info("Scheduler started — checking for due posts every 30s, metrics every 6h")


def _tick():
    """Query pending posts that are due and fire them."""
    from app.routes.post import _do_post  # deferred to avoid circular import

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        due = (
            db.query(ScheduledPost)
            .filter(
                ScheduledPost.status == "pending",
                ScheduledPost.scheduled_at <= now,
            )
            .all()
        )
        for sp in due:
            sp.status = "posting"
            db.commit()

            user = db.query(User).filter(User.id == sp.user_id).first()
            if not user:
                sp.status = "failed"
                sp.error = "User not found"
                db.commit()
                continue

            payload = PostToPlatformRequest(
                content=sp.content,
                post_id=sp.post_id,
                media_ids=sp.media_ids,
                options=sp.options or {},
            )

            try:
                result = _do_post(sp.platform, payload, db, user)
                if result.success:
                    sp.status = "posted"
                    sp.post_url = result.post_url
                    sp.error = None
                else:
                    sp.retry_count += 1
                    if sp.retry_count >= 3:
                        sp.status = "failed"
                    else:
                        sp.status = "pending"  # will be retried next tick
                    sp.error = result.error
            except Exception as exc:
                sp.retry_count += 1
                if sp.retry_count >= 3:
                    sp.status = "failed"
                else:
                    sp.status = "pending"
                sp.error = str(exc)

            sp.updated_at = datetime.utcnow()
            db.commit()
            logger.info("Scheduled post %s → %s (%s)", sp.id, sp.status, sp.platform)
    except Exception:
        logger.exception("Scheduler tick failed")
    finally:
        db.close()


def _metrics_tick():
    """Fetch engagement metrics for recently posted content."""
    from app.services.metrics_service import fetch_all_due_metrics

    db = SessionLocal()
    try:
        count = fetch_all_due_metrics(db)
        if count:
            logger.info("Metrics tick — updated %d posts", count)
    except Exception:
        logger.exception("Metrics tick failed")
    finally:
        db.close()
