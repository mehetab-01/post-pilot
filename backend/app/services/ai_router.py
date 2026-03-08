"""
AI provider fallback chain.

Priority order:
1. User's own AiProvider rows (ordered by priority) — Pro user override
2. PostPilot platform-owned keys — tier-gated:
   - Free users  → Groq only (POSTPILOT_GROQ_KEY, free tier, Llama 3.3)
   - Starter/Pro → Claude first, then OpenAI, then Groq as fallback

This keeps Claude API costs reserved for paying users.
"""
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session

from app.config import settings as cfg
from app.models.ai_provider import AiProvider
from app.services.encryption import decrypt_value
from app.services import claude_service, openai_compat_service


class AiRateLimitError(Exception):
    """Raised when all AI providers are rate-limited. Returns 429 to client."""
    pass

# Cost per million tokens (USD) — actual Anthropic pricing (Mar 2025)
# Haiku 4.5: $1/$5 | Sonnet 4.6: $3/$15 | Opus 4.6: $5/$25
_COST_PER_MTOK = {
    "claude": {"in": 1.0,  "out": 5.0},   # Haiku 4.5 (default platform model)
    "openai": {"in": 2.5,  "out": 10.0},
    "groq":   {"in": 0.1,  "out": 0.1},
    "gemini": {"in": 0.5,  "out": 1.5},
}


