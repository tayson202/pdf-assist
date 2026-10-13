"""
Common Pydantic Schemas
Generic response wrappers, health checks, and pagination metadata.
"""

from datetime import datetime, timezone
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class HealthResponse(BaseModel):
    """System health check payload."""
    status: str = Field(..., json_schema_extra={"example": "ok"})
    app_name: str = Field(..., json_schema_extra={"example": "AI PDF Assistant API"})
    environment: str = Field(..., json_schema_extra={"example": "development"})
    database_connected: bool = Field(..., json_schema_extra={"example": True})
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ErrorDetail(BaseModel):
    """Standardized error response payload."""
    detail: str
    code: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic pagination wrapper."""
    total: int
    skip: int
    limit: int
    items: List[T]
