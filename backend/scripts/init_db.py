import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.core.config import get_settings


async def init_db():
    settings = get_settings()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select

    async with AsyncSession(engine) as db:
        result = await db.execute(select(User).where(User.email == "admin@face-lab.local"))
        admin = result.scalar_one_or_none()

        if not admin:
            admin = User(
                email="admin@face-lab.local",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
            )
            db.add(admin)
            await db.commit()
            print("Created admin user: admin@face-lab.local / admin123")
        else:
            print("Admin user already exists")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init_db())