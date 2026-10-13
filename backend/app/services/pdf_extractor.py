"""
PDF Extraction Service
Extracts page-by-page text using PyMuPDF (fitz) with OCR detection guard.
"""

from typing import Dict, List, Tuple
import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)


class PDFExtractionResult:
    def __init__(
        self,
        is_valid: bool,
        page_count: int,
        pages_text: List[Dict[str, any]],
        error: str = None,
        requires_ocr: bool = False,
    ):
        self.is_valid = is_valid
        self.page_count = page_count
        self.pages_text = pages_text  # List of {"page_number": int (1-based), "text": str}
        self.error = error
        self.requires_ocr = requires_ocr


class PDFExtractor:
    @staticmethod
    def extract_text_from_bytes(pdf_bytes: bytes) -> PDFExtractionResult:
        """
        Parses PDF bytes, extracts per-page text, validates page structure,
        and detects if OCR is required.
        """
        if not pdf_bytes or len(pdf_bytes) == 0:
            return PDFExtractionResult(
                is_valid=False,
                page_count=0,
                pages_text=[],
                error="The uploaded PDF file is empty (0 bytes).",
            )

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            return PDFExtractionResult(
                is_valid=False,
                page_count=0,
                pages_text=[],
                error=f"Corrupted or invalid PDF document: {str(e)}",
            )

        try:
            if doc.is_encrypted:
                return PDFExtractionResult(
                    is_valid=False,
                    page_count=0,
                    pages_text=[],
                    error="Password-protected PDFs are not supported. Please remove the password and retry.",
                )

            page_count = len(doc)
            if page_count == 0:
                return PDFExtractionResult(
                    is_valid=False,
                    page_count=0,
                    pages_text=[],
                    error="The PDF contains zero pages.",
                )

            pages_text: List[Dict[str, any]] = []
            total_chars = 0
            image_count = 0

            for page_index in range(page_count):
                page = doc.load_page(page_index)
                one_based_page_number = page_index + 1
                
                # Extract clean text
                raw_text = page.get_text("text").strip()
                pages_text.append({
                    "page_number": one_based_page_number,
                    "text": raw_text,
                })
                
                total_chars += len(raw_text)
                image_count += len(page.get_images())

            # OCR & Empty Document Detection Guard
            avg_chars_per_page = total_chars / max(page_count, 1)

            # Scanned Document: has images but negligible extracted digital text
            if image_count > 0 and avg_chars_per_page < 40:
                return PDFExtractionResult(
                    is_valid=False,
                    page_count=page_count,
                    pages_text=pages_text,
                    requires_ocr=True,
                    error="Scanned PDF detected. This document contains scanned images with no embedded digital text. Optical Character Recognition (OCR) is required.",
                )

            # Blank Document: no text and no images
            if total_chars == 0 and image_count == 0:
                return PDFExtractionResult(
                    is_valid=False,
                    page_count=page_count,
                    pages_text=pages_text,
                    error="The document is blank and contains no readable text.",
                )

            return PDFExtractionResult(
                is_valid=True,
                page_count=page_count,
                pages_text=pages_text,
            )
        finally:
            doc.close()


pdf_extractor = PDFExtractor()
