import { create } from 'zustand';
import { getSession, updateSession } from '@/lib/db/session-db';
import { generateBeliefHypothesis } from '@/lib/ai/gemini';
import type { LocalSession } from '@/lib/models/session';

interface BeliefHypothesisState {
  session: LocalSession | null;
  hypothesisText: string;
  hypothesisBelief: string;
  isLoading: boolean;
  error: string | null;
  load: (sessionId: string) => Promise<void>;
  confirmHypothesis: (sessionId: string) => Promise<void>;
  reset: () => void;
}

export const useBeliefHypothesisStore = create<BeliefHypothesisState>((set, get) => ({
  session: null,
  hypothesisText: '',
  hypothesisBelief: '',
  isLoading: false,
  error: null,

  load: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await getSession(sessionId);
      if (!session) throw new Error('세션을 찾을 수 없습니다.');

      if (session.beliefHypothesis) {
        set({
          session,
          hypothesisText: session.beliefHypothesis.text,
          hypothesisBelief: session.beliefHypothesis.belief,
          isLoading: false,
        });
        return;
      }

      const followUpAnswers = session.followUpQA.map((qa) => qa.answerText);
      const { hypothesis, belief } = await generateBeliefHypothesis({
        restatement: session.restatement!,
        followUpAnswers,
      });
      const updated: LocalSession = {
        ...session,
        beliefHypothesis: { text: hypothesis, belief },
      };
      await updateSession(updated);
      set({ session: updated, hypothesisText: hypothesis, hypothesisBelief: belief, isLoading: false });
    } catch {
      set({ isLoading: false, error: '신념 가설 생성 중 오류가 발생했습니다.' });
    }
  },

  confirmHypothesis: async (sessionId: string) => {
    const { session, hypothesisBelief } = get();
    if (!session || !hypothesisBelief) return;

    const updated: LocalSession = {
      ...session,
      beliefSelection: {
        choices: session.beliefSelection?.choices ?? [hypothesisBelief],
        selectedChoice: hypothesisBelief,
        isCustomInput: false,
        interpretation: '',
      },
    };
    await updateSession(updated);
    set({ session: updated });
  },

  reset: () =>
    set({ session: null, hypothesisText: '', hypothesisBelief: '', isLoading: false, error: null }),
}));
