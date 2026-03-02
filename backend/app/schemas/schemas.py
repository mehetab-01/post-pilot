from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── API Keys ──────────────────────────────────────────────────────────────────

class SaveKeysRequest(BaseModel):
    platform: str
    keys: Dict[str, str]


class MaskedKeyEntry(BaseModel):
    key_name: str
    masked_value: str
    updated_at: datetime

    class Config:
        from_attributes = True


class PlatformKeysResponse(BaseModel):
    platform: str
    keys: list[MaskedKeyEntry]


class TestConnectionRequest(BaseModel):
    platform: str


class TestConnectionResponse(BaseModel):
    platform: str
    success: bool
    message: str


class DeleteKeysResponse(BaseModel):
    platform: str
    deleted_count: int
    message: str


# ── Posts ─────────────────────────────────────────────────────────────────────

class PostResponse(BaseModel):
    id: int
    user_id: int
    context: Optional[str] = None
    platform: Optional[str] = None
    tone: Optional[str] = None
    generated_content: Optional[str] = None
    final_content: Optional[str] = None
    posted: bool
    posted_at: Optional[datetime] = None
    post_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Media ─────────────────────────────────────────────────────────────────────

class MediaResponse(BaseModel):
    id: int
    user_id: int
    post_id: Optional[int] = None
    filename: str
    filepath: str
    media_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Generate ──────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    context: str
    platforms: Dict[str, Dict[str, Any]]
    additional_instructions: Optional[str] = None
    length: str = "medium"


class RegenerateRequest(BaseModel):
    platform: str
    context: str
    tone: str
    options: Dict[str, Any] = {}


class EnhanceRequest(BaseModel):
    platform: str
    content: str
    tone: str


class HumanizeRequest(BaseModel):
    platform: str
    content: str
    tone: str


class GeneratedPlatformPost(BaseModel):
    post_id: int
    platform: str
    tone: str
    content: str
    raw: Dict[str, Any]


class GenerateResponse(BaseModel):
    generated: List[GeneratedPlatformPost]
    posting_tips: Dict[str, str]


class RegenerateResponse(BaseModel):
    post_id: int
    platform: str
    tone: str
    content: str
    raw: Dict[str, Any]


class EnhanceResponse(BaseModel):
    platform: str
    original_content: str
    enhanced_content: str


class HumanizeResponse(BaseModel):
    platform: str
    original_content: str
    humanized_content: str


# ── Posting ───────────────────────────────────────────────────────────────────

class PostToPlatformRequest(BaseModel):
    content: str
    post_id: Optional[int] = None
    media_ids: Optional[List[int]] = None
    options: Dict[str, Any] = {}


class PlatformPostResult(BaseModel):
    platform: str
    success: bool
    post_url: Optional[str] = None
    error: Optional[str] = None


class PostAllRequest(BaseModel):
    posts: Dict[str, Dict[str, Any]]


class PostAllResponse(BaseModel):
    results: List[PlatformPostResult]


# ── History ───────────────────────────────────────────────────────────────────

class HistoryItem(BaseModel):
    id: int
    platform: Optional[str] = None
    tone: Optional[str] = None
    content_preview: str
    posted: bool
    post_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int
    limit: int
    offset: int
