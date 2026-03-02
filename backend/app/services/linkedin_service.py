# LinkedIn posting service using LinkedIn API v2 via httpx.
# LinkedIn API reference:
#   https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

import re
from typing import Optional

import httpx

_BASE = "https://api.linkedin.com/v2"
_TIMEOUT = 15  # seconds


def _headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }


def _parse_annotations(text: str) -> tuple[str, list]:
    """Parse **bold** and *italic* markdown into LinkedIn annotation format.
    Returns (clean_text, annotations_list)."""
    annotations = []
    result = ""
    last_end = 0

    # Bold: **text**
    for m in re.finditer(r'\*\*(.+?)\*\*', text, re.DOTALL):
        result += text[last_end:m.start()]
        start = len(result)
        inner = m.group(1)
        result += inner
        annotations.append({
            "start": start, "length": len(inner),
            "value": {"com.linkedin.common.BoldAnnotation": {}},
        })
        last_end = m.end()
    result += text[last_end:]

    # Italic: *text* (single, not double)
    text2, result2 = result, ""
    last_end = 0
    adjusted = []
    for m in re.finditer(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', text2, re.DOTALL):
        result2 += text2[last_end:m.start()]
        start = len(result2)
        inner = m.group(1)
        result2 += inner
        adjusted.append({
            "start": start, "length": len(inner),
            "value": {"com.linkedin.common.ItalicAnnotation": {}},
        })
        last_end = m.end()
    result2 += text2[last_end:]

    # Re-adjust bold annotation positions after italic removal
    shift = 0
    final_bold = []
    for a in annotations:
        final_bold.append({"start": a["start"] - shift, "length": a["length"], "value": a["value"]})

    all_annotations = final_bold + adjusted
    all_annotations.sort(key=lambda x: x["start"])
    return result2, all_annotations


def _get_profile_urn(access_token: str) -> tuple[str, str]:
    """Return (urn, display_name) for the token owner using OpenID Connect userinfo."""
    with httpx.Client(timeout=_TIMEOUT) as client:
        resp = client.get(
            f"{_BASE}/userinfo",
            headers=_headers(access_token),
        )
    resp.raise_for_status()
    data = resp.json()
    urn = f"urn:li:person:{data['sub']}"
    name = data.get("name") or f"{data.get('given_name', '')} {data.get('family_name', '')}".strip() or "LinkedIn User"
    return urn, name


def post_to_linkedin(
    access_token: str,
    content: str,
    media_urls: Optional[list[str]] = None,
) -> dict:
    author_urn, display_name = _get_profile_urn(access_token)

    clean_text, annotations = _parse_annotations(content)
    share_commentary: dict = {"text": clean_text}
    if annotations:
        share_commentary["attributes"] = annotations

    share_content: dict = {
        "shareCommentary": share_commentary,
        "shareMediaCategory": "NONE",
    }

    if media_urls:
        # Only image/article links are supported via UGC posts without uploading assets.
        # For simplicity we attach the first URL as an article share.
        share_content["shareMediaCategory"] = "ARTICLE"
        share_content["media"] = [
            {
                "status": "READY",
                "originalUrl": media_urls[0],
            }
        ]

    payload = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": share_content,
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
    }

    with httpx.Client(timeout=_TIMEOUT) as client:
        resp = client.post(
            f"{_BASE}/ugcPosts",
            headers=_headers(access_token),
            json=payload,
        )

    resp.raise_for_status()
    post_id = resp.headers.get("x-restli-id", "")
    post_url = f"https://www.linkedin.com/feed/update/{post_id}/" if post_id else ""

    return {
        "post_id": post_id,
        "post_url": post_url,
        "author": display_name,
    }


def test_connection(access_token: str) -> dict:
    try:
        _, display_name = _get_profile_urn(access_token)
        return {"success": True, "name": display_name, "message": f"Connected as {display_name}"}
    except httpx.HTTPStatusError as exc:
        return {"success": False, "message": f"HTTP {exc.response.status_code}: {exc.response.text}"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}
