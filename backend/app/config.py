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
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    LINKEDIN_CLIENT_ID: str     = os.getenv("LINKEDIN_CLIENT_ID", "")
    LINKEDIN_CLIENT_SECRET: str = os.getenv("LINKEDIN_CLIENT_SECRET", "")
    LINKEDIN_REDIRECT_URI: str  = os.getenv(
        "LINKEDIN_REDIRECT_URI", "http://localhost:8000/api/oauth/linkedin/callback"
    )

    REDDIT_CLIENT_ID: str     = os.getenv("REDDIT_CLIENT_ID", "")
    REDDIT_CLIENT_SECRET: str = os.getenv("REDDIT_CLIENT_SECRET", "")
    REDDIT_REDIRECT_URI: str  = os.getenv(
        "REDDIT_REDIRECT_URI", "http://localhost:8000/api/oauth/reddit/callback"
    )

    # X / Twitter OAuth 2.0 with PKCE (Free tier — 500 posts/month)
    TWITTER_CLIENT_ID: str     = os.getenv("TWITTER_CLIENT_ID", "")
    TWITTER_CLIENT_SECRET: str = os.getenv("TWITTER_CLIENT_SECRET", "")
    TWITTER_REDIRECT_URI: str  = os.getenv(
        "TWITTER_REDIRECT_URI", "http://localhost:8000/api/oauth/twitter/callback"
    )


settings = Settings()
