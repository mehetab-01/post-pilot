"""
Bluesky / AT Protocol posting service.

Uses the `atproto` library with handle + app-password authentication.
Sessions are exported as strings and stored encrypted in SocialConnection.
"""

from atproto import Client, client_utils


def login_and_export(handle: str, app_password: str) -> dict:
    """
    Authenticate with Bluesky and return session data.

    Returns:
        dict with keys: session_string, username, did
    """
    client = Client()
    profile = client.login(handle, app_password)
    return {
        "session_string": client.export_session_string(),
        "username": f"@{profile.handle}",
        "did": profile.did,
    }


def _restore_client(session_string: str) -> Client:
    """Restore a Client from a stored session string."""
    client = Client()
    client.login(session_string=session_string)
    return client


def test_connection(session_string: str) -> dict:
    """Verify a stored session is still valid. Returns profile info."""
    client = _restore_client(session_string)
    profile = client.get_profile(client.me.did)
    return {
        "handle": profile.handle,
        "display_name": profile.display_name or profile.handle,
        "did": profile.did,
    }


def post_to_bluesky(
    session_string: str,
    content: str,
    media_paths: list[str] | None = None,
) -> dict:
    """
    Create a post on Bluesky.

    Args:
        session_string: Exported session string.
        content: Post text (max 300 graphemes).
        media_paths: Optional list of image file paths (max 4).

    Returns:
        dict with uri, cid, post_url.
    """
    client = _restore_client(session_string)

    # Build rich text with auto-detected links, mentions, hashtags
    tb = client_utils.TextBuilder()
    tb.text(content)

    embed = None
    if media_paths:
        images = []
        for path in media_paths[:4]:
            with open(path, "rb") as f:
                img_data = f.read()
            upload = client.upload_blob(img_data)
            images.append({"alt": "", "image": upload.blob})

        if images:
            from atproto import models
            embed = models.AppBskyEmbedImages.Main(images=[
                models.AppBskyEmbedImages.Image(alt=img["alt"], image=img["image"])
                for img in images
            ])

    response = client.send_post(tb, embed=embed)

    # Build post URL from URI: at://did:plc:xxx/app.bsky.feed.post/rkey
    rkey = response.uri.split("/")[-1]
    handle = client.me.handle
    post_url = f"https://bsky.app/profile/{handle}/post/{rkey}"

    return {
        "uri": response.uri,
        "cid": response.cid,
        "post_url": post_url,
    }
