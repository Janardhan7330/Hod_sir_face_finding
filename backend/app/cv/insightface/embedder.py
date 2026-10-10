from pathlib import Path

import cv2
import numpy as np
from app.core.config import get_settings
from app.cv.interfaces import FaceEmbedder, FaceEmbedding
from app.cv.onnx.session import create_session


class InsightFaceEmbedder(FaceEmbedder):
    def __init__(self, model_path: str = None):
        settings = get_settings()
        self.model_path = model_path or str(Path(settings.MODEL_PATH) / "buffalo_l" / "w600k_r50.onnx")
        self.session = create_session(self.model_path)
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

    def embed(self, face_image: np.ndarray) -> FaceEmbedding:
        return self.embed_batch([face_image])[0]

    def embed_batch(self, face_images: list[np.ndarray]) -> list[FaceEmbedding]:
        if not face_images:
            return []

        batch = np.stack([self._preprocess(img) for img in face_images])
        outputs = self.session.run([self.output_name], {self.input_name: batch})
        embeddings = outputs[0]

        results = []
        for emb in embeddings:
            emb = emb / (np.linalg.norm(emb) + 1e-10)
            results.append(FaceEmbedding(emb.astype(np.float32), self.get_model_name()))

        return results

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        if image.shape[:2] != (112, 112):
            image = cv2.resize(image, (112, 112))

        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = image.astype(np.float32) / 255.0
        image = (image - 0.5) / 0.5
        image = np.transpose(image, (2, 0, 1))
        return image

    def get_model_name(self) -> str:
        return "ResNet50@WebFace600K"
