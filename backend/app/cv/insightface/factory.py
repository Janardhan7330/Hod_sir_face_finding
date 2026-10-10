from pathlib import Path
import logging

from app.core.config import get_settings
from app.cv.insightface.aligner import InsightFaceAligner
from app.cv.insightface.detector import InsightFaceDetector
from app.cv.insightface.embedder import InsightFaceEmbedder
from app.cv.interfaces import FaceAligner, FaceDetector, FaceEmbedder

logger = logging.getLogger(__name__)


class InsightFaceFactory:
    def __init__(self):
        self._detector = None
        self._embedder = None
        self._aligner = None
        self._model_load_error = None

    def _load_models(self) -> None:
        if self._model_load_error:
            return
        try:
            settings = get_settings()
            candidate_paths = [
                Path(settings.MODEL_PATH) / settings.MODEL_PACK,
                Path(__file__).resolve().parents[4] / "cv" / "models" / settings.MODEL_PACK,
                Path.cwd() / "cv" / "models" / settings.MODEL_PACK,
                Path.cwd().parent / "cv" / "models" / settings.MODEL_PACK,
            ]
            model_path = None
            for p in candidate_paths:
                if (p / "det_10g.onnx").exists():
                    model_path = p
                    break

            if model_path is None:
                raise FileNotFoundError(f"det_10g.onnx not found in candidate paths: {[str(p) for p in candidate_paths]}")

            logger.info(f"Loading InsightFace models from {model_path}")
            self._detector = InsightFaceDetector(str(model_path / "det_10g.onnx"))
            self._embedder = InsightFaceEmbedder(str(model_path / "w600k_r50.onnx"))
            self._aligner = InsightFaceAligner()
            logger.info("InsightFace models loaded successfully!")
        except Exception as e:
            self._model_load_error = e
            logger.warning(f"Failed to load InsightFace models: {e}. Models will be loaded on first use.")

    @property
    def detector(self) -> FaceDetector:
        if self._detector is None and self._model_load_error is None:
            self._load_models()
        if self._detector is None:
            # Return a mock detector for development
            from app.cv.interfaces import FaceDetector
            class MockDetector(FaceDetector):
                def detect(self, image): return []
                def get_model_name(self): return "SCRFD-10GF (mock)"
            return MockDetector()
        return self._detector

    @property
    def embedder(self) -> FaceEmbedder:
        if self._embedder is None and self._model_load_error is None:
            self._load_models()
        if self._embedder is None:
            from app.cv.interfaces import FaceEmbedder
            class MockEmbedder(FaceEmbedder):
                def embed(self, face_image): raise RuntimeError("Model not loaded")
                def embed_batch(self, face_images): raise RuntimeError("Model not loaded")
                def get_model_name(self): return "ResNet50@WebFace600K (mock)"
            return MockEmbedder()
        return self._embedder

    @property
    def aligner(self) -> FaceAligner:
        if self._aligner is None and self._model_load_error is None:
            self._load_models()
        if self._aligner is None:
            self._aligner = InsightFaceAligner()
        return self._aligner


cv_factory = InsightFaceFactory()
