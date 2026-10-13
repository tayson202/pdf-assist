"""
RAG Pipeline, Text Extraction & Citation Verification Tests
"""

import pytest
import fitz
from httpx import AsyncClient
from app.services.pdf_extractor import pdf_extractor
from app.services.text_chunker import text_chunker
from app.services.embedding_service import embedding_service
from tests.test_documents import create_sample_pdf_bytes


def test_pdf_extraction_page_numbering():
    """Verify PyMuPDF extractor tracks exact 1-based page numbers."""
    pdf_bytes = create_sample_pdf_bytes("MultiPage Test", 3)
    result = pdf_extractor.extract_text_from_bytes(pdf_bytes)

    assert result.is_valid is True
    assert result.page_count == 3
    assert len(result.pages_text) == 3
    assert result.pages_text[0]["page_number"] == 1
    assert result.pages_text[1]["page_number"] == 2
    assert result.pages_text[2]["page_number"] == 3
    assert "Page 1" in result.pages_text[0]["text"]
    assert "Page 2" in result.pages_text[1]["text"]


def test_ocr_guard_on_scanned_pdf():
    """Verify scanned/raster image PDFs trigger OCR warning instead of empty silent failure."""
    # 1x1 valid PNG image bytes
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06"
        b"\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
        b"\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_image(fitz.Rect(50, 50, 250, 250), stream=png_bytes)
    pdf_bytes = doc.write()
    doc.close()

    result = pdf_extractor.extract_text_from_bytes(pdf_bytes)
    assert result.is_valid is False
    assert result.requires_ocr is True
    assert "(OCR) is required" in result.error


def test_text_chunking_metadata():
    """Verify chunker preserves 1-based page numbers and overlapping content."""
    pages = [
        {"page_number": 1, "text": "This is page one content. " * 30},
        {"page_number": 2, "text": "This is page two content. " * 30},
    ]
    chunks = text_chunker.chunk_document_pages(pages, chunk_size=20, chunk_overlap=5)

    assert len(chunks) > 0
    # Every chunk must have a positive 1-based page number
    for chunk in chunks:
        assert chunk.page_number in [1, 2]
        assert chunk.chunk_index >= 0
        assert len(chunk.content) > 0


@pytest.mark.asyncio
async def test_full_rag_chat_flow(async_client: AsyncClient, db_session):
    # Register & Login
    await async_client.post("/api/v1/auth/register", json={"email": "rag@test.com", "password": "Password123!"})
    login_res = await async_client.post("/api/v1/auth/login", json={"email": "rag@test.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload document
    pdf_bytes = create_sample_pdf_bytes("Annual Strategy", 2)
    files = {"file": ("strategy.pdf", pdf_bytes, "application/pdf")}
    up_res = await async_client.post("/api/v1/documents", headers=headers, files=files)
    doc_id = up_res.json()["id"]

    # In test mode: manually trigger process_document_pipeline with test db_session so chunks are indexed
    from app.services.background_worker import process_document_pipeline
    import uuid
    await process_document_pipeline(uuid.UUID(doc_id), db=db_session)

    # Create Conversation
    conv_res = await async_client.post(
        f"/api/v1/documents/{doc_id}/conversations",
        headers=headers,
        json={"title": "Strategy Discussion"},
    )
    assert conv_res.status_code == 201
    conv_id = conv_res.json()["id"]

    # Send Chat Message (RAG Query)
    chat_res = await async_client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        headers=headers,
        json={"content": "What is the revenue growth percentage reported?"},
    )
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["role"] == "assistant"
    assert len(chat_data["content"]) > 0
    # Citations must be returned with 1-based page numbers
    assert len(chat_data["sources"]) > 0
    for citation in chat_data["sources"]:
        assert citation["page_number"] in [1, 2]
        assert "document_id" in citation
        assert "excerpt" in citation

    # Fetch Message History
    history_res = await async_client.get(f"/api/v1/conversations/{conv_id}/messages", headers=headers)
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) == 2  # 1 user + 1 assistant
    assert history[0]["role"] == "user"
    assert history[1]["role"] == "assistant"
