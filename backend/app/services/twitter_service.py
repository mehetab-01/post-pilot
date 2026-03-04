"""
Twitter / X service layer.

Two auth modes are supported:
  - OAuth 1.0a (legacy): uses tweepy with 4 API keys — kept for backward compat.
  - OAuth 2.0 (new):     uses httpx with a user access token obtained via PKCE flow.
                         Access tokens expire every 2 hours; use refresh_oauth2_token()
                         to get a new one before retrying on 401.
"""
from typing import Optional

import httpx
import tweepy

# ── OAuth 1.0a (legacy — kept for backward compatibility) ─────────────────────

def _make_client(api_key: str, api_secret: str, access_token: str, access_token_secret: str) -> tweepy.Client:
    return tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_token_secret,
    )


def _upload_media_v1(api_key: str, api_secret: str, access_token: str, access_token_secret: str, media_path: str) -> str:
    """Upload media via Tweepy v1 API and return media_id string."""
    auth = tweepy.OAuth1UserHandler(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_token_secret,
    )
    api_v1 = tweepy.API(auth)
    media = api_v1.media_upload(filename=media_path)
    return str(media.media_id)


def post_tweet(
    api_key: str,
    api_secret: str,
    access_token: str,
    access_token_secret: str,
    content: str,
    media_paths: Optional[list[str]] = None,
) -> dict:
    client = _make_client(api_key, api_secret, access_token, access_token_secret)

    media_ids = None
    if media_paths:
        media_ids = [
            _upload_media_v1(api_key, api_secret, access_token, access_token_secret, path)
            for path in media_paths[:4]
        ]

    response = client.create_tweet(text=content, media_ids=media_ids)
    tweet_id = response.data["id"]

    me = client.get_me()
    username = me.data.username if me.data else "unknown"

    return {
        "tweet_id": tweet_id,
        "post_url": f"https://x.com/{username}/status/{tweet_id}",
        "username": username,
    }


def post_thread(
    api_key: str,
    api_secret: str,
    access_token: str,
    access_token_secret: str,
    tweets: list[str],
    media_paths: Optional[list[str]] = None,
) -> dict:
    """Post a thread. media_paths apply to the first tweet only."""
    client = _make_client(api_key, api_secret, access_token, access_token_secret)

    media_ids = None
    if media_paths:
        media_ids = [
            _upload_media_v1(api_key, api_secret, access_token, access_token_secret, path)
            for path in media_paths[:4]
        ]

    me = client.get_me()
    username = me.data.username if me.data else "unknown"

    tweet_ids = []
    reply_to_id = None

    for idx, text in enumerate(tweets):
        kwargs: dict = {"text": text}
        if idx == 0 and media_ids:
            kwargs["media_ids"] = media_ids
        if reply_to_id:
            kwargs["in_reply_to_tweet_id"] = reply_to_id

        response = client.create_tweet(**kwargs)
        tweet_id = response.data["id"]
        tweet_ids.append(tweet_id)
        reply_to_id = tweet_id

    first_id = tweet_ids[0]
    return {
        "thread_ids": tweet_ids,
        "post_url": f"https://x.com/{username}/status/{first_id}",
        "tweet_count": len(tweet_ids),
        "username": username,
    }


def test_connection(credentials: dict) -> dict:
    required = {"api_key", "api_secret", "access_token", "access_token_secret"}
    missing = required - credentials.keys()
    if missing:
        return {"success": False, "message": f"Missing keys: {', '.join(missing)}"}

    try:
        client = _make_client(
            credentials["api_key"],
            credentials["api_secret"],
            credentials["access_token"],
            credentials["access_token_secret"],
        )
        me = client.get_me()
        username = me.data.username if me.data else "unknown"
        return {"success": True, "username": username, "message": f"Connected as @{username}"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}


# ── OAuth 2.0 (new — PKCE connect flow) ──────────────────────────────────────

_X_TWEETS_URL   = "https://api.x.com/2/tweets"
_X_USERS_ME_URL = "https://api.x.com/2/users/me"
_X_MEDIA_URL    = "https://api.x.com/2/media/upload"
_X_TOKEN_URL    = "https://api.x.com/2/oauth2/token"


