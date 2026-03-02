import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import Base, engine
from app.routes import auth, generate, history, media, post, settings, oauth, ai_providers

app = FastAPI(
    title="PostPilot API",
    description="AI social media content generator and auto-poster",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
from app.config import settings as _cfg  # noqa: E402

_cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
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


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    # Import new models so SQLAlchemy registers them before create_all
    import app.models.social_connection  # noqa: F401
    import app.models.ai_provider        # noqa: F401
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Ensure upload directory exists
    from app.config import settings as cfg
    os.makedirs(cfg.UPLOAD_DIR, exist_ok=True)


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
        f = _DIST / full_path
        if f.exists() and f.is_file():
            return FileResponse(f)
        return FileResponse(_DIST / "index.html")
else:
    # Dev: health check only
    @app.get("/")
    def health_check():
        return {"status": "ok"}
