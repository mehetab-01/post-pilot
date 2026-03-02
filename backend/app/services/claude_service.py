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

PLATFORM GUIDELINES:

X/Twitter (max 280 chars per tweet):
- Start with a bold hook or unexpected statement
- Short punchy sentences
- 1-3 relevant hashtags max
- If thread mode: tweet 1 = hook, middle tweets = value/story, last = CTA
- Use line breaks between thoughts

LinkedIn (sweet spot 1300 chars):
- First line must be a scroll-stopping hook (this shows before "see more")
- Single-line paragraphs with line breaks between them
- Professional but genuinely human — no corporate buzzwords
- Weave in personal story or specific insight
- 3-5 hashtags at the very end
- End with a question or call-to-action to drive comments

Reddit (title + body):
- Title: Specific, genuine, not clickbait
- Body: Detailed, conversational, adds real value
- NO hashtags, minimal emojis
- Reddit hates obvious self-promotion — lead with value
- Suggest 2-3 relevant subreddits

Instagram (max 2200 chars):
- Strong hook in first sentence (shows before "...more")
- Storytelling or list format
- Natural emoji usage woven into text
- Line breaks between paragraphs
- Separate hashtag block at end: 20-30 relevant hashtags
- End with CTA: "Save this for later" or "Share with someone"

WhatsApp (short & personal):
- 2-3 short paragraphs maximum
- Casual tone like texting a close friend
- Relevant emojis sprinkled naturally
- Link on its own line if included
- No hashtags ever

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
    }
  },
  "posting_tips": {
    "best_time": "Suggested posting times",
    "engagement_tip": "Quick tip to boost reach"
  }
}

Only include platforms that were requested. Never include unrequested platforms."""


def _build_generate_prompt(
    context: str,
    platforms: dict,
    media_info: Optional[list],
    additional_instructions: Optional[str],
) -> str:
    lines = [
        "Generate social media posts for the following context:",
        "",
        f"CONTEXT:\n{context}",
        "",
        "PLATFORMS TO GENERATE (respect the tone and options for each):",
    ]

    for platform, opts in platforms.items():
        option_parts = []
        for k, v in opts.items():
            option_parts.append(f"{k}={v}")
        opts_str = ", ".join(option_parts) if option_parts else "default options"
        lines.append(f"- {platform}: {opts_str}")

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
    model: str = "claude-sonnet-4-20250514",
) -> dict:
    client = anthropic.AsyncAnthropic(api_key=api_key)

    user_prompt = _build_generate_prompt(context, platforms, media_info, additional_instructions)

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
    model: str = "claude-sonnet-4-20250514",
) -> str:
    client = anthropic.AsyncAnthropic(api_key=api_key)

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
