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


# default_limits applies to every @limiter.limit() decorated route as a floor.
# Per-route limits (stricter) always win. This acts as a global DDoS safety net.
limiter = Limiter(
    key_func=get_real_ip,
    default_limits=["300/minute", "2000/hour"],
)
