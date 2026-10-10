from datetime import UTC, datetime
from typing import List
import hashlib

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError
from app.core.exceptions import ValidationError as ValidationErrorExc
from app.models.embedding import FaceEmbedding
from app.models.person import ConsentStatus, Person
from app.models.user import UserRole
from app.schemas.person import (
    ConsentUpdate,
    DatasetPersonCreate,
    DatasetUploadRequest,
    DatasetUploadResponse,
    EmbeddingResponse,
    PersonCreate,
    PersonListResponse,
    PersonResponse,
    PersonUpdate,
)
from app.services.audit_service import audit_service
from app.services import save_temp_upload, cleanup_temp_file
from app.services.enrollment_service import enrollment_service
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(
    data: PersonCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN)),
):
    existing = await db.execute(select(Person).where(Person.participant_id == data.participant_id))
    if existing.scalar_one_or_none():
        raise ValidationErrorExc("Participant ID already exists")

    person = Person(
        participant_id=data.participant_id,
        display_name=data.display_name,
        college_id=data.college_id,
        department=data.department,
        year=data.year,
        consent_status=ConsentStatus.GRANTED if data.consent_confirmed else ConsentStatus.PENDING,
        consent_date=datetime.now(UTC) if data.consent_confirmed else None,
    )
    db.add(person)
    await db.commit()
    await db.refresh(person)

    await audit_service.log(
        db, user_id=current_user.id, action="person.create", resource_type="person", resource_id=person.id,
        details={"participant_id": person.participant_id, "display_name": person.display_name}
    )

    return PersonResponse(
        id=person.id,
        participant_id=person.participant_id,
        display_name=person.display_name,
        college_id=person.college_id,
        department=person.department,
        year=person.year,
        consent_status=person.consent_status.value,
        consent_date=person.consent_date,
        notes=person.notes,
        created_at=person.created_at,
        updated_at=person.updated_at,
        deleted_at=person.deleted_at,
        embeddings_count=0,
    )


