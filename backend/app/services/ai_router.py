"""
AI provider fallback chain.

Reads the user's AiProvider rows ordered by priority (ascending).
Tries each enabled provider in turn; if one fails for any reason
(bad key, rate-limit, network error), the next is tried automatically.
Raises ValueError if every provider is exhausted.
"""
from typing import Optional

from sqlalchemy.orm import Session

from app.models.ai_provider import AiProvider
from app.services.encryption import decrypt_value
from app.services import claude_service, openai_compat_service


def _get_providers(db: Session, user_id: int) -> list[AiProvider]:
    return (
        db.query(AiProvider)
        .filter(AiProvider.user_id == user_id, AiProvider.enabled == True)  # noqa: E712
        .order_by(AiProvider.priority)
        .all()
    )


async def generate_posts(
    db: Session,
    user_id: int,
    context: str,
    platforms: dict,
    media_info: Optional[list] = None,
    additional_instructions: Optional[str] = None,
    length: str = "medium",
) -> dict:
    providers = _get_providers(db, user_id)
    if not providers:
        raise ValueError(
            "No AI providers configured. Go to Settings and add at least one AI provider."
        )

    last_err: Exception = Exception("Unknown error")
    for p in providers:
        try:
            key = decrypt_value(p.encrypted_key)
            if p.provider == "claude":
                return await claude_service.generate_posts(
                    api_key=key,
                    model=p.model,
                    context=context,
                    platforms=platforms,
                    media_info=media_info,
                    additional_instructions=additional_instructions,
                    length=length,
                )
            else:
                return await openai_compat_service.generate_posts(
                    api_key=key,
                    model=p.model,
                    provider=p.provider,
                    context=context,
                    platforms=platforms,
                    media_info=media_info,
                    additional_instructions=additional_instructions,
                    length=length,
                )
        except Exception as exc:
            last_err = exc
            continue

    raise ValueError(
        f"All AI providers failed. Last error: {last_err}"
    )


async def enhance_post(
    db: Session,
    user_id: int,
    platform: str,
    current_content: str,
    tone: str,
    additional_instructions: Optional[str] = None,
) -> str:
    providers = _get_providers(db, user_id)
    if not providers:
        raise ValueError("No AI providers configured.")

    last_err: Exception = Exception("Unknown error")
    for p in providers:
        try:
            key = decrypt_value(p.encrypted_key)
            if p.provider == "claude":
                return await claude_service.enhance_post(
                    api_key=key, model=p.model,
                    platform=platform, current_content=current_content, tone=tone,
                    additional_instructions=additional_instructions,
                )
            else:
                return await openai_compat_service.enhance_post(
                    api_key=key, model=p.model, provider=p.provider,
                    platform=platform, current_content=current_content, tone=tone,
                    additional_instructions=additional_instructions,
                )
        except Exception as exc:
            last_err = exc
            continue

    raise ValueError(f"All AI providers failed. Last error: {last_err}")


async def score_content(
    db: Session,
    user_id: int,
    content: str,
    platform: str,
) -> dict:
    providers = _get_providers(db, user_id)
    if not providers:
        raise ValueError("No AI providers configured.")

    last_err: Exception = Exception("Unknown error")
    for p in providers:
        try:
            key = decrypt_value(p.encrypted_key)
            if p.provider == "claude":
                return await claude_service.score_content(
                    api_key=key, model=p.model,
                    content=content, platform=platform,
                )
            else:
                return await openai_compat_service.score_content(
                    api_key=key, model=p.model, provider=p.provider,
                    content=content, platform=platform,
                )
        except Exception as exc:
            last_err = exc
            continue

    raise ValueError(f"All AI providers failed. Last error: {last_err}")


async def check_originality(
    db: Session,
    user_id: int,
    content: str,
    platform: str,
) -> dict:
    providers = _get_providers(db, user_id)
    if not providers:
        raise ValueError("No AI providers configured.")

    last_err: Exception = Exception("Unknown error")
    for p in providers:
        try:
            key = decrypt_value(p.encrypted_key)
            if p.provider == "claude":
                return await claude_service.check_originality(
                    api_key=key, model=p.model,
                    content=content, platform=platform,
                )
            else:
                return await openai_compat_service.check_originality(
                    api_key=key, model=p.model, provider=p.provider,
                    content=content, platform=platform,
                )
        except Exception as exc:
            last_err = exc
            continue

    raise ValueError(f"All AI providers failed. Last error: {last_err}")


async def humanize_post(
    db: Session,
    user_id: int,
    platform: str,
    current_content: str,
    tone: str,
) -> str:
    providers = _get_providers(db, user_id)
    if not providers:
        raise ValueError("No AI providers configured.")

    last_err: Exception = Exception("Unknown error")
    for p in providers:
        try:
            key = decrypt_value(p.encrypted_key)
            if p.provider == "claude":
                return await claude_service.humanize_post(
                    api_key=key, model=p.model,
                    platform=platform, current_content=current_content, tone=tone,
                )
            else:
                return await openai_compat_service.humanize_post(
                    api_key=key, model=p.model, provider=p.provider,
                    platform=platform, current_content=current_content, tone=tone,
                )
        except Exception as exc:
            last_err = exc
            continue

    raise ValueError(f"All AI providers failed. Last error: {last_err}")


async def generate_ideas(
    db: Session,
    user_id: int,
    niche: Optional[str] = None,
    platforms: Optional[list[str]] = None,
    recent_contexts: Optional[list[str]] = None,
) -> list[dict]:
    providers = _get_providers(db, user_id)
    if not providers:
        raise ValueError("No AI providers configured.")

    last_err: Exception = Exception("Unknown error")
    for p in providers:
        try:
            key = decrypt_value(p.encrypted_key)
            if p.provider == "claude":
                return await claude_service.generate_ideas(
                    api_key=key, model=p.model,
                    niche=niche, platforms=platforms, recent_contexts=recent_contexts,
                )
            else:
                return await openai_compat_service.generate_ideas(
                    api_key=key, model=p.model, provider=p.provider,
                    niche=niche, platforms=platforms, recent_contexts=recent_contexts,
                )
        except Exception as exc:
            last_err = exc
            continue

    raise ValueError(f"All AI providers failed. Last error: {last_err}")
