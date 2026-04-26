import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import {
  RESTATEMENT_SYSTEM_PROMPT,
  buildRestatementPrompt,
} from '@/lib/prompts/restatement-prompt';
import {
  FOLLOWUP_SYSTEM_PROMPT,
  SOCRATIC_ROUND1_SYSTEM_PROMPT,
  SOCRATIC_SYSTEM_PROMPT,
  buildFollowupPrompt,
  buildSocraticPrompt,
} from '@/lib/prompts/followup-prompt';
import {
  BELIEF_CHOICES_SYSTEM_PROMPT,
  buildBeliefChoicesPrompt,
} from '@/lib/prompts/belief-choices-prompt';
import {
  INTERPRETATION_SYSTEM_PROMPT,
  buildInterpretationPrompt,
} from '@/lib/prompts/interpretation-prompt';
import {
  EMPATHY_SYSTEM_PROMPT,
  buildEmpathyPrompt,
} from '@/lib/prompts/empathy-prompt';
import {
  BELIEF_HYPOTHESIS_SYSTEM_PROMPT,
  buildBeliefHypothesisPrompt,
} from '@/lib/prompts/belief-hypothesis-prompt';
import {
  DEEP_CHAT_SYSTEM_PROMPT,
  DEEP_CHAT_SUMMARY_SYSTEM_PROMPT,
  buildDeepChatPrompt,
  buildDeepChatSummaryPrompt,
} from '@/lib/prompts/deep-prompt';
import type { DeepChatQA } from '@/lib/models/session';
import type { ActionItem } from '@/lib/models/action-item';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL_NAME = 'gemini-2.5-flash-lite';

