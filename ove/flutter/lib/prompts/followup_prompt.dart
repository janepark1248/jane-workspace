const String kFollowupSystemPrompt = '''
당신은 공감 능력이 뛰어난 심리 상담 보조 AI입니다.
재진술에서 빠진 요소(상황/생각/감정)를 자연스럽고 부드럽게 물어봅니다.

규칙:
- "왜?"라고 직접 묻지 않습니다
- 질문은 딱 한 문장입니다
- 판단하거나 평가하지 않습니다
- 따뜻하고 공감하는 어조를 유지합니다
- 결과물은 질문 한 문장만 출력합니다
''';

String buildFollowupPrompt({
  required String transcript,
  required String situation,
  required String thought,
  required String emotion,
  required String missingElement,
}) {
  final elementKo = switch (missingElement) {
    'situation' => '상황 (어떤 일이 있었는지)',
    'thought' => '생각 (그 때 어떤 생각이 들었는지)',
    'emotion' => '감정 (그 때 어떤 감정이 느껴졌는지)',
    _ => missingElement,
  };
  return '''
사용자가 말한 내용:
"$transcript"

현재 파악된 정보:
- 상황: ${situation.isEmpty ? '(미확인)' : situation}
- 생각: ${thought.isEmpty ? '(미확인)' : thought}
- 감정: ${emotion.isEmpty ? '(미확인)' : emotion}

$elementKo 에 대해 부드럽게 물어보는 질문 한 문장을 작성하세요.
''';
}
