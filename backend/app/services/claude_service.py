import json
from typing import Optional

import anthropic

SYSTEM_PROMPT = """You are an expert social media content strategist. Generate platform-optimized posts that feel authentic, engaging, and genuinely human-written.

RULES:
1. Never sound robotic or AI-generated
2. Each platform version must be COMPLETELY DIFFERENT in structure and approach — not just reformatted
3. Match the exact tone requested for each platform
4. Respect character limits strictly
5. Use platform-native formatting
6. STRUCTURE IS MANDATORY — never write a wall of text. Every post must have distinct sections separated by blank lines.

PLATFORM GUIDELINES:

X/Twitter (max 280 chars per tweet):
- Start with a bold hook or unexpected statement
- Short punchy sentences
- 1-3 relevant hashtags max
- If thread=True and thread_count=N: generate exactly N tweets. tweet 1 = hook, middle tweets = value/story, last tweet = CTA or wrap-up. Each tweet must be ≤280 chars.
- Use line breaks between thoughts

LinkedIn — STRICT STRUCTURE REQUIRED:
Every LinkedIn post MUST follow this exact structure with blank lines between each section:

[HOOK LINE — single bold statement, max 12 words, no period]

[1-2 lines of context or the problem/insight]

[2-4 lines of the main value: story, lessons, steps, or data points — use "→" or numbered list if helpful]

[1-2 lines of key takeaway or reflection]

[CTA — if cta_link is provided: end with a clear call-to-action incorporating the link, e.g. "👉 {cta_text}: {cta_link}". If no cta_link: question to spark comments like "What do you think?"]

[3-5 hashtags on final line]

Rules: NEVER write more than 2 sentences per paragraph. Use **bold** for key terms. Sweet spot: 800-1300 chars.

Reddit (title + body):
- Title: Specific, genuine, not clickbait
- Body: Detailed, conversational, adds real value. Use paragraph breaks.
- NO hashtags, minimal emojis
- Reddit hates obvious self-promotion — lead with value
- Suggest 2-3 relevant subreddits

Instagram (max 2200 chars):
- Strong hook in first sentence (shows before "...more")
- Storytelling or list format with blank lines between sections
- Natural emoji usage woven into text
- Separate hashtag block at end: 20-30 relevant hashtags
- End with CTA: "Save this for later" or "Share with someone"

WhatsApp (short & personal):
- 2-3 short paragraphs maximum, blank line between each
- Casual tone like texting a close friend
- Relevant emojis sprinkled naturally
- No hashtags ever

Bluesky (max 300 chars):
- Concise, conversational, community-oriented
- 1-3 relevant hashtags max (use # inline, no separate block)
- Avoid corporate speak — more indie/open-web vibe
- No markdown bold/italic (plain text only)
- Can mention users with @handle.bsky.social
- Good use of wit, brevity, and personality

Mastodon (max 500 chars):
- Community-focused, thoughtful, longer-form micro-posts
- Use content warning (CW) if topic is sensitive — put CW text in "cw" field
- Hashtags are important for discovery (no algorithmic feed) — 3-5 relevant tags
- Plain text only, no markdown
- More conversational and less "brand" voice
- Can be more nuanced/detailed than Twitter
- Avoid engagement bait — Mastodon culture values authenticity

TONE DEFINITIONS:

Professional: Corporate-appropriate but warm. Use metrics, achievements. Sound accomplished without bragging.
Casual: Like talking to a work friend over coffee. Contractions, relatable language.
Hype/Excited: High energy, celebratory. Strategic caps for emphasis. Create urgency and FOMO.
Storytelling: Hook > Context > Journey > Lesson > CTA. Personal details. Emotional arc.
Educational: "Here's what I learned" format. Numbered tips or steps. Actionable takeaways.
Witty/Humorous: Self-deprecating humor, unexpected comparisons, clever wordplay.
Inspirational: Vulnerability plus triumph. Motivational without being cheesy.
Bold/Controversial: Hot takes backed by experience. Challenge conventional wisdom. Debate starters.

RESPOND IN VALID JSON ONLY (no markdown, no backticks, just raw JSON):
{
  "posts": {
    "twitter": {
      "content": "the tweet text",
      "thread": ["tweet 1", "tweet 2"],
      "hashtags": ["tag1", "tag2"],
      "char_count": 240,
      "media_suggestion": "Attach image to first tweet"
    },
    "linkedin": {
      "content": "full linkedin post text",
      "hashtags": ["tag1", "tag2"],
      "char_count": 1250,
      "media_suggestion": "Add image at top of post"
    },
    "reddit": {
      "title": "post title",
      "content": "post body",
      "subreddits": ["r/sub1", "r/sub2"],
      "char_count": 800,
      "media_suggestion": "Link in body"
    },
    "instagram": {
      "content": "caption text",
      "hashtags": ["tag1", "tag2"],
      "char_count": 1800,
      "media_suggestion": "Post as carousel with text overlay"
    },
    "whatsapp": {
      "content": "message text",
      "char_count": 300,
      "media_suggestion": "Attach image before text"
    },
    "bluesky": {
      "content": "post text",
      "hashtags": ["tag1", "tag2"],
      "char_count": 280,
      "media_suggestion": "Attach image to post"
    },
    "mastodon": {
      "content": "post text",
      "cw": null,
      "hashtags": ["tag1", "tag2"],
      "char_count": 450,
      "media_suggestion": "Attach image to post"
    }
  },
  "posting_tips": {
    "best_time": "Suggested posting times",
    "engagement_tip": "Quick tip to boost reach"
  }
}

Only include platforms that were requested. Never include unrequested platforms."""


