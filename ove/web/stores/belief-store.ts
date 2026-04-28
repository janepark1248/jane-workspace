import { create } from 'zustand';
import { saveSession, withSessionLoad } from '@/lib/db/session-db';
import { generateBeliefChoices } from '@/lib/ai/gemini';
import type { LocalSession } from '@/lib/models/session';

interface BeliefState {
  session: LocalSession | null;
  choices: string[];
  selected: string[];
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
  selected: [],
  isCustomInput: false,
  customText: '',
  isLoading: false,
  error: null,

  load: async (sessionId: string) => {
    await withSessionLoad<BeliefState>(sessionId, set, async (session, set) => {
      const choices = session.beliefSelection?.choices ?? [];
      const preSelected = session.beliefSelection?.selectedChoices ?? [];
      if (choices.length === 0) {
        const followUpAnswers = session.followUpQA.map((qa) => qa.answerText);
        const newChoices = await generateBeliefChoices({
          restatement: session.restatement!,
          followUpAnswers,
        });
        const updated: LocalSession = {
          ...session,
          beliefSelection: { choices: newChoices, selectedChoices: [], isCustomInput: false, interpretation: '' },
        };
        await saveSession(updated);
        set({ session: updated, choices: newChoices, selected: [], isLoading: false });
      } else {
        set({ session, choices, selected: preSelected, isLoading: false });
      }
    }, '선택지를 가져오다 멈췄어요.');
  },

  select: (choice: string) =>
    set((s) => ({
      selected: s.selected.includes(choice)
        ? s.selected.filter((c) => c !== choice)
        : [...s.selected, choice],
      isCustomInput: false,
    })),

  setCustomText: (text: string) => set({ customText: text }),

  toggleCustomInput: () =>
    set((s) => ({ isCustomInput: !s.isCustomInput, selected: [] })),

  confirm: async (sessionId: string) => {
    const { session, selected, isCustomInput, customText, choices } = get();
    if (!session) return;
    const finalChoices = isCustomInput
      ? (customText.trim() ? [customText.trim()] : [])
      : selected;
    if (finalChoices.length === 0) return;

    const updated: LocalSession = {
      ...session,
      beliefSelection: { choices, selectedChoices: finalChoices, isCustomInput, interpretation: '' },
    };
    await saveSession(updated);
    set({ session: updated });
  },

  reset: () =>
    set({
      session: null,
      choices: [],
      selected: [],
      isCustomInput: false,
      customText: '',
      isLoading: false,
      error: null,
    }),
}));
