from datetime import datetime
from typing import List

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import ApiKey, User
from app.schemas.schemas import (
    DeleteKeysResponse,
    MaskedKeyEntry,
    PlatformKeysResponse,
    SaveKeysRequest,
    TestConnectionRequest,
    TestConnectionResponse,
)
from app.security import get_current_user
from app.services.encryption import decrypt_value, encrypt_value

router = APIRouter(prefix="/api/settings", tags=["settings"])

SUPPORTED_PLATFORMS = {"claude", "twitter", "linkedin", "reddit", "instagram"}


def _mask_value(plain: str) -> str:
    if len(plain) <= 4:
        return "••••••••"
    return "••••••••" + plain[-4:]


@router.post("/keys", status_code=status.HTTP_200_OK)
def save_keys(
    payload: SaveKeysRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported platform '{payload.platform}'. Must be one of: {', '.join(SUPPORTED_PLATFORMS)}",
        )

    saved = []
    for key_name, plain_value in payload.keys.items():
        encrypted = encrypt_value(plain_value)
        existing = (
            db.query(ApiKey)
            .filter(
                ApiKey.user_id == current_user.id,
                ApiKey.platform == payload.platform,
                ApiKey.key_name == key_name,
            )
            .first()
        )
        if existing:
            existing.encrypted_value = encrypted
            existing.updated_at = datetime.utcnow()
        else:
            new_key = ApiKey(
                user_id=current_user.id,
                platform=payload.platform,
                key_name=key_name,
                encrypted_value=encrypted,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(new_key)
        saved.append(key_name)

    db.commit()
    return {"platform": payload.platform, "saved_keys": saved, "message": "Keys saved successfully"}


@router.get("/keys", response_model=List[PlatformKeysResponse])
def get_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.query(ApiKey).filter(ApiKey.user_id == current_user.id).all()

    platforms: dict[str, list] = {}
    for row in rows:
        plain = decrypt_value(row.encrypted_value)
        entry = MaskedKeyEntry(
            key_name=row.key_name,
            masked_value=_mask_value(plain),
            updated_at=row.updated_at,
        )
        platforms.setdefault(row.platform, []).append(entry)

    return [
        PlatformKeysResponse(platform=platform, keys=keys)
        for platform, keys in platforms.items()
    ]


@router.delete("/keys/{platform}", response_model=DeleteKeysResponse)
def delete_keys(
    platform: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == current_user.id, ApiKey.platform == platform)
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No keys found for platform '{platform}'",
        )

    count = len(rows)
    for row in rows:
        db.delete(row)
    db.commit()

    return DeleteKeysResponse(
        platform=platform,
        deleted_count=count,
        message=f"Deleted {count} key(s) for platform '{platform}'",
    )


@router.post("/keys/test", response_model=TestConnectionResponse)
def test_connection(
    payload: TestConnectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(ApiKey)
        .filter(ApiKey.user_id == current_user.id, ApiKey.platform == payload.platform)
        .all()
    )
    if not rows:
        return TestConnectionResponse(
            platform=payload.platform,
            success=False,
            message="No API keys found for this platform. Please save keys first.",
        )

    decrypted: dict[str, str] = {}
    for row in rows:
        try:
            decrypted[row.key_name] = decrypt_value(row.encrypted_value)
        except Exception:
            return TestConnectionResponse(
                platform=payload.platform,
                success=False,
                message=f"Failed to decrypt key '{row.key_name}'. The key may be corrupted.",
            )

    platform = payload.platform

    if platform == "claude":
        return _test_claude(decrypted)
    elif platform == "twitter":
        return _test_twitter(decrypted)
    elif platform == "reddit":
        return _test_reddit(decrypted)
    elif platform == "linkedin":
        return _test_linkedin(decrypted)
    elif platform == "instagram":
        return _test_instagram(decrypted)
    else:
        return TestConnectionResponse(
            platform=platform,
            success=False,
            message=f"Connection test not implemented for platform '{platform}'",
        )


