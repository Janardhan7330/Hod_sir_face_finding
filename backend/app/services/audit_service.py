from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


class AuditService:
    async def log(
        self,
        db: AsyncSession,
        user_id: str = None,
        action: str = "",
        resource_type: str = None,
        resource_id: str = None,
        details: dict[str, Any] = None,
        ip_address: str = None,
        user_agent: str = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log)
        await db.flush()
        return log


audit_service = AuditService()
