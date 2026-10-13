import 'package:flutter_test/flutter_test.dart';
import 'package:pdf_assist_mobile/features/auth/domain/user_model.dart';

void main() {
  group('UserModel Serialization', () {
    test('parses JSON correctly', () {
      final json = {
        'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'email': 'test@example.com',
        'created_at': '2026-10-14T00:00:00Z',
      };

      final user = UserModel.fromJson(json);
      expect(user.id, '3fa85f64-5717-4562-b3fc-2c963f66afa6');
      expect(user.email, 'test@example.com');
      expect(user.createdAt, isNotNull);
    });

    test('serializes to JSON correctly', () {
      final user = UserModel(
        id: '123-uuid',
        email: 'user@test.com',
        createdAt: DateTime.parse('2026-10-14T10:00:00Z'),
      );

      final json = user.toJson();
      expect(json['id'], '123-uuid');
      expect(json['email'], 'user@test.com');
    });
  });
}
