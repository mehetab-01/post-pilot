"""
OpenAI-compatible service for OpenAI, Groq, and Gemini.

All three providers expose an OpenAI-compatible chat completions API,
so we use the `openai` SDK with provider-specific base_url values.

Uses the same SYSTEM_PROMPT and prompt builder from claude_service
so the output JSON format is identical across all providers.
"""
import json
from typing import Optional

import openai

from app.services.claude_service import SYSTEM_PROMPT, _build_generate_prompt

PROVIDER_BASE_URLS = {
    "openai": None,                                                        # default OpenAI
    "groq":   "https://api.groq.com/openai/v1",
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
}


def _get_client(provider: str, api_key: str) -> openai.AsyncOpenAI:
    base_url = PROVIDER_BASE_URLS.get(provider)
    kwargs: dict = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return openai.AsyncOpenAI(**kwargs)


def _strip_json_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
    return text.strip()


async def generate_posts(
    api_key: str,
    model: str,
    provider: str,
    context: str,
    platforms: dict,
    media_info: Optional[list] = None,
    additional_instructions: Optional[str] = None,
    length: str = "medium",
) -> dict:
    client = _get_client(provider, api_key)
    user_prompt = _build_generate_prompt(context, platforms, media_info, additional_instructions, length)

    resp = await client.chat.completions.create(
        model=model,
        max_tokens=4096,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt},
        ],
    )

    raw = _strip_json_fences(resp.choices[0].message.content or "")

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"{provider} returned invalid JSON: {exc}\n\nRaw:\n{raw}"
        ) from exc


async def enhance_post(
    api_key: str,
    model: str,
    provider: str,
    platform: str,
    current_content: str,
    tone: str,
) -> str:
    client = _get_client(provider, api_key)

    prompt = (
        f"Take this {platform} post and make it significantly more engaging. "
        f"Improve the hook, add more compelling language, increase viral potential. "
        f"Keep the same tone ({tone}) and platform format. Keep the core message intact. "
        f"Return ONLY the improved post text, nothing else.\n\nCurrent post:\n{current_content}"
    )

    resp = await client.chat.completions.create(
        model=model,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    return (resp.choices[0].message.content or "").strip()


async def humanize_post(
    api_key: str,
    model: str,
    provider: str,
    platform: str,
    current_content: str,
    tone: str,
) -> str:
    client = _get_client(provider, api_key)

    prompt = (
        f"Rewrite this {platform} post to sound genuinely human and not AI-generated at all. "
        f"Add natural imperfections, personal touches, real speech patterns. "
        f"Remove any corporate or AI buzzwords. Make it sound like a real person typed this casually. "
        f"Keep the core message and {tone} tone. "
        f"Return ONLY the rewritten post text, nothing else.\n\nCurrent post:\n{current_content}"
    )

    resp = await client.chat.completions.create(
        model=model,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    return (resp.choices[0].message.content or "").strip()
