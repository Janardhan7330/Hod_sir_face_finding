import secrets
from datetime import UTC, datetime

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_token_pair,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.audit_service import audit_service
from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: LoginRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedError("Account is deactivated")

    refresh_jti = secrets.token_urlsafe(32)
    tokens = create_token_pair(str(user.id), user.email, user.role.value, refresh_jti)

    user.last_login = datetime.now(UTC)
    await db.commit()

    await audit_service.log(
        db, user_id=user.id, action="auth.login", resource_type="user", resource_id=user.id,
        details={"email": user.email}, ip_address=request.client.host if request.client else None
    )

    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=60 * 60 * 24 * 7,
    )

    return TokenResponse(access_token=tokens.access_token, refresh_token=tokens.refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise UnauthorizedError("Missing refresh token")

    try:
        payload = decode_token(refresh_token)
    except ValueError as e:
        raise UnauthorizedError(str(e))

    if payload.type != "refresh":
        raise UnauthorizedError("Invalid token type")

    result = await db.execute(select(User).where(User.id == payload.sub))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    new_refresh_jti = secrets.token_urlsafe(32)
    tokens = create_token_pair(str(user.id), user.email, user.role.value, new_refresh_jti)

    await audit_service.log(
        db, user_id=user.id, action="auth.refresh", resource_type="user", resource_id=user.id
    )

    return TokenResponse(access_token=tokens.access_token, refresh_token=tokens.refresh_token)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await audit_service.log(
        db, user_id=user.id, action="auth.logout", resource_type="user", resource_id=user.id
    )

    response.delete_cookie("refresh_token", httponly=True, secure=True, samesite="strict")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictError("Email already registered")

    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=UserRole(data.role),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    await audit_service.log(
        db, user_id=current_user.id, action="auth.register", resource_type="user", resource_id=user.id,
        details={"email": user.email, "role": user.role.value}
    )

    return UserResponse.model_validate(user)
