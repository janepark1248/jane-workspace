import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ove/data/ai/gemini_service.dart';
import 'package:ove/data/local/session_dao.dart';
import 'package:ove/domain/model/belief_selection.dart';
import 'package:ove/ui/home/home_provider.dart';
import 'package:ove/ui/recording/recording_provider.dart';

class BeliefState {
  final bool isLoading;
  final List<String> choices;
  final String? selected;
  final String? error;

  const BeliefState({
    this.isLoading = false,
    this.choices = const [],
    this.selected,
    this.error,
  });

  BeliefState copyWith({
    bool? isLoading,
    List<String>? choices,
    String? selected,
    String? error,
  }) =>
      BeliefState(
        isLoading: isLoading ?? this.isLoading,
        choices: choices ?? this.choices,
        selected: selected ?? this.selected,
        error: error ?? this.error,
      );
}

class BeliefNotifier extends StateNotifier<BeliefState> {
  final GeminiService _gemini;
  final SessionDao _dao;
  final String sessionId;

  BeliefNotifier({
    required GeminiService gemini,
    required SessionDao dao,
    required this.sessionId,
  })  : _gemini = gemini,
        _dao = dao,
        super(const BeliefState());

  Future<void> loadChoices() async {
    state = state.copyWith(isLoading: true);
    final session = await _dao.getSession(sessionId);
    if (session?.restatement == null) return;

    final choices = await _gemini.generateBeliefChoices(
      restatement: session!.restatement!,
      followUpAnswers:
          session.followUpQA.map((q) => q.answerTranscript).toList(),
    );
    state = state.copyWith(isLoading: false, choices: choices);
  }

  Future<void> selectBelief(String choice) async {
    state = state.copyWith(selected: choice);
    final session = await _dao.getSession(sessionId);
    if (session == null) return;
    await _dao.insertSession(session.copyWith(
      beliefSelection: BeliefSelection(
        choices: state.choices,
        selectedChoice: choice,
      ),
    ));
  }

  Future<void> submitCustom(String custom) => selectBelief(custom);
}

final beliefProvider =
    StateNotifierProvider.family<BeliefNotifier, BeliefState, String>(
        (ref, sessionId) {
  return BeliefNotifier(
    gemini: ref.watch(geminiServiceProvider),
    dao: ref.watch(sessionDaoProvider),
    sessionId: sessionId,
  );
});
