import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import 'package:ove/domain/model/session.dart';
import 'package:ove/data/local/database_helper.dart';
import 'package:ove/data/local/session_dao.dart';

final dbHelperProvider = Provider<DatabaseHelper>((_) => DatabaseHelper());

final sessionDaoProvider = Provider<SessionDao>((ref) {
  final helper = ref.watch(dbHelperProvider);
  return SessionDao(helper);
});

final recentSessionsProvider =
    FutureProvider<List<LocalSession>>((ref) async {
  final dao = ref.watch(sessionDaoProvider);
  return dao.getAllSessions();
});

final newSessionIdProvider = Provider<String>((_) => const Uuid().v4());