def _estimate_cost(provider: str, text_in: str, text_out: str) -> tuple[int, int, float]:
    tokens_in  = max(1, len(text_in)  // 4)
    tokens_out = max(1, len(text_out) // 4)
    rates = _COST_PER_MTOK.get(provider, {"in": 3.0, "out": 15.0})
    cost  = (tokens_in * rates["in"] + tokens_out * rates["out"]) / 1_000_000
    return tokens_in, tokens_out, round(cost, 8)


def _log_cost(db: Session, user_id: int, provider: str, model: str,
              text_in: str, text_out: str) -> None:
    """Append a cost-tracking row. Never raises."""
    try:
        from app.models.models import AiCostLog
        tokens_in, tokens_out, cost = _estimate_cost(provider, text_in, text_out)
        db.add(AiCostLog(
            user_id=user_id, provider=provider, model=model,
            tokens_in=tokens_in, tokens_out=tokens_out, cost_usd=cost,
        ))
        db.commit()
    except Exception:
        pass


def _get_user_providers(db: Session, user_id: int) -> list[AiProvider]:
    return (
        db.query(AiProvider)
        .filter(AiProvider.user_id == user_id, AiProvider.enabled == True)  # noqa: E712
        .order_by(AiProvider.priority)
        .all()
    )


def _platform_providers_for_plan(user_plan: str) -> list[tuple[str, str, str]]:
    """
    Return PostPilot's platform-owned (provider, key, model) based on user plan.
    Free users get Groq only (free tier). Starter/Pro get Claude → OpenAI → Groq.
    """
    plan = user_plan or "free"
    if plan == "free":
        # Free users: Groq only (llama-3.3-70b, free tier, $0 cost)
        if cfg.POSTPILOT_GROQ_KEY:
            return [("groq", cfg.POSTPILOT_GROQ_KEY, "llama-3.3-70b-versatile")]
        return []
    # Starter / Pro: Claude first, then OpenAI, then Groq fallback
    result = []
    if cfg.POSTPILOT_CLAUDE_API_KEY:
        result.append(("claude", cfg.POSTPILOT_CLAUDE_API_KEY, cfg.POSTPILOT_AI_MODEL))
    if cfg.POSTPILOT_OPENAI_KEY:
        result.append(("openai", cfg.POSTPILOT_OPENAI_KEY, "gpt-4o-mini"))
    if cfg.POSTPILOT_GROQ_KEY:
        result.append(("groq", cfg.POSTPILOT_GROQ_KEY, "llama-3.3-70b-versatile"))
    return result


def _is_rate_limit_err(exc: Exception) -> bool:
    """Return True if the exception indicates a provider rate limit (429)."""
    name = type(exc).__name__.lower()
    msg = str(exc).lower()
    return "ratelimit" in name or "rate_limit" in name or "429" in msg or "rate limit" in msg


async def _call(provider: str, key: str, model: str, fn: str, **kwargs):
    """Dispatch to the right service by provider name and function."""
    svc = claude_service if provider == "claude" else openai_compat_service
    extra = {} if provider == "claude" else {"provider": provider}
    return await getattr(svc, fn)(api_key=key, model=model, **extra, **kwargs)


def _iter_all(db: Session, user_id: int, user_plan: str = "free"):
    """Yield (provider, key, model) — user's own keys first, then platform keys."""
    for p in _get_user_providers(db, user_id):
        yield p.provider, decrypt_value(p.encrypted_key), p.model
    yield from _platform_providers_for_plan(user_plan)


async def generate_posts(
    db: Session,
    user_id: int,
    context: str,
    platforms: dict,
    media_info: Optional[list] = None,
    additional_instructions: Optional[str] = None,
    length: str = "medium",
    user_plan: str = "free",
) -> dict:
    last_err: Exception = Exception("No AI providers configured")
    rate_limited = False
    for provider, key, model in _iter_all(db, user_id, user_plan):
        try:
            result = await _call(
                provider, key, model, "generate_posts",
                context=context, platforms=platforms,
                media_info=media_info,
                additional_instructions=additional_instructions,
                length=length,
            )
            _log_cost(db, user_id, provider, model, context, str(result))
            return result
        except Exception as exc:
            last_err = exc
            if _is_rate_limit_err(exc):
                rate_limited = True
            continue
    if rate_limited:
        raise AiRateLimitError("PostPilot AI is busy right now. Please try again in a moment.")
    raise ValueError(f"AI generation failed. Last error: {last_err}")


async def enhance_post(
    db: Session,
    user_id: int,
    platform: str,
    current_content: str,
    tone: str,
    additional_instructions: Optional[str] = None,
    user_plan: str = "free",
) -> str:
    last_err: Exception = Exception("No AI providers configured")
    for provider, key, model in _iter_all(db, user_id, user_plan):
        try:
            result = await _call(
                provider, key, model, "enhance_post",
                platform=platform, current_content=current_content,
                tone=tone, additional_instructions=additional_instructions,
            )
            _log_cost(db, user_id, provider, model, current_content, str(result))
            return result
        except Exception as exc:
            last_err = exc
            continue
    raise ValueError(f"AI enhance failed. Last error: {last_err}")


async def score_content(
    db: Session,
    user_id: int,
    content: str,
    platform: str,
    user_plan: str = "free",
) -> dict:
    last_err: Exception = Exception("No AI providers configured")
    for provider, key, model in _iter_all(db, user_id, user_plan):
        try:
            result = await _call(
                provider, key, model, "score_content",
                content=content, platform=platform,
            )
            _log_cost(db, user_id, provider, model, content, str(result))
            return result
        except Exception as exc:
            last_err = exc
            continue
    raise ValueError(f"AI score failed. Last error: {last_err}")


async def check_originality(
    db: Session,
    user_id: int,
    content: str,
    platform: str,
    user_plan: str = "free",
) -> dict:
    last_err: Exception = Exception("No AI providers configured")
    for provider, key, model in _iter_all(db, user_id, user_plan):
        try:
            result = await _call(
                provider, key, model, "check_originality",
                content=content, platform=platform,
            )
            _log_cost(db, user_id, provider, model, content, str(result))
            return result
        except Exception as exc:
            last_err = exc
            continue
    raise ValueError(f"AI originality check failed. Last error: {last_err}")


async def humanize_post(
    db: Session,
    user_id: int,
    platform: str,
    current_content: str,
    tone: str,
    user_plan: str = "free",
) -> str:
    last_err: Exception = Exception("No AI providers configured")
    for provider, key, model in _iter_all(db, user_id, user_plan):
        try:
            result = await _call(
                provider, key, model, "humanize_post",
                platform=platform, current_content=current_content, tone=tone,
            )
            _log_cost(db, user_id, provider, model, current_content, str(result))
            return result
        except Exception as exc:
            last_err = exc
            continue
    raise ValueError(f"AI humanize failed. Last error: {last_err}")


async def generate_week_plan(
    db: Session,
    user_id: int,
    context: str,
    platforms: Optional[list[str]] = None,
    days: int = 7,
    style: str = "balanced",
) -> dict:
    last_err: Exception = Exception("No AI providers configured")
    for provider, key, model in _iter_all(db, user_id):
        try:
            result = await claude_service.generate_week_plan(
                api_key=key, model=model,
                context=context, platforms=platforms or [],
                days=days, style=style,
            )
            _log_cost(db, user_id, provider, model, context, str(result))
            return result
        except Exception as exc:
            last_err = exc
            continue
    raise ValueError(f"Week plan generation failed. Last error: {last_err}")


async def generate_ideas(
    db: Session,
    user_id: int,
    niche: Optional[str] = None,
    platforms: Optional[list[str]] = None,
    recent_contexts: Optional[list[str]] = None,
    user_plan: str = "free",
) -> list[dict]:
    last_err: Exception = Exception("No AI providers configured")
    for provider, key, model in _iter_all(db, user_id, user_plan):
        try:
            result = await _call(
                provider, key, model, "generate_ideas",
                niche=niche, platforms=platforms,
                recent_contexts=recent_contexts,
            )
            _log_cost(db, user_id, provider, model, str(niche or ""), str(result))
            return result
        except Exception as exc:
            last_err = exc
            continue
    raise ValueError(f"AI ideas generation failed. Last error: {last_err}")
