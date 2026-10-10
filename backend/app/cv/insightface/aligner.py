import cv2
import numpy as np
from insightface.utils import face_align
from app.cv.interfaces import FaceAligner


class InsightFaceAligner(FaceAligner):
    def __init__(self, output_size: int = 112):
        self.output_size = output_size

    def align(self, image: np.ndarray, landmarks: np.ndarray) -> np.ndarray:
        if landmarks is None or len(landmarks) < 5:
            return cv2.resize(image, (self.output_size, self.output_size))

        try:
            aligned = face_align.norm_crop(image, landmark=landmarks, image_size=self.output_size)
            return aligned
        except Exception:
            return cv2.resize(image, (self.output_size, self.output_size))
