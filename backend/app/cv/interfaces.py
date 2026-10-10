from abc import ABC, abstractmethod

import numpy as np


class BoundingBox:
    def __init__(self, x: int, y: int, width: int, height: int, confidence: float = 1.0):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.confidence = confidence

    def to_dict(self):
        return {
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "confidence": self.confidence,
        }


class FaceDetection:
    def __init__(
        self,
        bbox: BoundingBox,
        landmarks: np.ndarray | None = None,
        detection_score: float = 1.0,
    ):
        self.bbox = bbox
        self.landmarks = landmarks
        self.detection_score = detection_score


class FaceEmbedding:
    def __init__(self, vector: np.ndarray, model_name: str = "unknown"):
        self.vector = vector.astype(np.float32)
        self.model_name = model_name

    def to_list(self) -> list[float]:
        return self.vector.tolist()


class FaceDetector(ABC):
    @abstractmethod
    def detect(self, image: np.ndarray) -> list[FaceDetection]:
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        pass


class FaceEmbedder(ABC):
    @abstractmethod
    def embed(self, face_image: np.ndarray) -> FaceEmbedding:
        pass

    @abstractmethod
    def embed_batch(self, face_images: list[np.ndarray]) -> list[FaceEmbedding]:
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        pass


class FaceAligner(ABC):
    @abstractmethod
    def align(self, image: np.ndarray, landmarks: np.ndarray) -> np.ndarray:
        pass


class FaceMatcher(ABC):
    @abstractmethod
    def match(self, embedding: np.ndarray, top_k: int = 5) -> list[tuple[str, float]]:
        pass

    @abstractmethod
    def add_embedding(self, person_id: str, embedding: np.ndarray) -> None:
        pass

    @abstractmethod
    def remove_embedding(self, embedding_id: str) -> None:
        pass
