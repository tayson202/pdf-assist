"""
Document Management Endpoints
Upload, list, inspect, rename, delete, and download PDF documents.
"""

import uuid
from typing import List, Optional
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document, ProcessingStatus
from app.models.document_chunk import DocumentChunk
from app.services.storage_service import storage_service
from app.services.background_worker import process_document_pipeline
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentDetailResponse,
    DocumentUpdateRequest,
    DocumentStatusResponse,
    PageTextResponse,
)
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload PDF Document",
    description="Validates file format, stores in private storage, and schedules background text indexing.",
)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentUploadResponse:
    # 1. Validate file extension and MIME type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files (.pdf) are supported.",
        )

    content = await file.read()
    file_size = len(content)

    # 2. Validate file size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    # 3. Validate PDF magic bytes header (%PDF-)
    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match a valid PDF header.",
        )

    # 4. Generate unique document ID and storage key
    document_id = uuid.uuid4()
    safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._- ")
    storage_key = f"{current_user.id}/{document_id}/{safe_filename}"

    # 5. Persist file bytes in storage
    await storage_service.save_file(content, storage_key)

    # 6. Create document database record
    document = Document(
        id=document_id,
        owner_id=current_user.id,
        original_filename=file.filename,
        storage_key=storage_key,
        file_size=file_size,
        page_count=0,
        processing_status=ProcessingStatus.UPLOADING,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # 7. Schedule background extraction & vector indexing
    background_tasks.add_task(process_document_pipeline, document.id)

    return document


@router.get(
    "",
    response_model=PaginatedResponse[DocumentDetailResponse],
    summary="List Documents",
    description="Returns paginated list of documents owned by the authenticated user.",
)
async def list_documents(
    search: Optional[str] = Query(None, description="Filter by filename"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(Document.owner_id == current_user.id)
    if search:
        query = query.where(Document.original_filename.ilike(f"%{search}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Paginated results
    query = query.order_by(Document.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    documents = result.scalars().all()

    items = []
    for doc in documents:
        item = DocumentDetailResponse.model_validate(doc)
        item.download_url = storage_service.generate_download_url(doc.storage_key)
        items.append(item)

    return PaginatedResponse(total=total, skip=skip, limit=limit, items=items)


@router.get(
    "/{document_id}",
    response_model=DocumentDetailResponse,
    summary="Get Document Details",
)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentDetailResponse:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    response = DocumentDetailResponse.model_validate(doc)
    response.download_url = storage_service.generate_download_url(doc.storage_key)
    return response


@router.patch(
    "/{document_id}",
    response_model=DocumentDetailResponse,
    summary="Rename Document",
)
async def update_document(
    document_id: uuid.UUID,
    payload: DocumentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentDetailResponse:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    doc.original_filename = payload.original_filename
    await db.commit()
    await db.refresh(doc)

    response = DocumentDetailResponse.model_validate(doc)
    response.download_url = storage_service.generate_download_url(doc.storage_key)
    return response


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Document",
)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    storage_key = doc.storage_key

    # Delete database record (cascades to chunks, conversations, messages)
    await db.delete(doc)
    await db.commit()

    # Delete file from storage
    await storage_service.delete_file(storage_key)
    return None


@router.get(
    "/{document_id}/status",
    response_model=DocumentStatusResponse,
    summary="Get Document Processing Status",
)
async def get_document_status(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentStatusResponse:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    return DocumentStatusResponse.model_validate(doc)


@router.get(
    "/{document_id}/pages/{page_number}",
    response_model=PageTextResponse,
    summary="Get Specific Page Content",
)
async def get_page_text(
    document_id: uuid.UUID,
    page_number: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PageTextResponse:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    # Query chunks for this page
    chunks_query = await db.execute(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id, DocumentChunk.page_number == page_number)
        .order_by(DocumentChunk.chunk_index.asc())
    )
    chunks = chunks_query.scalars().all()
    page_content = "\n\n".join(c.content for c in chunks)

    return PageTextResponse(
        document_id=doc.id,
        page_number=page_number,
        total_pages=doc.page_count,
        content=page_content,
    )


@router.get(
    "/download/{storage_key:path}",
    summary="Direct File Download Stream",
)
async def download_file(
    storage_key: str,
    current_user: User = Depends(get_current_user),
):
    # Verify user owns this storage key path (prefix check)
    if not storage_key.startswith(str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to this file resource is forbidden.",
        )

    file_bytes = await storage_service.get_file(storage_key)
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in storage.",
        )

    return Response(
        content=file_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="document.pdf"'},
    )