_LENGTH_GUIDE = {
    "short": (
        "LENGTH: Keep posts SHORT and punchy. "
        "Twitter: 1-2 sentences. LinkedIn: 300-500 chars, 3-4 sections max. "
        "Reddit body: 2-3 paragraphs. Instagram: 3-4 lines + hashtags. "
        "Bluesky: 1-2 sentences under 200 chars. "
        "Mastodon: 2-3 sentences, ~250 chars."
    ),
    "medium": (
        "LENGTH: Use MEDIUM length — balanced and complete. "
        "Twitter: 2-3 sentences. LinkedIn: 700-1000 chars, full structure. "
        "Reddit body: 4-6 paragraphs. Instagram: 6-8 lines + hashtags. "
        "Bluesky: 2-3 sentences, ~250 chars. "
        "Mastodon: 3-4 sentences, ~400 chars."
    ),
    "detailed": (
        "LENGTH: Write DETAILED and comprehensive posts. "
        "Twitter: thread preferred, each tweet maxed. LinkedIn: 1100-1500 chars, rich structure with examples. "
        "Reddit body: thorough, 6+ paragraphs with depth. Instagram: full caption near 2000 chars. "
        "Bluesky: use full 300 chars with detail. "
        "Mastodon: use full 500 chars with nuance."
    ),
}


def _build_generate_prompt(
    context: str,
    platforms: dict,
    media_info: Optional[list],
    additional_instructions: Optional[str],
    length: str = "medium",
) -> str:
    lines = [
        "Generate social media posts for the following context:",
        "",
        f"CONTEXT:\n{context}",
        "",
        "PLATFORMS TO GENERATE (respect the tone, options, and length for each):",
    ]

    for platform, opts in platforms.items():
        # Per-platform length — extracted from opts, not shown as a regular option
        plat_length = opts.get("length", length)
        length_hint = _LENGTH_GUIDE.get(plat_length, _LENGTH_GUIDE["medium"])

        option_parts = [f"{k}={v}" for k, v in opts.items() if k != "length"]
        opts_str = ", ".join(option_parts) if option_parts else "default options"
        lines.append(f"- {platform}: {opts_str}")
        lines.append(f"  {length_hint}")

    if media_info:
        lines.append("")
        lines.append("MEDIA ATTACHED:")
        for item in media_info:
            lines.append(f"- {item}")

    if additional_instructions:
        lines.append("")
        lines.append(f"ADDITIONAL INSTRUCTIONS:\n{additional_instructions}")

    return "\n".join(lines)


