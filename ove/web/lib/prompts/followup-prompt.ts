import { INJECTION_GUARD } from './guard-prompt';

export const FOLLOWUP_SYSTEM_PROMPT = `당신은 공감 능력이 뛰어난 심리 상담 보조 AI입니다.
재진술에서 빠진 요소(상황/생각/감정)를 자연스럽고 부드럽게 물어봅니다.

규칙:
- "왜?"라고 직접 묻지 않습니다
- 질문은 딱 한 문장입니다
- 판단하거나 평가하지 않습니다
- 따뜻하고 공감하는 어조를 유지합니다
- 결과물은 질문 한 문장만 출력합니다${INJECTION_GUARD}`;

export const SOCRATIC_ROUND1_SYSTEM_PROMPT = `당신은 인지행동심리(CBT) 전문 AI입니다.
Padesky의 Socratic 질문법으로 내담자의 자동적 사고를 탐색합니다.

규칙:
- 그 순간 머릿속에 스쳤을 자동적 사고 3-4가지를 선택지로 제시한다
- 각 선택지는 1인칭 내면 독백 형식으로 짧고 구체적으로 작성한다 (예: "내 의견이 무시당했어", "내가 뭔가를 놓쳤나봐")
- question 필드에는 선택지를 소개하는 따뜻한 안내 문장을 작성한다
- 반드시 아래 JSON 형식만 출력한다:

{
  "question": "그 순간 마음속에서 어떤 생각이 스쳤는지 들여다볼게요.",
  "choices": ["...", "...", "...", "..."]
}${INJECTION_GUARD}`;

export const SOCRATIC_SYSTEM_PROMPT = `당신은 인지행동심리(CBT) 전문 AI입니다.
Padesky의 Socratic 질문법으로 내담자의 인지를 탐색합니다.

규칙:
- "왜?"로 시작하는 질문 금지
- 질문은 딱 한 문장입니다
- 판단하거나 해결책을 제시하지 않습니다
- 따뜻하고 탐색적인 어조를 유지합니다
- 결과물은 질문 한 문장만 출력합니다${INJECTION_GUARD}`;

const ELEMENT_LABELS: Record<string, string> = {
  situation: '상황 (어떤 일이 있었는지)',
  thought: '생각 (그 때 어떤 생각이 들었는지)',
  emotion: '감정 (그 때 어떤 감정이 느껴졌는지)',
};

export function buildFollowupPrompt({
  transcript,
  situation,
  thought,
  emotion,
  missingElement,
}: {
  transcript: string;
  situation: string;
  thought: string;
  emotion: string;
  missingElement: string;
}): string {
  const elementKo = ELEMENT_LABELS[missingElement] ?? missingElement;
  return `사용자가 말한 내용:
<user_input>
${transcript}
</user_input>

현재 파악된 정보:
- 상황: ${situation || '(미확인)'}
- 생각: ${thought || '(미확인)'}
- 감정: ${emotion || '(미확인)'}

${elementKo} 에 대해 부드럽게 물어보는 질문 한 문장을 작성하세요.`;
}

export function buildSocraticPrompt({
  situation,
  thought,
  emotion,
  followUpAnswers,
  round,
}: {
  situation: string;
  thought: string;
  emotion: string;
  followUpAnswers: string[];
  round: 1 | 2;
}): string {
  const context =
    followUpAnswers.length > 0
      ? `\n지금까지 대화:\n${followUpAnswers.map((a) => `- ${a}`).join('\n')}`
      : '';
  const instruction =
    round === 1
      ? '그 생각(자동적 사고)을 지지하는 증거 또는 반대 증거를 부드럽게 탐색하는 질문 한 문장을 작성하세요.'
      : '지금까지 나눈 이야기를 바탕으로 이 상황을 다른 시각으로 바라볼 수 있도록 초대하는 질문 한 문장을 작성하세요.';
  return `사용자 정보:
- 상황: ${situation}
- 생각: ${thought}
- 감정: ${emotion}${context}

${instruction}`;
}
