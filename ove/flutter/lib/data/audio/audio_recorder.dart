import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart' as record_pkg;

class AudioRecorder {
  final record_pkg.AudioRecorder _recorder = record_pkg.AudioRecorder();
  String? _currentPath;

  /// 녹음 시작. 임시 파일 경로 반환.
  Future<String> startRecording() async {
    final hasPermission = await _recorder.hasPermission();
    if (!hasPermission) throw Exception('마이크 권한이 없습니다.');

    final dir = await getTemporaryDirectory();
    _currentPath =
        '${dir.path}/ove_${DateTime.now().millisecondsSinceEpoch}.m4a';

    await _recorder.start(
      const record_pkg.RecordConfig(
        encoder: record_pkg.AudioEncoder.aacLc,
        bitRate: 128000,
        sampleRate: 16000, // Gemini 권장 샘플레이트
      ),
      path: _currentPath!,
    );
    return _currentPath!;
  }

  /// 녹음 중지. 녹음 파일 반환.
  Future<File?> stopRecording() async {
    final path = await _recorder.stop();
    if (path == null) return null;
    return File(path);
  }

  /// 녹음 중인지 여부
  Future<bool> get isRecording => _recorder.isRecording();

  /// 리소스 해제
  void dispose() => _recorder.dispose();

  /// 임시 파일 삭제 (전사 완료 후 호출)
  Future<void> deleteRecording(File file) async {
    if (await file.exists()) await file.delete();
  }
}
