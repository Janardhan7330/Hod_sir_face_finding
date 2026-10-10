import hashlib

from app.api.deps import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError
from app.core.exceptions import ValidationError as ValidationErrorExc
from app.models.person import Person
from app.models.user import UserRole
from app.schemas.enrollment import EnrollmentResponse, ValidateImageResponse
from app.services.audit_service import audit_service
from app.services.enrollment_service import enrollment_service
from app.services import save_temp_upload, cleanup_temp_file
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("", response_model=EnrollmentResponse)
async def enroll_person(
    person_id: str = Form(...),
    consent_confirmed: bool = Form(True),
    images: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(UserRole.ADMIN)),
):
    if not images:
        raise ValidationErrorExc("At least one image is required")

    if len(images) > 5:
        raise ValidationErrorExc("Maximum 5 images allowed per enrollment")

    result = await db.execute(select(Person).where(Person.id == person_id, Person.deleted_at.is_(None)))
    person = result.scalar_one_or_none()

    if not person:
        raise NotFoundError("Person", person_id)

    if person.consent_status.value != "granted":
        raise ValidationErrorExc("Person must have granted consent before enrollment")

    embeddings_created = 0
    warnings = []

    for image in images:
        try:
            content = await image.read()
            image_hash = hashlib.sha256(content).hexdigest()

            file_path = await save_temp_upload(content, image.filename)

            result = await enrollment_service.process_enrollment_image(
                db, person_id, file_path, image_hash
            )
            embeddings_created += result["embeddings_created"]
            warnings.extend(result["warnings"])

        except Exception as e:
            warnings.append(f"Failed to process {image.filename}: {str(e)}")
        finally:
            await cleanup_temp_file(file_path)

    await audit_service.log(
        db, user_id=current_user.id, action="enrollment.create", resource_type="person", resource_id=person.id,
        details={"embeddings_created": embeddings_created, "images_count": len(images), "warnings": warnings}
    )

    return EnrollmentResponse(
        embeddings_created=embeddings_created,
        warnings=warnings,
        person_id=person.id,
    )


@router.post("/validate", response_model=ValidateImageResponse)
async def validate_enrollment_image(
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        content = await image.read()
        file_path = await save_temp_upload(content, image.filename)

        result = await enrollment_service.validate_image(file_path)

        await cleanup_temp_file(file_path)

        return ValidateImageResponse(**result)

    except Exception as e:
        raise ValidationErrorExc(f"Validation failed: {str(e)}")
