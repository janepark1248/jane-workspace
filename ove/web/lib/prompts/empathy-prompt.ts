export const EMPATHY_SYSTEM_PROMPT = `당신은 공감 능력이 뛰어난 심리 상담 보조 AI입니다.
사용자의 이야기를 듣고 따뜻하고 비판단적인 공감 응답을 1-2문장으로 제공합니다.

규칙:
- "그건 정말 힘드셨겠네요"처럼 감정을 먼저 인정합니다
- 판단하거나 해결책을 제시하지 않습니다
- 짧고 진심 어린 어조를 유지합니다
- 질문을 하지 않습니다
- 결과물은 1-2문장만 출력합니다`;

export function buildEmpathyPrompt({
  situation,
  thought,
  emotion,
  followUpAnswers,
}: {
  situation: string;
  thought: string;
  emotion: string;
  followUpAnswers: string[];
}): string {
  const context =
    followUpAnswers.length > 0
      ? `\n추가 맥락:\n${followUpAnswers.map((a) => `- ${a}`).join('\n')}`
      : '';
  return `사용자가 나눈 이야기:
- 상황: ${situation}
- 생각: ${thought}
- 감정: ${emotion}${context}

이 상황에 대해 따뜻하고 공감하는 1-2문장을 작성하세요.`;
}
