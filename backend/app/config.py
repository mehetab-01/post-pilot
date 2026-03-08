import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./postpilot.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-this-to-a-random-string")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    FERNET_KEY: str = os.getenv("FERNET_KEY", "")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    # Comma-separated extra origins allowed by CORS (e.g. your deployed frontend URL)
    EXTRA_CORS_ORIGINS: str = os.getenv("EXTRA_CORS_ORIGINS", "")

    # OAuth — Social platforms (set these in .env after registering developer apps)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://postpilot.tabcrypt.in")

    LINKEDIN_CLIENT_ID: str     = os.getenv("LINKEDIN_CLIENT_ID", "")
    LINKEDIN_CLIENT_SECRET: str = os.getenv("LINKEDIN_CLIENT_SECRET", "")
    LINKEDIN_REDIRECT_URI: str  = os.getenv(
        "LINKEDIN_REDIRECT_URI", "https://postpilot.tabcrypt.in/api/oauth/linkedin/callback"
    )

    REDDIT_CLIENT_ID: str     = os.getenv("REDDIT_CLIENT_ID", "")
    REDDIT_CLIENT_SECRET: str = os.getenv("REDDIT_CLIENT_SECRET", "")
    REDDIT_REDIRECT_URI: str  = os.getenv(
        "REDDIT_REDIRECT_URI", "https://postpilot.tabcrypt.in/api/oauth/reddit/callback"
    )

    # X / Twitter OAuth 2.0 with PKCE (Free tier — 500 posts/month)
    TWITTER_CLIENT_ID: str     = os.getenv("TWITTER_CLIENT_ID", "")
    TWITTER_CLIENT_SECRET: str = os.getenv("TWITTER_CLIENT_SECRET", "")
    TWITTER_REDIRECT_URI: str  = os.getenv(
        "TWITTER_REDIRECT_URI", "https://postpilot.tabcrypt.in/api/oauth/twitter/callback"
    )

    # Mastodon (per-instance OAuth — no global client credentials needed)
    MASTODON_REDIRECT_URI: str = os.getenv(
        "MASTODON_REDIRECT_URI", "https://postpilot.tabcrypt.in/api/oauth/mastodon/callback"
    )

    # Razorpay payments
    RAZORPAY_KEY_ID: str          = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str      = os.getenv("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_WEBHOOK_SECRET: str  = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")

    # PostPilot-owned AI keys — used for ALL users (no setup required)
    POSTPILOT_CLAUDE_API_KEY: str = os.getenv("POSTPILOT_CLAUDE_API_KEY", "")
    POSTPILOT_AI_MODEL: str       = os.getenv("POSTPILOT_AI_MODEL", "claude-haiku-4-5-20251001")
    POSTPILOT_OPENAI_KEY: str     = os.getenv("POSTPILOT_OPENAI_KEY", "")
    POSTPILOT_GROQ_KEY: str       = os.getenv("POSTPILOT_GROQ_KEY", "")

    # Admin secret for internal endpoints
    ADMIN_SECRET: str = os.getenv("ADMIN_SECRET", "")


settings = Settings()
