from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint, ForeignKey

from app.database import Base


class SocialConnection(Base):
    """Stores OAuth access/refresh tokens for social platforms (linkedin, reddit)."""
    __tablename__ = "social_connections"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform         = Column(String, nullable=False)          # "linkedin" | "reddit"
    access_token_enc = Column(String, nullable=True)           # encrypted access token
    refresh_token_enc = Column(String, nullable=True)          # encrypted refresh token (Reddit)
    username         = Column(String, nullable=True)           # display name, e.g. "u/johndoe"
    expires_at       = Column(DateTime, nullable=True)         # token expiry (LinkedIn ~60 days)
    connected_at     = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "platform", name="uq_social_connection_user_platform"),
    )
