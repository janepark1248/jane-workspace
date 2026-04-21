import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ove/data/ai/gemini_service.dart';
import 'package:ove/data/local/session_dao.dart';
import 'package:ove/domain/model/belief_selection.dart';
import 'package:ove/domain/model/session.dart';
import 'package:ove/ui/home/home_provider.dart';
import 'package:ove/ui/recording/recording_provider.dart';

class ReportState {
  final bool isLoading;
  final LocalSession? session;
  final String? error;

  const ReportState({this.isLoading = false, this.session, this.error});

  ReportState copyWith(
          {bool? isLoading, LocalSession? session, String? error}) =>
      ReportState(
        isLoading: isLoading ?? this.isLoading,
        session: session ?? this.session,
        error: error ?? this.error,
      );
}

class ReportNotifier extends StateNotifier<ReportState> {
  final GeminiService _gemini;
  final SessionDao _dao;
  final String sessionId;

  ReportNotifier({
    required GeminiService gemini,
    required SessionDao dao,
    required this.sessionId,
  })  : _gemini = gemini,
        _dao = dao,
        super(const ReportState());

  Future<void> loadReport() async {
    state = state.copyWith(isLoading: true);
    final session = await _dao.getSession(sessionId);
    if (session == null) return;

    if (session.beliefSelection?.interpretation.isEmpty ?? true) {
      final result = await _gemini.generateInterpretation(
        sessionId: sessionId,
        selectedBelief: session.beliefSelection?.selectedChoice ?? '',
        restatement: session.restatement!,
      );
      final updatedBelief = BeliefSelection(
        choices: session.beliefSelection?.choices ?? [],
        selectedChoice: session.beliefSelection?.selectedChoice ?? '',
        isCustomInput: session.beliefSelection?.isCustomInput ?? false,
        interpretation: result.interpretation,
      );
      final updatedSession = session.copyWith(
        beliefSelection: updatedBelief,
        actionItems: result.actions,
        status: SessionStatus.completed,
        completedAt: DateTime.now(),
      );
      await _dao.insertSession(updatedSession);
      state = state.copyWith(isLoading: false, session: updatedSession);
    } else {
      state = state.copyWith(isLoading: false, session: session);
    }
  }
}

final reportProvider =
    StateNotifierProvider.family<ReportNotifier, ReportState, String>(
        (ref, sessionId) {
  return ReportNotifier(
    gemini: ref.watch(geminiServiceProvider),
    dao: ref.watch(sessionDaoProvider),
    sessionId: sessionId,
  );
});
