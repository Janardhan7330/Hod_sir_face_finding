from app.api.deps import get_current_user, get_db, require_role
from app.core.config import get_settings
from app.models.embedding import FaceEmbedding
from app.models.person import ConsentStatus, Person
from app.models.recognition import RecognitionEvent
from app.models.user import UserRole
from app.schemas.system import HealthResponse, SystemConfig, SystemStats
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    settings = get_settings()
    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        version="0.1.0",
    )


@router.get("/stats", response_model=SystemStats)
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    people_count = await db.execute(select(func.count(Person.id)).where(Person.deleted_at.is_(None)))
    embeddings_count = await db.execute(select(func.count(FaceEmbedding.id)))
    events_count = await db.execute(select(func.count(RecognitionEvent.id)))
    consent_granted = await db.execute(select(func.count(Person.id)).where(Person.consent_status == ConsentStatus.GRANTED))

    return SystemStats(
        people_count=people_count.scalar(),
        embeddings_count=embeddings_count.scalar(),
        recognition_events_count=events_count.scalar(),
        consent_granted_count=consent_granted.scalar(),
    )


@router.get("/config", response_model=SystemConfig)
async def get_system_config(
    current_user = Depends(require_role(UserRole.ADMIN)),
):
    settings = get_settings()
    return SystemConfig(
        match_threshold=settings.MATCH_THRESHOLD,
        review_threshold=settings.REVIEW_THRESHOLD,
        detection_threshold=settings.DETECTION_THRESHOLD,
        max_faces_per_image=settings.MAX_FACES_PER_IMAGE,
        max_upload_size_mb=settings.MAX_UPLOAD_SIZE_MB,
        model_pack=settings.MODEL_PACK,
        detector_model="SCRFD-10GF",
        embedder_model="ResNet50@WebFace600K",
    )
