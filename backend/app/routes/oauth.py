"""
OAuth 2.0 flows for LinkedIn, Reddit, and X/Twitter.

The PostPilot server owner registers one app per platform and puts
their CLIENT_ID / CLIENT_SECRET in .env.  End-users just click
"Connect" — no developer credentials required from them.

Flow:
  1. Frontend calls GET /api/oauth/{platform}/authorize (with JWT Bearer).
  2. Backend builds the platform authorization URL, embeds a signed
     short-lived state token containing user_id (and code_verifier for
     Twitter PKCE), returns {redirect_url}.
  3. Frontend does window.location.href = redirect_url.
  4. Platform redirects to GET /api/oauth/{platform}/callback?code=…&state=…
  5. Backend verifies state, exchanges code for tokens, stores in DB,
     redirects to FRONTEND_URL/settings?connected={platform}.
  6. Frontend shows a success toast and re-fetches connection status.
"""
import hashlib
import base64
import secrets
from datetime import datetime, timedelta
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.social_connection import SocialConnection, MastodonApp
from app.models.models import User
from app.security import get_current_user
from app.services.encryption import encrypt_value, decrypt_value
from app.services import mastodon_service

router = APIRouter(prefix="/api/oauth", tags=["oauth"])

ALLOWED_PLATFORMS = ("linkedin", "reddit", "twitter", "bluesky", "mastodon")

# ── State helpers ─────────────────────────────────────────────────────────────

