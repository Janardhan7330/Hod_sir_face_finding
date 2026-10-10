import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class PersonDetail(BaseModel):
    id: uuid.UUID
    participant_id: str
    display_name: str
    college_id: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    consent_status: str
    consent_date: Optional[datetime] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    section: Optional[str] = None
    semester: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    embeddings_count: int = 0


class PersonSummary(BaseModel):
    id: uuid.UUID
    display_name: str
    department: Optional[str] = None
    year: Optional[int] = None


class FaceResult(BaseModel):
    face_id: int
    bbox: BoundingBox
    status: str
    person: Optional[PersonDetail] = None
    similarity: float


class RecognitionResponse(BaseModel):
    event_id: uuid.UUID
    processing_time_ms: int
    image_width: int
    image_height: int
    faces_detected: int
    faces_matched: int
    faces_unknown: int
    faces_review: int
    results: list[FaceResult]


class RecognitionEventSummary(BaseModel):
    id: uuid.UUID
    image_hash: str
    faces_detected: int
    faces_matched: int
    faces_unknown: int
    faces_review: int
    processing_time_ms: int
    created_at: datetime
    matched_names: Optional[list[str]] = None

    class Config:
        from_attributes = True


class RecognitionHistoryResponse(BaseModel):
    items: list[RecognitionEventSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class RecognitionDetailResponse(BaseModel):
    event_id: uuid.UUID
    image_hash: str
    image_width: int
    image_height: int
    faces_detected: int
    faces_matched: int
    faces_unknown: int
    faces_review: int
    processing_time_ms: int
    created_at: datetime
    results: list[FaceResult]

    class Config:
        from_attributes = True
