import time
from typing import Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.cv.pipeline import cv_pipeline
from app.models.person import Person
from app.models.recognition import RecognitionEvent, RecognitionResult, ResultType
from app.services.matching_service import matching_service


class RecognitionService:
    async def recognize(
        self,
        db: AsyncSession,
        image_path: str,
        image_hash: str,
        user_id: str,
    ) -> dict:
        start_time = time.perf_counter()

        pipeline_result = cv_pipeline.process_image(image_path)

        detections = pipeline_result["detections"]
        embeddings = pipeline_result["embeddings"]

        face_results = []
        matched_count = 0
        unknown_count = 0
        review_count = 0

        for i, (detection, embedding) in enumerate(zip(detections, embeddings)):
            matches = await matching_service.match_embedding(db, embedding.vector)

            if matches:
                best_person_id, best_similarity, _ = matches[0]
                result_type, is_matched = matching_service.evaluate_match(best_similarity)

                if result_type == "matched":
                    matched_count += 1
                else:
                    unknown_count += 1
                    best_person_id = None
            else:
                best_person_id = None
                best_similarity = 0.0
                result_type = "unknown"
                unknown_count += 1

            face_result = RecognitionResult(
                face_id=i + 1,
                bbox_x=detection.bbox.x,
                bbox_y=detection.bbox.y,
                bbox_width=detection.bbox.width,
                bbox_height=detection.bbox.height,
                person_id=best_person_id,
                similarity_score=best_similarity,
                result_type=ResultType(result_type),
                detection_confidence=detection.detection_score,
            )
            face_results.append(face_result)

        event = RecognitionEvent(
            image_hash=image_hash,
            image_width=pipeline_result["image_width"],
            image_height=pipeline_result["image_height"],
            faces_detected=len(detections),
            faces_matched=matched_count,
            faces_unknown=unknown_count,
            faces_review=review_count,
            processing_time_ms=int((time.perf_counter() - start_time) * 1000),
            detector_model=cv_pipeline.detector.get_model_name(),
            embedder_model=cv_pipeline.embedder.get_model_name(),
            match_threshold=matching_service.match_threshold,
            review_threshold=matching_service.review_threshold,
            created_by=user_id,
        )
        db.add(event)
        await db.flush()

        for fr in face_results:
            fr.recognition_event_id = event.id
            db.add(fr)

        await db.commit()

        person_ids = [fr.person_id for fr in face_results if fr.person_id and fr.result_type != ResultType.UNKNOWN]
        person_details: Dict[str, Dict] = {}
        if person_ids:
            result = await db.execute(select(Person).where(Person.id.in_(person_ids)))
            for p in result.scalars().all():
                photo_url = None
                section = None
                semester = None
                clean_notes = p.notes
                if p.notes:
                    try:
                        import json
                        meta = json.loads(p.notes)
                        if isinstance(meta, dict):
                            photo_url = meta.get("photo_url")
                            section = meta.get("section")
                            semester = meta.get("semester")
                            clean_notes = f"Section: {section or 'N/A'}, Semester: {semester or 'N/A'}"
                    except Exception:
                        clean_notes = p.notes

                person_details[str(p.id)] = {
                    "id": str(p.id),
                    "participant_id": p.participant_id,
                    "display_name": p.display_name,
                    "college_id": p.college_id,
                    "department": p.department,
                    "year": p.year,
                    "consent_status": p.consent_status.value,
                    "consent_date": p.consent_date.isoformat() if p.consent_date else None,
                    "notes": clean_notes,
                    "photo_url": photo_url,
                    "section": section,
                    "semester": semester,
                    "created_at": p.created_at.isoformat(),
                    "updated_at": p.updated_at.isoformat(),
                    "embeddings_count": len(p.embeddings),
                }

        results_output = []
        for fr in face_results:
            person = None
            if fr.person_id and fr.result_type != ResultType.UNKNOWN:
                person = person_details.get(str(fr.person_id))

            results_output.append({
                "face_id": fr.face_id,
                "bbox": {
                    "x": fr.bbox_x,
                    "y": fr.bbox_y,
                    "width": fr.bbox_width,
                    "height": fr.bbox_height,
                },
                "status": fr.result_type.value,
                "person": person,
                "similarity": fr.similarity_score,
            })

        return {
            "event_id": str(event.id),
            "processing_time_ms": event.processing_time_ms,
            "image_width": event.image_width,
            "image_height": event.image_height,
            "faces_detected": event.faces_detected,
            "faces_matched": matched_count,
            "faces_unknown": unknown_count,
            "faces_review": review_count,
            "results": results_output,
        }


recognition_service = RecognitionService()
