import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.database import Base, engine as db_engine
from app.routes import auth, generate, history, media, post, settings, oauth, ai_providers, analyze, templates, usage, billing, schedule, ideas, analytics, admin
from app.routes import engine as engine_routes

from app.limiter import limiter

app = FastAPI(
    title="PostPilot API",
    description="AI social media content generator and auto-poster",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
from app.config import settings as _cfg  # noqa: E402

_cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "https://postpilot.tabcrypt.in"]
if _cfg.EXTRA_CORS_ORIGINS:
    _cors_origins += [o.strip() for o in _cfg.EXTRA_CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(settings.router)
app.include_router(generate.router)
app.include_router(post.router)
app.include_router(history.router)
app.include_router(media.router)
app.include_router(oauth.router)
app.include_router(ai_providers.router)
app.include_router(analyze.router)
app.include_router(templates.router)
app.include_router(usage.router)
app.include_router(billing.router)
app.include_router(schedule.router)
app.include_router(ideas.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(engine_routes.router)


# ── Secure headers middleware ──────────────────────────────────────────────────
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    # Import new models so SQLAlchemy registers them before create_all
    import app.models.social_connection  # noqa: F401
    import app.models.ai_provider        # noqa: F401
    import app.models.models             # noqa: F401  (registers Template)
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=db_engine)

    # ── Auto-migrate: add any missing columns to existing tables ──────────
    from sqlalchemy import inspect as sa_inspect, text
    with db_engine.connect() as conn:
        existing = {c["name"] for c in sa_inspect(db_engine).get_columns("users")}
        _new_cols = [
            ("plan",                "VARCHAR DEFAULT 'free'"),
            ("generations_used",    "INTEGER DEFAULT 0"),
            ("generations_limit",   "INTEGER DEFAULT 10"),
            ("plan_started_at",     "DATETIME"),
            ("plan_expires_at",     "DATETIME"),
            ("billing_cycle_start", "DATETIME"),
            ("billing_cycle",       "VARCHAR"),
            ("razorpay_order_id",   "VARCHAR"),
            ("razorpay_payment_id", "VARCHAR"),
            ("plan_cancelled",      "BOOLEAN DEFAULT 0"),
        ]
        for col_name, col_def in _new_cols:
            if col_name not in existing:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"))
                conn.commit()

    # ── Auto-migrate: add missing columns to templates ────────────────────
    try:
        tpl_existing = {c["name"] for c in sa_inspect(db_engine).get_columns("templates")}
        _tpl_cols = [
            ("tier",            "VARCHAR NOT NULL DEFAULT 'free'"),
            ("preview_example", "TEXT"),
            ("icon",            "VARCHAR"),
            ("color",           "VARCHAR"),
        ]
        with db_engine.connect() as conn2:
            for col_name, col_def in _tpl_cols:
                if col_name not in tpl_existing:
                    conn2.execute(text(f"ALTER TABLE templates ADD COLUMN {col_name} {col_def}"))
                    conn2.commit()
    except Exception:
        pass  # templates table doesn't exist yet — create_all will handle it

    # ── Auto-migrate: create ai_cost_logs if missing ──────────────────────
    try:
        if "ai_cost_logs" not in sa_inspect(db_engine).get_table_names():
            pass  # create_all above handles it
    except Exception:
        pass

    # ── Auto-migrate: add missing columns to social_connections ───────────
    try:
        sc_existing = {c["name"] for c in sa_inspect(db_engine).get_columns("social_connections")}
        if "instance_url" not in sc_existing:
            with db_engine.connect() as conn3:
                conn3.execute(text("ALTER TABLE social_connections ADD COLUMN instance_url VARCHAR"))
                conn3.commit()
    except Exception:
        pass  # table doesn't exist yet — create_all will handle it

    # ── Validate required env vars ────────────────────────────────────────
    from app.config import settings as cfg
    _errors = []
    if cfg.JWT_SECRET == "change-this-to-a-random-string":
        _errors.append("JWT_SECRET is still the default value — set a secure random string in .env")
    if not cfg.FERNET_KEY:
        _errors.append("FERNET_KEY is not set — encrypted values cannot be decrypted without it")
    if _errors:
        msg = "\n".join(f"  ✗ {e}" for e in _errors)
        raise RuntimeError(f"PostPilot startup aborted — missing required config:\n{msg}")

    # Ensure upload directory exists
    os.makedirs(cfg.UPLOAD_DIR, exist_ok=True)

    # Seed built-in templates (skips if already seeded)
    from app.routes.templates import seed_builtin_templates
    from app.database import SessionLocal
    _db = SessionLocal()
    try:
        seed_builtin_templates(_db)
    finally:
        _db.close()

    # Start background scheduler for scheduled posts
    from app.services.scheduler_service import start_scheduler
    start_scheduler()


# ── Frontend static files (production) ───────────────────────────────────────
_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"
if _DIST.exists():
    app.mount("/assets", StaticFiles(directory=_DIST / "assets"), name="assets")

    @app.get("/favicon.ico", include_in_schema=False)
    async def _favicon():
        f = _DIST / "favicon.ico"
        return FileResponse(f) if f.exists() else FileResponse(_DIST / "index.html")

    @app.get("/logo.png", include_in_schema=False)
    async def _logo():
        f = _DIST / "logo.png"
        return FileResponse(f) if f.exists() else FileResponse(_DIST / "index.html")

    # Catch-all: serve index.html for React Router paths
    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        # Never intercept API routes
        if full_path.startswith("api/") or full_path == "api":
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        f = _DIST / full_path
        if f.exists() and f.is_file():
            return FileResponse(f)
        return FileResponse(_DIST / "index.html")
else:
    # Dev: health check only
    @app.get("/")
    def health_check():
        return {"status": "ok"}
