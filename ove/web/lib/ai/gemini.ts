import type { Restatement } from '@/lib/models/restatement';
import type { ActionItem } from '@/lib/models/action-item';
import type { Homework } from '@/lib/models/homework';
import { getMissingElement } from '@/lib/models/restatement';

async function callGemini<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'AI 서비스 오류');
  }
  return res.json() as Promise<T>;
}

export async function generateRestatement(transcript: string): Promise<Restatement> {
  return callGemini<Restatement>('restatement', { transcript });
}

export async function generateFollowUpQuestion(params: {
  transcript: string;
  restatement: Restatement;
}): Promise<string> {
  const missing = getMissingElement(params.restatement);
  if (!missing) return '';
  const data = await callGemini<{ question: string }>('followup', {
    transcript: params.transcript,
    situation: params.restatement.situation,
    thought: params.restatement.thought,
    emotion: params.restatement.emotion,
    missingElement: missing,
  });
  return data.question;
}

export async function generateSocraticQuestion(params: {
  restatement: Restatement;
  followUpAnswers: string[];
  round: 1 | 2;
}): Promise<string> {
  const data = await callGemini<{ question: string }>('socraticFollowup', {
    situation: params.restatement.situation,
    thought: params.restatement.thought,
    emotion: params.restatement.emotion,
    followUpAnswers: params.followUpAnswers,
    round: params.round,
  });
  return data.question;
}

export async function generateEmpathy(params: {
  restatement: Restatement;
  followUpAnswers: string[];
}): Promise<string> {
  const data = await callGemini<{ empathyText: string }>('empathy', {
    situation: params.restatement.situation,
    thought: params.restatement.thought,
    emotion: params.restatement.emotion,
    followUpAnswers: params.followUpAnswers,
  });
  return data.empathyText;
}

export async function generateBeliefHypothesis(params: {
  restatement: Restatement;
  followUpAnswers: string[];
}): Promise<{ hypothesis: string; belief: string }> {
  return callGemini<{ hypothesis: string; belief: string }>('beliefHypothesis', {
    situation: params.restatement.situation,
    thought: params.restatement.thought,
    emotion: params.restatement.emotion,
    followUpAnswers: params.followUpAnswers,
  });
}

export async function generateBeliefChoices(params: {
  restatement: Restatement;
  followUpAnswers: string[];
}): Promise<string[]> {
  const data = await callGemini<{ choices: string[] }>('beliefChoices', {
    situation: params.restatement.situation,
    thought: params.restatement.thought,
    emotion: params.restatement.emotion,
    followUpAnswers: params.followUpAnswers,
  });
  return data.choices;
}

export async function generateInterpretation(params: {
  sessionId: string;
  selectedBelief: string;
  restatement: Restatement;
}): Promise<{ interpretation: string; actions: ActionItem[]; homework: Homework | null }> {
  return callGemini('interpretation', {
    sessionId: params.sessionId,
    selectedBelief: params.selectedBelief,
    situation: params.restatement.situation,
    thought: params.restatement.thought,
    emotion: params.restatement.emotion,
  });
}
