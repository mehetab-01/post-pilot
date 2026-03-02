# LinkedIn posting service using LinkedIn API v2 via httpx.
#
# NOTE: In production this would require a full OAuth 2.0 flow to obtain the
# access_token.  The implementation below assumes the user has already completed
# OAuth and stored their personal access token (or a long-lived member token)
# via the settings API.  The token must have the scopes:
#   w_member_social  (posting)
#   r_liteprofile    (reading name/urn)
#
# LinkedIn API reference:
#   https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

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

    share_content: dict = {
        "shareCommentary": {"text": content},
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
