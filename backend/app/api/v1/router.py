"""
API v1 Router Aggregator
Mounts all v1 domain routers.
"""

from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.documents import router as documents_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.chat import router as chat_router

api_v1_router = APIRouter()

# Mount all domain routers
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(documents_router)
api_v1_router.include_router(conversations_router)
api_v1_router.include_router(chat_router)
