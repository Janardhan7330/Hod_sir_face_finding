import os
import sys
import requests
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

MODEL_URLS = {
    "buffalo_l": {
        "det_10g.onnx": "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip",
    }
}


def download_file(url: str, dest: Path):
    print(f"Downloading {url}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()

    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Saved to {dest}")


def main():
    models_dir = Path(__file__).parent.parent / "cv" / "models" / "buffalo_l"
    models_dir.mkdir(parents=True, exist_ok=True)

    for model_name, files in MODEL_URLS.items():
        for filename, url in files.items():
            dest = models_dir / filename
            if dest.exists():
                print(f"{filename} already exists, skipping")
                continue
            try:
                download_file(url, dest)
            except Exception as e:
                print(f"Failed to download {filename}: {e}")

    print("\nNote: InsightFace models will be auto-downloaded on first use via the Python package.")
    print("Run: pip install insightface")
    print("Then the models will be downloaded to ~/.insightface/models/")


if __name__ == "__main__":
    main()