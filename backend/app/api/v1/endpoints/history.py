from app.api.deps import get_current_user, get_db
from app.models.recognition import RecognitionEvent
from app.schemas.recognition import RecognitionEventSummary, RecognitionHistoryResponse
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=RecognitionHistoryResponse)
async def get_recognition_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    query = select(RecognitionEvent).order_by(RecognitionEvent.created_at.desc())

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    events = result.scalars().all()

    items = [
        RecognitionEventSummary.model_validate(e)
        for e in events
    ]

    return RecognitionHistoryResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )
