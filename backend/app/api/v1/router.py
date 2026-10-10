from app.api.v1.endpoints import auth, enrollment, history, people, recognition, system
from fastapi import APIRouter

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(people.router, prefix="/people", tags=["People"])
api_router.include_router(enrollment.router, prefix="/enrollment", tags=["Enrollment"])
api_router.include_router(recognition.router, prefix="/recognition", tags=["Recognition"])
api_router.include_router(history.router, prefix="/history", tags=["History"])
api_router.include_router(system.router, prefix="/system", tags=["System"])
