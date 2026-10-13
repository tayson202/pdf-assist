"""
Text Chunking Service
Token-aware sliding window chunker preserving 1-based page metadata.
"""

from typing import Dict, List
import tiktoken
from app.core.config import settings


class TextChunk:
    def __init__(self, page_number: int, chunk_index: int, content: str, token_count: int):
        self.page_number = page_number
        self.chunk_index = chunk_index
        self.content = content
        self.token_count = token_count


class TextChunker:
    def __init__(self):
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        except Exception:
            # Fallback for environments without internet to download tiktoken assets
            self.tokenizer = None

    def _count_tokens(self, text: str) -> int:
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        return len(text.split())

    def chunk_document_pages(
        self,
        pages_text: List[Dict[str, any]],
        chunk_size: int = settings.CHUNK_SIZE_TOKENS,
        chunk_overlap: int = settings.CHUNK_OVERLAP_TOKENS,
    ) -> List[TextChunk]:
        """
        Splits text into overlapping chunks, maintaining strict 1-based page numbers.
        """
        all_chunks: List[TextChunk] = []
        global_chunk_index = 0

        for page_data in pages_text:
            page_number = page_data["page_number"]
            page_text = page_data["text"]

            if not page_text or len(page_text.strip()) == 0:
                continue

            # Split by paragraphs or sentences first
            paragraphs = [p.strip() for p in page_text.split("\n\n") if p.strip()]
            if not paragraphs:
                paragraphs = [page_text]

            current_chunk_tokens: List[str] = []
            current_token_count = 0

            for para in paragraphs:
                para_words = para.split(" ")
                for word in para_words:
                    current_chunk_tokens.append(word)
                    current_token_count += 1

                    if current_token_count >= chunk_size:
                        chunk_text = " ".join(current_chunk_tokens).strip()
                        if chunk_text:
                            all_chunks.append(
                                TextChunk(
                                    page_number=page_number,
                                    chunk_index=global_chunk_index,
                                    content=chunk_text,
                                    token_count=self._count_tokens(chunk_text),
                                )
                            )
                            global_chunk_index += 1

                        # Keep overlap words
                        overlap_count = min(chunk_overlap, len(current_chunk_tokens))
                        current_chunk_tokens = current_chunk_tokens[-overlap_count:]
                        current_token_count = len(current_chunk_tokens)

            # Flush remaining tokens on this page
            if current_chunk_tokens:
                remaining_text = " ".join(current_chunk_tokens).strip()
                if remaining_text:
                    all_chunks.append(
                        TextChunk(
                            page_number=page_number,
                            chunk_index=global_chunk_index,
                            content=remaining_text,
                            token_count=self._count_tokens(remaining_text),
                        )
                    )
                    global_chunk_index += 1

        return all_chunks


text_chunker = TextChunker()
