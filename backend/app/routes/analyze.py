from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    HumanizeScoreRequest, HumanizeScoreResponse, HumanizeScoreFlag,
    OriginalityCheckRequest, OriginalityCheckResponse, OriginalityGenericPhrase,
)
from app.security import get_current_user
from app.services import ai_router
from app.plans import require_plan

router = APIRouter(prefix="/api/analyze", tags=["analyze"])


@router.post("/humanize-score", response_model=HumanizeScoreResponse)
async def humanize_score(
    payload: HumanizeScoreRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "starter", "AI Humanize Score")

    try:
        result = await ai_router.score_content(
            db=db,
            user_id=current_user.id,
            content=payload.content,
            platform=payload.platform,
            user_plan=current_user.plan or "free",
        )
    except ValueError:
        # Bad JSON from AI — return a neutral fallback rather than a 4xx
        return HumanizeScoreResponse(score=50, level="mixed", flags=[], tips=[])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        )

    # Clamp score and derive level from score (ignore AI's level field to stay consistent)
    score = max(0, min(100, int(result.get("score", 50))))
    if score <= 30:
        level = "human"
    elif score <= 60:
        level = "mixed"
    else:
        level = "ai"

    flags = [
        HumanizeScoreFlag(phrase=f.get("phrase", ""), reason=f.get("reason", ""))
        for f in result.get("flags", [])
        if isinstance(f, dict)
    ]
    tips = [t for t in result.get("tips", []) if isinstance(t, str)]

    return HumanizeScoreResponse(
        score=score,
        level=level,
        flags=flags,
        tips=tips,
    )


@router.post("/originality-check", response_model=OriginalityCheckResponse)
async def originality_check(
    payload: OriginalityCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_plan(current_user, "starter", "Originality Check")

    try:
        result = await ai_router.check_originality(
            db=db,
            user_id=current_user.id,
            content=payload.content,
            platform=payload.platform,
            user_plan=current_user.plan or "free",
        )
    except ValueError:
        return OriginalityCheckResponse(
            originality_score=55, level="mixed",
            generic_phrases=[], improvements=[], verdict="",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        )

    raw_score = max(0, min(100, int(result.get("originality_score", 55))))
    if raw_score >= 71:
        level = "good"
    elif raw_score >= 41:
        level = "mixed"
    else:
        level = "generic"

    phrases = [
        OriginalityGenericPhrase(
            phrase=p.get("phrase", ""),
            suggestion=p.get("suggestion", ""),
        )
        for p in result.get("generic_phrases", [])
        if isinstance(p, dict)
    ]
    improvements = [s for s in result.get("improvements", []) if isinstance(s, str)]
    verdict = result.get("verdict", "") or ""

    return OriginalityCheckResponse(
        originality_score=raw_score,
        level=level,
        generic_phrases=phrases,
        improvements=improvements,
        verdict=verdict,
    )
