"""
Conversation and Chat Pydantic Schemas
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.models.message import MessageRole


class ConversationCreateRequest(BaseModel):
    title: Optional[str] = Field(default="New Conversation", max_length=255)


class ConversationResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None

    model_config = {"from_attributes": True}


class MessageCitation(BaseModel):
    document_id: str
    page_number: int
    chunk_id: str
    excerpt: str


class ChatMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    message_id: uuid.UUID
    conversation_id: uuid.UUID
    role: MessageRole
    content: str
    sources: List[MessageCitation] = Field(default_factory=list)
    created_at: datetime


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: MessageRole
    content: str
    sources: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    model_config = {"from_attributes": True}
