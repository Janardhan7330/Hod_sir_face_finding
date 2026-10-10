import time
import numpy as np
import cv2
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.cv.pipeline import cv_pipeline


def generate_test_image(width: int = 640, height: int = 480) -> np.ndarray:
    image = np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)
    return image


def benchmark_detection(iterations: int = 10):
    print(f"Benchmarking face detection ({iterations} iterations)...")

    image = generate_test_image(640, 480)
    cv2.imwrite("/tmp/test_image.jpg", image)

    times = []
    for i in range(iterations):
        start = time.perf_counter()
        detections = cv_pipeline.detect_faces(image)
        elapsed = (time.perf_counter() - start) * 1000
        times.append(elapsed)
        print(f"  Iteration {i+1}: {elapsed:.2f}ms, {len(detections)} faces")

    print(f"\n  Average: {np.mean(times):.2f}ms")
    print(f"  Min: {np.min(times):.2f}ms")
    print(f"  Max: {np.max(times):.2f}ms")
    print(f"  Std: {np.std(times):.2f}ms")


def benchmark_full_pipeline(iterations: int = 5):
    print(f"\nBenchmarking full pipeline ({iterations} iterations)...")

    image = generate_test_image(640, 480)
    cv2.imwrite("/tmp/test_image.jpg", image)

    times = []
    for i in range(iterations):
        start = time.perf_counter()
        result = cv_pipeline.process_image("/tmp/test_image.jpg")
        elapsed = (time.perf_counter() - start) * 1000
        times.append(elapsed)
        print(f"  Iteration {i+1}: {elapsed:.2f}ms, {result['faces_detected']} faces, {len(result['embeddings'])} embeddings")

    print(f"\n  Average: {np.mean(times):.2f}ms")
    print(f"  Min: {np.min(times):.2f}ms")
    print(f"  Max: {np.max(times):.2f}ms")
    print(f"  Std: {np.std(times):.2f}ms")


if __name__ == "__main__":
    print("Face Recognition Lab - CV Benchmark")
    print("=" * 40)

    try:
        benchmark_detection(10)
        benchmark_full_pipeline(5)
    except Exception as e:
        print(f"Benchmark failed: {e}")
        import traceback
        traceback.print_exc()