def _test_claude(keys: dict) -> TestConnectionResponse:
    api_key = keys.get("api_key")
    if not api_key:
        return TestConnectionResponse(platform="claude", success=False, message="Missing 'api_key'")
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=10,
            messages=[{"role": "user", "content": "ping"}],
        )
        return TestConnectionResponse(platform="claude", success=True, message="Claude API connection successful")
    except Exception as e:
        return TestConnectionResponse(platform="claude", success=False, message=str(e))


def _test_twitter(keys: dict) -> TestConnectionResponse:
    required = {"api_key", "api_secret", "access_token", "access_token_secret"}
    missing = required - keys.keys()
    if missing:
        return TestConnectionResponse(
            platform="twitter",
            success=False,
            message=f"Missing keys: {', '.join(missing)}",
        )
    try:
        import tweepy
        client = tweepy.Client(
            consumer_key=keys["api_key"],
            consumer_secret=keys["api_secret"],
            access_token=keys["access_token"],
            access_token_secret=keys["access_token_secret"],
        )
        me = client.get_me()
        username = me.data.username if me.data else "unknown"
        return TestConnectionResponse(
            platform="twitter",
            success=True,
            message=f"Twitter connection successful. Logged in as @{username}",
        )
    except Exception as e:
        return TestConnectionResponse(platform="twitter", success=False, message=str(e))


def _test_reddit(keys: dict) -> TestConnectionResponse:
    required = {"client_id", "client_secret", "username", "password"}
    missing = required - keys.keys()
    if missing:
        return TestConnectionResponse(
            platform="reddit",
            success=False,
            message=f"Missing keys: {', '.join(missing)}",
        )
    try:
        import praw
        reddit = praw.Reddit(
            client_id=keys["client_id"],
            client_secret=keys["client_secret"],
            username=keys["username"],
            password=keys["password"],
            user_agent="PostPilot/1.0",
        )
        username = reddit.user.me().name
        return TestConnectionResponse(
            platform="reddit",
            success=True,
            message=f"Reddit connection successful. Logged in as u/{username}",
        )
    except Exception as e:
        return TestConnectionResponse(platform="reddit", success=False, message=str(e))


def _test_linkedin(keys: dict) -> TestConnectionResponse:
    access_token = keys.get("access_token")
    if not access_token:
        return TestConnectionResponse(
            platform="linkedin", success=False, message="Missing 'access_token'"
        )
    try:
        with httpx.Client() as client:
            resp = client.get(
                "https://api.linkedin.com/v2/me",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
        if resp.status_code == 200:
            data = resp.json()
            name = f"{data.get('localizedFirstName', '')} {data.get('localizedLastName', '')}".strip()
            return TestConnectionResponse(
                platform="linkedin",
                success=True,
                message=f"LinkedIn connection successful. Logged in as {name or 'unknown'}",
            )
        else:
            return TestConnectionResponse(
                platform="linkedin",
                success=False,
                message=f"LinkedIn API returned status {resp.status_code}: {resp.text}",
            )
    except Exception as e:
        return TestConnectionResponse(platform="linkedin", success=False, message=str(e))


def _test_instagram(keys: dict) -> TestConnectionResponse:
    access_token = keys.get("access_token")
    if not access_token:
        return TestConnectionResponse(
            platform="instagram", success=False, message="Missing 'access_token'"
        )
    try:
        with httpx.Client() as client:
            resp = client.get(
                "https://graph.instagram.com/me",
                params={"fields": "id,username", "access_token": access_token},
                timeout=10,
            )
        if resp.status_code == 200:
            data = resp.json()
            username = data.get("username", "unknown")
            return TestConnectionResponse(
                platform="instagram",
                success=True,
                message=f"Instagram connection successful. Logged in as @{username}",
            )
        else:
            return TestConnectionResponse(
                platform="instagram",
                success=False,
                message=f"Instagram API returned status {resp.status_code}: {resp.text}",
            )
    except Exception as e:
        return TestConnectionResponse(platform="instagram", success=False, message=str(e))
