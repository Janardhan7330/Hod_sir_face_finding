from sqlalchemy.ext.asyncio import AsyncSession

from app.cv.pipeline import cv_pipeline
from app.models.embedding import FaceEmbedding


class EnrollmentService:
    async def process_enrollment_image(
        self,
        db: AsyncSession,
        person_id: str,
        image_path: str,
        image_hash: str,
    ) -> Dict[str, Any]:
        result = cv_pipeline.process_image(image_path)

        if result["faces_detected"] == 0:
            return {"embeddings_created": 0, "warnings": ["No faces detected in image"]}

        if result["faces_detected"] > 1:
            return {"embeddings_created": 0, "warnings": ["Multiple faces detected. Enrollment requires exactly one face per image."]}

        detection = result["detections"][0]
        embedding = result["embeddings"][0]

        face_embedding = FaceEmbedding(
            person_id=person_id,
            embedding=embedding.to_list(),
            model_name=embedding.model_name,
            model_version="1.0",
            quality_score=detection.detection_score,
            source_image_hash=image_hash,
        )
        db.add(face_embedding)
        await db.flush()

        return {"embeddings_created": 1, "warnings": []}

    async def validate_image(self, image_path: str) -> Dict[str, Any]:
        result = cv_pipeline.process_image(image_path)

        if result["faces_detected"] == 0:
            return {"valid": False, "faces_detected": 0, "message": "No faces detected"}
        elif result["faces_detected"] > 1:
            return {"valid": False, "faces_detected": result["faces_detected"], "message": "Multiple faces detected"}
        else:
            return {"valid": True, "faces_detected": 1, "message": "Valid enrollment image"}


enrollment_service = EnrollmentService()
