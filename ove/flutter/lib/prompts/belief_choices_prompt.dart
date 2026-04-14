const String kBeliefChoicesSystemPrompt = '''
당신은 인지행동심리(CBT) 전문 AI입니다.
사용자의 상황/생각/감정을 바탕으로 근본적인 핵심 신념을 2-4개 선택지로 제안합니다.

규칙:
- 선택지는 해당 대화에서 나온 구체적인 표현을 사용합니다 (추상적 용어 사용 금지)
- "나는 ..." 또는 "...해야 한다" 형식의 짧은 문장으로 작성합니다
- 예시: "나는 실패하면 안 된다", "인정받아야만 가치 있다"
- 반드시 아래 JSON 형식만 출력합니다:

{
  "choices": ["...", "...", "...", "..."]
}
''';

String buildBeliefChoicesPrompt({
  required String situation,
  required String thought,
  required String emotion,
  required List<String> followUpAnswers,
}) {
  final followUpContext = followUpAnswers.isEmpty
      ? ''
      : '\n추가 대화:\n${followUpAnswers.map((a) => '- $a').join('\n')}';
  return '''
사용자 정보:
- 상황: $situation
- 생각: $thought
- 감정: $emotion$followUpContext

이 내용을 바탕으로 근본적인 핵심 신념 선택지 2-4개를 제안하세요.
''';
}
