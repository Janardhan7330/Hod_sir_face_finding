import time
from typing import Any

import cv2
import numpy as np
from app.core.config import get_settings
from app.cv.insightface.factory import cv_factory
from app.cv.interfaces import FaceDetection, FaceEmbedding


class CVPipeline:
    def __init__(self):
        self.settings = get_settings()
        self.detector = cv_factory.detector
        self.embedder = cv_factory.embedder
        self.aligner = cv_factory.aligner

    def detect_faces(self, image: np.ndarray) -> list[FaceDetection]:
        return self.detector.detect(image)

    def extract_embeddings(self, image: np.ndarray, detections: list[FaceDetection]) -> list[FaceEmbedding]:
        if not detections:
            return []

        face_crops = []
        for det in detections:
            aligned = self._crop_and_align(image, det)
            face_crops.append(aligned)

        return self.embedder.embed_batch(face_crops)

    def _crop_and_align(self, image: np.ndarray, detection: FaceDetection) -> np.ndarray:
        if detection.landmarks is not None and len(detection.landmarks) >= 5:
            return self.aligner.align(image, detection.landmarks)

        x, y, w, h = detection.bbox.x, detection.bbox.y, detection.bbox.width, detection.bbox.height
        padding = 0.2
        x1 = max(0, int(x - w * padding))
        y1 = max(0, int(y - h * padding))
        x2 = min(image.shape[1], int(x + w * (1 + padding)))
        y2 = min(image.shape[0], int(y + h * (1 + padding)))
        face_crop = image[y1:y2, x1:x2]
        return cv2.resize(face_crop, (112, 112))

    def process_image(self, image_path: str) -> dict[str, Any]:
        start_time = time.perf_counter()

        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")

        h, w = image.shape[:2]

        detections = self.detect_faces(image)
        embeddings = self.extract_embeddings(image, detections)

        processing_time = int((time.perf_counter() - start_time) * 1000)

        return {
            "image_width": w,
            "image_height": h,
            "faces_detected": len(detections),
            "detections": detections,
            "embeddings": embeddings,
            "processing_time_ms": processing_time,
        }


cv_pipeline = CVPipeline()
