import uuid

from pydantic import BaseModel


class EnrollmentRequest(BaseModel):
    person_id: uuid.UUID
    consent_confirmed: bool = True


class EnrollmentResponse(BaseModel):
    embeddings_created: int
    warnings: list[str] = []
    person_id: uuid.UUID


class ValidateImageResponse(BaseModel):
    valid: bool
    faces_detected: int
    message: str
