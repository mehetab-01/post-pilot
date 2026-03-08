"""
CRUD + reorder endpoints for user AI providers.
Users can add Claude, OpenAI, Groq, Gemini entries.
The priority column determines the fallback order (0 = first tried).
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ai_provider import AiProvider
from app.models.models import User
from app.plans import require_plan
from app.security import get_current_user
from app.services.encryption import encrypt_value, decrypt_value

router = APIRouter(prefix="/api/ai-providers", tags=["ai-providers"])

SUPPORTED_PROVIDERS = ("claude", "openai", "groq", "gemini")

DEFAULT_MODELS = {
    "claude": "claude-sonnet-4-20250514",
    "openai": "gpt-4o-mini",
    "groq":   "llama-3.3-70b-versatile",
    "gemini": "gemini-2.0-flash",
}


# ── Schemas ───────────────────────────────────────────────────────────────────

class AddProviderRequest(BaseModel):
    provider: str
    label: str
    api_key: str
    model: Optional[str] = None


class UpdateProviderRequest(BaseModel):
    label: Optional[str] = None
    model: Optional[str] = None
    enabled: Optional[bool] = None


class ReorderItem(BaseModel):
    id: int
    priority: int


class ReorderRequest(BaseModel):
    items: list[ReorderItem]


def _mask_key(plain: str) -> str:
    if len(plain) <= 4:
        return "••••••••"
    return "••••••••" + plain[-4:]


def _provider_to_dict(p: AiProvider) -> dict:
    try:
        plain = decrypt_value(p.encrypted_key)
        masked = _mask_key(plain)
    except Exception:
        masked = "••••••••"
    return {
        "id":       p.id,
        "provider": p.provider,
        "label":    p.label,
        "masked_key": masked,
        "model":    p.model,
        "priority": p.priority,
        "enabled":  p.enabled,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("")
def list_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    providers = (
        db.query(AiProvider)
        .filter(AiProvider.user_id == current_user.id)
        .order_by(AiProvider.priority)
        .all()
    )
    return [_provider_to_dict(p) for p in providers]


@router.post("", status_code=status.HTTP_201_CREATED)
def add_provider(
    payload: AddProviderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "pro", "Custom AI providers")
    if payload.provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {payload.provider}")
    if not payload.api_key.strip():
        raise HTTPException(status_code=400, detail="API key cannot be empty")
    if not payload.label.strip():
        raise HTTPException(status_code=400, detail="Label cannot be empty")

    model = payload.model or DEFAULT_MODELS[payload.provider]

    # Assign next priority
    max_p = (
        db.query(AiProvider)
        .filter(AiProvider.user_id == current_user.id)
        .count()
    )

    entry = AiProvider(
        user_id       = current_user.id,
        provider      = payload.provider,
        label         = payload.label.strip(),
        encrypted_key = encrypt_value(payload.api_key.strip()),
        model         = model,
        priority      = max_p,
        enabled       = True,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _provider_to_dict(entry)


@router.put("/reorder")
def reorder_providers(
    payload: ReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for item in payload.items:
        entry = (
            db.query(AiProvider)
            .filter(AiProvider.id == item.id, AiProvider.user_id == current_user.id)
            .first()
        )
        if entry:
            entry.priority = item.priority
    db.commit()
    return {"success": True}


@router.put("/{provider_id}")
def update_provider(
    provider_id: int,
    payload: UpdateProviderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(AiProvider)
        .filter(AiProvider.id == provider_id, AiProvider.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Provider not found")

    if payload.label is not None:
        entry.label = payload.label.strip()
    if payload.model is not None:
        entry.model = payload.model.strip()
    if payload.enabled is not None:
        entry.enabled = payload.enabled

    db.commit()
    db.refresh(entry)
    return _provider_to_dict(entry)


@router.delete("/{provider_id}")
def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = (
        db.query(AiProvider)
        .filter(AiProvider.id == provider_id, AiProvider.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Provider not found")

    db.delete(entry)
    db.commit()

    # Compact priorities so they stay sequential
    remaining = (
        db.query(AiProvider)
        .filter(AiProvider.user_id == current_user.id)
        .order_by(AiProvider.priority)
        .all()
    )
    for i, p in enumerate(remaining):
        p.priority = i
    db.commit()

    return {"success": True, "id": provider_id}
