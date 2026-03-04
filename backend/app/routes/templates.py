from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Template, User
from app.schemas.schemas import TemplateCreate, TemplateResponse, TemplateUpdate
from app.security import get_current_user

router = APIRouter(prefix="/api/templates", tags=["templates"])


# ── Tier / plan helpers ───────────────────────────────────────────────────────

_PLAN_RANK = {"free": 0, "starter": 1, "pro": 2}
_TIER_RANK = {"free": 0, "starter": 1, "pro": 2}


def _plan_allows_tier(user_plan: str, template_tier: str) -> bool:
    return _PLAN_RANK.get(user_plan, 0) >= _TIER_RANK.get(template_tier, 0)


# ── Built-in template definitions ─────────────────────────────────────────────

_BUILTIN_TEMPLATES = [
    # ── FREE ─────────────────────────────────────────────────────────────────
    {
        "name": "Career Update",
        "description": "Announce a new role, promotion, or career milestone",
        "category": "career",
        "tier": "free",
        "icon": "Briefcase",
        "color": "#6366f1",
        "context_template": (
            "I just got {{role/position}} at {{company}}. "
            "Previously I was {{previous role}}. "
            "Key achievement that helped: {{achievement}}. "
            "Feeling {{emotion}} about this next chapter."
        ),
        "platforms": ["twitter", "linkedin", "whatsapp"],
        "tones": {"twitter": "hype", "linkedin": "professional", "whatsapp": "casual"},
        "preview_example": (
            "Excited to share that I've just joined Acme Corp as Senior Engineer! "
            "After 3 years as a dev at Startup X, this feels like the right next step. "
            "Grateful for everyone who believed in me along the way. 🚀"
        ),
    },
    {
        "name": "Project Launch",
        "description": "Ship something new and tell the world about it",
        "category": "project",
        "tier": "free",
        "icon": "Rocket",
        "color": "#8b5cf6",
        "context_template": (
            "Just launched {{project name}} — {{one line description}}. "
            "Built with {{tech stack}}. "
            "It solves {{problem}}. "
            "Check it out: {{link}}"
        ),
        "platforms": ["twitter", "linkedin", "reddit"],
        "tones": {"twitter": "hype", "linkedin": "storytelling", "reddit": "educational"},
        "preview_example": (
            "Just shipped PostPilot — an AI tool that writes social posts for 5 platforms at once. "
            "Built with FastAPI + React + Claude. "
            "Tired of rewriting the same idea 5 times? This is for you: postpilot.app"
        ),
    },
    {
        "name": "Tutorial / How-To",
        "description": "Share a step-by-step guide or technical walkthrough",
        "category": "tutorial",
        "tier": "free",
        "icon": "BookOpen",
        "color": "#3b82f6",
        "context_template": (
            "Here's how to {{task}} in {{number}} steps. "
            "I figured this out while {{context}}. "
            "The key insight: {{insight}}. "
            "Tools used: {{tools}}"
        ),
        "platforms": ["twitter", "linkedin", "reddit"],
        "tones": {"twitter": "educational", "linkedin": "educational", "reddit": "educational"},
        "preview_example": (
            "Here's how to deploy a FastAPI app in 5 steps.\n"
            "1. Dockerize it\n2. Push to ECR\n3. Create ECS task\n4. Attach ALB\n5. Point DNS\n"
            "The key insight: use Fargate so you never touch a server again."
        ),
    },
    {
        "name": "Hot Take / Opinion",
        "description": "Share a contrarian or provocative opinion to spark discussion",
        "category": "opinion",
        "tier": "free",
        "icon": "Flame",
        "color": "#ef4444",
        "context_template": (
            "Unpopular opinion: {{opinion}}. "
            "Here's why I think this: {{reasoning}}. "
            "What most people get wrong: {{misconception}}."
        ),
        "platforms": ["twitter", "linkedin"],
        "tones": {"twitter": "bold", "linkedin": "professional"},
        "preview_example": (
            "Unpopular opinion: daily standups are killing your team's deep work.\n\n"
            "Here's why: context switching has a 23-minute recovery cost. "
            "What most teams get wrong: they confuse presence with productivity."
        ),
    },
    {
        "name": "Milestone / Achievement",
        "description": "Celebrate a personal or professional milestone with a story arc",
        "category": "milestone",
        "tier": "free",
        "icon": "Trophy",
        "color": "#f59e0b",
        "context_template": (
            "{{timeframe}} ago, I {{starting point}}. "
            "Today, I {{achievement}}. "
            "The journey: {{brief journey}}. "
            "Biggest lesson: {{lesson}}."
        ),
        "platforms": ["twitter", "linkedin", "instagram"],
        "tones": {"twitter": "hype", "linkedin": "storytelling", "instagram": "inspirational"},
        "preview_example": (
            "2 years ago, I was freelancing for $20/hr with no direction.\n"
            "Today, I crossed $10k MRR with my SaaS.\n"
            "The journey wasn't linear — 4 failed products before this one.\n"
            "Biggest lesson: distribution matters more than features."
        ),
    },
    {
        "name": "Learning / TIL",
        "description": "Share something you just learned in a concise, digestible post",
        "category": "tutorial",
        "tier": "free",
        "icon": "Lightbulb",
        "color": "#06b6d4",
        "context_template": (
            "Today I learned {{topic}}. "
            "What surprised me: {{surprise}}. "
            "How I'll use this: {{application}}. "
            "Resource that helped: {{resource}}"
        ),
        "platforms": ["twitter", "linkedin"],
        "tones": {"linkedin": "educational", "twitter": "casual"},
        "preview_example": (
            "TIL: SQLite can handle 100k writes/sec with WAL mode enabled.\n"
            "What surprised me: it outperforms Postgres for read-heavy workloads under 1GB.\n"
            "How I'll use this: switching my side project off Postgres to keep infra simple."
        ),
    },
    {
        "name": "Behind the Scenes",
        "description": "Show the real, unfiltered process behind a project or product",
        "category": "project",
        "tier": "free",
        "icon": "Camera",
        "color": "#ec4899",
        "context_template": (
            "Here's what building {{project}} actually looks like behind the scenes. "
            "The good: {{good}}. "
            "The ugly: {{ugly}}. "
            "What I'd do differently: {{lesson}}"
        ),
        "platforms": ["twitter", "linkedin", "instagram"],
        "tones": {"linkedin": "storytelling", "twitter": "casual", "instagram": "casual"},
        "preview_example": (
            "Here's what building PostPilot actually looks like behind the scenes.\n"
            "The good: users love the multi-platform generation.\n"
            "The ugly: I rewrote the auth system three times.\n"
            "What I'd do differently: validate the idea with 10 users before writing a single line."
        ),
    },
    {
        "name": "Weekly Recap",
        "description": "Summarise your week — wins, struggles, and what's next",
        "category": "career",
        "tier": "free",
        "icon": "CalendarDays",
        "color": "#10b981",
        "context_template": (
            "This week I: {{list of things done}}. "
            "Biggest win: {{win}}. "
            "Biggest struggle: {{struggle}}. "
            "Next week focus: {{focus}}"
        ),
        "platforms": ["twitter", "linkedin"],
        "tones": {"twitter": "casual", "linkedin": "professional"},
        "preview_example": (
            "Week 12 recap:\n"
            "✅ Shipped the analytics dashboard\n✅ Onboarded 3 new users\n✅ Fixed the auth bug\n\n"
            "Biggest win: first paying customer.\n"
            "Biggest struggle: scope creep on the dashboard.\n"
            "Next week: pricing page + payment integration."
        ),
    },

    # ── STARTER ───────────────────────────────────────────────────────────────
    {
        "name": "Cold DM / Outreach",
        "description": "A warm, non-salesy outreach message that actually gets replies",
        "category": "career",
        "tier": "starter",
        "icon": "MessageSquare",
        "color": "#f59e0b",
        "context_template": (
            "Reaching out to {{target person/role}} at {{company}}. "
            "I'm {{your background}}. "
            "Why them specifically: {{specific reason}}. "
            "What I can offer / common ground: {{value or connection}}. "
            "Desired outcome: {{meeting / feedback / collaboration}}"
        ),
        "platforms": ["linkedin", "twitter"],
        "tones": {"linkedin": "professional", "twitter": "casual"},
        "preview_example": (
            "Hey Sarah — I've been following your work on distributed systems at Stripe for a while.\n\n"
            "I'm a backend engineer who just shipped a similar rate-limiting system. "
            "Your post on token buckets last month saved me hours.\n\n"
            "Would love to grab a 20-min coffee chat if you're open to it."
        ),
    },
    {
        "name": "Twitter / X Thread Starter",
        "description": "Hook + promise structure that makes people click 'show more'",
        "category": "tutorial",
        "tier": "starter",
        "icon": "List",
        "color": "#8b5cf6",
        "context_template": (
            "Thread topic: {{topic}}. "
            "Target audience: {{audience}}. "
            "The bold claim or hook: {{hook}}. "
            "What they'll learn (list 3-5 points): {{learning points}}. "
            "The counter-intuitive angle: {{twist}}"
        ),
        "platforms": ["twitter"],
        "tones": {"twitter": "bold"},
        "preview_example": (
            "I studied 100 viral developer threads. Here's what they all have in common 🧵\n\n"
            "Most people write threads wrong.\n\n"
            "They open with context. They structure like an essay. They end with nothing.\n\n"
            "The viral ones do the opposite. Here's the exact formula:"
        ),
    },
    {
        "name": "Product Feature Drop",
        "description": "Announce a new feature with benefit-first framing",
        "category": "project",
        "tier": "starter",
        "icon": "Sparkles",
        "color": "#06b6d4",
        "context_template": (
            "New feature: {{feature name}}. "
            "Product: {{product name}}. "
            "Problem it solves: {{problem}}. "
            "How it works: {{brief explanation}}. "
            "Who asked for it: {{user persona or real user}}. "
            "Link / where to access: {{link}}"
        ),
        "platforms": ["twitter", "linkedin"],
        "tones": {"twitter": "hype", "linkedin": "professional"},
        "preview_example": (
            "New in PostPilot: AI Humanizer.\n\n"
            "Your posts kept getting flagged as AI-written. Now they won't.\n\n"
            "One click rewrites your draft to match your natural voice — "
            "contractions, rhythm, personality included.\n\n"
            "Live now for all Starter+ users."
        ),
    },
    {
        "name": "Case Study / Success Story",
        "description": "Before/after narrative that builds trust and shows real results",
        "category": "milestone",
        "tier": "starter",
        "icon": "TrendingUp",
        "color": "#10b981",
        "context_template": (
            "Client/project: {{name or alias}}. "
            "The problem they had before: {{problem}}. "
            "What we did: {{solution/approach}}. "
            "The result (with numbers): {{specific outcome}}. "
            "Key takeaway: {{lesson or insight}}"
        ),
        "platforms": ["linkedin", "twitter"],
        "tones": {"linkedin": "storytelling", "twitter": "bold"},
        "preview_example": (
            "A founder came to me with a 2% email open rate.\n\n"
            "Problem: generic subject lines, no segmentation, sending at 9am Mondays.\n\n"
            "What we did: rewrote the sequence, segmented by job title, A/B tested 3 send times.\n\n"
            "Result: 34% open rate in 6 weeks. Revenue up 22%.\n\n"
            "Lesson: the product was never the problem."
        ),
    },
    {
        "name": "AMA / Community Engagement",
        "description": "Invite questions and position yourself as a go-to expert",
        "category": "opinion",
        "tier": "starter",
        "icon": "HelpCircle",
        "color": "#f59e0b",
        "context_template": (
            "Your area of expertise: {{domain}}. "
            "Your credibility (brief): {{experience or proof}}. "
            "Topics you'll answer: {{topic list}}. "
            "Timeframe: {{e.g. next 24 hours}}. "
            "What you want in return: {{follows / newsletter subs / nothing}}"
        ),
        "platforms": ["twitter", "linkedin", "reddit"],
        "tones": {"twitter": "casual", "linkedin": "professional", "reddit": "casual"},
        "preview_example": (
            "I've spent 5 years building developer tools used by 50k+ devs.\n\n"
            "Today I'm doing an AMA on:\n"
            "• Building in public\n• Pricing SaaS products\n• Getting your first 100 users\n\n"
            "Drop your question below. Answering everything in the next 24 hours. 👇"
        ),
    },
    {
        "name": "30-Day Challenge Kickoff",
        "description": "Build-in-public accountability post with clear stakes and goals",
        "category": "career",
        "tier": "starter",
        "icon": "Zap",
        "color": "#ef4444",
        "context_template": (
            "Challenge: {{what you're doing for 30 days}}. "
            "Why: {{motivation or goal}}. "
            "Daily commitment: {{specific action}}. "
            "How you'll measure success: {{metric}}. "
            "Accountability: {{ask followers to follow along or join}}"
        ),
        "platforms": ["twitter", "linkedin"],
        "tones": {"twitter": "hype", "linkedin": "professional"},
        "preview_example": (
            "Day 1 of my 30-day writing challenge.\n\n"
            "Goal: publish one post every day for 30 days.\n"
            "Why: I want to find my voice online and grow from 200 to 1,000 followers.\n"
            "Daily commitment: 30 minutes of writing before 9am.\n\n"
            "Follow along. I'll share the raw stats at the end. 📈"
        ),
    },

    # ── PRO ───────────────────────────────────────────────────────────────────
    {
        "name": "Viral Story Arc",
        "description": "The 3-act narrative formula used by top creators for 10k+ posts",
        "category": "milestone",
        "tier": "pro",
        "icon": "Flame",
        "color": "#ef4444",
        "context_template": (
            "Act 1 — The fall / struggle: {{what went wrong or what you had to overcome}}. "
            "Act 2 — The turning point: {{specific insight, event, or decision that changed things}}. "
            "Act 3 — The result: {{measurable outcome + what it means}}. "
            "The moral / takeaway for the reader: {{universal lesson}}. "
            "Emotion to evoke: {{e.g. hope, respect, surprise}}"
        ),
        "platforms": ["twitter", "linkedin", "instagram"],
        "tones": {"twitter": "bold", "linkedin": "storytelling", "instagram": "inspirational"},
        "preview_example": (
            "I lost everything in 2021.\n\n"
            "My startup failed. My co-founder quit. I had $800 in my account and zero users.\n\n"
            "The turning point: I stopped building for investors and started talking to real people. "
            "Found one user who'd pay $50/month. Then five. Then twenty.\n\n"
            "Today: $40k MRR, bootstrapped, profitable.\n\n"
            "The lesson no one tells you: distribution beats product. Every time."
        ),
    },
    {
        "name": "Sales / Offer Post",
        "description": "High-converting offer copy that sells without sounding salesy",
        "category": "project",
        "tier": "pro",
        "icon": "Tag",
        "color": "#f59e0b",
        "context_template": (
            "Product/service: {{name}}. "
            "Price: {{price or price range}}. "
            "Who it's for: {{ideal customer}}. "
            "The #1 problem it solves: {{specific pain point}}. "
            "Proof / social proof: {{testimonial, number, or result}}. "
            "Urgency or scarcity (real): {{deadline or limited spots}}. "
            "CTA: {{what to do next — link / DM / reply}}"
        ),
        "platforms": ["twitter", "linkedin"],
        "tones": {"twitter": "bold", "linkedin": "professional"},
        "preview_example": (
            "If you're a freelancer spending 3+ hours/week writing proposals, this is for you.\n\n"
            "I built a proposal template system used by 200+ freelancers. "
            "Average close rate went from 20% to 47%.\n\n"
            "It's $49 one-time. No subscription.\n\n"
            "5 spots left at this price before I raise it Friday. "
            "DM me 'PROPOSAL' to grab one."
        ),
    },
    {
        "name": "Founder's Origin Story",
        "description": "The authentic 'why I built this' narrative that converts browsers to believers",
        "category": "career",
        "tier": "pro",
        "icon": "Star",
        "color": "#6366f1",
        "context_template": (
            "The personal problem you experienced: {{your pain point}}. "
            "What existing solutions failed at: {{why others weren't good enough}}. "
            "The moment you decided to build it: {{the 'aha' moment}}. "
            "What building it taught you: {{unexpected lesson}}. "
            "Where the product is now: {{traction or milestone}}. "
            "What's next: {{vision or next milestone}}"
        ),
        "platforms": ["linkedin", "twitter"],
        "tones": {"linkedin": "storytelling", "twitter": "casual"},
        "preview_example": (
            "I started PostPilot because I was spending 4 hours every week doing the same thing: "
            "taking one idea and rewriting it 5 different ways for 5 different platforms.\n\n"
            "Every tool I tried either sounded robotic or only did one platform.\n\n"
            "So I built the thing I wished existed.\n\n"
            "6 months later: 800 users, $3k MRR, and I haven't written a social post manually since."
        ),
    },
    {
        "name": "Industry Breakdown / Analysis",
        "description": "Data-backed take on a trend that positions you as a category expert",
        "category": "opinion",
        "tier": "pro",
        "icon": "BarChart2",
        "color": "#3b82f6",
        "context_template": (
            "The trend or shift you're analysing: {{trend}}. "
            "Why now (what changed recently): {{catalyst}}. "
            "The data or evidence: {{stats, examples, or observations}}. "
            "Who wins: {{who benefits}}. "
            "Who loses: {{who's at risk}}. "
            "Your contrarian or nuanced take: {{what most analysts miss}}. "
            "What the reader should do about it: {{actionable advice}}"
        ),
        "platforms": ["linkedin", "twitter", "reddit"],
        "tones": {"linkedin": "professional", "twitter": "bold", "reddit": "educational"},
        "preview_example": (
            "The AI writing tools market just hit $2B. But 80% of users churn in month 2.\n\n"
            "Why: generic output, no workflow integration, content sounds identical to competitors.\n\n"
            "Who wins: tools with platform-specific tuning and distribution-aware output.\n"
            "Who loses: single-prompt generators with no memory or context.\n\n"
            "My take: the real moat isn't the AI — it's the workflow. "
            "The teams building around that are already pulling away."
        ),
    },
    {
        "name": "Newsletter / Content Promo",
        "description": "Tease your latest piece and drive clicks without giving everything away",
        "category": "project",
        "tier": "pro",
        "icon": "Mail",
        "color": "#10b981",
        "context_template": (
            "Content title: {{title}}. "
            "Platform (newsletter / blog / YouTube / podcast): {{platform}}. "
            "The single biggest insight from it: {{insight — don't give it all away}}. "
            "Who it's for: {{target reader/viewer}}. "
            "One surprising or counter-intuitive thing covered: {{tease}}. "
            "Link: {{url}}"
        ),
        "platforms": ["twitter", "linkedin"],
        "tones": {"twitter": "casual", "linkedin": "professional"},
        "preview_example": (
            "This week's issue: why your newsletter open rates are lying to you.\n\n"
            "Apple Mail Privacy Protection inflates opens by 30–60%. "
            "Most creators are optimising for a metric that's broken.\n\n"
            "Inside: the 3 metrics that actually predict growth, "
            "and the tool I use to get real numbers.\n\n"
            "Link in bio. Worth 8 minutes."
        ),
    },
]


