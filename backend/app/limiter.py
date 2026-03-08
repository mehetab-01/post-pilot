"""Shared slowapi rate limiter instance."""
from slowapi import Limiter
from slowapi.util import get_remote_address

# default_limits applies to every @limiter.limit() decorated route as a floor.
# Per-route limits (stricter) always win. This acts as a global DDoS safety net.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute", "1000/hour"],
)
