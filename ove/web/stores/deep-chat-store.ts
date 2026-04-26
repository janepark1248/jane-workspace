'use client';

import { create } from 'zustand';
import { getSession, updateSession } from '@/lib/db/session-db';
import type { LocalSession, DeepChatQA } from '@/lib/models/session';

interface DeepChatState {
  session: LocalSession | null;
  round: number | 'summary';
  showContinueChoice: boolean;
  currentQuestion: string;
  qa: DeepChatQA[];
  summary: string;
  isLoading: boolean;
  pendingAnswer: string | null;
  error: string | null;

  load: (sessionId: string) => Promise<void>;
  submitAnswer: (sessionId: string, answerText: string) => Promise<void>;
  continueTalking: () => Promise<void>;
  finishChat: () => Promise<void>;
  reset: () => void;
}

async function fetchDeepChat(
  body: Record<string, unknown>,
): Promise<{ text: string }> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deepChat', ...body }),
  });
  if (!res.ok) throw new Error('AI 서비스 오류가 발생했습니다.');
  return res.json() as Promise<{ text: string }>;
}

const BASE_ROUNDS = 3;

export const useDeepChatStore = create<DeepChatState>((set, get) => ({
  session: null,
  round: 1,
  showContinueChoice: false,
  currentQuestion: '',
  qa: [],
  summary: '',
  isLoading: false,
  pendingAnswer: null,
  error: null,

  load: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const session = await getSession(sessionId);
      if (!session) throw new Error('세션을 찾을 수 없습니다.');

      if (session.deepChat && session.deepChat.length > 0) {
        const completedRounds = session.deepChat.length;
        if (session.deepChatSummary) {
          set({ session, qa: session.deepChat, summary: session.deepChatSummary, round: 'summary', isLoading: false });
          return;
        }
        const nextRound = completedRounds + 1;
        const belief = session.beliefSelection?.selectedChoice ?? '';
        const interpretation = session.beliefSelection?.interpretation ?? '';
        const { text } = await fetchDeepChat({
          belief,
          interpretation,
          actionItems: session.actionItems,
          previousQA: session.deepChat,
          round: nextRound,
        });
        set({ session, qa: session.deepChat, round: nextRound, currentQuestion: text, isLoading: false });
        return;
      }

      const belief = session.beliefSelection?.selectedChoice ?? '';
      const interpretation = session.beliefSelection?.interpretation ?? '';
      const { text } = await fetchDeepChat({
        belief,
        interpretation,
        actionItems: session.actionItems,
        previousQA: [],
        round: 1,
      });
      set({ session, qa: [], round: 1, currentQuestion: text, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  submitAnswer: async (sessionId, answerText) => {
    const { session, round, currentQuestion, qa } = get();
    if (!session || round === 'summary') return;

    const newQA: DeepChatQA = { question: currentQuestion, answer: answerText, round: round as number };
    const updatedQA = [...qa, newQA];

    set({ isLoading: true, pendingAnswer: answerText, error: null });
    try {
      const belief = session.beliefSelection?.selectedChoice ?? '';
      const interpretation = session.beliefSelection?.interpretation ?? '';

      if ((round as number) >= BASE_ROUNDS) {
        // BASE_ROUNDS 이상이면 계속/마무리 선택 제공
        const updated: LocalSession = { ...session, deepChat: updatedQA };
        await updateSession(updated);
        set({ session: updated, qa: updatedQA, showContinueChoice: true, isLoading: false, pendingAnswer: null });
      } else {
        const nextRound = (round as number) + 1;
        const { text: nextQuestion } = await fetchDeepChat({
          belief,
          interpretation,
          actionItems: session.actionItems,
          previousQA: updatedQA,
          round: nextRound,
        });
        const updated: LocalSession = { ...session, deepChat: updatedQA };
        await updateSession(updated);
        set({ session: updated, qa: updatedQA, round: nextRound, currentQuestion: nextQuestion, isLoading: false, pendingAnswer: null });
      }
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false, pendingAnswer: null });
    }
  },

  continueTalking: async () => {
    const { session, qa } = get();
    if (!session) return;

    set({ showContinueChoice: false, isLoading: true, error: null });
    try {
      const nextRound = qa.length + 1;
      const belief = session.beliefSelection?.selectedChoice ?? '';
      const interpretation = session.beliefSelection?.interpretation ?? '';
      const { text } = await fetchDeepChat({
        belief,
        interpretation,
        actionItems: session.actionItems,
        previousQA: qa,
        round: nextRound,
      });
      set({ round: nextRound, currentQuestion: text, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false, showContinueChoice: true });
    }
  },

  finishChat: async () => {
    const { session, qa } = get();
    if (!session) return;

    set({ showContinueChoice: false, isLoading: true, error: null });
    try {
      const belief = session.beliefSelection?.selectedChoice ?? '';
      const interpretation = session.beliefSelection?.interpretation ?? '';
      const { text: summary } = await fetchDeepChat({
        belief,
        interpretation,
        actionItems: session.actionItems,
        previousQA: qa,
        round: 'summary',
      });
      const updated: LocalSession = { ...session, deepChat: qa, deepChatSummary: summary };
      await updateSession(updated);
      set({ session: updated, summary, round: 'summary', isLoading: false, pendingAnswer: null });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false, showContinueChoice: true });
    }
  },

  reset: () =>
    set({ session: null, round: 1, showContinueChoice: false, currentQuestion: '', qa: [], summary: '', isLoading: false, error: null }),
}));
