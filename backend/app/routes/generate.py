import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Post, User
from app.schemas.schemas import (
    EnhanceRequest,
    EnhanceResponse,
    GenerateRequest,
    GenerateResponse,
    GeneratedPlatformPost,
    HumanizeRequest,
    HumanizeResponse,
    RegenerateRequest,
    RegenerateResponse,
)
from app.limiter import limiter
from app.plans import check_generation_limit, check_platform_allowed, check_platform_limit, check_tone_allowed, increment_generation, require_plan
from app.security import get_current_user
from app.services import ai_router

router = APIRouter(prefix="/api/generate", tags=["generate"])


def _primary_content(platform: str, platform_data: dict) -> str:
    """Extract the main text content from a platform's generated data."""
    if platform == "reddit":
        return platform_data.get("title", "") + "\n\n" + platform_data.get("content", "")
    return platform_data.get("content", "")


def _get_tone(platform_options: dict) -> str:
    return platform_options.get("tone", "professional")


@router.post("", response_model=GenerateResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def generate(
    request: Request,
    payload: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.platforms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one platform must be specified.",
        )

    # ── Plan gating ───────────────────────────────────────────────────────
    check_generation_limit(current_user, db)
    check_platform_allowed(current_user, payload.platforms)
    check_platform_limit(current_user, payload.platforms)
    check_tone_allowed(current_user, payload.platforms)

    # ── Normalize options ─────────────────────────────────────────────────
    twitter_opts = payload.platforms.get("twitter", {})
    if twitter_opts.get("thread"):
        tc = twitter_opts.get("thread_count", 3)
        twitter_opts["thread_count"] = max(2, min(10, int(tc)))
        payload.platforms["twitter"] = twitter_opts

    try:
        result = await ai_router.generate_posts(
            db=db,
            user_id=current_user.id,
            context=payload.context,
            platforms=payload.platforms,
            additional_instructions=payload.additional_instructions,
            length=payload.length,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        )

    posts_data: dict = result.get("posts", {})
    posting_tips: dict = result.get("posting_tips", {})

    generated: list[GeneratedPlatformPost] = []

    for platform, platform_data in posts_data.items():
        tone = _get_tone(payload.platforms.get(platform, {}))
        content = _primary_content(platform, platform_data)

        post = Post(
            user_id=current_user.id,
            context=payload.context,
            platform=platform,
            tone=tone,
            generated_content=content,
            created_at=datetime.utcnow(),
        )
        db.add(post)
        db.flush()

        generated.append(
            GeneratedPlatformPost(
                post_id=post.id,
                platform=platform,
                tone=tone,
                content=content,
                raw=platform_data,
            )
        )

    db.commit()

    # Track usage
    increment_generation(current_user, db, count=len(generated))

    return GenerateResponse(generated=generated, posting_tips=posting_tips)


@router.post("/regenerate", response_model=RegenerateResponse)
async def regenerate(
    payload: RegenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    platform_options = {"tone": payload.tone, **payload.options}

    # ── Plan gating ───────────────────────────────────────────────────────
    check_generation_limit(current_user, db)
    check_platform_allowed(current_user, {payload.platform: platform_options})
    check_tone_allowed(current_user, {payload.platform: platform_options})

    try:
        result = await ai_router.generate_posts(
            db=db,
            user_id=current_user.id,
            context=payload.context,
            platforms={payload.platform: platform_options},
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        )

    posts_data = result.get("posts", {})
    platform_data = posts_data.get(payload.platform)
    if not platform_data:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI did not return content for platform '{payload.platform}'",
        )

    content = _primary_content(payload.platform, platform_data)

    post = Post(
        user_id=current_user.id,
        context=payload.context,
        platform=payload.platform,
        tone=payload.tone,
        generated_content=content,
        created_at=datetime.utcnow(),
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Track usage
    increment_generation(current_user, db)

    return RegenerateResponse(
        post_id=post.id,
        platform=payload.platform,
        tone=payload.tone,
        content=content,
        raw=platform_data,
    )


@router.post("/enhance", response_model=EnhanceResponse)
async def enhance(
    payload: EnhanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        enhanced = await ai_router.enhance_post(
            db=db,
            user_id=current_user.id,
            platform=payload.platform,
            current_content=payload.content,
            tone=payload.tone,
            additional_instructions=payload.additional_instructions,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        )

    return EnhanceResponse(
        platform=payload.platform,
        original_content=payload.content,
        enhanced_content=enhanced,
    )


@router.post("/humanize", response_model=HumanizeResponse)
async def humanize(
    payload: HumanizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "starter", "AI Humanizer")

    try:
        humanized = await ai_router.humanize_post(
            db=db,
            user_id=current_user.id,
            platform=payload.platform,
            current_content=payload.content,
            tone=payload.tone,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        )

    return HumanizeResponse(
        platform=payload.platform,
        original_content=payload.content,
        humanized_content=humanized,
    )
