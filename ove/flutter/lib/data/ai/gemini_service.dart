import 'dart:convert';
import 'dart:io';
import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:uuid/uuid.dart';
import 'package:ove/config/api_config.dart';
import 'package:ove/domain/model/restatement.dart';
import 'package:ove/domain/model/belief_selection.dart';
import 'package:ove/domain/model/action_item.dart';
import 'package:ove/prompts/transcription_prompt.dart';
import 'package:ove/prompts/restatement_prompt.dart';
import 'package:ove/prompts/followup_prompt.dart';
import 'package:ove/prompts/belief_choices_prompt.dart';
import 'package:ove/prompts/interpretation_prompt.dart';

class GeminiService {
  late final GenerativeModel _model;

  GeminiService() {
    _model = GenerativeModel(
      model: 'gemini-1.5-flash',
      apiKey: kGeminiApiKey,
    );
  }

  /// 오디오 파일 → 한국어 전사 텍스트
  Future<String> transcribeAudio(File audioFile) async {
    final bytes = await audioFile.readAsBytes();
    final content = [
      Content.multi([
        TextPart(kTranscriptionSystemPrompt),
        DataPart('audio/m4a', bytes),
      ]),
    ];
    final response = await _model.generateContent(content);
    return response.text?.trim() ?? '';
  }

  /// 텍스트 → 상황/생각/감정 재진술
  Future<Restatement> generateRestatement(String transcript) async {
    final chat = _model.startChat(history: [
      Content.text(kRestatementSystemPrompt),
    ]);
    final response = await chat.sendMessage(
      Content.text(buildRestatementPrompt(transcript)),
    );
    return parseRestatementJson(response.text ?? '');
  }

  /// 빠진 요소에 대한 보완 질문 생성
  Future<String> generateFollowUpQuestion({
    required String transcript,
    required Restatement restatement,
  }) async {
    final missingElement = restatement.missingElement;
    if (missingElement == null) return '';

    final chat = _model.startChat(history: [
      Content.text(kFollowupSystemPrompt),
    ]);
    final response = await chat.sendMessage(
      Content.text(buildFollowupPrompt(
        transcript: transcript,
        situation: restatement.situation,
        thought: restatement.thought,
        emotion: restatement.emotion,
        missingElement: missingElement,
      )),
    );
    return response.text?.trim() ?? '';
  }

  /// 재진술 → 핵심 신념 선택지 2-4개
  Future<List<String>> generateBeliefChoices({
    required Restatement restatement,
    required List<String> followUpAnswers,
  }) async {
    final chat = _model.startChat(history: [
      Content.text(kBeliefChoicesSystemPrompt),
    ]);
    final response = await chat.sendMessage(
      Content.text(buildBeliefChoicesPrompt(
        situation: restatement.situation,
        thought: restatement.thought,
        emotion: restatement.emotion,
        followUpAnswers: followUpAnswers,
      )),
    );
    return parseBeliefChoicesJson(response.text ?? '');
  }

  /// 선택된 신념 → 해석 + 행동 아이템 3개
  Future<({String interpretation, List<ActionItem> actions})>
      generateInterpretation({
    required String sessionId,
    required String selectedBelief,
    required Restatement restatement,
  }) async {
    final chat = _model.startChat(history: [
      Content.text(kInterpretationSystemPrompt),
    ]);
    final response = await chat.sendMessage(
      Content.text(buildInterpretationPrompt(
        selectedBelief: selectedBelief,
        situation: restatement.situation,
        thought: restatement.thought,
        emotion: restatement.emotion,
      )),
    );
    return _parseInterpretationJson(response.text ?? '', sessionId);
  }

  // --- Static JSON parsers (테스트 가능) ---

  static Restatement parseRestatementJson(String raw) {
    try {
      final cleaned = _extractJson(raw);
      final map = json.decode(cleaned) as Map<String, dynamic>;
      return Restatement.fromMap(map);
    } catch (_) {
      return const Restatement(situation: '', thought: '', emotion: '');
    }
  }

  static List<String> parseBeliefChoicesJson(String raw) {
    try {
      final cleaned = _extractJson(raw);
      final map = json.decode(cleaned) as Map<String, dynamic>;
      return List<String>.from(map['choices'] as List? ?? []);
    } catch (_) {
      return [];
    }
  }

  static ({String interpretation, List<ActionItem> actions})
      _parseInterpretationJson(String raw, String sessionId) {
    try {
      final cleaned = _extractJson(raw);
      final map = json.decode(cleaned) as Map<String, dynamic>;
      final interpretation = map['interpretation'] as String? ?? '';
      final actionsRaw = map['actions'] as List? ?? [];
      final actions = actionsRaw.map((a) {
        final m = a as Map<String, dynamic>;
        return ActionItem(
          id: const Uuid().v4(),
          sessionId: sessionId,
          text: m['text'] as String,
          type: ActionType.values.byName(m['type'] as String? ?? 'behavioral'),
          createdAt: DateTime.now(),
        );
      }).toList();
      return (interpretation: interpretation, actions: actions);
    } catch (_) {
      return (interpretation: '', actions: <ActionItem>[]);
    }
  }

  /// 응답에서 JSON 블록 추출 (마크다운 코드블록 제거)
  static String _extractJson(String raw) {
    final jsonBlockRegex = RegExp(r'```(?:json)?\s*([\s\S]*?)\s*```');
    final match = jsonBlockRegex.firstMatch(raw);
    if (match != null) return match.group(1)!;
    final start = raw.indexOf('{');
    final end = raw.lastIndexOf('}');
    if (start != -1 && end != -1) return raw.substring(start, end + 1);
    return raw;
  }
}
