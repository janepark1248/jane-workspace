import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import {
  RESTATEMENT_SYSTEM_PROMPT,
  buildRestatementPrompt,
} from '@/lib/prompts/restatement-prompt';
import {
  FOLLOWUP_SYSTEM_PROMPT,
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

async function generate(systemPrompt: string, userMessage: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(userMessage);
  return result.response.text().trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

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
        return Response.json({
          hypothesis: (parsed.hypothesis as string) ?? '',
          belief: (parsed.belief as string) ?? '',
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

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[Gemini API error]', err);
    return Response.json({ error: 'AI 서비스 오류가 발생했습니다.' }, { status: 500 });
  }
}
