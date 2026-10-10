import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class PersonBase(BaseModel):
    participant_id: str = Field(..., min_length=1, max_length=64)
    display_name: str = Field(..., min_length=1, max_length=128)
    college_id: str | None = Field(None, max_length=64)
    department: str | None = Field(None, max_length=128)
    year: int | None = Field(None, ge=1, le=10)


class PersonCreate(PersonBase):
    consent_confirmed: bool = False


class PersonUpdate(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=128)
    college_id: str | None = Field(None, max_length=64)
    department: str | None = Field(None, max_length=128)
    year: int | None = Field(None, ge=1, le=10)
    notes: str | None = None


class PersonResponse(PersonBase):
    id: uuid.UUID
    consent_status: str
    consent_date: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    embeddings_count: int = 0

    class Config:
        from_attributes = True


class PersonListResponse(BaseModel):
    items: list[PersonResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ConsentUpdate(BaseModel):
    consent_status: str = Field(..., pattern="^(granted|withdrawn)$")


class EmbeddingResponse(BaseModel):
    id: uuid.UUID
    model_name: str
    model_version: str
    quality_score: float | None
    created_at: datetime

    class Config:
        from_attributes = True


# Dataset upload schemas
class DatasetPersonCreate(BaseModel):
    participant_id: str = Field(..., min_length=1, max_length=64)
    display_name: str = Field(..., min_length=1, max_length=128)
    college_id: Optional[str] = Field(None, max_length=64)
    department: Optional[str] = Field(None, max_length=128)
    year: Optional[int] = Field(None, ge=1, le=10)
    consent_confirmed: bool = True


class DatasetUploadRequest(BaseModel):
    persons: List[DatasetPersonCreate]


class DatasetUploadResponse(BaseModel):
    total_persons: int
    successful_enrollments: int
    failed_enrollments: int
    warnings: List[str]
    created_persons: List[dict]
