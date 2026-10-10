from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    environment: str
    version: str


class SystemStats(BaseModel):
    people_count: int
    embeddings_count: int
    recognition_events_count: int
    consent_granted_count: int


class SystemConfig(BaseModel):
    match_threshold: float
    review_threshold: float
    detection_threshold: float
    max_faces_per_image: int
    max_upload_size_mb: int
    model_pack: str
    detector_model: str
    embedder_model: str
