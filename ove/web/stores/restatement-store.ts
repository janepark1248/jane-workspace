import { create } from 'zustand';
import { saveSession, withSessionLoad } from '@/lib/db/session-db';
import {
  generateRestatement,
  generateFollowUpQuestion,
  generateSocraticQuestion,
} from '@/lib/ai/gemini';
import { getMissingElement, isComplete } from '@/lib/models/restatement';
import type { LocalSession, FollowUpQA } from '@/lib/models/session';
import type { Restatement } from '@/lib/models/restatement';

interface RestatementState {
  session: LocalSession | null;
  isLoading: boolean;
  followUpQuestion: string | null;
  socraticChoices: string[] | null;
  currentPhase: 'ste' | 'socratic';
  awaitingConfirmation: boolean;
  readyForFollowUp: boolean;
  readyForEmpathy: boolean;
  error: string | null;
  load: (sessionId: string) => Promise<void>;
  confirmParaphrase: (sessionId: string) => Promise<void>;
  correctParaphrase: (sessionId: string, correction: string) => Promise<void>;
  loadFollowUp: (sessionId: string) => Promise<void>;
  submitFollowUp: (sessionId: string, answer: string) => Promise<void>;
  reset: () => void;
}

const MAX_STE_FOLLOWUPS = 2;
const SOCRATIC_ROUNDS = 2;

export const useRestatementStore = create<RestatementState>((set, get) => ({
  session: null,
  isLoading: false,
  followUpQuestion: null,
  socraticChoices: null,
  currentPhase: 'ste',
  awaitingConfirmation: false,
  readyForFollowUp: false,
  readyForEmpathy: false,
  error: null,

  load: async (sessionId: string) => {
    await withSessionLoad<RestatementState>(sessionId, set, async (session, set) => {
      let current = session;
      if (!current.restatement) {
        const restatement = await generateRestatement(current.transcript);
        current = { ...current, restatement };
        await saveSession(current);
      }
      set({ session: current, isLoading: false, awaitingConfirmation: true });
    }, '분석하다가 멈췄어요.');
  },

  confirmParaphrase: async (sessionId: string) => {
    const { session } = get();
    if (!session) return;
    set({ isLoading: true, awaitingConfirmation: false });
    try {
      await resolveFollowUp(session, set);
      set((s) => ({ ...s, readyForFollowUp: true }));
    } catch {
      set({ isLoading: false, error: '잠시 막혔어요.' });
    }
  },

  correctParaphrase: async (sessionId: string, correction: string) => {
    const { session } = get();
    if (!session) return;
    set({ isLoading: true, awaitingConfirmation: false });
    try {
      const combined = `${session.transcript}\n\n추가 내용: ${correction}`;
      const restatement = await generateRestatement(combined);
      const updated = { ...session, restatement };
      await saveSession(updated);
      set({ session: updated, isLoading: false, awaitingConfirmation: true });
    } catch {
      set({ isLoading: false, error: '잠시 막혔어요.' });
    }
  },

  loadFollowUp: async (sessionId: string) => {
    const { session, followUpQuestion, readyForEmpathy } = get();
    if (session?.id === sessionId && (followUpQuestion !== null || readyForEmpathy)) return;

    await withSessionLoad<RestatementState>(sessionId, set, async (session, set) => {
      await resolveFollowUp(session, set);
    }, '잠시 문제가 생겼어요.');
  },

  submitFollowUp: async (sessionId: string, answer: string) => {
    const { session, followUpQuestion, currentPhase } = get();
    if (!session?.restatement || !followUpQuestion) return;

    set({ isLoading: true, error: null });
    try {
      let updatedRestatement: Restatement = session.restatement;
      let newQA: FollowUpQA;

      if (currentPhase === 'ste') {
        const missing = getMissingElement(session.restatement)!;
        updatedRestatement = { ...session.restatement, [missing]: answer };
        newQA = {
          targetElement: missing,
          question: followUpQuestion,
          answerText: answer,
          phase: 'ste',
        };
      } else {
        const socraticCount = session.followUpQA.filter((qa) => qa.phase === 'socratic').length;
        newQA = {
          question: followUpQuestion,
          answerText: answer,
          phase: 'socratic',
          socraticRound: (socraticCount + 1) as 1 | 2,
        };
      }

      const updated: LocalSession = {
        ...session,
        restatement: updatedRestatement,
        followUpQA: [...session.followUpQA, newQA],
      };
      await saveSession(updated);
      await resolveFollowUp(updated, set);
    } catch {
      set({ isLoading: false, error: '잠시 막혔어요.' });
    }
  },

  reset: () =>
    set({
      session: null,
      isLoading: false,
      followUpQuestion: null,
      socraticChoices: null,
      currentPhase: 'ste',
      awaitingConfirmation: false,
      readyForFollowUp: false,
      readyForEmpathy: false,
      error: null,
    }),
}));

async function resolveFollowUp(
  session: LocalSession,
  set: (state: Partial<RestatementState>) => void,
) {
  const restatement = session.restatement!;
  const steQAs = session.followUpQA.filter((qa) => (qa.phase ?? 'ste') === 'ste');
  const socraticQAs = session.followUpQA.filter((qa) => qa.phase === 'socratic');

  if (!isComplete(restatement) && steQAs.length < MAX_STE_FOLLOWUPS) {
    const followUpQuestion = await generateFollowUpQuestion({
      transcript: session.transcript,
      restatement,
    });
    set({ session, isLoading: false, followUpQuestion, socraticChoices: null, currentPhase: 'ste', readyForEmpathy: false });
    return;
  }

  if (socraticQAs.length < SOCRATIC_ROUNDS) {
    const round = (socraticQAs.length + 1) as 1 | 2;
    const followUpAnswers = session.followUpQA.map((qa) => qa.answerText);
    const { question: followUpQuestion, choices } = await generateSocraticQuestion({
      restatement,
      followUpAnswers,
      round,
    });
    set({
      session,
      isLoading: false,
      followUpQuestion,
      socraticChoices: choices && choices.length > 0 ? choices : null,
      currentPhase: 'socratic',
      readyForEmpathy: false,
    });
    return;
  }

  set({ session, isLoading: false, followUpQuestion: null, socraticChoices: null, currentPhase: 'ste', readyForEmpathy: true });
}
