import 'package:flutter_test/flutter_test.dart';
import 'package:pdf_assist_mobile/features/chat/domain/message_model.dart';

void main() {
  group('MessageModel and CitationModel Tests', () {
    test('parses message with multiple source citations', () {
      final json = {
        'message_id': 'msg-123',
        'conversation_id': 'conv-456',
        'role': 'assistant',
        'content': 'Net revenue increased by 18% in Q4.',
        'sources': [
          {
            'document_id': 'doc-789',
            'page_number': 14,
            'chunk_id': 'chunk-001',
            'excerpt': 'Consolidated operating revenue reached \$48.2M.',
          },
          {
            'document_id': 'doc-789',
            'page_number': 15,
            'chunk_id': 'chunk-002',
            'excerpt': 'Gross margin expanded by 240 basis points.',
          }
        ],
        'created_at': '2026-10-14T00:00:05Z',
      };

      final message = MessageModel.fromJson(json);
      expect(message.id, 'msg-123');
      expect(message.isAssistant, isTrue);
      expect(message.isUser, isFalse);
      expect(message.sources.length, 2);

      final citation1 = message.sources[0];
      expect(citation1.pageNumber, 14);
      expect(citation1.excerpt, contains('48.2M'));

      final citation2 = message.sources[1];
      expect(citation2.pageNumber, 15);
    });
  });
}
