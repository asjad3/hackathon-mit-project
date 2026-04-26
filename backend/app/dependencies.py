from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.db import get_db


async def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Require X-API-Key only when APP_API_KEY is configured."""
    settings = get_settings()
    if not settings.app_api_key:
        return

    if x_api_key != settings.app_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )


def get_db_session() -> Session:
    """Dependency for FastAPI routers to get database session."""
    return next(get_db())
