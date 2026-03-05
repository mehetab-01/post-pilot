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
    plan: Optional[str] = "free"
    generations_used: Optional[int] = 0
    generations_limit: Optional[int] = 10

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
    additional_instructions: Optional[str] = None


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


# ── Humanize Score ────────────────────────────────────────────────────────────

class HumanizeScoreRequest(BaseModel):
    content: str
    platform: str


class HumanizeScoreFlag(BaseModel):
    phrase: str
    reason: str


class HumanizeScoreResponse(BaseModel):
    score: int
    level: str  # "human" | "mixed" | "ai"
    flags: List[HumanizeScoreFlag]
    tips: List[str]


# ── Originality Check ─────────────────────────────────────────────────────────

class OriginalityCheckRequest(BaseModel):
    content: str
    platform: str


class OriginalityGenericPhrase(BaseModel):
    phrase: str
    suggestion: str


class OriginalityCheckResponse(BaseModel):
    originality_score: int
    level: str  # "good" | "mixed" | "generic"
    generic_phrases: List[OriginalityGenericPhrase]
    improvements: List[str]
    verdict: str


# ── History ───────────────────────────────────────────────────────────────────

class HistoryItem(BaseModel):
    id: int
    platform: Optional[str] = None
    tone: Optional[str] = None
    content_preview: str
    posted: bool
    post_url: Optional[str] = None
    created_at: datetime
    metrics: Optional[dict] = None

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int
    limit: int
    offset: int


# ── Templates ─────────────────────────────────────────────────────────────────

class TemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "custom"
    context_template: str
    platforms: Optional[List[str]] = None
    tones: Optional[Dict[str, str]] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    context_template: Optional[str] = None
    platforms: Optional[List[str]] = None
    tones: Optional[Dict[str, str]] = None


class TemplateResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    category: str
    context_template: str
    platforms: Optional[List[str]] = None
    tones: Optional[Dict[str, str]] = None
    is_public: bool
    use_count: int
    created_at: datetime
    tier: str = "free"
    preview_example: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

    class Config:
        from_attributes = True


# ── Scheduled Posts ───────────────────────────────────────────────────────────

class SchedulePostRequest(BaseModel):
    platform: str
    content: str
    scheduled_at: datetime           # UTC ISO 8601
    timezone: Optional[str] = None   # e.g. "Asia/Kolkata"
    media_ids: Optional[List[int]] = None
    options: Dict[str, Any] = {}
    post_id: Optional[int] = None


class RescheduleRequest(BaseModel):
    scheduled_at: datetime


class ScheduledPostResponse(BaseModel):
    id: int
    platform: str
    content: str
    scheduled_at: datetime
    timezone: Optional[str] = None
    status: str
    error: Optional[str] = None
    post_url: Optional[str] = None
    retry_count: int
    created_at: datetime

    class Config:
        from_attributes = True