def _create_state(user_id: int) -> str:
    """Standard state JWT for LinkedIn and Reddit (no PKCE)."""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def _decode_state(state: str) -> int:
    try:
        payload = jwt.decode(state, settings.JWT_SECRET, algorithms=["HS256"])
        return int(payload["user_id"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")


def _create_twitter_state(user_id: int, code_verifier: str) -> str:
    """Twitter state JWT — also carries the PKCE code_verifier."""
    payload = {
        "user_id": user_id,
        "cv": code_verifier,
        "exp": datetime.utcnow() + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def _decode_twitter_state(state: str) -> tuple[int, str]:
    try:
        payload = jwt.decode(state, settings.JWT_SECRET, algorithms=["HS256"])
        return int(payload["user_id"]), payload["cv"]
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid or expired Twitter OAuth state")


# ── PKCE helpers ──────────────────────────────────────────────────────────────

def _pkce_pair() -> tuple[str, str]:
    """Generate (code_verifier, code_challenge) for PKCE S256."""
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).decode().rstrip("=")
    return verifier, challenge


# ── Platform-specific auth URL builders ───────────────────────────────────────

def _linkedin_authorize_url(state: str) -> str:
    if not settings.LINKEDIN_CLIENT_ID:
        raise HTTPException(status_code=503, detail="LinkedIn OAuth not configured (LINKEDIN_CLIENT_ID missing)")
    params = (
        f"response_type=code"
        f"&client_id={settings.LINKEDIN_CLIENT_ID}"
        f"&redirect_uri={settings.LINKEDIN_REDIRECT_URI}"
        f"&scope=openid%20profile%20email%20w_member_social"
        f"&state={state}"
    )
    return f"https://www.linkedin.com/oauth/v2/authorization?{params}"


def _reddit_authorize_url(state: str) -> str:
    if not settings.REDDIT_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Reddit OAuth not configured (REDDIT_CLIENT_ID missing)")
    params = (
        f"client_id={settings.REDDIT_CLIENT_ID}"
        f"&response_type=code"
        f"&state={state}"
        f"&redirect_uri={settings.REDDIT_REDIRECT_URI}"
        f"&duration=permanent"
        f"&scope=submit%20identity"
    )
    return f"https://www.reddit.com/api/v1/authorize?{params}"


def _twitter_authorize_url(state: str, code_challenge: str) -> str:
    if not settings.TWITTER_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Twitter OAuth not configured (TWITTER_CLIENT_ID missing)")
    # Scopes: tweet.read tweet.write users.read media.write offline.access
    scopes = "tweet.read%20tweet.write%20users.read%20media.write%20offline.access"
    params = (
        f"response_type=code"
        f"&client_id={settings.TWITTER_CLIENT_ID}"
        f"&redirect_uri={settings.TWITTER_REDIRECT_URI}"
        f"&scope={scopes}"
        f"&state={state}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
    )
    return f"https://x.com/i/oauth2/authorize?{params}"


# ── Token exchange ────────────────────────────────────────────────────────────

async def _exchange_linkedin(code: str) -> dict:
    """Exchange auth code for LinkedIn access token."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"LinkedIn token error: {resp.text}")
        data = resp.json()
        access_token = data["access_token"]
        expires_in   = data.get("expires_in", 5184000)

        me_resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        name = "LinkedIn User"
        if me_resp.status_code == 200:
            me = me_resp.json()
            name = me.get("name") or f"{me.get('given_name', '')} {me.get('family_name', '')}".strip() or "LinkedIn User"

    return {
        "access_token": access_token,
        "refresh_token": None,
        "username": name,
        "expires_at": datetime.utcnow() + timedelta(seconds=expires_in),
    }


async def _exchange_reddit(code: str) -> dict:
    """Exchange auth code for Reddit access + refresh tokens."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://www.reddit.com/api/v1/access_token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.REDDIT_REDIRECT_URI,
            },
            auth=(settings.REDDIT_CLIENT_ID, settings.REDDIT_CLIENT_SECRET),
            headers={"User-Agent": "PostPilot/1.0"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Reddit token error: {resp.text}")
        data = resp.json()
        access_token  = data["access_token"]
        refresh_token = data.get("refresh_token", "")

        me_resp = await client.get(
            "https://oauth.reddit.com/api/v1/me",
            headers={
                "Authorization": f"Bearer {access_token}",
                "User-Agent": "PostPilot/1.0",
            },
        )
        username = "Reddit User"
        if me_resp.status_code == 200:
            username = f"u/{me_resp.json().get('name', 'unknown')}"

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "username": username,
        "expires_at": None,
    }


async def _exchange_twitter(code: str, code_verifier: str) -> dict:
    """Exchange auth code + PKCE verifier for X/Twitter OAuth 2.0 tokens."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.x.com/2/oauth2/token",
            data={
                "code": code,
                "grant_type": "authorization_code",
                "client_id": settings.TWITTER_CLIENT_ID,
                "redirect_uri": settings.TWITTER_REDIRECT_URI,
                "code_verifier": code_verifier,
            },
            auth=(settings.TWITTER_CLIENT_ID, settings.TWITTER_CLIENT_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Twitter token error: {resp.text}")
        data = resp.json()
        access_token  = data["access_token"]
        refresh_token = data.get("refresh_token", "")

        # Fetch username via /2/users/me
        me_resp = await client.get(
            "https://api.x.com/2/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        username = "X User"
        if me_resp.status_code == 200:
            username = f"@{me_resp.json().get('data', {}).get('username', 'unknown')}"

    return {
        "access_token": access_token,
        "refresh_token": refresh_token if refresh_token else None,
        "username": username,
        "expires_at": datetime.utcnow() + timedelta(hours=2),  # X tokens expire in 2h
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/connections")
def get_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return connection status for all OAuth platforms."""
    result = {}
    for platform in ALLOWED_PLATFORMS:
        conn = (
            db.query(SocialConnection)
            .filter(SocialConnection.user_id == current_user.id, SocialConnection.platform == platform)
            .first()
        )
        if conn:
            result[platform] = {
                "connected": True,
                "username": conn.username,
                "connected_at": conn.connected_at.isoformat() if conn.connected_at else None,
                "expires_at": conn.expires_at.isoformat() if conn.expires_at else None,
            }
        else:
            result[platform] = {"connected": False, "username": None}
    return result


@router.get("/{platform}/authorize")
def authorize(
    platform: str,
    current_user: User = Depends(get_current_user),
):
    """Return the OAuth authorization URL for the given platform."""
    if platform not in ALLOWED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")
    if platform in ("bluesky", "mastodon"):
        raise HTTPException(status_code=400, detail=f"{platform} uses a dedicated connect endpoint")

    if platform == "linkedin":
        state = _create_state(current_user.id)
        url   = _linkedin_authorize_url(state)
    elif platform == "reddit":
        state = _create_state(current_user.id)
        url   = _reddit_authorize_url(state)
    elif platform == "twitter":
        code_verifier, code_challenge = _pkce_pair()
        state = _create_twitter_state(current_user.id, code_verifier)
        url   = _twitter_authorize_url(state, code_challenge)

    return {"redirect_url": url, "platform": platform}


@router.get("/{platform}/callback")
async def callback(
    platform: str,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Handle the OAuth callback from the platform.
    NOTE: No JWT Bearer — user identity is recovered from the signed state token.
    """
    if platform not in ALLOWED_PLATFORMS:
        return RedirectResponse(f"{settings.FRONTEND_URL}/settings?error=bad_platform")

    # Decode state (Twitter also extracts code_verifier)
    try:
        if platform == "twitter":
            user_id, code_verifier = _decode_twitter_state(state)
            token_data = await _exchange_twitter(code, code_verifier)
        else:
            user_id = _decode_state(state)
            if platform == "linkedin":
                token_data = await _exchange_linkedin(code)
            else:
                token_data = await _exchange_reddit(code)
    except HTTPException as exc:
        return RedirectResponse(f"{settings.FRONTEND_URL}/settings?error={exc.detail[:60]}")

    # Upsert SocialConnection
    conn = (
        db.query(SocialConnection)
        .filter(SocialConnection.user_id == user_id, SocialConnection.platform == platform)
        .first()
    )
    if not conn:
        conn = SocialConnection(user_id=user_id, platform=platform)
        db.add(conn)

    conn.access_token_enc  = encrypt_value(token_data["access_token"])
    conn.refresh_token_enc = encrypt_value(token_data["refresh_token"]) if token_data["refresh_token"] else None
    conn.username          = token_data["username"]
    conn.expires_at        = token_data["expires_at"]
    conn.connected_at      = datetime.utcnow()
    db.commit()

    return RedirectResponse(f"{settings.FRONTEND_URL}/settings?connected={platform}")


@router.post("/twitter/refresh")
def refresh_twitter(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Proactively refresh X/Twitter OAuth 2.0 tokens (they expire every 2 h)."""
    conn = (
        db.query(SocialConnection)
        .filter(SocialConnection.user_id == current_user.id, SocialConnection.platform == "twitter")
        .first()
    )
    if not conn or not conn.refresh_token_enc:
        raise HTTPException(status_code=404, detail="No Twitter connection with refresh token found")

    from app.services.twitter_service import refresh_oauth2_token as _refresh

    refresh_token = decrypt_value(conn.refresh_token_enc)
    try:
        new_tokens = _refresh(refresh_token, settings.TWITTER_CLIENT_ID, settings.TWITTER_CLIENT_SECRET)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Token refresh failed: {exc}")

    conn.access_token_enc  = encrypt_value(new_tokens["access_token"])
    conn.refresh_token_enc = encrypt_value(new_tokens["refresh_token"])
    conn.expires_at        = datetime.utcnow() + timedelta(hours=2)
    db.commit()

    return {"success": True, "expires_at": conn.expires_at.isoformat()}


@router.delete("/{platform}")
def disconnect(
    platform: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove the stored OAuth connection for the given platform."""
    if platform not in ALLOWED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    conn = (
        db.query(SocialConnection)
        .filter(SocialConnection.user_id == current_user.id, SocialConnection.platform == platform)
        .first()
    )
    if not conn:
        raise HTTPException(status_code=404, detail=f"No {platform} connection found")

    db.delete(conn)
    db.commit()
    return {"success": True, "platform": platform}


# ── Bluesky (App Password auth — not OAuth) ──────────────────────────────────

class BlueskyConnectRequest(BaseModel):
    handle: str
    app_password: str


@router.post("/bluesky/connect")
def bluesky_connect(
    payload: BlueskyConnectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticate with Bluesky using handle + app password, store session."""
    from app.services.bluesky_service import login_and_export

    try:
        session_data = login_and_export(payload.handle.strip(), payload.app_password.strip())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Bluesky login failed: {exc}",
        )

    # Upsert SocialConnection
    conn = (
        db.query(SocialConnection)
        .filter(SocialConnection.user_id == current_user.id, SocialConnection.platform == "bluesky")
        .first()
    )
    if not conn:
        conn = SocialConnection(user_id=current_user.id, platform="bluesky")
        db.add(conn)

    conn.access_token_enc = encrypt_value(session_data["session_string"])
    conn.refresh_token_enc = None
    conn.username = session_data["username"]
    conn.expires_at = None  # Session doesn't have a fixed expiry
    conn.connected_at = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "username": session_data["username"],
        "platform": "bluesky",
    }


# ── Mastodon — per-instance OAuth ─────────────────────────────────────────────

class MastodonAuthorizeRequest(BaseModel):
    instance_url: str          # e.g. "mastodon.social"


def _get_or_create_mastodon_app(db: Session, instance_url: str) -> MastodonApp:
    """Return cached MastodonApp or register a new one."""
    instance_url = instance_url.strip().lower().rstrip("/")
    app = db.query(MastodonApp).filter(MastodonApp.instance_url == instance_url).first()
    if app:
        return app

    from app.config import settings as cfg
    try:
        client_id, client_secret = mastodon_service.register_app(instance_url, cfg.MASTODON_REDIRECT_URI)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not connect to Mastodon instance '{instance_url}'. "
                   f"Make sure you entered the instance domain only (e.g. mastodon.social), not your username. Error: {exc}",
        )

    app = MastodonApp(
        instance_url=instance_url,
        client_id=client_id,
        client_secret=client_secret,
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.post("/mastodon/authorize")
def mastodon_authorize(
    payload: MastodonAuthorizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Register app on user's instance (if first time), return authorize URL.
    State JWT carries user_id + instance_url so callback knows which instance.
    """
    from app.config import settings as cfg

    instance_url = payload.instance_url.strip().lower().rstrip("/")

    # Strip protocol if user pasted a full URL (https://mastodon.social or http://...)
    for prefix in ("https://", "http://"):
        if instance_url.startswith(prefix):
            instance_url = instance_url[len(prefix):]

    # Handle @user@instance format (e.g. @tabcrypt@mastodon.social → mastodon.social)
    if instance_url.startswith("@") and instance_url.count("@") >= 2:
        instance_url = instance_url.split("@")[-1]
    elif instance_url.startswith("@"):
        instance_url = instance_url.lstrip("@")

    # Strip any trailing path (mastodon.social/@tabcrypt → mastodon.social)
    instance_url = instance_url.split("/")[0]

    # Reject obvious non-instance inputs (no dot = likely a plain username)
    if "." not in instance_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter the Mastodon instance domain (e.g. mastodon.social), not your username.",
        )

    app = _get_or_create_mastodon_app(db, instance_url)

    # State JWT with instance_url embedded
    state_payload = {
        "user_id": current_user.id,
        "instance_url": instance_url,
        "exp": datetime.utcnow() + timedelta(minutes=10),
    }
    state = jwt.encode(state_payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    try:
        url = mastodon_service.get_authorize_url(instance_url, app.client_id, app.client_secret, cfg.MASTODON_REDIRECT_URI)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to build authorization URL for '{instance_url}': {exc}",
        )
    return {"redirect_url": url + f"&state={state}"}


@router.get("/mastodon/callback")
def mastodon_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """Mastodon OAuth callback — exchange code for token."""
    from app.config import settings as cfg

    try:
        payload = jwt.decode(state, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload["user_id"]
        instance_url = payload["instance_url"]
    except (JWTError, KeyError):
        raise HTTPException(status_code=400, detail="Invalid state")

    app = db.query(MastodonApp).filter(MastodonApp.instance_url == instance_url).first()
    if not app:
        raise HTTPException(status_code=400, detail="Unknown Mastodon instance")

    try:
        result = mastodon_service.exchange_code(
            instance_url, app.client_id, app.client_secret, code, cfg.MASTODON_REDIRECT_URI
        )
    except Exception as exc:
        return RedirectResponse(f"{cfg.FRONTEND_URL}/settings?error=mastodon_exchange_failed")

    # Upsert SocialConnection
    conn = (
        db.query(SocialConnection)
        .filter(SocialConnection.user_id == user_id, SocialConnection.platform == "mastodon")
        .first()
    )
    if not conn:
        conn = SocialConnection(user_id=user_id, platform="mastodon")
        db.add(conn)

    conn.access_token_enc = encrypt_value(result["access_token"])
    conn.refresh_token_enc = None
    conn.username = result["username"]
    conn.instance_url = instance_url
    conn.expires_at = None  # Mastodon tokens don't expire
    conn.connected_at = datetime.utcnow()
    db.commit()

    return RedirectResponse(f"{cfg.FRONTEND_URL}/settings?connected=mastodon")
