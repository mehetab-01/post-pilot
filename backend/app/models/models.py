from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # ── Subscription / usage fields ──
    plan = Column(String, nullable=False, default="free")
    generations_used = Column(Integer, nullable=False, default=0)
    generations_limit = Column(Integer, nullable=False, default=10)
    plan_started_at = Column(DateTime, default=datetime.utcnow)
    plan_expires_at = Column(DateTime, nullable=True)
    billing_cycle_start = Column(DateTime, default=datetime.utcnow)

    billing_cycle = Column(String, nullable=True)           # monthly | yearly
    razorpay_order_id = Column(String, nullable=True)        # last order
    razorpay_payment_id = Column(String, nullable=True)      # last payment
    plan_cancelled = Column(Boolean, default=False)          # cancel pending

    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform = Column(String, nullable=False)
    key_name = Column(String, nullable=False)
    encrypted_value = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "platform", "key_name", name="uq_user_platform_keyname"),)

    user = relationship("User", back_populates="api_keys")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    context = Column(Text, nullable=True)
    platform = Column(String, nullable=True)
    tone = Column(String, nullable=True)
    generated_content = Column(Text, nullable=True)
    final_content = Column(Text, nullable=True)
    posted = Column(Boolean, default=False)
    posted_at = Column(DateTime, nullable=True)
    post_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="posts")
    media = relationship("Media", back_populates="post", cascade="all, delete-orphan")


class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    media_type = Column(String, nullable=False)  # image, video, link
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="media")
    post = relationship("Post", back_populates="media")


class Template(Base):
    __tablename__ = "templates"

    id               = Column(Integer, primary_key=True, autoincrement=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = built-in
    name             = Column(String, nullable=False)
    description      = Column(String, nullable=True)
    category         = Column(String, nullable=False, default="custom")
    context_template = Column(Text, nullable=False)
    platforms        = Column(JSON, nullable=True)   # list[str]
    tones            = Column(JSON, nullable=True)   # {platform: tone}
    is_public        = Column(Boolean, default=False)
    use_count        = Column(Integer, default=0)
    created_at       = Column(DateTime, default=datetime.utcnow)
    # Premium template metadata
    tier             = Column(String, nullable=False, default="free")  # free | starter | pro
    preview_example  = Column(Text, nullable=True)
    icon             = Column(String, nullable=True)
    color            = Column(String, nullable=True)


class Payment(Base):
    __tablename__ = "payments"

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False)
    razorpay_order_id   = Column(String, nullable=False)
    razorpay_payment_id = Column(String, nullable=True)
    amount              = Column(Integer, nullable=False)   # in paise
    currency            = Column(String, nullable=False, default="INR")
    plan                = Column(String, nullable=False)
    billing_cycle       = Column(String, nullable=False)    # monthly | yearly
    status              = Column(String, nullable=False, default="created")  # created | paid | failed
    created_at          = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="payments")


class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform      = Column(String, nullable=False)
    content       = Column(Text, nullable=False)
    media_ids     = Column(JSON, nullable=True)        # list[int]
    options       = Column(JSON, nullable=True)        # {subreddit, visibility, ...}
    scheduled_at  = Column(DateTime, nullable=False)   # UTC
    timezone      = Column(String, nullable=True)      # e.g. "Asia/Kolkata"
    status        = Column(String, nullable=False, default="pending")  # pending|posting|posted|failed|cancelled
    error         = Column(Text, nullable=True)
    post_url      = Column(String, nullable=True)
    retry_count   = Column(Integer, nullable=False, default=0)
    post_id       = Column(Integer, ForeignKey("posts.id"), nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IdeaLog(Base):
    """Tracks daily idea generation usage for rate limiting."""
    __tablename__ = "idea_logs"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class PostMetrics(Base):
    """Time-series engagement metrics fetched from platform APIs."""
    __tablename__ = "post_metrics"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    post_id         = Column(Integer, ForeignKey("posts.id"), nullable=False)
    platform        = Column(String, nullable=False)
    impressions     = Column(Integer, default=0)
    likes           = Column(Integer, default=0)
    shares          = Column(Integer, default=0)
    comments        = Column(Integer, default=0)
    clicks          = Column(Integer, default=0)
    engagement_rate = Column(String, nullable=True)   # stored as string e.g. "4.5"
    fetched_at      = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post")


class ContentPlan(Base):
    """A generated weekly content calendar."""
    __tablename__ = "content_plans"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    context    = Column(Text, nullable=False)
    style      = Column(String, nullable=False, default="balanced")
    week_plan  = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status     = Column(String, nullable=False, default="active")


class BlacklistedToken(Base):
    """JWT tokens invalidated on logout. Cleaned up after 7 days."""
    __tablename__ = "blacklisted_tokens"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    jti        = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AiCostLog(Base):
    """Per-call cost tracking for platform-owned AI key usage."""
    __tablename__ = "ai_cost_logs"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider   = Column(String, nullable=False)   # "claude" | "openai" | "groq"
    model      = Column(String, nullable=False)
    tokens_in  = Column(Integer, nullable=False, default=0)
    tokens_out = Column(Integer, nullable=False, default=0)
    cost_usd   = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