function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) return match[1];
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1) return raw.substring(start, end + 1);
  return raw;
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function generate(systemPrompt: string, userMessage: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
    safetySettings: SAFETY_SETTINGS,
  });
  const result = await model.generateContent(userMessage);
  return result.response.text().trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    const CRISIS_KEYWORDS = ['자해', '자살', '죽고싶', '목숨을 끊', '극단적 선택', 'suicide', 'self-harm', 'kill myself'];
    const userInputTexts: string[] = [
      body.transcript,
      body.situation,
      body.thought,
      body.emotion,
      ...(Array.isArray(body.previousQA)
        ? (body.previousQA as Array<{ answer?: unknown }>)
            .filter((qa) => typeof qa.answer === 'string')
            .map((qa) => qa.answer as string)
        : []),
    ].filter((f): f is string => typeof f === 'string');
    if (CRISIS_KEYWORDS.some((kw) => userInputTexts.some((f) => f.includes(kw)))) {
      return Response.json({
        crisis: true,
        message: '지금 많이 힘드신 것 같아요. 혼자 감당하기 어려우시다면 자살예방상담전화(1393)에 연락해보세요. 24시간 전화 상담을 받을 수 있어요.',
      });
    }

    const MAX_TEXT_LENGTH = 2000;
    const textFields = [body.transcript, body.situation, body.thought, body.emotion, body.selectedBelief];
    if (textFields.some((f) => typeof f === 'string' && f.length > MAX_TEXT_LENGTH)) {
      return Response.json({ error: '입력이 너무 깁니다.' }, { status: 400 });
    }

    if (action === 'deepChat') {
      const { belief, interpretation, previousQA } = body as {
        belief?: unknown;
        interpretation?: unknown;
        previousQA?: unknown;
      };
      if (
        (typeof belief === 'string' && belief.length > MAX_TEXT_LENGTH) ||
        (typeof interpretation === 'string' && interpretation.length > MAX_TEXT_LENGTH)
      ) {
        return Response.json({ error: '입력이 너무 깁니다.' }, { status: 400 });
      }
      if (Array.isArray(previousQA) && previousQA.length > 10) {
        return Response.json({ error: '요청이 너무 깁니다.' }, { status: 400 });
      }
    }

    switch (action) {
      case 'restatement': {
        const { transcript } = body as { transcript: string };
        const raw = await generate(
          RESTATEMENT_SYSTEM_PROMPT,
          buildRestatementPrompt(transcript),
        );
        const parsed = JSON.parse(extractJson(raw));
        return Response.json({
          situation: (parsed.situation as string) ?? '',
          thought: (parsed.thought as string) ?? '',
          emotion: (parsed.emotion as string) ?? '',
          paraphrase: (parsed.paraphrase as string) ?? '',
        });
      }

      case 'followup': {
        const { transcript, situation, thought, emotion, missingElement } = body as {
          transcript: string;
          situation: string;
          thought: string;
          emotion: string;
          missingElement: string;
        };
        const question = await generate(
          FOLLOWUP_SYSTEM_PROMPT,
          buildFollowupPrompt({ transcript, situation, thought, emotion, missingElement }),
        );
        return Response.json({ question });
      }

      case 'socraticFollowup': {
        const { situation, thought, emotion, followUpAnswers, round } = body as {
          situation: string;
          thought: string;
          emotion: string;
          followUpAnswers: string[];
          round: 1 | 2;
        };
        if (round === 1) {
          const raw = await generate(
            SOCRATIC_ROUND1_SYSTEM_PROMPT,
            buildSocraticPrompt({ situation, thought, emotion, followUpAnswers, round }),
          );
          const parsed = JSON.parse(extractJson(raw));
          return Response.json({
            question: (parsed.question as string) ?? '',
            choices: (parsed.choices as string[]) ?? [],
          });
        }
        const question = await generate(
          SOCRATIC_SYSTEM_PROMPT,
          buildSocraticPrompt({ situation, thought, emotion, followUpAnswers, round }),
        );
        return Response.json({ question });
      }

      case 'empathy': {
        const { situation, thought, emotion, followUpAnswers } = body as {
          situation: string;
          thought: string;
          emotion: string;
          followUpAnswers: string[];
        };
        const empathyText = await generate(
          EMPATHY_SYSTEM_PROMPT,
          buildEmpathyPrompt({ situation, thought, emotion, followUpAnswers }),
        );
        return Response.json({ empathyText });
      }

      case 'beliefHypothesis': {
        const { situation, thought, emotion, followUpAnswers } = body as {
          situation: string;
          thought: string;
          emotion: string;
          followUpAnswers: string[];
        };
        const raw = await generate(
          BELIEF_HYPOTHESIS_SYSTEM_PROMPT,
          buildBeliefHypothesisPrompt({ situation, thought, emotion, followUpAnswers }),
        );
        const parsed = JSON.parse(extractJson(raw));
        if (parsed.hypotheses && Array.isArray(parsed.hypotheses)) {
          return Response.json({
            hypotheses: (parsed.hypotheses as Array<{ hypothesis: string; belief: string }>).map(
              (h) => ({
                hypothesis: h.hypothesis ?? '',
                belief: h.belief ?? '',
              }),
            ),
          });
        }
        // 레거시 단일 형식 → 배열로 래핑
        return Response.json({
          hypotheses: [
            {
              hypothesis: (parsed.hypothesis as string) ?? '',
              belief: (parsed.belief as string) ?? '',
            },
          ],
        });
      }

      case 'beliefChoices': {
        const { situation, thought, emotion, followUpAnswers } = body as {
          situation: string;
          thought: string;
          emotion: string;
          followUpAnswers: string[];
        };
        const raw = await generate(
          BELIEF_CHOICES_SYSTEM_PROMPT,
          buildBeliefChoicesPrompt({ situation, thought, emotion, followUpAnswers }),
        );
        const parsed = JSON.parse(extractJson(raw));
        return Response.json({ choices: (parsed.choices as string[]) ?? [] });
      }

      case 'interpretation': {
        const { sessionId, selectedBelief, situation, thought, emotion } = body as {
          sessionId: string;
          selectedBelief: string;
          situation: string;
          thought: string;
          emotion: string;
        };
        const raw = await generate(
          INTERPRETATION_SYSTEM_PROMPT,
          buildInterpretationPrompt({ selectedBelief, situation, thought, emotion }),
        );
        const parsed = JSON.parse(extractJson(raw));
        const actions = ((parsed.actions as { text: string; type: string }[]) ?? []).map(
          (a) => ({
            id: uuidv4(),
            sessionId,
            text: a.text,
            type: a.type ?? 'behavioral',
            createdAt: new Date().toISOString(),
          }),
        );
        const homework =
          parsed.homework && parsed.homework.type && parsed.homework.description
            ? { type: parsed.homework.type as string, description: parsed.homework.description as string }
            : null;
        return Response.json({
          interpretation: (parsed.interpretation as string) ?? '',
          actions,
          homework,
        });
      }

      case 'deepChat': {
        const { belief, interpretation, actionItems, previousQA, round } = body as {
          belief: string;
          interpretation: string;
          actionItems: ActionItem[];
          previousQA: DeepChatQA[];
          round: 1 | 2 | 3 | 'summary';
        };
        if (round === 'summary') {
          const text = await generate(
            DEEP_CHAT_SUMMARY_SYSTEM_PROMPT,
            buildDeepChatSummaryPrompt({ belief, interpretation, allQA: previousQA }),
          );
          return Response.json({ text });
        }
        const text = await generate(
          DEEP_CHAT_SYSTEM_PROMPT,
          buildDeepChatPrompt({ belief, interpretation, actionItems, previousQA, round }),
        );
        return Response.json({ text });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[Gemini API error]', err);
    return Response.json({ error: 'AI 서비스 오류가 발생했습니다.' }, { status: 500 });
  }
}
