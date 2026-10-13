"""
Document Pydantic Schemas
"""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.document import ProcessingStatus


class DocumentUploadResponse(BaseModel):
    id: uuid.UUID
    original_filename: str
    file_size: int
    page_count: int
    processing_status: ProcessingStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetailResponse(BaseModel):
    id: uuid.UUID
    original_filename: str
    file_size: int
    page_count: int
    processing_status: ProcessingStatus
    processing_error: Optional[str] = None
    download_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentUpdateRequest(BaseModel):
    original_filename: str = Field(..., min_length=1, max_length=255)


class DocumentStatusResponse(BaseModel):
    id: uuid.UUID
    processing_status: ProcessingStatus
    processing_error: Optional[str] = None
    page_count: int

    model_config = {"from_attributes": True}


class PageTextResponse(BaseModel):
    document_id: uuid.UUID
    page_number: int
    total_pages: int
    content: str
