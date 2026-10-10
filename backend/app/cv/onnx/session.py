
import onnxruntime as ort
from app.core.config import get_settings


def get_providers() -> list[str]:
    settings = get_settings()
    available = ort.get_available_providers()

    providers = []
    if "CUDAExecutionProvider" in available:
        providers.append("CUDAExecutionProvider")
    if "OpenVINOExecutionProvider" in available:
        providers.append("OpenVINOExecutionProvider")
    providers.append("CPUExecutionProvider")

    return providers


def create_session(model_path: str) -> ort.InferenceSession:
    return ort.InferenceSession(model_path, providers=get_providers())


def run_inference(session: ort.InferenceSession, input_name: str, input_data) -> list:
    return session.run(None, {input_name: input_data})