async def generate_posts(
    api_key: str,
    context: str,
    platforms: dict,
    media_info: Optional[list] = None,
    additional_instructions: Optional[str] = None,
    length: str = "medium",
    model: str = "claude-sonnet-4-20250514",
) -> dict:
    client = anthropic.AsyncAnthropic(api_key=api_key)

    user_prompt = _build_generate_prompt(context, platforms, media_info, additional_instructions, length)

    message = await client.messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw = message.content[0].text.strip()

    # Strip accidental markdown fences if Claude adds them despite instructions
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Claude returned invalid JSON: {exc}\n\nRaw response:\n{raw}") from exc


async def enhance_post(
    api_key: str,
    platform: str,
    current_content: str,
    tone: str,
    additional_instructions: Optional[str] = None,
    model: str = "claude-sonnet-4-20250514",
) -> str:
    client = anthropic.AsyncAnthropic(api_key=api_key)

    if additional_instructions:
        prompt = (
            f"Rewrite this {platform} post following these specific instructions:\n"
            f"{additional_instructions}\n\n"
            f"Keep the same tone ({tone}) and platform format. "
            f"Return ONLY the rewritten post text, nothing else.\n\n"
            f"Current post:\n{current_content}"
        )
    else:
        prompt = (
            f"Take this {platform} post and make it significantly more engaging. "
            f"Improve the hook, add more compelling language, increase viral potential. "
            f"Keep the same tone ({tone}) and platform format. Keep the core message intact. "
            f"Return ONLY the improved post text, nothing else.\n\n"
            f"Current post:\n{current_content}"
        )

    message = await client.messages.create(
        model=model,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()


_SCORE_PROMPT_TEMPLATE = """\
Analyze this {platform} post and rate how AI-generated it sounds on a scale of 0-100.
0 = completely natural/human, 100 = obviously AI-generated.

Check for these AI tell-tale patterns:
- Corporate buzzwords: "leverage", "elevate", "foster", "synergy", "unlock"
- Over-polished grammar with zero personal quirks or typos
- Hollow filler phrases: "In today's world", "It's worth noting", "That being said", "At the end of the day"
- Formulaic structure: hook → bullet points → CTA, every time, no variation
- Absence of contractions, slang, or casual language
- Overuse of em-dashes, semicolons, or parallel lists
- Excessive hedging or overly balanced tone
- Generic motivational sign-offs

Return ONLY raw JSON — no markdown fences, no backticks, no prose:
{{
  "score": 45,
  "level": "mixed",
  "flags": [
    {{"phrase": "exact phrase from the post", "reason": "why this sounds AI-written"}},
    {{"phrase": "another phrase", "reason": "why this sounds AI-written"}}
  ],
  "tips": [
    "Add a short personal anecdote or opinion",
    "Replace 'leverage' with a plain verb like 'use'",
    "Break the perfect structure — start mid-thought"
  ]
}}

Rules:
- level must be exactly one of: "human" (score 0-30), "mixed" (score 31-60), "ai" (score 61-100)
- flags: 0-4 items, only the most impactful patterns; empty array if none found
- tips: 2-3 short, actionable suggestions

Post to analyze:
{content}"""


async def score_content(
    api_key: str,
    content: str,
    platform: str,
    model: str = "claude-sonnet-4-20250514",
) -> dict:
    """Analyze content and return an AI-detection score."""
    client = anthropic.AsyncAnthropic(api_key=api_key)
    prompt = _SCORE_PROMPT_TEMPLATE.format(content=content, platform=platform)

    message = await client.messages.create(
        model=model,
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Return a neutral fallback so the route can handle it gracefully
        return {"score": 50, "level": "mixed", "flags": [], "tips": []}


_ORIGINALITY_PROMPT_TEMPLATE = """\
You are a content originality analyst. Analyze this {platform} post for originality.

Check for:
1. Cliche AI phrases that appear in thousands of AI-generated posts
2. Generic statements that could apply to anyone (not personalized)
3. Overused social media formulas (e.g., "I did X. Here's what I learned:" followed by generic list)
4. Content that reads like a template with no real substance
5. Specific vs vague: does it include real details, numbers, names, or is it all abstract?

Rate originality 0-100:
- 0-40: Very generic, needs major personalization
- 41-70: Somewhat original, could use more specific details
- 71-100: Feels unique and personal

Return ONLY raw JSON — no markdown fences, no backticks, no prose:
{{
  "originality_score": 72,
  "level": "good",
  "generic_phrases": [
    {{"phrase": "exact generic phrase from the post", "suggestion": "replace with something specific like..."}},
    {{"phrase": "another generic phrase", "suggestion": "try a concrete example instead"}}
  ],
  "improvements": [
    "Add a specific number or metric",
    "Name the actual tool/company/person"
  ],
  "verdict": "one sentence summary of the originality assessment"
}}

Rules:
- level must be exactly one of: "good" (71-100), "mixed" (41-70), "generic" (0-40)
- generic_phrases: 0-3 items, the most egregious generic patterns; empty array if none
- improvements: 2-3 short, actionable suggestions
- verdict: one sentence, honest and direct

Post to analyze:
{content}"""


async def check_originality(
    api_key: str,
    content: str,
    platform: str,
    model: str = "claude-sonnet-4-20250514",
) -> dict:
    """Analyze content and return an originality score."""
    client = anthropic.AsyncAnthropic(api_key=api_key)
    prompt = _ORIGINALITY_PROMPT_TEMPLATE.format(content=content, platform=platform)

    message = await client.messages.create(
        model=model,
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"originality_score": 55, "level": "mixed", "generic_phrases": [], "improvements": [], "verdict": ""}


async def generate_ideas(
    api_key: str,
    niche: str | None = None,
    platforms: list[str] | None = None,
    recent_contexts: list[str] | None = None,
    model: str = "claude-sonnet-4-20250514",
) -> list[dict]:
    """Generate 5-8 post topic suggestions."""
    client = anthropic.AsyncAnthropic(api_key=api_key)

    parts = [
        "You are an expert social media content strategist. Generate 6 unique, creative post ideas.",
        "Each idea should be specific, timely, and actionable — not generic.",
    ]
    if niche:
        parts.append(f"User's niche/industry: {niche}")
    if platforms:
        parts.append(f"Preferred platforms: {', '.join(platforms)}")
    if recent_contexts:
        parts.append("Recent posts (avoid repetition):")
        for ctx in recent_contexts[:5]:
            parts.append(f"  - {ctx[:120]}")

    parts.append(
        "\nReturn a JSON array of 6 objects, each with:\n"
        '  - "title": short catchy title (max 60 chars)\n'
        '  - "description": one-line description of what to write about (max 120 chars)\n'
        '  - "platforms": array of 1-3 best platforms for this idea (twitter, linkedin, reddit, instagram, bluesky, mastodon)\n'
        '  - "tone": suggested tone (professional, casual, hype, storytelling, educational, witty, inspirational, bold)\n'
        "\nReturn ONLY the JSON array, no extra text."
    )

    message = await client.messages.create(
        model=model,
        max_tokens=2048,
        messages=[{"role": "user", "content": "\n".join(parts)}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    import json as _json
    return _json.loads(raw)


_WEEK_SYSTEM_PROMPT = """You are a social media content strategist creating a weekly content plan.

Given ONE topic/context, generate a full week of social media posts. Each day must have:
1. A COMPLETELY DIFFERENT angle on the topic (not just rephrased)
2. A specific platform assignment (match content type to platform strength)
3. An appropriate tone for that platform
4. A strategic reason for posting this on this day

Content angle ideas to vary across the week:
- Behind the scenes / making-of story
- Educational breakdown / how-to
- Personal reflection / lessons learned
- Data/metrics/results sharing
- Hot take / controversial opinion
- Community engagement / question-asking
- Celebration / milestone / gratitude
- Comparison / vs post
- Prediction / future outlook
- Tutorial / step-by-step

NEVER repeat the same angle twice in one week.
NEVER just reformat the same content for different platforms.
Each post must stand alone and provide unique value.

Respond ONLY in valid JSON — no markdown fences, no backticks:
{
  "week_plan": [
    {
      "day": 1,
      "day_name": "Monday",
      "platform": "linkedin",
      "tone": "storytelling",
      "angle": "The origin story",
      "why_this_day": "Monday = fresh start, professional audience active",
      "content": "full post text ready to publish",
      "hashtags": ["tag1", "tag2"],
      "media_suggestion": "Add a photo of your workspace or team",
      "best_time": "9:00 AM IST"
    }
  ],
  "strategy_note": "Brief explanation of the overall content strategy for the week"
}"""

_STYLE_HINTS = {
    "balanced":       "Mix educational, personal, and engaging content evenly. Vary tones and formats throughout the week.",
    "aggressive":     "Maximize virality. Use bold takes, controversy, high-energy copy, and strong CTAs. Optimize for shares and engagement.",
    "educational":    "Every post should teach something. Lead with value, use frameworks, numbered lists, and actionable insights.",
    "personal-brand": "Focus on storytelling, vulnerability, behind-the-scenes moments, and authentic personal voice. Build connection.",
}


async def generate_week_plan(
    api_key: str,
    context: str,
    platforms: list[str],
    days: int = 7,
    style: str = "balanced",
    model: str = "claude-sonnet-4-20250514",
) -> dict:
    """Generate a full weekly content plan from a single context/idea."""
    client = anthropic.AsyncAnthropic(api_key=api_key)

    style_hint = _STYLE_HINTS.get(style, _STYLE_HINTS["balanced"])
    platform_str = ", ".join(platforms) if platforms else "twitter, linkedin, reddit, instagram"

    prompt = (
        f"Generate a {days}-day content plan for the following topic/context:\n\n"
        f"CONTEXT: {context}\n\n"
        f"AVAILABLE PLATFORMS (distribute smartly across the week): {platform_str}\n\n"
        f"CONTENT STYLE: {style_hint}\n\n"
        f"Generate exactly {days} posts — one per day (Day 1 through Day {days}). "
        f"Each post on a DIFFERENT platform with a DIFFERENT angle. "
        f"Match platform to content type (LinkedIn=professional insights, Twitter=hot takes/threads, "
        f"Reddit=community value, Instagram=visual storytelling, Bluesky=casual/indie)."
    )

    message = await client.messages.create(
        model=model,
        max_tokens=6000,
        system=_WEEK_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Claude returned invalid JSON: {exc}\n\nRaw:\n{raw}") from exc


async def humanize_post(
    api_key: str,
    platform: str,
    current_content: str,
    tone: str,
    model: str = "claude-sonnet-4-20250514",
) -> str:
    client = anthropic.AsyncAnthropic(api_key=api_key)

    prompt = (
        f"Rewrite this {platform} post to sound genuinely human and not AI-generated at all. "
        f"Add natural imperfections, personal touches, real speech patterns. "
        f"Remove any corporate or AI buzzwords. Make it sound like a real person typed this casually. "
        f"Keep the core message and {tone} tone. "
        f"Return ONLY the rewritten post text, nothing else.\n\n"
        f"Current post:\n{current_content}"
    )

    message = await client.messages.create(
        model=model,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()
