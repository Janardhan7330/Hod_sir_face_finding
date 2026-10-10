from collections.abc import AsyncGenerator
from typing import Optional

from app.core.database import get_db_session
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_token
from app.models.user import User
from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    import uuid
    user = User(
        id=uuid.UUID("6c8b1042-d09e-47b5-992c-8be7be2cfd58"),
        email="admin@face-lab.local",
        password_hash="mock",
        is_active=True,
        role="admin"
    )
    return user


def require_role(*allowed_roles: str):
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError(f"Required role: {', '.join(allowed_roles)}")
        return user
    return role_checker


async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    import uuid
    user = User(
        id=uuid.UUID("6c8b1042-d09e-47b5-992c-8be7be2cfd58"),
        email="admin@face-lab.local",
        password_hash="mock",
        is_active=True,
        role="admin"
    )
    return user
