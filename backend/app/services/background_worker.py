"""
Background Worker Service
Asynchronous pipeline for PDF parsing, chunking, embedding, and vector indexing.
"""

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_factory
from app.models.document import Document, ProcessingStatus
from app.services.storage_service import storage_service
from app.services.pdf_extractor import pdf_extractor
from app.services.text_chunker import text_chunker
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store
import logging

logger = logging.getLogger(__name__)


async def process_document_pipeline(document_id: uuid.UUID, db: AsyncSession = None):
    """
    Background worker job executing end-to-end extraction and vector indexing.
    Runs in background task or Celery worker.
    """
    logger.info("Starting processing pipeline for document %s", document_id)

    if db is not None:
        await _execute_pipeline(document_id, db)
    else:
        async with async_session_factory() as session:
            await _execute_pipeline(document_id, session)


async def _execute_pipeline(document_id: uuid.UUID, db: AsyncSession):
        try:
            # 1. Fetch document record
            result = await db.execute(select(Document).where(Document.id == document_id))
            document = result.scalar_one_or_none()
            if not document:
                logger.error("Document %s not found in database.", document_id)
                return

            document.processing_status = ProcessingStatus.PROCESSING
            await db.commit()

            # 2. Retrieve file bytes from storage
            pdf_bytes = await storage_service.get_file(document.storage_key)
            if not pdf_bytes:
                document.processing_status = ProcessingStatus.FAILED
                document.processing_error = "File could not be retrieved from object storage."
                await db.commit()
                return

            # 3. Extract text per page & check OCR guard
            extraction = pdf_extractor.extract_text_from_bytes(pdf_bytes)
            if not extraction.is_valid:
                document.processing_status = ProcessingStatus.FAILED
                document.processing_error = extraction.error
                document.page_count = extraction.page_count
                await db.commit()
                logger.warning("Document %s failed extraction: %s", document_id, extraction.error)
                return

            # 4. Update page count
            document.page_count = extraction.page_count

            # 5. Chunk pages into overlapping token windows
            chunks = text_chunker.chunk_document_pages(extraction.pages_text)
            if not chunks:
                document.processing_status = ProcessingStatus.FAILED
                document.processing_error = "No extractable text chunks found in document."
                await db.commit()
                return

            # 6. Generate embeddings in batch
            chunk_texts = [c.content for c in chunks]
            embeddings = await embedding_service.get_embeddings_batch(chunk_texts)

            # 7. Prepare vector records
            chunk_records = []
            for i, chunk in enumerate(chunks):
                chunk_records.append({
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "embedding": embeddings[i],
                })

            # 8. Store in vector database
            await vector_store.save_chunks(db, document.id, chunk_records)

            # 9. Mark status ready
            document.processing_status = ProcessingStatus.READY
            document.processing_error = None
            await db.commit()
            logger.info("Document %s successfully indexed with %d chunks.", document_id, len(chunk_records))

        except Exception as e:
            logger.exception("Unexpected error processing document %s: %s", document_id, e)
            try:
                result = await db.execute(select(Document).where(Document.id == document_id))
                doc = result.scalar_one_or_none()
                if doc:
                    doc.processing_status = ProcessingStatus.FAILED
                    doc.processing_error = f"Internal processing error: {str(e)}"
                    await db.commit()
            except Exception:
                pass
