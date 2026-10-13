"""
Chat & RAG Messaging Endpoints
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document, ProcessingStatus
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.services.rag_orchestrator import rag_orchestrator
from app.schemas.conversation import (
    ChatMessageRequest,
    ChatMessageResponse,
    MessageResponse,
    MessageCitation,
)

router = APIRouter(prefix="/conversations", tags=["Chat"])


@router.post(
    "/{conversation_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Send Question to PDF (RAG Query)",
    description="Embeds question, performs vector retrieval, and synthesizes grounded answer with citations.",
)
async def send_chat_message(
    conversation_id: uuid.UUID,
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    # 1. Verify conversation ownership
    conv_res = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.owner_id == current_user.id,
        )
    )
    conversation = conv_res.scalar_one_or_none()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )

    # 2. Verify document readiness
    doc_res = await db.execute(
        select(Document).where(Document.id == conversation.document_id)
    )
    doc = doc_res.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated document not found.",
        )

    if doc.processing_status != ProcessingStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document is not ready for querying (Current status: {doc.processing_status.value}).",
        )

    # 3. Persist user message
    user_msg = Message(
        conversation_id=conversation_id,
        role=MessageRole.USER,
        content=payload.content,
    )
    db.add(user_msg)
    await db.flush()

    # 4. Execute RAG pipeline
    rag_result = await rag_orchestrator.answer_question(
        db=db,
        document_id=doc.id,
        user_id=current_user.id,
        question=payload.content,
    )

    # 5. Persist assistant message with citations
    sources_data = [c.to_dict() for c in rag_result.citations]
    assistant_msg = Message(
        conversation_id=conversation_id,
        role=MessageRole.ASSISTANT,
        content=rag_result.answer,
        sources=sources_data,
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    # Convert to response schema
    sources_response = [
        MessageCitation(
            document_id=s["document_id"],
            page_number=s["page_number"],
            chunk_id=s["chunk_id"],
            excerpt=s["excerpt"],
        )
        for s in sources_data
    ]

    return ChatMessageResponse(
        message_id=assistant_msg.id,
        conversation_id=conversation_id,
        role=MessageRole.ASSISTANT,
        content=assistant_msg.content,
        sources=sources_response,
        created_at=assistant_msg.created_at,
    )


@router.get(
    "/{conversation_id}/messages",
    response_model=List[MessageResponse],
    summary="Get Message History",
)
async def get_messages(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[MessageResponse]:
    # Verify conversation ownership
    conv_res = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.owner_id == current_user.id,
        )
    )
    conversation = conv_res.scalar_one_or_none()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    return messages
