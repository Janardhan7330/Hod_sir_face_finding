from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.enrollment import EnrollmentRequest, EnrollmentResponse, ValidateImageResponse
from app.schemas.person import (
    ConsentUpdate,
    EmbeddingResponse,
    PersonCreate,
    PersonListResponse,
    PersonResponse,
    PersonUpdate,
)
from app.schemas.recognition import (
    BoundingBox,
    FaceResult,
    PersonSummary,
    RecognitionDetailResponse,
    RecognitionHistoryResponse,
    RecognitionResponse,
)
from app.schemas.system import HealthResponse, SystemConfig, SystemStats

__all__ = [
    "TokenResponse", "LoginRequest", "RegisterRequest", "UserResponse", "RefreshRequest",
    "PersonCreate", "PersonUpdate", "PersonResponse", "PersonListResponse", "ConsentUpdate", "EmbeddingResponse",
    "EnrollmentRequest", "EnrollmentResponse", "ValidateImageResponse",
    "RecognitionResponse", "RecognitionHistoryResponse", "RecognitionDetailResponse", "FaceResult", "PersonSummary", "BoundingBox",
    "HealthResponse", "SystemStats", "SystemConfig",
]