@router.get("", response_model=PersonListResponse)
async def list_people(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    consent_status: str | None = None,
    department: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    query = select(Person).where(Person.deleted_at.is_(None))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Person.display_name.ilike(search_term),
                Person.participant_id.ilike(search_term),
                Person.college_id.ilike(search_term),
            )
        )

    if consent_status:
        query = query.where(Person.consent_status == ConsentStatus(consent_status))

    if department:
        query = query.where(Person.department == department)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    query = query.order_by(Person.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    people = result.scalars().all()

    embeddings_counts = await db.execute(
        select(FaceEmbedding.person_id, func.count(FaceEmbedding.id))
        .where(FaceEmbedding.person_id.in_([p.id for p in people]))
        .group_by(FaceEmbedding.person_id)
    )
    counts = {row[0]: row[1] for row in embeddings_counts.all()}

    items = [
        PersonResponse(
            id=p.id,
            participant_id=p.participant_id,
            display_name=p.display_name,
            college_id=p.college_id,
            department=p.department,
            year=p.year,
            consent_status=p.consent_status.value,
            consent_date=p.consent_date,
            notes=p.notes,
            created_at=p.created_at,
            updated_at=p.updated_at,
            deleted_at=p.deleted_at,
            embeddings_count=counts.get(p.id, 0),
        )
        for p in people
    ]

    return PersonListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/{person_id}", response_model=PersonResponse)
async def get_person(
    person_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    result = await db.execute(select(Person).where(Person.id == person_id, Person.deleted_at.is_(None)))
    person = result.scalar_one_or_none()

    if not person:
        raise NotFoundError("Person", person_id)

    embeddings_result = await db.execute(
        select(func.count(FaceEmbedding.id)).where(FaceEmbedding.person_id == person.id)
    )
    embeddings_count = embeddings_result.scalar()

    return PersonResponse(
        id=person.id,
        participant_id=person.participant_id,
        display_name=person.display_name,
        college_id=person.college_id,
        department=person.department,
        year=person.year,
        consent_status=person.consent_status.value,
        consent_date=person.consent_date,
        notes=person.notes,
        created_at=person.created_at,
        updated_at=person.updated_at,
        deleted_at=person.deleted_at,
        embeddings_count=embeddings_count,
    )


@router.patch("/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: str,
    data: PersonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Person).where(Person.id == person_id, Person.deleted_at.is_(None)))
    person = result.scalar_one_or_none()

    if not person:
        raise NotFoundError("Person", person_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(person, field, value)

    await db.commit()
    await db.refresh(person)

    await audit_service.log(
        db, user_id=current_user.id, action="person.update", resource_type="person", resource_id=person.id,
        details=update_data
    )

    embeddings_result = await db.execute(
        select(func.count(FaceEmbedding.id)).where(FaceEmbedding.person_id == person.id)
    )
    embeddings_count = embeddings_result.scalar()

    return PersonResponse(
        id=person.id,
        participant_id=person.participant_id,
        display_name=person.display_name,
        college_id=person.college_id,
        department=person.department,
        year=person.year,
        consent_status=person.consent_status.value,
        consent_date=person.consent_date,
        notes=person.notes,
        created_at=person.created_at,
        updated_at=person.updated_at,
        deleted_at=person.deleted_at,
        embeddings_count=embeddings_count,
    )


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_person(
    person_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Person).where(Person.id == person_id, Person.deleted_at.is_(None)))
    person = result.scalar_one_or_none()

    if not person:
        raise NotFoundError("Person", person_id)

    person.deleted_at = datetime.now(UTC)
    await db.commit()

    await audit_service.log(
        db, user_id=current_user.id, action="person.delete", resource_type="person", resource_id=person.id,
        details={"participant_id": person.participant_id, "display_name": person.display_name}
    )


@router.post("/{person_id}/consent", response_model=PersonResponse)
async def update_consent(
    person_id: str,
    data: ConsentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(select(Person).where(Person.id == person_id, Person.deleted_at.is_(None)))
    person = result.scalar_one_or_none()

    if not person:
        raise NotFoundError("Person", person_id)

    person.consent_status = ConsentStatus(data.consent_status)
    person.consent_date = datetime.now(UTC) if data.consent_status == "granted" else None
    await db.commit()
    await db.refresh(person)

    await audit_service.log(
        db, user_id=current_user.id, action="person.consent", resource_type="person", resource_id=person.id,
        details={"consent_status": data.consent_status}
    )

    embeddings_result = await db.execute(
        select(func.count(FaceEmbedding.id)).where(FaceEmbedding.person_id == person.id)
    )
    embeddings_count = embeddings_result.scalar()

    return PersonResponse(
        id=person.id,
        participant_id=person.participant_id,
        display_name=person.display_name,
        college_id=person.college_id,
        department=person.department,
        year=person.year,
        consent_status=person.consent_status.value,
        consent_date=person.consent_date,
        notes=person.notes,
        created_at=person.created_at,
        updated_at=person.updated_at,
        deleted_at=person.deleted_at,
        embeddings_count=embeddings_count,
    )


@router.get("/{person_id}/embeddings", response_model=list[EmbeddingResponse])
async def list_embeddings(
    person_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    result = await db.execute(select(Person).where(Person.id == person_id, Person.deleted_at.is_(None)))
    person = result.scalar_one_or_none()

    if not person:
        raise NotFoundError("Person", person_id)

    embeddings_result = await db.execute(
        select(FaceEmbedding).where(FaceEmbedding.person_id == person.id).order_by(FaceEmbedding.created_at.desc())
    )
    embeddings = embeddings_result.scalars().all()

    return [EmbeddingResponse.model_validate(e) for e in embeddings]


@router.delete("/{person_id}/embeddings/{embedding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_embedding(
    person_id: str,
    embedding_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN)),
):
    result = await db.execute(
        select(FaceEmbedding).where(FaceEmbedding.id == embedding_id, FaceEmbedding.person_id == person_id)
    )
    embedding = result.scalar_one_or_none()

    if not embedding:
        raise NotFoundError("Embedding", embedding_id)

    await db.delete(embedding)
    await db.commit()

    await audit_service.log(
        db, user_id=current_user.id, action="embedding.delete", resource_type="embedding", resource_id=embedding.id
    )


@router.post("/dataset/upload", response_model=DatasetUploadResponse)
async def upload_dataset(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN)),
    dataset_json: str = Form(...),
    images: List[UploadFile] = File(...),
):
    """Upload a dataset of persons with their images and details.
    
    Expects:
    - dataset_json: JSON string with list of persons (participant_id, display_name, college_id, department, year, consent_confirmed)
    - images: List of image files, one per person (or multiple per person if named with participant_id prefix)
    """
    import json
    
    try:
        dataset = json.loads(dataset_json)
        persons_data = [DatasetPersonCreate(**p) for p in dataset.get("persons", [])]
    except Exception as e:
        raise ValidationErrorExc(f"Invalid dataset JSON: {str(e)}")
    
    if not persons_data:
        raise ValidationErrorExc("No persons provided in dataset")
    
    if len(persons_data) > 50:
        raise ValidationErrorExc("Maximum 50 persons allowed per dataset upload")
    
    # Group images by participant_id (assuming filename starts with participant_id)
    images_by_person = {}
    unmatched_images = []
    
    for img in images:
        filename = img.filename or ""
        # Try to extract participant_id from filename (e.g., "STU-2024-001_1.jpg")
        person_id = None
        for p in persons_data:
            if filename.startswith(p.participant_id):
                person_id = p.participant_id
                break
        
        content = await img.read()
        if person_id:
            if person_id not in images_by_person:
                images_by_person[person_id] = []
            images_by_person[person_id].append((filename, content))
        else:
            unmatched_images.append((filename, content))
            
    # Fallback logic for unmatched images
    if unmatched_images:
        if len(persons_data) == 1:
            # If there's only one person, assign all unmatched images to them
            pid = persons_data[0].participant_id
            if pid not in images_by_person:
                images_by_person[pid] = []
            images_by_person[pid].extend(unmatched_images)
        elif len(persons_data) == len(images) and len(unmatched_images) == len(images):
            # If the number of images matches the number of persons and NONE matched, map them sequentially 1-to-1
            for i, p in enumerate(persons_data):
                pid = p.participant_id
                if pid not in images_by_person:
                    images_by_person[pid] = []
                images_by_person[pid].append(unmatched_images[i])
    
    successful = 0
    failed = 0
    warnings = []
    created_persons = []
    
    for person_data in persons_data:
        person_images = images_by_person.get(person_data.participant_id, [])
        
        if not person_images:
            warnings.append(f"No images found for {person_data.participant_id} ({person_data.display_name})")
            failed += 1
            continue
        
        try:
            # Check if person already exists
            existing = await db.execute(
                select(Person).where(Person.participant_id == person_data.participant_id, Person.deleted_at.is_(None))
            )
            if existing.scalar_one_or_none():
                warnings.append(f"Person {person_data.participant_id} already exists, skipping")
                failed += 1
                continue
            
            # Create person
            person = Person(
                participant_id=person_data.participant_id,
                display_name=person_data.display_name,
                college_id=person_data.college_id,
                department=person_data.department,
                year=person_data.year,
                consent_status=ConsentStatus.GRANTED if person_data.consent_confirmed else ConsentStatus.PENDING,
                consent_date=datetime.now(UTC) if person_data.consent_confirmed else None,
            )
            db.add(person)
            await db.flush()
            
            # Process each image for this person
            embeddings_created = 0
            for filename, content in person_images:
                image_hash = hashlib.sha256(content).hexdigest()
                file_path = await save_temp_upload(content, filename)
                
                try:
                    result = await enrollment_service.process_enrollment_image(
                        db, str(person.id), file_path, image_hash
                    )
                    embeddings_created += result["embeddings_created"]
                    warnings.extend(result["warnings"])
                finally:
                    await cleanup_temp_file(file_path)
            
            if embeddings_created == 0:
                warnings.append(f"No valid faces found for {person_data.participant_id}")
                failed += 1
                # Delete the person since no embeddings were created
                await db.delete(person)
            else:
                await db.commit()
                await audit_service.log(
                    db, user_id=current_user.id, action="dataset.person_enroll", 
                    resource_type="person", resource_id=person.id,
                    details={"participant_id": person.participant_id, "embeddings_created": embeddings_created}
                )
                created_persons.append({
                    "id": str(person.id),
                    "participant_id": person.participant_id,
                    "display_name": person.display_name,
                    "embeddings_created": embeddings_created
                })
                successful += 1
                
        except Exception as e:
            await db.rollback()
            warnings.append(f"Failed to enroll {person_data.participant_id}: {str(e)}")
            failed += 1
    
    return DatasetUploadResponse(
        total_persons=len(persons_data),
        successful_enrollments=successful,
        failed_enrollments=failed,
        warnings=warnings,
        created_persons=created_persons,
    )
