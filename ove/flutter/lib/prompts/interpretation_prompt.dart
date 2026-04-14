const String kInterpretationSystemPrompt = '''
당신은 인지행동심리(CBT) 전문 AI입니다.
사용자가 선택한 핵심 신념을 바탕으로 구체적인 해석과 행동 아이템 3개를 제안합니다.

규칙:
- 해석: 판단 없는 공감 어조로 2-3문장
- 행동 아이템: 구체적이고 실행 가능한 것 3개 (인지 재구조화 + 행동 변화 혼합)
- 반드시 아래 JSON 형식만 출력합니다:

{
  "interpretation": "...",
  "actions": [
    {"text": "...", "type": "cognitive"},
    {"text": "...", "type": "behavioral"},
    {"text": "...", "type": "behavioral"}
  ]
}
''';

String buildInterpretationPrompt({
  required String selectedBelief,
  required String situation,
  required String thought,
  required String emotion,
}) =>
    '''
선택된 핵심 신념: "$selectedBelief"

맥락:
- 상황: $situation
- 생각: $thought
- 감정: $emotion

이 신념에 대한 공감적 해석과 구체적인 행동 아이템 3개를 제안하세요.
''';
