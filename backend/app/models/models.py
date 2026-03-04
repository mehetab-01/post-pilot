from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
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

    api_keys = relationship("ApiKey", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="user", cascade="all, delete-orphan")


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
