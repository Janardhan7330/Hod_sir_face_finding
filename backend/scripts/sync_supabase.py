import asyncio
import hashlib
import json
import logging
import os
import sys
from datetime import UTC, datetime
from pathlib import Path
import httpx
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import async_session_maker
from app.models.person import Person, ConsentStatus
from app.models.embedding import FaceEmbedding
from app.cv.pipeline import cv_pipeline
from sqlalchemy import select

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("supabase_sync")


async def download_image(client: httpx.AsyncClient, url: str) -> bytes | None:
    try:
        resp = await client.get(url, timeout=15.0)
        if resp.status_code == 200:
            return resp.content
        return None
    except Exception:
        return None


async def sync_one_student(student: dict, client: httpx.AsyncClient, temp_dir: Path) -> bool:
    roll_number = str(student.get("roll_number", "")).strip()
    name = str(student.get("name", "")).strip()
    image_url = student.get("face_image_url")

    if not roll_number or not name or not image_url:
        return False

    year_val = None
    try:
        if student.get("year"):
            year_val = int(student.get("year"))
    except (ValueError, TypeError):
        pass

    notes = f"Section: {student.get('section', 'N/A')}, Semester: {student.get('semester', 'N/A')}"

    async with async_session_maker() as db:
        try:
            # Check if person exists
            stmt = select(Person).where(Person.participant_id == roll_number)
            res = await db.execute(stmt)
            person = res.scalar_one_or_none()

            if not person:
                person = Person(
                    participant_id=roll_number,
                    display_name=name,
                    college_id=roll_number,
                    department=student.get("branch", "AI"),
                    year=year_val,
                    notes=notes,
                    consent_status=ConsentStatus.GRANTED,
                    consent_date=datetime.now(UTC),
                )
                db.add(person)
                await db.commit()
                await db.refresh(person)
            else:
                person.display_name = name
                person.department = student.get("branch", "AI")
                person.year = year_val
                person.notes = notes
                person.consent_status = ConsentStatus.GRANTED
                await db.commit()

            # Check if embedding already exists
            emb_stmt = select(FaceEmbedding).where(FaceEmbedding.person_id == person.id)
            emb_res = await db.execute(emb_stmt)
            if emb_res.scalar_one_or_none():
                return True

            # Download photo
            img_bytes = await download_image(client, image_url)
            if not img_bytes:
                return False

            image_hash = hashlib.sha256(img_bytes).hexdigest()
            temp_file = temp_dir / f"{roll_number}.jpg"
            temp_file.write_bytes(img_bytes)

            try:
                cv_res = cv_pipeline.process_image(str(temp_file))
                if cv_res["faces_detected"] == 0:
                    logger.warning(f"No face detected in photo for {name} ({roll_number})")
                    return False

                det = cv_res["detections"][0]
                emb = cv_res["embeddings"][0]

                face_embedding = FaceEmbedding(
                    person_id=person.id,
                    embedding=emb.to_list(),
                    model_name="buffalo_l",
                    model_version="1.0",
                    quality_score=det.detection_score,
                    source_image_hash=image_hash,
                )
                db.add(face_embedding)
                await db.commit()
                logger.info(f"Enrolled {name} ({roll_number}) successfully!")
                return True
            finally:
                if temp_file.exists():
                    temp_file.unlink()

        except Exception as e:
            await db.rollback()
            logger.warning(f"Error syncing {name} ({roll_number}): {e}")
            return False


async def main():
    json_path = Path(__file__).parent / "supabase_students.json"
    with open(json_path) as f:
        students = json.load(f)

    logger.info(f"Starting sync for {len(students)} Supabase students...")
    temp_dir = Path("/tmp/supabase_sync_images")
    temp_dir.mkdir(parents=True, exist_ok=True)

    limits = httpx.Limits(max_keepalive_connections=20, max_connections=30)
    async with httpx.AsyncClient(limits=limits, follow_redirects=True) as client:
        success = 0
        failed = 0
        for i, s in enumerate(students, 1):
            ok = await sync_one_student(s, client, temp_dir)
            if ok:
                success += 1
            else:
                failed += 1
            if i % 25 == 0 or i == len(students):
                logger.info(f"Progress: [{i}/{len(students)}] - Enrolled: {success}, Skipped: {failed}")

        logger.info(f"Sync complete! Total Enrolled: {success}, Skipped: {failed}")


if __name__ == "__main__":
    asyncio.run(main())
