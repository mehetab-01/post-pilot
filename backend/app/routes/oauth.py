"""
OAuth 2.0 flows for LinkedIn and Reddit.

The PostPilot server owner registers one app per platform and puts
their CLIENT_ID / CLIENT_SECRET in .env.  End-users just click
"Connect" — no developer credentials required from them.

Flow:
  1. Frontend calls GET /api/oauth/{platform}/authorize (with JWT Bearer).
  2. Backend builds the platform authorization URL, embeds a signed
     short-lived state token containing user_id, returns {redirect_url}.
  3. Frontend does window.location.href = redirect_url.
  4. Platform redirects to GET /api/oauth/{platform}/callback?code=…&state=…
  5. Backend verifies state, exchanges code for tokens, stores in DB,
     redirects to FRONTEND_URL/settings?connected={platform}.
  6. Frontend shows a success toast and re-fetches connection status.
"""
from datetime import datetime, timedelta
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.social_connection import SocialConnection
from app.models.models import User
from app.security import get_current_user
from app.services.encryption import encrypt_value, decrypt_value

router = APIRouter(prefix="/api/oauth", tags=["oauth"])

ALLOWED_PLATFORMS = ("linkedin", "reddit")

# ── State helpers ─────────────────────────────────────────────────────────────

def _create_state(user_id: int) -> str:
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


# ── Platform-specific builders ────────────────────────────────────────────────

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


# ── Token exchange ────────────────────────────────────────────────────────────

async def _exchange_linkedin(code: str) -> dict:
    """Exchange auth code for LinkedIn access token. Returns {access_token, username}."""
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
        expires_in   = data.get("expires_in", 5184000)  # ~60 days default

        # Fetch profile to get display name
        me_resp = await client.get(
            "https://api.linkedin.com/v2/me",
            params={"projection": "(id,localizedFirstName,localizedLastName)"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        name = "LinkedIn User"
        if me_resp.status_code == 200:
            me = me_resp.json()
            first = me.get("localizedFirstName", "")
            last  = me.get("localizedLastName", "")
            name  = f"{first} {last}".strip() or "LinkedIn User"

    return {
        "access_token": access_token,
        "refresh_token": None,
        "username": name,
        "expires_at": datetime.utcnow() + timedelta(seconds=expires_in),
    }


async def _exchange_reddit(code: str) -> dict:
    """Exchange auth code for Reddit access + refresh tokens. Returns {access_token, refresh_token, username}."""
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

        # Fetch Reddit username
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
        "expires_at": None,  # Reddit tokens are permanent via refresh_token
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/connections")
def get_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return connection status for linkedin and reddit."""
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

    state = _create_state(current_user.id)
    if platform == "linkedin":
        url = _linkedin_authorize_url(state)
    else:
        url = _reddit_authorize_url(state)

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
    Stores tokens in DB, then redirects the browser back to the frontend.
    NOTE: This endpoint is called by the platform (not the frontend), so there
    is no JWT Bearer — user identity is recovered from the signed state token.
    """
    if platform not in ALLOWED_PLATFORMS:
        return RedirectResponse(f"{settings.FRONTEND_URL}/settings?error=bad_platform")

    user_id = _decode_state(state)

    try:
        if platform == "linkedin":
            token_data = await _exchange_linkedin(code)
        else:
            token_data = await _exchange_reddit(code)
    except HTTPException as exc:
        return RedirectResponse(f"{settings.FRONTEND_URL}/settings?error={exc.detail[:40]}")

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
