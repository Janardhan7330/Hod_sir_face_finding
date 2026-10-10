import secrets
from datetime import UTC, datetime, timedelta
from pathlib import Path

from app.core.config import get_settings
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class TokenData(BaseModel):
    sub: str
    email: str
    role: str
    exp: datetime
    iat: datetime
    jti: str
    type: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def load_private_key() -> str:
    settings = get_settings()
    path = Path(settings.JWT_PRIVATE_KEY_PATH)
    if path.exists():
        return path.read_text()
    return settings.SECRET_KEY


def load_public_key() -> str:
    settings = get_settings()
    path = Path(settings.JWT_PUBLIC_KEY_PATH)
    if path.exists():
        return path.read_text()
    return settings.SECRET_KEY


def get_algorithm() -> str:
    settings = get_settings()
    # Use HS256 for development (with SECRET_KEY), RS256 for production (with PEM keys)
    path = Path(settings.JWT_PRIVATE_KEY_PATH)
    if path.exists():
        return settings.JWT_ALGORITHM
    return "HS256"


def create_access_token(
    subject: str,
    email: str,
    role: str,
    expires_delta: timedelta | None = None,
) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {
        "sub": subject,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": now,
        "type": "access",
        "jti": secrets.token_urlsafe(16),
    }
    private_key = load_private_key()
    algorithm = get_algorithm()
    return jwt.encode(to_encode, private_key, algorithm=algorithm)


def create_refresh_token(subject: str, jti: str) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "type": "refresh",
        "jti": jti,
    }
    private_key = load_private_key()
    algorithm = get_algorithm()
    return jwt.encode(to_encode, private_key, algorithm=algorithm)


def decode_token(token: str) -> TokenData:
    settings = get_settings()
    public_key = load_public_key()
    algorithm = get_algorithm()
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[algorithm],
            options={"verify_aud": False},
        )
        return TokenData(**payload)
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")


def create_token_pair(user_id: str, email: str, role: str, refresh_jti: str) -> TokenPair:
    return TokenPair(
        access_token=create_access_token(user_id, email, role),
        refresh_token=create_refresh_token(user_id, refresh_jti),
    )
