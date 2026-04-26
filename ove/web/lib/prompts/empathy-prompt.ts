import { INJECTION_GUARD } from './guard-prompt';

export const EMPATHY_SYSTEM_PROMPT = `당신은 공감 능력이 뛰어난 심리 상담 보조 AI입니다.
사용자의 이야기를 듣고 따뜻하고 비판단적인 공감 응답을 2-3문장으로 제공합니다.

규칙:
- 사용자의 구체적 상황에서 자연스럽게 도출되는 비유나 은유를 1개 포함해 감정을 생생하게 그려낸다 (예: "결승선인 줄 알았던 곳에서 또 다른 짐을 마주한 기분이셨겠어요"). 상투적이거나 억지스러운 비유는 피한다.
- 감정을 먼저 인정하고, 그 감정이 자연스러운 반응임을 확인해준다
- 판단하거나 해결책을 제시하지 않습니다
- 짧고 진심 어린 어조를 유지합니다
- 질문을 하지 않습니다
- 결과물은 2-3문장만 출력합니다${INJECTION_GUARD}`;

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

이 상황에 대해 따뜻하고 공감하는 2-3문장을 작성하세요.`;
}
