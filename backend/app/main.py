from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.database import Base, engine
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.core.middleware import RequestIDMiddleware

logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("application_starting", environment=settings.ENVIRONMENT)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("database_ready")

    yield

    logger.info("application_shutting_down")
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Face Recognition Lab API",
        description="Consent-Based Group Photo Face Recognition & Profile System",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
    )

    app.add_middleware(RequestIDMiddleware)

    register_exception_handlers(app)

    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health", tags=["System"])
    async def health_check():
        return {
            "status": "ok",
            "environment": settings.ENVIRONMENT,
            "version": "0.1.0",
        }

    return app


app = create_app()
