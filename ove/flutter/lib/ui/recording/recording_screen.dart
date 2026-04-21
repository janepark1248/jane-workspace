import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ove/domain/session_state.dart';
import 'package:ove/ui/recording/recording_provider.dart';

class RecordingScreen extends ConsumerStatefulWidget {
  final String sessionId;
  const RecordingScreen({super.key, required this.sessionId});

  @override
  ConsumerState<RecordingScreen> createState() => _RecordingScreenState();
}

class _RecordingScreenState extends ConsumerState<RecordingScreen> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(recordingProvider(widget.sessionId));
    final notifier = ref.read(recordingProvider(widget.sessionId).notifier);

    ref.listen(recordingProvider(widget.sessionId), (_, next) {
      if (next.step == SessionStep.restating) {
        context.pushReplacement('/restatement/${widget.sessionId}');
      }
    });

    return Scaffold(
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (state.step == SessionStep.transcribing) ...[
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              const Text('분석 중...', style: TextStyle(color: Colors.grey)),
            ] else ...[
              _buildMicButton(state, notifier),
              const SizedBox(height: 24),
              Text(
                state.isRecording ? '말하고 있습니다...' : '탭하여 시작',
                style: const TextStyle(color: Colors.grey, fontSize: 14),
              ),
              if (state.error != null)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(state.error!,
                      style: const TextStyle(color: Colors.red)),
                ),
            ],
            const SizedBox(height: 48),
            if (!state.isRecording && state.step == SessionStep.idle)
              TextButton(
                onPressed: () => context.pop(),
                child: const Text('취소', style: TextStyle(color: Colors.grey)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMicButton(RecordingState state, RecordingNotifier notifier) =>
      GestureDetector(
        onTap: state.isRecording
            ? () => notifier.stopAndTranscribe()
            : () => notifier.startRecording(),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: state.isRecording ? 100 : 80,
          height: state.isRecording ? 100 : 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: state.isRecording ? Colors.red : Colors.white,
          ),
          child: Icon(
            state.isRecording ? Icons.stop : Icons.mic,
            color: Colors.black,
            size: 36,
          ),
        ),
      );
}
