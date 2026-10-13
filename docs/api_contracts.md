# AI PDF Assistant — API Contracts & Endpoint Specifications

All endpoints are prefixed with `/api/v1`. Authentication uses `Bearer <JWT_TOKEN>` in the `Authorization` header.

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method**: `POST /api/v1/auth/register`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```
- **Response (201 Created)**:
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "user@example.com",
  "created_at": "2026-10-14T00:00:00Z"
}
```
- **Errors**: `400 Bad Request` (Email already registered, weak password).

### 1.2 Login
- **Method**: `POST /api/v1/auth/login`
- **Request Body** (`application/x-www-form-urlencoded` or JSON):
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```
- **Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 86400
}
```
- **Errors**: `401 Unauthorized` (Invalid credentials).

### 1.3 Current User Profile
- **Method**: `GET /api/v1/auth/me`
- **Response (200 OK)**:
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "user@example.com",
  "created_at": "2026-10-14T00:00:00Z"
}
```
- **Errors**: `401 Unauthorized` (Token expired or missing).

---

## 2. Document Endpoints

### 2.1 Upload PDF
- **Method**: `POST /api/v1/documents`
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file` (Binary PDF file)
- **Response (202 Accepted)**:
```json
{
  "id": "7ca64850-25e4-4d89-9944-ff7a63ce7345",
  "original_filename": "Annual_Report_2025.pdf",
  "file_size": 2450800,
  "page_count": 0,
  "processing_status": "processing",
  "created_at": "2026-10-14T00:00:00Z"
}
```
- **Errors**: `400 Bad Request` (Not a PDF, exceeds 25MB, empty file).

### 2.2 List Documents
- **Method**: `GET /api/v1/documents?search=report&skip=0&limit=20`
- **Response (200 OK)**:
```json
{
  "total": 1,
  "items": [
    {
      "id": "7ca64850-25e4-4d89-9944-ff7a63ce7345",
      "original_filename": "Annual_Report_2025.pdf",
      "file_size": 2450800,
      "page_count": 42,
      "processing_status": "ready",
      "processing_error": null,
      "created_at": "2026-10-14T00:00:00Z"
    }
  ]
}
```

### 2.3 Get Document Details & Status
- **Method**: `GET /api/v1/documents/{document_id}`
- **Response (200 OK)**:
```json
{
  "id": "7ca64850-25e4-4d89-9944-ff7a63ce7345",
  "original_filename": "Annual_Report_2025.pdf",
  "file_size": 2450800,
  "page_count": 42,
  "processing_status": "ready",
  "download_url": "https://storage.example.com/presigned-url...",
  "created_at": "2026-10-14T00:00:00Z"
}
```
- **Errors**: `404 Not Found`, `403 Forbidden`.

### 2.4 Update Document (Rename)
- **Method**: `PATCH /api/v1/documents/{document_id}`
- **Request Body**:
```json
{
  "filename": "Q4_Annual_Report_2025.pdf"
}
```
- **Response (200 OK)**: Document metadata object.

### 2.5 Delete Document
- **Method**: `DELETE /api/v1/documents/{document_id}`
- **Response (204 No Content)**
- **Behavior**: Cascades to all chunks in pgvector, conversations, messages, and purges binary object in S3/MinIO.

---

## 3. Conversation & Chat Endpoints

### 3.1 Create Conversation
- **Method**: `POST /api/v1/documents/{document_id}/conversations`
- **Request Body**:
```json
{
  "title": "Revenue and Projections"
}
```
- **Response (201 Created)**:
```json
{
  "id": "b0f7161b-90e6-42bb-a454-e9185a5fa1c8",
  "document_id": "7ca64850-25e4-4d89-9944-ff7a63ce7345",
  "title": "Revenue and Projections",
  "created_at": "2026-10-14T00:00:00Z"
}
```

### 3.2 List Conversations
- **Method**: `GET /api/v1/conversations?document_id={optional_uuid}`
- **Response (200 OK)**:
```json
[
  {
    "id": "b0f7161b-90e6-42bb-a454-e9185a5fa1c8",
    "document_id": "7ca64850-25e4-4d89-9944-ff7a63ce7345",
    "document_name": "Annual_Report_2025.pdf",
    "title": "Revenue and Projections",
    "created_at": "2026-10-14T00:00:00Z",
    "last_message": "Net revenue increased by 18% in Q4."
  }
]
```

### 3.3 Send Chat Message (RAG Question)
- **Method**: `POST /api/v1/conversations/{conversation_id}/messages`
- **Request Body**:
```json
{
  "content": "What was the total operating revenue reported in Q4?"
}
```
- **Response (200 OK)**:
```json
{
  "message_id": "993512b9-eefc-493a-8fce-58bc083cfc0b",
  "conversation_id": "b0f7161b-90e6-42bb-a454-e9185a5fa1c8",
  "role": "assistant",
  "content": "Total operating revenue in Q4 was $48.2 million, representing an 18% increase year-over-year.",
  "sources": [
    {
      "document_id": "7ca64850-25e4-4d89-9944-ff7a63ce7345",
      "page_number": 14,
      "chunk_id": "4a71d87f-e770-4f05-8968-3069c9ea8810",
      "excerpt": "Consolidated operating revenue for the fourth quarter ended December 31 reached $48.2M compared to $40.8M in the prior year period."
    }
  ],
  "created_at": "2026-10-14T00:00:05Z"
}
```

### 3.4 Get Conversation Message History
- **Method**: `GET /api/v1/conversations/{conversation_id}/messages`
- **Response (200 OK)**: Array of messages ordered chronologically with sources.
