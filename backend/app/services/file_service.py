import uuid
from pathlib import Path

import aiofiles

from app.core.config import get_settings

settings = get_settings()

UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


async def save_temp_upload(content: bytes, original_filename: str) -> Path:
    if len(content) > MAX_FILE_SIZE:
        raise ValueError(f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit")

    ext = Path(original_filename).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise ValueError("Invalid file extension. Allowed: .jpg, .jpeg, .png, .webp")

    mime_type = _detect_mime_type(content)
    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValueError(f"Invalid file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}")

    filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / filename

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return file_path


async def cleanup_temp_file(file_path: Path) -> None:
    try:
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass


def _detect_mime_type(content: bytes) -> str:
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    elif content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    elif content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return "image/webp"
    return "application/octet-stream"
