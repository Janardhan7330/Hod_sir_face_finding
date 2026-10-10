FROM python:3.12-slim

WORKDIR /app

# System dependencies for OpenCV, ONNX Runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libgl1 \
    libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# Install UV for fast package management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy application code from backend folder
COPY backend/ .

# Install dependencies
RUN uv sync --frozen --no-dev

# Non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD sh -c "uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
