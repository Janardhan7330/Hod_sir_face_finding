import uuid
from datetime import datetime

from pydantic import BaseModel, Field
from pydantic.networks import EmailStr


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    password: str = Field(..., min_length=8)


class RegisterRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    password: str = Field(..., min_length=8)
    role: str = "operator"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    is_active: bool
    last_login: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class RefreshRequest(BaseModel):
    refresh_token: str
