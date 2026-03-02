from cryptography.fernet import Fernet

from app.config import settings


def _get_fernet() -> Fernet:
    key = settings.FERNET_KEY
    if not key:
        # Auto-generate a key and warn — in production this should be set in .env
        key = Fernet.generate_key().decode()
        settings.FERNET_KEY = key
        print(
            f"[WARNING] FERNET_KEY not set in environment. Generated a temporary key.\n"
            f"Add this to your .env file to persist encrypted data across restarts:\n"
            f"FERNET_KEY={key}"
        )
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_value(plain_text: str) -> str:
    f = _get_fernet()
    return f.encrypt(plain_text.encode()).decode()


def decrypt_value(encrypted_text: str) -> str:
    f = _get_fernet()
    return f.decrypt(encrypted_text.encode()).decode()
