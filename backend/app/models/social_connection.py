from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint, ForeignKey

from app.database import Base


class SocialConnection(Base):
    """Stores OAuth access/refresh tokens for social platforms (linkedin, reddit, twitter, bluesky, mastodon)."""
    __tablename__ = "social_connections"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform         = Column(String, nullable=False)          # "linkedin" | "reddit" | "bluesky" | "mastodon"
    access_token_enc = Column(String, nullable=True)           # encrypted access token
    refresh_token_enc = Column(String, nullable=True)          # encrypted refresh token (Reddit)
    username         = Column(String, nullable=True)           # display name, e.g. "u/johndoe"
    instance_url     = Column(String, nullable=True)           # Mastodon instance URL, e.g. "mastodon.social"
    expires_at       = Column(DateTime, nullable=True)         # token expiry (LinkedIn ~60 days)
    connected_at     = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "platform", name="uq_social_connection_user_platform"),
    )


class MastodonApp(Base):
    """Caches per-instance Mastodon app credentials so we don't re-register on every connect."""
    __tablename__ = "mastodon_apps"

    id            = Column(Integer, primary_key=True, index=True)
    instance_url  = Column(String, nullable=False, unique=True)   # e.g. "mastodon.social"
    client_id     = Column(String, nullable=False)
    client_secret = Column(String, nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow, nullable=False)
