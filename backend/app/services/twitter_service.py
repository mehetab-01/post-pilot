from typing import Optional

import tweepy


def _make_client(api_key: str, api_secret: str, access_token: str, access_token_secret: str) -> tweepy.Client:
    return tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_token_secret,
    )


def _upload_media(api_key: str, api_secret: str, access_token: str, access_token_secret: str, media_path: str) -> str:
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
            _upload_media(api_key, api_secret, access_token, access_token_secret, path)
            for path in media_paths[:4]  # Twitter allows max 4 images
        ]

    response = client.create_tweet(text=content, media_ids=media_ids)
    tweet_id = response.data["id"]

    # Get the username to build the URL
    me = client.get_me()
    username = me.data.username if me.data else "unknown"

    return {
        "tweet_id": tweet_id,
        "post_url": f"https://twitter.com/{username}/status/{tweet_id}",
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
    """Post a thread of tweets. media_paths apply to the first tweet only."""
    client = _make_client(api_key, api_secret, access_token, access_token_secret)

    media_ids = None
    if media_paths:
        media_ids = [
            _upload_media(api_key, api_secret, access_token, access_token_secret, path)
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
        "post_url": f"https://twitter.com/{username}/status/{first_id}",
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
