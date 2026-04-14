import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ove/data/ai/gemini_service.dart';
import 'package:ove/data/local/session_dao.dart';
import 'package:ove/domain/model/restatement.dart';
import 'package:ove/domain/model/session.dart';
import 'package:ove/ui/home/home_provider.dart';
import 'package:ove/ui/recording/recording_provider.dart';

class RestatementState {
  final bool isLoading;
  final Restatement? restatement;
  final String? followUpQuestion;
  final int followUpCount;
  final String? error;
  final bool readyForBelief;

  const RestatementState({
    this.isLoading = false,
    this.restatement,
    this.followUpQuestion,
    this.followUpCount = 0,
    this.error,
    this.readyForBelief = false,
  });

  RestatementState copyWith({
    bool? isLoading,
    Restatement? restatement,
    String? followUpQuestion,
    int? followUpCount,
    String? error,
    bool? readyForBelief,
  }) =>
      RestatementState(
        isLoading: isLoading ?? this.isLoading,
        restatement: restatement ?? this.restatement,
        followUpQuestion: followUpQuestion ?? this.followUpQuestion,
        followUpCount: followUpCount ?? this.followUpCount,
        error: error ?? this.error,
        readyForBelief: readyForBelief ?? this.readyForBelief,
      );
}

class RestatementNotifier extends StateNotifier<RestatementState> {
  final GeminiService _gemini;
  final SessionDao _dao;
  final String sessionId;

  RestatementNotifier({
    required GeminiService gemini,
    required SessionDao dao,
    required this.sessionId,
  })  : _gemini = gemini,
        _dao = dao,
        super(const RestatementState());

  Future<void> loadAndRestate() async {
    state = state.copyWith(isLoading: true);
    final session = await _dao.getSession(sessionId);
    if (session == null) return;

    final restatement =
        await _gemini.generateRestatement(session.transcript);

    if (restatement.isComplete) {
      state = state.copyWith(
          isLoading: false, restatement: restatement, readyForBelief: true);
    } else {
      final question = await _gemini.generateFollowUpQuestion(
          transcript: session.transcript, restatement: restatement);
      state = state.copyWith(
          isLoading: false,
          restatement: restatement,
          followUpQuestion: question);
    }
    await _saveRestatement(restatement);
  }

  Future<void> answerFollowUp(String audioTranscript) async {
    final current = state.restatement!;
    final missing = current.missingElement;
    if (missing == null) return;

    final updated = switch (missing) {
      'situation' => current.copyWith(situation: audioTranscript),
      'thought' => current.copyWith(thought: audioTranscript),
      'emotion' => current.copyWith(emotion: audioTranscript),
      _ => current,
    };

    await _saveRestatement(updated);

    if (updated.isComplete || state.followUpCount >= 2) {
      state = state.copyWith(
          restatement: updated,
          followUpQuestion: null,
          readyForBelief: true);
    } else {
      final question = await _gemini.generateFollowUpQuestion(
          transcript: audioTranscript, restatement: updated);
      state = state.copyWith(
        restatement: updated,
        followUpQuestion: question,
        followUpCount: state.followUpCount + 1,
      );
    }
  }

  Future<void> _saveRestatement(Restatement r) async {
    final session = await _dao.getSession(sessionId);
    if (session == null) return;
    await _dao.insertSession(session.copyWith(restatement: r));
  }
}

final restatementProvider = StateNotifierProvider.family<RestatementNotifier,
    RestatementState, String>((ref, sessionId) {
  return RestatementNotifier(
    gemini: ref.watch(geminiServiceProvider),
    dao: ref.watch(sessionDaoProvider),
    sessionId: sessionId,
  );
});
