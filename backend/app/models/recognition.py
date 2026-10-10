from __future__ import annotations
import enum
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.person import Person


class ResultType(str, enum.Enum):
    MATCHED = "matched"
    REVIEW = "review"
    UNKNOWN = "unknown"


class RecognitionEvent(Base):
    __tablename__ = "recognition_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    image_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    image_width: Mapped[int] = mapped_column(Integer, nullable=False)
    image_height: Mapped[int] = mapped_column(Integer, nullable=False)
    faces_detected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    faces_matched: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    faces_unknown: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    faces_review: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processing_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    detector_model: Mapped[str] = mapped_column(String(64), nullable=False)
    embedder_model: Mapped[str] = mapped_column(String(64), nullable=False)
    match_threshold: Mapped[float] = mapped_column(nullable=False)
    review_threshold: Mapped[float] = mapped_column(nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False, index=True
    )

    results: Mapped[list["RecognitionResult"]] = relationship(
        "RecognitionResult", back_populates="event", cascade="all, delete-orphan", lazy="selectin"
    )


class RecognitionResult(Base):
    __tablename__ = "recognition_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recognition_event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recognition_events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    face_id: Mapped[int] = mapped_column(Integer, nullable=False)
    bbox_x: Mapped[int] = mapped_column(Integer, nullable=False)
    bbox_y: Mapped[int] = mapped_column(Integer, nullable=False)
    bbox_width: Mapped[int] = mapped_column(Integer, nullable=False)
    bbox_height: Mapped[int] = mapped_column(Integer, nullable=False)
    person_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("people.id", ondelete="SET NULL"), nullable=True, index=True)
    similarity_score: Mapped[float] = mapped_column(nullable=False)
    result_type: Mapped[ResultType] = mapped_column(
        SQLEnum(ResultType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    detection_confidence: Mapped[Optional[float]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    event: Mapped["RecognitionEvent"] = relationship("RecognitionEvent", back_populates="results")
