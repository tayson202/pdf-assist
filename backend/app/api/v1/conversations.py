"""
Conversations Management Endpoints
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import (
    ConversationCreateRequest,
    ConversationResponse,
)

router = APIRouter(tags=["Conversations"])


@router.post(
    "/documents/{document_id}/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Conversation for Document",
)
async def create_conversation(
    document_id: uuid.UUID,
    payload: ConversationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    # Verify document exists and belongs to current user
    doc_res = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = doc_res.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    conversation = Conversation(
        owner_id=current_user.id,
        document_id=document_id,
        title=payload.title or f"Chat with {doc.original_filename}",
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    return conversation


@router.get(
    "/conversations",
    response_model=List[ConversationResponse],
    summary="List User Conversations",
)
async def list_conversations(
    document_id: Optional[uuid.UUID] = Query(None, description="Filter by document ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ConversationResponse]:
    query = select(Conversation).where(Conversation.owner_id == current_user.id)
    if document_id:
        query = query.where(Conversation.document_id == document_id)

    query = query.order_by(Conversation.updated_at.desc())
    result = await db.execute(query)
    conversations = result.scalars().all()

    items = []
    for conv in conversations:
        # Fetch last message if available
        last_msg_res = await db.execute(
            select(Message.content)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_res.scalar_one_or_none()

        item = ConversationResponse.model_validate(conv)
        item.last_message = last_msg
        items.append(item)

    return items


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    summary="Get Conversation Details",
)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.owner_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )

    return conv


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Conversation",
)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.owner_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied.",
        )

    await db.delete(conv)
    await db.commit()
    return None
