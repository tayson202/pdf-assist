import 'package:flutter_test/flutter_test.dart';
import 'package:pdf_assist_mobile/features/documents/domain/document_model.dart';

void main() {
  group('DocumentModel Parsing & Status Tests', () {
    test('parses ready document status', () {
      final json = {
        'id': '7ca64850-25e4-4d89-9944-ff7a63ce7345',
        'original_filename': 'Annual_Report.pdf',
        'file_size': 2048500,
        'page_count': 12,
        'processing_status': 'ready',
        'created_at': '2026-10-14T00:00:00Z',
      };

      final doc = DocumentModel.fromJson(json);
      expect(doc.id, '7ca64850-25e4-4d89-9944-ff7a63ce7345');
      expect(doc.originalFilename, 'Annual_Report.pdf');
      expect(doc.pageCount, 12);
      expect(doc.processingStatus, DocumentProcessingStatus.ready);
      expect(doc.isReady, isTrue);
      expect(doc.isFailed, isFalse);
    });

    test('parses failed document with OCR error', () {
      final json = {
        'id': '88884850-25e4-4d89-9944-ff7a63ce7345',
        'original_filename': 'Scanned_Receipt.pdf',
        'file_size': 500000,
        'page_count': 1,
        'processing_status': 'failed',
        'processing_error': 'Scanned PDF detected. OCR is required.',
      };

      final doc = DocumentModel.fromJson(json);
      expect(doc.processingStatus, DocumentProcessingStatus.failed);
      expect(doc.isReady, isFalse);
      expect(doc.isFailed, isTrue);
      expect(doc.processingError, contains('OCR is required'));
    });
  });
}
