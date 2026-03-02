from typing import Optional

import praw

_USER_AGENT = "PostPilot/1.0 (content scheduler)"


def _make_reddit(client_id: str, client_secret: str, username: str, password: str) -> praw.Reddit:
    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        username=username,
        password=password,
        user_agent=_USER_AGENT,
    )


def post_to_reddit(
    client_id: str,
    client_secret: str,
    username: str,
    password: str,
    subreddit: str,
    title: str,
    content: str,
    media_path: Optional[str] = None,
) -> dict:
    reddit = _make_reddit(client_id, client_secret, username, password)

    # Strip leading "r/" if provided
    subreddit_name = subreddit.lstrip("r/").lstrip("/")
    sub = reddit.subreddit(subreddit_name)

    if media_path:
        # Image / video submission
        submission = sub.submit_image(
            title=title,
            image_path=media_path,
        )
    else:
        # Text post
        submission = sub.submit(
            title=title,
            selftext=content,
        )

    return {
        "submission_id": submission.id,
        "post_url": f"https://www.reddit.com{submission.permalink}",
        "subreddit": subreddit_name,
        "title": submission.title,
    }


def post_to_reddit_oauth(
    client_id: str,
    client_secret: str,
    access_token: str,
    refresh_token: Optional[str],
    subreddit: str,
    title: str,
    content: str,
    media_path: Optional[str] = None,
) -> dict:
    """Post to Reddit using an OAuth refresh_token (from the Connect flow)."""
    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        refresh_token=refresh_token or access_token,
        user_agent=_USER_AGENT,
    )

    subreddit_name = subreddit.lstrip("r/").lstrip("/")
    sub = reddit.subreddit(subreddit_name)

    if media_path:
        submission = sub.submit_image(title=title, image_path=media_path)
    else:
        submission = sub.submit(title=title, selftext=content)

    return {
        "submission_id": submission.id,
        "post_url": f"https://www.reddit.com{submission.permalink}",
        "subreddit": subreddit_name,
        "title": submission.title,
    }


def test_connection(credentials: dict) -> dict:
    required = {"client_id", "client_secret", "username", "password"}
    missing = required - credentials.keys()
    if missing:
        return {"success": False, "message": f"Missing keys: {', '.join(missing)}"}

    try:
        reddit = _make_reddit(
            credentials["client_id"],
            credentials["client_secret"],
            credentials["username"],
            credentials["password"],
        )
        me = reddit.user.me()
        return {"success": True, "username": me.name, "message": f"Connected as u/{me.name}"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}
