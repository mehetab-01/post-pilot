"""
Mastodon service — per-instance OAuth app registration + posting.

Uses Mastodon.py library: https://mastodonpy.readthedocs.io/
"""
from __future__ import annotations

import mimetypes
from typing import Optional

from mastodon import Mastodon


def register_app(instance_url: str, redirect_uri: str) -> tuple[str, str]:
    """
    Register a Mastodon app on the given instance (once per instance).
    Returns (client_id, client_secret).
    """
    client_id, client_secret = Mastodon.create_app(
        "PostPilot",
        api_base_url=f"https://{instance_url}",
        redirect_uris=redirect_uri,
        scopes=["read", "write"],
    )
    return client_id, client_secret


def get_authorize_url(instance_url: str, client_id: str, client_secret: str, redirect_uri: str) -> str:
    """Build the OAuth authorize URL for the given instance."""
    api = Mastodon(
        client_id=client_id,
        client_secret=client_secret,
        api_base_url=f"https://{instance_url}",
    )
    return api.auth_request_url(
        redirect_uris=redirect_uri,
        scopes=["read", "write"],
    )


def exchange_code(instance_url: str, client_id: str, client_secret: str, code: str, redirect_uri: str) -> dict:
    """Exchange an auth code for an access token. Returns {access_token, username}."""
    api = Mastodon(
        client_id=client_id,
        client_secret=client_secret,
        api_base_url=f"https://{instance_url}",
    )
    access_token = api.log_in(
        code=code,
        redirect_uri=redirect_uri,
        scopes=["read", "write"],
    )
    account = api.account_verify_credentials()
    return {
        "access_token": access_token,
        "username": account.acct,
    }


def test_connection(instance_url: str, access_token: str) -> bool:
    """Verify credentials are valid."""
    api = Mastodon(
        access_token=access_token,
        api_base_url=f"https://{instance_url}",
    )
    api.account_verify_credentials()
    return True


def post_to_mastodon(
    instance_url: str,
    access_token: str,
    content: str,
    media_paths: Optional[list[str]] = None,
    visibility: str = "public",
) -> dict:
    """
    Post a status to Mastodon.
    visibility: 'public' | 'unlisted' | 'private' | 'direct'
    Returns {post_url, id}.
    """
    api = Mastodon(
        access_token=access_token,
        api_base_url=f"https://{instance_url}",
    )

    media_ids = []
    if media_paths:
        for path in media_paths[:4]:
            mime, _ = mimetypes.guess_type(path)
            media = api.media_post(path, mime_type=mime)
            media_ids.append(media.id)

    status = api.status_post(
        content,
        media_ids=media_ids or None,
        visibility=visibility,
    )
    return {
        "post_url": status.url,
        "id": status.id,
    }
