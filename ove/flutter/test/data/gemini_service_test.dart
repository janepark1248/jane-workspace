import 'package:flutter_test/flutter_test.dart';
import 'package:ove/data/ai/gemini_service.dart';

void main() {
  group('GeminiService.parseRestatement', () {
    test('유효한 JSON에서 Restatement 파싱', () {
      const json = '''
{
  "situation": "발표가 망했다",
  "thought": "나는 무능하다",
  "emotion": "수치심"
}
''';
      final result = GeminiService.parseRestatementJson(json);
      expect(result.situation, '발표가 망했다');
      expect(result.thought, '나는 무능하다');
      expect(result.emotion, '수치심');
      expect(result.isComplete, true);
    });

    test('빈 필드가 있는 JSON 파싱', () {
      const json = '{"situation": "발표", "thought": "", "emotion": ""}';
      final result = GeminiService.parseRestatementJson(json);
      expect(result.isComplete, false);
      expect(result.missingElement, 'thought');
    });

    test('마크다운 코드블록 감싼 JSON 파싱', () {
      const json = '```json\n{"situation": "s", "thought": "t", "emotion": "e"}\n```';
      final result = GeminiService.parseRestatementJson(json);
      expect(result.situation, 's');
      expect(result.isComplete, true);
    });
  });

  group('GeminiService.parseBeliefChoices', () {
    test('choices 배열 파싱', () {
      const json = '{"choices": ["나는 실패하면 안 된다", "인정받아야 가치 있다"]}';
      final result = GeminiService.parseBeliefChoicesJson(json);
      expect(result.length, 2);
      expect(result.first, '나는 실패하면 안 된다');
    });

    test('잘못된 JSON이면 빈 리스트 반환', () {
      final result = GeminiService.parseBeliefChoicesJson('invalid');
      expect(result, isEmpty);
    });
  });
}
