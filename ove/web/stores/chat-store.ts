import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { saveSession } from '@/lib/db/session-db';
import type { LocalSession } from '@/lib/models/session';

interface ChatState {
  isSubmitting: boolean;
  error: string | null;
  submit: (text: string) => Promise<string>;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isSubmitting: false,
  error: null,

  submit: async (text: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const session: LocalSession = {
        id: uuidv4(),
        startedAt: new Date().toISOString(),
        status: 'inProgress',
        transcript: text,
        followUpQA: [],
        actionItems: [],
      };
      await saveSession(session);
      set({ isSubmitting: false });
      return session.id;
    } catch {
      set({ isSubmitting: false, error: '저장하다 멈췄어요.' });
      throw new Error('저장하다 멈췄어요.');
    }
  },

  reset: () => set({ isSubmitting: false, error: null }),
}));
