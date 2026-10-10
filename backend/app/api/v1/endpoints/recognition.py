import hashlib
from sqlalchemy import func

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError
from app.models.person import Person
from app.models.recognition import RecognitionEvent, RecognitionResult, ResultType
from app.schemas.recognition import (
    BoundingBox,
    FaceResult,
    PersonDetail,
    PersonSummary,
    RecognitionDetailResponse,
    RecognitionEventSummary,
    RecognitionHistoryResponse,
    RecognitionResponse,
)
from app.services import save_temp_upload, cleanup_temp_file
from app.services.audit_service import audit_service
from app.services.recognition_service import recognition_service
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/history", response_model=RecognitionHistoryResponse)
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

    event_ids = [e.id for e in events]
    results_map: dict = {}
    if event_ids:
        r_stmt = (
            select(RecognitionResult.recognition_event_id, Person.display_name, Person.participant_id)
            .join(Person, RecognitionResult.person_id == Person.id, isouter=True)
            .where(
                RecognitionResult.recognition_event_id.in_(event_ids),
                RecognitionResult.result_type == ResultType.MATCHED
            )
        )
        r_rows = await db.execute(r_stmt)
        for event_id, name, roll in r_rows.fetchall():
            if name:
                results_map.setdefault(event_id, []).append(f"{name} ({roll})")

    items = []
    for e in events:
        summary = RecognitionEventSummary.model_validate(e)
        summary.matched_names = results_map.get(e.id, [])
        items.append(summary)

    return RecognitionHistoryResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=RecognitionResponse)
async def recognize_faces(
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    content = await image.read()
    image_hash = hashlib.sha256(content).hexdigest()

    file_path = await save_temp_upload(content, image.filename)

    try:
        result = await recognition_service.recognize(
            db, file_path, image_hash, current_user.id
        )

        await audit_service.log(
            db, user_id=current_user.id, action="recognition.create", resource_type="recognition_event",
            resource_id=result["event_id"], details={
                "faces_detected": result["faces_detected"],
                "faces_matched": result["faces_matched"],
                "faces_unknown": result["faces_unknown"],
                "faces_review": result["faces_review"],
                "processing_time_ms": result["processing_time_ms"],
            }
        )

        return RecognitionResponse(**result)

    finally:
        await cleanup_temp_file(file_path)


@router.get("/{event_id}", response_model=RecognitionDetailResponse)
async def get_recognition_detail(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    result = await db.execute(select(RecognitionEvent).where(RecognitionEvent.id == event_id))
    event = result.scalar_one_or_none()

    if not event:
        raise NotFoundError("RecognitionEvent", event_id)

    results_result = await db.execute(
        select(RecognitionResult).where(RecognitionResult.recognition_event_id == event.id)
    )
    results = results_result.scalars().all()

    face_results = []
    for r in results:
        person = None
        if r.person_id and r.result_type.value != "unknown":
            person_result = await db.execute(select(Person).where(Person.id == r.person_id))
            p = person_result.scalar_one_or_none()
            if p:
                photo_url = None
                section = None
                semester = None
                clean_notes = p.notes
                if p.notes:
                    try:
                        import json
                        meta = json.loads(p.notes)
                        if isinstance(meta, dict):
                            photo_url = meta.get("photo_url")
                            section = meta.get("section")
                            semester = meta.get("semester")
                            clean_notes = f"Section: {section or 'N/A'}, Semester: {semester or 'N/A'}"
                    except Exception:
                        clean_notes = p.notes

                person = PersonDetail(
                    id=p.id,
                    participant_id=p.participant_id,
                    display_name=p.display_name,
                    college_id=p.college_id,
                    department=p.department,
                    year=p.year,
                    consent_status=p.consent_status.value,
                    consent_date=p.consent_date,
                    notes=clean_notes,
                    photo_url=photo_url,
                    section=section,
                    semester=semester,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    embeddings_count=len(p.embeddings) if p.embeddings else 0,
                )

        face_results.append(FaceResult(
            face_id=r.face_id,
            bbox=BoundingBox(x=r.bbox_x, y=r.bbox_y, width=r.bbox_width, height=r.bbox_height),
            status=r.result_type.value,
            person=person,
            similarity=r.similarity_score,
        ))

    return RecognitionDetailResponse(
        event_id=event.id,
        image_hash=event.image_hash,
        image_width=event.image_width,
        image_height=event.image_height,
        faces_detected=event.faces_detected,
        faces_matched=event.faces_matched,
        faces_unknown=event.faces_unknown,
        faces_review=event.faces_review,
        processing_time_ms=event.processing_time_ms,
        created_at=event.created_at,
        results=face_results,
    )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recognition_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    await require_role(UserRole.ADMIN)(current_user)

    result = await db.execute(select(RecognitionEvent).where(RecognitionEvent.id == event_id))
    event = result.scalar_one_or_none()

    if not event:
        raise NotFoundError("RecognitionEvent", event_id)

    await db.delete(event)
    await db.commit()

    await audit_service.log(
        db, user_id=current_user.id, action="recognition.delete", resource_type="recognition_event", resource_id=event.id
    )
