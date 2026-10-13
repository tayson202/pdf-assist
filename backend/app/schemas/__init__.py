"""
Pydantic Schemas Package
"""

from app.schemas.common import HealthResponse, ErrorDetail, PaginatedResponse

__all__ = [
    "HealthResponse",
    "ErrorDetail",
    "PaginatedResponse",
]
