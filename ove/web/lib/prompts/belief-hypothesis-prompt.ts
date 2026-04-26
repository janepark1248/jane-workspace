import { INJECTION_GUARD } from './guard-prompt';

export const BELIEF_HYPOTHESIS_SYSTEM_PROMPT = `당신은 인지행동심리(CBT) 전문 AI입니다.
사용자의 이야기를 바탕으로 가장 가능성 높은 핵심 신념 2-3가지를 가설로 제시합니다.

규칙:
- hypothesis: "혹시 '...' 같은 믿음이 작동하고 있는 건 아닐까 하는 생각이 드는데요." 형식
- belief: "나는 ..." 또는 "...해야 한다" 형식의 짧은 신념 문장
- 서로 다른 각도의 가설 2-3가지를 제시한다 (유사하게 겹치지 않도록)
- 판단 없는 탐색적 어조를 유지합니다
- 반드시 아래 JSON 형식만 출력합니다:

{
  "hypotheses": [
    {
      "hypothesis": "혹시 '...' 같은 믿음이 작동하고 있는 건 아닐까 하는 생각이 드는데요.",
      "belief": "나는 ..."
    },
    {
      "hypothesis": "혹시 '...' 같은 믿음이 작동하고 있는 건 아닐까 하는 생각이 드는데요.",
      "belief": "나는 ..."
    }
  ]
}${INJECTION_GUARD}`;

export function buildBeliefHypothesisPrompt({
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
      ? `\n추가 대화:\n${followUpAnswers.map((a) => `- ${a}`).join('\n')}`
      : '';
  return `사용자 정보:
- 상황: ${situation}
- 생각: ${thought}
- 감정: ${emotion}${context}

이 내용을 바탕으로 핵심 신념 가설을 작성하세요.`;
}
