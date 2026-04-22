import { create } from 'zustand';
import { getSession, updateSession } from '@/lib/db/session-db';
import { generateBeliefChoices } from '@/lib/ai/gemini';
import type { LocalSession } from '@/lib/models/session';

interface BeliefState {
  session: LocalSession | null;
  choices: string[];
  selected: string | null;
  isCustomInput: boolean;
  customText: string;
  isLoading: boolean;
  error: string | null;
  load: (sessionId: string) => Promise<void>;
  select: (choice: string) => void;
  setCustomText: (text: string) => void;
  toggleCustomInput: () => void;
  confirm: (sessionId: string) => Promise<void>;
  reset: () => void;
}

export const useBeliefStore = create<BeliefState>((set, get) => ({
  session: null,
  choices: [],
  selected: null,
  isCustomInput: false,
  customText: '',
  isLoading: false,
  error: null,

  load: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await getSession(sessionId);
      if (!session) throw new Error('세션을 찾을 수 없습니다.');

      let choices = session.beliefSelection?.choices ?? [];
      const preSelected = session.beliefSelection?.selectedChoice ?? null;
      if (choices.length === 0) {
        const followUpAnswers = session.followUpQA.map((qa) => qa.answerText);
        choices = await generateBeliefChoices({
          restatement: session.restatement!,
          followUpAnswers,
        });
        const updated: LocalSession = {
          ...session,
          beliefSelection: {
            choices,
            selectedChoice: '',
            isCustomInput: false,
            interpretation: '',
          },
        };
        await updateSession(updated);
        set({ session: updated, choices, selected: null, isLoading: false });
      } else {
        set({ session, choices, selected: preSelected || null, isLoading: false });
      }
    } catch {
      set({ isLoading: false, error: '신념 선택지 생성 중 오류가 발생했습니다.' });
    }
  },

  select: (choice: string) => set({ selected: choice, isCustomInput: false }),

  setCustomText: (text: string) => set({ customText: text }),

  toggleCustomInput: () =>
    set((s) => ({ isCustomInput: !s.isCustomInput, selected: null })),

  confirm: async (sessionId: string) => {
    const { session, selected, isCustomInput, customText, choices } = get();
    if (!session) return;
    const finalChoice = isCustomInput ? customText.trim() : (selected ?? '');
    if (!finalChoice) return;

    const updated: LocalSession = {
      ...session,
      beliefSelection: {
        choices,
        selectedChoice: finalChoice,
        isCustomInput,
        interpretation: '',
      },
    };
    await updateSession(updated);
    set({ session: updated });
  },

  reset: () =>
    set({
      session: null,
      choices: [],
      selected: null,
      isCustomInput: false,
      customText: '',
      isLoading: false,
      error: null,
    }),
}));