def _auth_headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


def _get_username_oauth2(client: httpx.Client, access_token: str) -> str:
    resp = client.get(_X_USERS_ME_URL, headers=_auth_headers(access_token))
    if resp.status_code == 200:
        return resp.json().get("data", {}).get("username", "unknown")
    return "unknown"


def _upload_media_oauth2(client: httpx.Client, access_token: str, media_path: str) -> str:
    """Upload a single media file via X API v2 and return its media_id string."""
    with open(media_path, "rb") as f:
        resp = client.post(
            _X_MEDIA_URL,
            files={"media": f},
            headers=_auth_headers(access_token),
        )
    resp.raise_for_status()
    return str(resp.json()["media_id_string"])


def post_tweet_oauth2(
    access_token: str,
    content: str,
    media_paths: Optional[list[str]] = None,
) -> dict:
    """
    Post a single tweet using OAuth 2.0 user access token.
    Raises ValueError("TOKEN_EXPIRED") if the token is expired (HTTP 401).
    """
    with httpx.Client(timeout=20) as client:
        media_ids = None
        if media_paths:
            media_ids = [_upload_media_oauth2(client, access_token, p) for p in media_paths[:4]]

        payload: dict = {"text": content}
        if media_ids:
            payload["media"] = {"media_ids": media_ids}

        resp = client.post(
            _X_TWEETS_URL,
            json=payload,
            headers={**_auth_headers(access_token), "Content-Type": "application/json"},
        )

        if resp.status_code == 401:
            raise ValueError("TOKEN_EXPIRED")
        resp.raise_for_status()

        tweet_id = resp.json()["data"]["id"]
        username = _get_username_oauth2(client, access_token)

    return {
        "tweet_id": tweet_id,
        "post_url": f"https://x.com/{username}/status/{tweet_id}",
        "username": username,
    }


def post_thread_oauth2(
    access_token: str,
    tweets: list[str],
    media_paths: Optional[list[str]] = None,
) -> dict:
    """
    Post a reply-chain thread using OAuth 2.0.
    media_paths attach to the first tweet only.
    Raises ValueError("TOKEN_EXPIRED") on HTTP 401.
    """
    with httpx.Client(timeout=20) as client:
        media_ids = None
        if media_paths:
            media_ids = [_upload_media_oauth2(client, access_token, p) for p in media_paths[:4]]

        username = _get_username_oauth2(client, access_token)
        tweet_ids = []
        reply_to_id = None

        for idx, text in enumerate(tweets):
            payload: dict = {"text": text}
            if idx == 0 and media_ids:
                payload["media"] = {"media_ids": media_ids}
            if reply_to_id:
                payload["reply"] = {"in_reply_to_tweet_id": reply_to_id}

            resp = client.post(
                _X_TWEETS_URL,
                json=payload,
                headers={**_auth_headers(access_token), "Content-Type": "application/json"},
            )
            if resp.status_code == 401:
                raise ValueError("TOKEN_EXPIRED")
            resp.raise_for_status()

            tweet_id = resp.json()["data"]["id"]
            tweet_ids.append(tweet_id)
            reply_to_id = tweet_id

    return {
        "thread_ids": tweet_ids,
        "post_url": f"https://x.com/{username}/status/{tweet_ids[0]}",
        "tweet_count": len(tweet_ids),
        "username": username,
    }


def refresh_oauth2_token(refresh_token: str, client_id: str, client_secret: str) -> dict:
    """
    Exchange a refresh token for a new access token.
    Returns {"access_token": ..., "refresh_token": ...}
    X may rotate the refresh token — always save the returned one.
    """
    with httpx.Client(timeout=15) as client:
        resp = client.post(
            _X_TOKEN_URL,
            data={
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
                "client_id": client_id,
            },
            auth=(client_id, client_secret),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        data = resp.json()

    return {
        "access_token": data["access_token"],
        "refresh_token": data.get("refresh_token", refresh_token),
    }
