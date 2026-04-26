import { create } from 'zustand';
import { getSession, updateSession } from '@/lib/db/session-db';
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
    set({ isLoading: true, error: null });
    try {
      const session = await getSession(sessionId);
      if (!session) throw new Error('세션을 찾을 수 없습니다.');

      // 이미 저장된 복수 가설이 있으면 복원
      if (session.beliefHypotheses && session.beliefHypotheses.length > 0) {
        set({ session, hypotheses: session.beliefHypotheses, selectedIndex: 0, isLoading: false });
        return;
      }
      // 레거시: 단일 가설이 저장된 경우
      if (session.beliefHypothesis) {
        const hypotheses = [{ text: session.beliefHypothesis.text, belief: session.beliefHypothesis.belief }];
        set({ session, hypotheses, selectedIndex: 0, isLoading: false });
        return;
      }

      const followUpAnswers = session.followUpQA.map((qa) => qa.answerText);
      const { hypotheses: raw } = await generateBeliefHypothesis({
        restatement: session.restatement!,
        followUpAnswers,
      });
      const hypotheses = raw.map((h) => ({ text: h.hypothesis, belief: h.belief }));
      const updated: LocalSession = {
        ...session,
        beliefHypotheses: hypotheses,
        beliefHypothesis: hypotheses[0]
          ? { text: hypotheses[0].text, belief: hypotheses[0].belief }
          : session.beliefHypothesis,
      };
      await updateSession(updated);
      set({ session: updated, hypotheses, selectedIndex: 0, isLoading: false });
    } catch {
      set({ isLoading: false, error: '신념 가설 생성 중 오류가 발생했습니다.' });
    }
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
        selectedChoice: selected.belief,
        isCustomInput: false,
        interpretation: '',
      },
    };
    await updateSession(updated);
    set({ session: updated });
  },

  reset: () =>
    set({ session: null, hypotheses: [], selectedIndex: null, isLoading: false, error: null }),
}));
