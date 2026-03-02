from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, ForeignKey

from app.database import Base


class AiProvider(Base):
    """Stores a user's AI provider entry (key + model + priority for fallback chain)."""
    __tablename__ = "ai_providers"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider      = Column(String, nullable=False)   # "claude" | "openai" | "groq" | "gemini"
    label         = Column(String, nullable=False)   # user's custom name, e.g. "My Claude Key"
    encrypted_key = Column(String, nullable=False)   # Fernet-encrypted API key
    model         = Column(String, nullable=False)   # e.g. "claude-sonnet-4-20250514"
    priority      = Column(Integer, nullable=False, default=0)  # ascending = tried first
    enabled       = Column(Boolean, nullable=False, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow, nullable=False)
