"""
Health & Liveness Check Endpoints
"""

from fastapi import APIRouter, status
from app.core.config import settings
from app.core.database import check_db_connection
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Comprehensive Health Check",
    description="Validates API gateway responsiveness and active database connection pool.",
)
async def get_health() -> HealthResponse:
    db_ok = await check_db_connection()
    return HealthResponse(
        status="ok" if db_ok else "degraded",
        app_name=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        database_connected=db_ok,
    )


@router.get(
    "/ping",
    status_code=status.HTTP_200_OK,
    summary="Liveness Probe",
    description="Lightweight ping-pong probe for container orchestrators.",
)
async def ping() -> dict[str, str]:
    return {"status": "pong"}
