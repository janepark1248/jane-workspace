import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:ove/data/local/database_helper.dart';
import 'package:ove/data/local/session_dao.dart';
import 'package:ove/domain/model/session.dart';
import 'package:ove/domain/model/restatement.dart';
import 'package:uuid/uuid.dart';

void main() {
  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  group('SessionDao', () {
    late DatabaseHelper dbHelper;
    late SessionDao dao;

    setUp(() async {
      dbHelper = DatabaseHelper(dbPath: ':memory:');
      await dbHelper.init();
      dao = SessionDao(dbHelper);
    });

    tearDown(() async => dbHelper.close());

    test('세션 저장 후 조회', () async {
      final session = LocalSession(
        id: const Uuid().v4(),
        startedAt: DateTime.now(),
        status: SessionStatus.completed,
        transcript: '발표가 망했다',
        restatement: const Restatement(
          situation: '발표',
          thought: '나는 무능하다',
          emotion: '수치심',
        ),
      );
      await dao.insertSession(session);
      final sessions = await dao.getAllSessions();
      expect(sessions.length, 1);
      expect(sessions.first.transcript, '발표가 망했다');
      expect(sessions.first.restatement?.situation, '발표');
    });
  });
}
