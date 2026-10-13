"""
RAG Orchestration Service
Coordinates embedding generation, vector retrieval, grounded prompt construction,
and verified page-level citation construction.
"""

import uuid
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.embedding_service import embedding_service
from app.services.vector_store import vector_store, RetrievedChunk
from app.services.llm_service import llm_service
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class CitationPayload:
    def __init__(self, document_id: uuid.UUID, page_number: int, chunk_id: uuid.UUID, excerpt: str):
        self.document_id = document_id
        self.page_number = page_number
        self.chunk_id = chunk_id
        self.excerpt = excerpt

    def to_dict(self) -> Dict[str, any]:
        return {
            "document_id": str(self.document_id),
            "page_number": self.page_number,
            "chunk_id": str(self.chunk_id),
            "excerpt": self.excerpt,
        }


class RAGResult:
    def __init__(self, answer: str, citations: List[CitationPayload]):
        self.answer = answer
        self.citations = citations


class RAGOrchestrator:
    async def answer_question(
        self,
        db: AsyncSession,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        question: str,
    ) -> RAGResult:
        """
        Executes end-to-end RAG workflow for a user question against a document.
        """
        # 1. Generate query embedding
        query_vector = await embedding_service.get_embedding(question)

        # 2. Retrieve relevant chunks with ownership check
        retrieved_chunks = await vector_store.search_similar_chunks(
            db=db,
            document_id=document_id,
            user_id=user_id,
            query_embedding=query_vector,
            top_k=settings.RETRIEVAL_TOP_K,
            threshold=settings.SIMILARITY_THRESHOLD,
        )

        if not retrieved_chunks:
            return RAGResult(
                answer="Based on the provided document content, I cannot find sufficient information to answer this question.",
                citations=[],
            )

        # 3. Build context blocks for LLM
        context_blocks = [c.content for c in retrieved_chunks]

        # 4. Synthesize answer with LLM
        answer = await llm_service.generate_grounded_answer(
            question=question,
            context_blocks=context_blocks,
        )

        # 5. Build physical page citations from actual retrieved chunks
        citations: List[CitationPayload] = []
        seen_pages = set()

        for chunk in retrieved_chunks:
            # Clean snippet for UI preview
            clean_excerpt = chunk.content.replace("\n", " ").strip()
            if len(clean_excerpt) > 220:
                clean_excerpt = clean_excerpt[:217] + "..."

            # Ensure unique citations by page/chunk
            if (chunk.page_number, chunk.chunk_id) not in seen_pages:
                seen_pages.add((chunk.page_number, chunk.chunk_id))
                citations.append(
                    CitationPayload(
                        document_id=chunk.document_id,
                        page_number=chunk.page_number,
                        chunk_id=chunk.chunk_id,
                        excerpt=clean_excerpt,
                    )
                )

        return RAGResult(answer=answer, citations=citations)


rag_orchestrator = RAGOrchestrator()
