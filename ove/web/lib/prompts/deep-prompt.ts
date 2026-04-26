import type { ActionItem } from '@/lib/models/action-item';
import type { DeepChatQA } from '@/lib/models/session';
import { INJECTION_GUARD } from './guard-prompt';

export const DEEP_CHAT_SYSTEM_PROMPT = `당신은 CBT 전문 AI 상담 보조입니다.
사용자가 오늘의 리포트(핵심 신념, 해석, 행동 제안)를 받은 후 더 깊이 탐색하고 싶을 때 Padesky의 소크라테틱 질문법으로 안내합니다.

규칙:
- 질문은 반드시 한 문장으로만 작성한다
- "왜?"로 시작하지 않는다
- 판단하거나 해결책을 직접 제시하지 않는다
- 따뜻하고 호기심 어린 어조를 유지한다
- 사용자가 스스로 인사이트를 발견하도록 돕는다
- 자연스러울 때에만 관련 CBT 개념 이름을 질문 앞에 한 문장으로 언급할 수 있다 (예: "이건 CBT에서 파국화라고 부르는 패턴인데요,"). 매번 넣지 않고 맥락에 맞을 때만 사용한다.${INJECTION_GUARD}`;

export const DEEP_CHAT_SUMMARY_SYSTEM_PROMPT = `당신은 CBT 전문 AI 상담 보조입니다.
사용자와 나눈 소크라테틱 대화를 바탕으로 따뜻하고 격려적인 마무리 요약을 작성합니다.

규칙:
- 2~3문장으로 간결하게 작성한다
- 사용자가 대화 중 발견한 인사이트를 부드럽게 반영한다
- 판단하거나 충고하지 않는다
- 오늘의 탐색에 대해 따뜻하게 마무리한다${INJECTION_GUARD}`;

export function buildDeepChatPrompt({
  belief,
  interpretation,
  actionItems,
  previousQA,
  round,
}: {
  belief: string;
  interpretation: string;
  actionItems: ActionItem[];
  previousQA: DeepChatQA[];
  round: number;
}): string {
  const actionTexts = actionItems.map((a) => `- ${a.text}`).join('\n');

  const previousContext =
    previousQA.length > 0
      ? '\n\n[이전 대화]\n' +
        previousQA
          .map((qa) => `Q (${qa.round}라운드): ${qa.question}\nA: ${qa.answer}`)
          .join('\n\n')
      : '';

  const roundInstructionMap: Record<number, string> = {
    1: '핵심 신념과 해석을 바탕으로, 오늘 가장 마음에 걸렸던 부분이 무엇인지 탐색하는 질문을 한다.',
    2: '앞선 대화를 바탕으로, 같은 상황을 다른 시각으로 바라볼 수 있는지 탐색하는 질문을 한다.',
    3: '행동 제안과 연결해, 이번 주에 작은 한 가지를 실험해보도록 초대하는 질문을 한다.',
  };
  const roundInstruction =
    roundInstructionMap[round] ??
    '앞선 대화에서 가장 의미 있었던 발견을 바탕으로, 한 층 더 깊이 탐색할 수 있는 질문을 한다.';

  return `[오늘의 리포트]
핵심 신념: ${belief}
해석: ${interpretation}
행동 제안:
${actionTexts}${previousContext}

[지시] ${roundInstruction}
질문 한 문장만 출력하라.`;
}

export function buildDeepChatSummaryPrompt({
  belief,
  interpretation,
  allQA,
}: {
  belief: string;
  interpretation: string;
  allQA: DeepChatQA[];
}): string {
  const conversation = allQA
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join('\n\n');

  return `[오늘의 리포트]
핵심 신념: ${belief}
해석: ${interpretation}

[대화 전체]
${conversation}

위 대화를 바탕으로 따뜻한 마무리 요약을 2~3문장으로 작성하라.`;
}