def seed_builtin_templates(db: Session) -> None:
    """Seed built-in templates by name — adds missing ones, skips existing."""
    existing_names = {
        row.name
        for row in db.query(Template.name).filter(Template.user_id.is_(None)).all()
    }
    added = False
    for tpl in _BUILTIN_TEMPLATES:
        if tpl["name"] in existing_names:
            continue
        db.add(Template(
            user_id=None,
            name=tpl["name"],
            description=tpl["description"],
            category=tpl["category"],
            tier=tpl.get("tier", "free"),
            icon=tpl.get("icon"),
            color=tpl.get("color"),
            context_template=tpl["context_template"],
            platforms=tpl["platforms"],
            tones=tpl["tones"],
            preview_example=tpl.get("preview_example"),
            is_public=True,
            use_count=0,
        ))
        added = True
    if added:
        db.commit()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tpl = Template(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        context_template=payload.context_template,
        platforms=payload.platforms,
        tones=payload.tones,
        is_public=False,
        use_count=0,
    )
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.get("/", response_model=List[TemplateResponse])
def list_templates(
    category: Optional[str] = None,
    tier: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Template).filter(
        (Template.user_id == current_user.id) | (Template.user_id.is_(None))
    )
    if category and category != "all":
        q = q.filter(Template.category == category)
    if tier and tier != "all":
        q = q.filter(Template.tier == tier)

    results = q.all()

    # Sort: built-ins first, within each group order by tier rank then use_count
    _tier_order = {"free": 0, "starter": 1, "pro": 2}
    results.sort(key=lambda t: (
        t.user_id is not None,           # user templates last
        _tier_order.get(t.tier or "free", 0),  # tier order within built-ins
        -(t.use_count or 0),             # more used first
    ))
    return results


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tpl = db.query(Template).filter(Template.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    if tpl.user_id is not None and tpl.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your template")
    return tpl


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    payload: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tpl = db.query(Template).filter(Template.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    if tpl.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your template")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tpl, field, value)
    db.commit()
    db.refresh(tpl)
    return tpl


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tpl = db.query(Template).filter(Template.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    if tpl.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your template")

    db.delete(tpl)
    db.commit()


@router.post("/{template_id}/use", response_model=TemplateResponse)
def use_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tpl = db.query(Template).filter(Template.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    # Tier access control
    user_plan = getattr(current_user, "plan", "free") or "free"
    if not _plan_allows_tier(user_plan, tpl.tier or "free"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "tier_locked", "required_tier": tpl.tier},
        )

    tpl.use_count = (tpl.use_count or 0) + 1
    db.commit()
    db.refresh(tpl)
    return tpl
