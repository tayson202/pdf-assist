"""
Document Upload, Processing & Management Tests
"""

import io
import pytest
from httpx import AsyncClient
import fitz  # PyMuPDF


def create_sample_pdf_bytes(title: str = "Test Document", num_pages: int = 3) -> bytes:
    """Generates valid in-memory PDF bytes with text on each page."""
    doc = fitz.open()
    for i in range(num_pages):
        page = doc.new_page(width=595, height=842)
        page.insert_text(
            (50, 72),
            f"{title} - Page {i+1}\n\nThis is paragraph text describing section {i+1} of the document.\n"
            f"It covers quarterly revenue metrics, risk governance, and key performance indicators.\n"
            f"Revenue increased by 15% and cloud adoption reached 92% this quarter.",
            fontsize=12,
        )
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


@pytest.mark.asyncio
async def test_upload_pdf_success(async_client: AsyncClient):
    # Register & Login
    await async_client.post("/api/v1/auth/register", json={"email": "doc@test.com", "password": "Password123!"})
    login_res = await async_client.post("/api/v1/auth/login", json={"email": "doc@test.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    pdf_bytes = create_sample_pdf_bytes("Financial Report", 2)
    files = {"file": ("report.pdf", pdf_bytes, "application/pdf")}

    response = await async_client.post("/api/v1/documents", headers=headers, files=files)
    assert response.status_code == 202
    data = response.json()
    assert data["original_filename"] == "report.pdf"
    assert "id" in data
    assert data["file_size"] > 0


@pytest.mark.asyncio
async def test_upload_invalid_file_rejected(async_client: AsyncClient):
    await async_client.post("/api/v1/auth/register", json={"email": "inv@test.com", "password": "Password123!"})
    login_res = await async_client.post("/api/v1/auth/login", json={"email": "inv@test.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload text file instead of PDF
    files = {"file": ("malicious.txt", b"plain text content", "text/plain")}
    response = await async_client.post("/api/v1/documents", headers=headers, files=files)
    assert response.status_code == 400
    assert "Invalid file format" in response.json()["detail"]


@pytest.mark.asyncio
async def test_list_and_rename_document(async_client: AsyncClient):
    await async_client.post("/api/v1/auth/register", json={"email": "list@test.com", "password": "Password123!"})
    login_res = await async_client.post("/api/v1/auth/login", json={"email": "list@test.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload document
    pdf_bytes = create_sample_pdf_bytes("Doc One", 1)
    files = {"file": ("doc_one.pdf", pdf_bytes, "application/pdf")}
    up_res = await async_client.post("/api/v1/documents", headers=headers, files=files)
    doc_id = up_res.json()["id"]

    # List documents
    list_res = await async_client.get("/api/v1/documents", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # Rename document
    patch_res = await async_client.patch(
        f"/api/v1/documents/{doc_id}",
        headers=headers,
        json={"original_filename": "renamed_doc.pdf"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["original_filename"] == "renamed_doc.pdf"


@pytest.mark.asyncio
async def test_cross_tenant_isolation(async_client: AsyncClient):
    # User A uploads a doc
    await async_client.post("/api/v1/auth/register", json={"email": "usera@test.com", "password": "Password123!"})
    login_a = await async_client.post("/api/v1/auth/login", json={"email": "usera@test.com", "password": "Password123!"})
    token_a = login_a.json()["access_token"]

    pdf_bytes = create_sample_pdf_bytes("Private Doc", 1)
    files = {"file": ("private.pdf", pdf_bytes, "application/pdf")}
    up_res = await async_client.post("/api/v1/documents", headers={"Authorization": f"Bearer {token_a}"}, files=files)
    doc_id = up_res.json()["id"]

    # User B tries to access User A's document
    await async_client.post("/api/v1/auth/register", json={"email": "userb@test.com", "password": "Password123!"})
    login_b = await async_client.post("/api/v1/auth/login", json={"email": "userb@test.com", "password": "Password123!"})
    token_b = login_b.json()["access_token"]

    forbidden_res = await async_client.get(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert forbidden_res.status_code == 404  # Not found or access denied
