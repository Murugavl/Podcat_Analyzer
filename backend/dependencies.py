# backend/dependencies.py
import uuid

from fastapi import Cookie, Response

from backend.config import settings
from backend.session_store import SESSION_COOKIE_NAME

SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def get_settings():
    return settings


def get_session_id(
    response: Response,
    echoscribe_session: str | None = Cookie(default=None),
) -> str:
    """Read the caller's session id from its cookie, or mint a new one.

    A new id is written back on `response` so the browser carries it on
    every later request — this is what stands in for a database: the
    session store keys everything off this id instead of a login.
    """
    session_id = echoscribe_session or str(uuid.uuid4())
    if echoscribe_session != session_id:
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_id,
            max_age=SESSION_COOKIE_MAX_AGE,
            httponly=True,
            samesite=settings.COOKIE_SAMESITE,
            secure=settings.COOKIE_SECURE,
        )
    return session_id
