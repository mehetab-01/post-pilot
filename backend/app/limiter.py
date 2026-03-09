"""Shared slowapi rate limiter instance."""
from slowapi import Limiter
from starlette.requests import Request


def get_real_ip(request: Request) -> str:
    """
    Extract the real client IP behind Cloudflare / reverse proxies.
    Priority: CF-Connecting-IP > X-Forwarded-For (first entry) > direct IP.
    """
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# No default_limits — only routes with explicit @limiter.limit() are rate-limited.
# Auth endpoints keep their per-route limits (register: 3/min, login: 5/min).
# Generate has no decorator so slowapi never touches it.
limiter = Limiter(
    key_func=get_real_ip,
    default_limits=[],
)
