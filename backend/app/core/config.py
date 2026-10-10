from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "RS256"
    JWT_PRIVATE_KEY_PATH: str = "/app/secrets/jwt_private.pem"
    JWT_PUBLIC_KEY_PATH: str = "/app/secrets/jwt_public.pem"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = Field(..., min_length=10)
    REDIS_URL: str = Field(default="redis://redis:6379/0")

    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    MODEL_PATH: str = "/app/models"
    MODEL_PACK: str = "buffalo_l"
    DETECTION_THRESHOLD: float = 0.5
    MATCH_THRESHOLD: float = 0.75
    REVIEW_THRESHOLD: float = 0.60
    MAX_FACES_PER_IMAGE: int = 50
    MAX_UPLOAD_SIZE_MB: int = 10

    UPLOAD_DIR: str = "/tmp/face_lab_uploads"
    CLEANUP_INTERVAL_MINUTES: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()
