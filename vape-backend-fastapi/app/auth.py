from fastapi import Header, HTTPException

from .settings import settings


def require_api_key(x_api_key: str | None = Header(default=None)):
    """Optional shared-secret auth.

    If API_KEY is set in env/.env, all requests must provide x-api-key.
    If API_KEY is not set, this dependency does nothing.
    """
    if settings.api_key is None or settings.api_key == "":
        return

    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")
