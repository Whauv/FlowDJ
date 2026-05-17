from fastapi import APIRouter
from .tracks import router as tracks_router
from .session import router as session_router
from .recommendations import router as recommendations_router
from .keyboard import router as keyboard_router
from .analytics import router as analytics_router

router = APIRouter()
router.include_router(tracks_router)
router.include_router(session_router)
router.include_router(recommendations_router)
router.include_router(keyboard_router)
router.include_router(analytics_router)
