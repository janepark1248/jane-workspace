'use client';

import { create } from 'zustand';
import { saveSession, withSessionLoad } from '@/lib/db/session-db';
import { generateDeepChat, generateDeepChatSummary } from '@/lib/ai/gemini';
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
    await withSessionLoad<DeepChatState>(sessionId, set, async (session, set) => {
      const belief = session.beliefSelection?.selectedChoices?.join(' 그리고 ') ?? '';
      const interpretation = session.beliefSelection?.interpretation ?? '';

      if (session.deepChat && session.deepChat.length > 0) {
        if (session.deepChatSummary) {
          set({ session, qa: session.deepChat, summary: session.deepChatSummary, round: 'summary', isLoading: false });
          return;
        }
        const nextRound = session.deepChat.length + 1;
        const text = await generateDeepChat({
          belief, interpretation, actionItems: session.actionItems,
          previousQA: session.deepChat, round: nextRound,
        });
        set({ session, qa: session.deepChat, round: nextRound, currentQuestion: text, isLoading: false });
        return;
      }

      const text = await generateDeepChat({
        belief, interpretation, actionItems: session.actionItems,
        previousQA: [], round: 1,
      });
      set({ session, qa: [], round: 1, currentQuestion: text, isLoading: false });
    }, '연결이 잠시 끊겼어요.');
  },

  submitAnswer: async (sessionId, answerText) => {
    const { session, round, currentQuestion, qa } = get();
    if (!session || round === 'summary') return;

    const newQA: DeepChatQA = { question: currentQuestion, answer: answerText, round: round as number };
    const updatedQA = [...qa, newQA];

    set({ isLoading: true, pendingAnswer: answerText, error: null });
    try {
      const belief = session.beliefSelection?.selectedChoices?.join(' 그리고 ') ?? '';
      const interpretation = session.beliefSelection?.interpretation ?? '';

      if ((round as number) >= BASE_ROUNDS) {
        const updated: LocalSession = { ...session, deepChat: updatedQA };
        await saveSession(updated);
        set({ session: updated, qa: updatedQA, showContinueChoice: true, isLoading: false, pendingAnswer: null });
      } else {
        const nextRound = (round as number) + 1;
        const nextQuestion = await generateDeepChat({
          belief, interpretation, actionItems: session.actionItems,
          previousQA: updatedQA, round: nextRound,
        });
        const updated: LocalSession = { ...session, deepChat: updatedQA };
        await saveSession(updated);
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
      const belief = session.beliefSelection?.selectedChoices?.join(' 그리고 ') ?? '';
      const interpretation = session.beliefSelection?.interpretation ?? '';
      const text = await generateDeepChat({
        belief, interpretation, actionItems: session.actionItems,
        previousQA: qa, round: nextRound,
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
      const belief = session.beliefSelection?.selectedChoices?.join(' 그리고 ') ?? '';
      const interpretation = session.beliefSelection?.interpretation ?? '';
      const summary = await generateDeepChatSummary({
        belief, interpretation, actionItems: session.actionItems, previousQA: qa,
      });
      const updated: LocalSession = { ...session, deepChat: qa, deepChatSummary: summary };
      await saveSession(updated);
      set({ session: updated, summary, round: 'summary', isLoading: false, pendingAnswer: null });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false, showContinueChoice: true });
    }
  },

  reset: () =>
    set({ session: null, round: 1, showContinueChoice: false, currentQuestion: '', qa: [], summary: '', isLoading: false, error: null }),
}));
