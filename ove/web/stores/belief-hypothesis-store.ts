import { create } from 'zustand';
import { saveSession, withSessionLoad } from '@/lib/db/session-db';
import { generateBeliefHypothesis } from '@/lib/ai/gemini';
import type { LocalSession } from '@/lib/models/session';

interface BeliefHypothesisState {
  session: LocalSession | null;
  hypotheses: Array<{ text: string; belief: string }>;
  selectedIndex: number | null;
  isLoading: boolean;
  error: string | null;
  load: (sessionId: string) => Promise<void>;
  selectHypothesis: (index: number) => void;
  confirmHypothesis: (sessionId: string) => Promise<void>;
  reset: () => void;
}

export const useBeliefHypothesisStore = create<BeliefHypothesisState>((set, get) => ({
  session: null,
  hypotheses: [],
  selectedIndex: null,
  isLoading: false,
  error: null,

  load: async (sessionId: string) => {
    await withSessionLoad<BeliefHypothesisState>(sessionId, set, async (session, set) => {
      if (session.beliefHypotheses && session.beliefHypotheses.length > 0) {
        set({ session, hypotheses: session.beliefHypotheses, selectedIndex: 0, isLoading: false });
        return;
      }
      const followUpAnswers = session.followUpQA.map((qa) => qa.answerText);
      const { hypotheses: raw } = await generateBeliefHypothesis({
        restatement: session.restatement!,
        followUpAnswers,
      });
      const hypotheses = raw.map((h) => ({ text: h.hypothesis, belief: h.belief }));
      const updated: LocalSession = { ...session, beliefHypotheses: hypotheses };
      await saveSession(updated);
      set({ session: updated, hypotheses, selectedIndex: 0, isLoading: false });
    }, '신념을 탐색하다 멈췄어요.');
  },

  selectHypothesis: (index: number) => {
    set({ selectedIndex: index });
  },

  confirmHypothesis: async (sessionId: string) => {
    const { session, hypotheses, selectedIndex } = get();
    if (!session || selectedIndex === null) return;

    const selected = hypotheses[selectedIndex];
    if (!selected) return;

    const updated: LocalSession = {
      ...session,
      beliefSelection: {
        choices: session.beliefSelection?.choices ?? [selected.belief],
        selectedChoices: [selected.belief],
        isCustomInput: false,
        interpretation: '',
      },
    };
    await saveSession(updated);
    set({ session: updated });
  },

  reset: () =>
    set({ session: null, hypotheses: [], selectedIndex: null, isLoading: false, error: null }),
}));
