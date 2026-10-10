from pathlib import Path
from typing import Tuple
import cv2
import numpy as np
from insightface.model_zoo import get_model
from app.core.config import get_settings
from app.cv.interfaces import BoundingBox, FaceDetection, FaceDetector


class InsightFaceDetector(FaceDetector):
    def __init__(self, model_path: str = None):
        settings = get_settings()
        self.model_path = model_path or str(Path(settings.MODEL_PATH) / "buffalo_l" / "det_10g.onnx")
        self.detector = get_model(self.model_path)
        self.detector.prepare(ctx_id=-1, input_size=(640, 640))
        self.detection_threshold = settings.DETECTION_THRESHOLD
        self.max_faces = settings.MAX_FACES_PER_IMAGE

    def detect(self, image: np.ndarray) -> list[FaceDetection]:
        if image is None:
            return []

        h, w = image.shape[:2]
        bboxes, kpss = self.detector.detect(image, max_num=self.max_faces, metric='default')

        if bboxes is None or len(bboxes) == 0:
            return []

        detections = []
        for i in range(len(bboxes)):
            bbox_raw = bboxes[i]
            score = float(bbox_raw[4])
            if score < self.detection_threshold:
                continue

            x1 = max(0, min(int(bbox_raw[0]), w - 1))
            y1 = max(0, min(int(bbox_raw[1]), h - 1))
            x2 = max(0, min(int(bbox_raw[2]), w))
            y2 = max(0, min(int(bbox_raw[3]), h))
            bw = max(1, x2 - x1)
            bh = max(1, y2 - y1)

            landmarks = None
            if kpss is not None and len(kpss) > i:
                landmarks = kpss[i].astype(np.float32)

            detections.append(FaceDetection(
                bbox=BoundingBox(x1, y1, bw, bh, score),
                landmarks=landmarks,
                detection_score=score,
            ))

        return detections

    def get_model_name(self) -> str:
        return "SCRFD-10GF"
