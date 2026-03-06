from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import limiter
from app.models.models import ApiKey, BlacklistedToken, Media, Payment, Post, User
from app.models.social_connection import SocialConnection
from app.models.ai_provider import AiProvider
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.security import create_access_token, decode_access_token, get_current_user, hash_password, verify_password

_bearer = HTTPBearer()

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invalidate the current JWT so it cannot be reused."""
    payload = decode_access_token(credentials.credentials)
    if payload:
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            # Purge tokens older than 7 days to keep the table small
            db.query(BlacklistedToken).filter(
                BlacklistedToken.expires_at < datetime.utcnow()
            ).delete()
            db.add(BlacklistedToken(
                jti=jti,
                expires_at=datetime.utcfromtimestamp(exp),
            ))
            db.commit()
    return {"success": True, "message": "Logged out successfully"}


# ── Delete account ────────────────────────────────────────────────────────────

class DeleteAccountRequest(BaseModel):
    confirmation: str


@router.delete("/account")
def delete_account(
    payload: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently delete the authenticated user's account and all associated data.
    Requires confirmation text: 'delete my account'
    """
    if payload.confirmation.strip().lower() != "delete my account":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please type 'delete my account' to confirm.",
        )

    user_id = current_user.id

    # Delete all related records explicitly (belt-and-suspenders alongside CASCADE)
    db.query(SocialConnection).filter(SocialConnection.user_id == user_id).delete()
    db.query(AiProvider).filter(AiProvider.user_id == user_id).delete()
    db.query(Payment).filter(Payment.user_id == user_id).delete()
    db.query(Media).filter(Media.user_id == user_id).delete()
    db.query(Post).filter(Post.user_id == user_id).delete()
    db.query(ApiKey).filter(ApiKey.user_id == user_id).delete()

    # Delete the user
    db.delete(current_user)
    db.commit()

    return {"success": True, "message": "Account and all data permanently deleted."}
