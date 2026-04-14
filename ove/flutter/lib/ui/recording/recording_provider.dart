import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ove/data/audio/audio_recorder.dart';
import 'package:ove/data/ai/gemini_service.dart';
import 'package:ove/data/local/session_dao.dart';
import 'package:ove/domain/model/session.dart';
import 'package:ove/domain/session_state.dart';
import 'package:ove/ui/home/home_provider.dart';

final audioRecorderProvider = Provider<AudioRecorder>((_) => AudioRecorder());
final geminiServiceProvider = Provider<GeminiService>((_) => GeminiService());

class RecordingState {
  final SessionStep step;
  final bool isRecording;
  final String? error;

  const RecordingState({
    this.step = SessionStep.idle,
    this.isRecording = false,
    this.error,
  });

  RecordingState copyWith(
          {SessionStep? step, bool? isRecording, String? error}) =>
      RecordingState(
        step: step ?? this.step,
        isRecording: isRecording ?? this.isRecording,
        error: error ?? this.error,
      );
}

class RecordingNotifier extends StateNotifier<RecordingState> {
  final AudioRecorder _recorder;
  final GeminiService _gemini;
  final SessionDao _dao;
  final String sessionId;

  RecordingNotifier({
    required AudioRecorder recorder,
    required GeminiService gemini,
    required SessionDao dao,
    required this.sessionId,
  })  : _recorder = recorder,
        _gemini = gemini,
        _dao = dao,
        super(const RecordingState());

  Future<void> startRecording() async {
    try {
      await _recorder.startRecording();
      state = state.copyWith(step: SessionStep.recording, isRecording: true);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<String?> stopAndTranscribe() async {
    state = state.copyWith(isRecording: false, step: SessionStep.transcribing);
    try {
      final file = await _recorder.stopRecording();
      if (file == null) return null;

      final transcript = await _gemini.transcribeAudio(file);
      await _recorder.deleteRecording(file);

      final session = LocalSession(
        id: sessionId,
        startedAt: DateTime.now(),
        status: SessionStatus.inProgress,
        transcript: transcript,
      );
      await _dao.insertSession(session);

      state = state.copyWith(step: SessionStep.restating);
      return sessionId;
    } catch (e) {
      state = state.copyWith(error: e.toString(), step: SessionStep.idle);
      return null;
    }
  }
}

final recordingProvider = StateNotifierProvider.family<RecordingNotifier,
    RecordingState, String>((ref, sessionId) {
  return RecordingNotifier(
    recorder: ref.watch(audioRecorderProvider),
    gemini: ref.watch(geminiServiceProvider),
    dao: ref.watch(sessionDaoProvider),
    sessionId: sessionId,
  );
});
