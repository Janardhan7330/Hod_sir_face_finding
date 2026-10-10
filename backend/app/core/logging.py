import logging
import sys
from typing import Any

import structlog
from app.core.config import get_settings


def configure_logging() -> None:
    settings = get_settings()

    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)
    pre_chain = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        timestamper,
    ]

    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            *pre_chain,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if settings.ENVIRONMENT == "production"
            else structlog.dev.ConsoleRenderer(colors=True),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    return structlog.get_logger(name)


class RequestLogger:
    def __init__(self, request_id: str, logger: structlog.BoundLogger):
        self.request_id = request_id
        self.logger = logger.bind(request_id=request_id)

    def info(self, event: str, **kwargs: Any) -> None:
        self.logger.info(event, **kwargs)

    def warning(self, event: str, **kwargs: Any) -> None:
        self.logger.warning(event, **kwargs)

    def error(self, event: str, **kwargs: Any) -> None:
        self.logger.error(event, **kwargs)

    def debug(self, event: str, **kwargs: Any) -> None:
        self.logger.debug(event, **kwargs)
