import time
import uuid
from collections.abc import Callable

from app.core.logging import get_logger
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        start_time = time.perf_counter()
        request.logger = get_logger("request").bind(request_id=request_id)

        request.logger.info(
            "request_started",
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else None,
        )

        try:
            response = await call_next(request)
            process_time = time.perf_counter() - start_time
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{process_time:.4f}"

            request.logger.info(
                "request_completed",
                status_code=response.status_code,
                process_time_ms=round(process_time * 1000, 2),
            )
            return response
        except Exception as e:
            process_time = time.perf_counter() - start_time
            request.logger.exception(
                "request_failed",
                error=str(e),
                process_time_ms=round(process_time * 1000, 2),
            )
            raise


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_client, requests_per_minute: int = 100):
        super().__init__(app)
        self.redis = redis_client
        self.limit = requests_per_minute

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path.startswith("/api/v1/auth/login"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        key = f"rate_limit:{client_ip}"

        current = await self.redis.incr(key)
        if current == 1:
            await self.redis.expire(key, 60)

        if current > self.limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."},
                headers={"Retry-After": "60"},
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, self.limit - current))
        return response
