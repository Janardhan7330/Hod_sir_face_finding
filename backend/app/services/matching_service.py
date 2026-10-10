
import numpy as np
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings


class MatchingService:
    def __init__(self):
        self.settings = get_settings()
        self.match_threshold = self.settings.MATCH_THRESHOLD
        self.review_threshold = self.settings.REVIEW_THRESHOLD

    async def match_embedding(
        self,
        db: AsyncSession,
        embedding: np.ndarray,
        top_k: int = 5,
    ) -> list[tuple[str, float, str]]:
        embedding_str = str(embedding.tolist())

        query = text("""
            SELECT person_id, embedding <=> CAST(:embedding AS vector) AS distance
            FROM face_embeddings
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :top_k
        """)

        result = await db.execute(query, {"embedding": embedding_str, "top_k": top_k})
        matches = result.all()

        results = []
        for person_id, distance in matches:
            similarity = 1.0 - float(distance)
            results.append((str(person_id), similarity, "cosine"))

        return results

    def evaluate_match(self, similarity: float) -> tuple[str, bool]:
        if similarity >= self.review_threshold:
            return "matched", True
        else:
            return "unknown", False


matching_service = MatchingService()
