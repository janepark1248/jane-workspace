import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { insertSession } from '@/lib/db/session-db';
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
      await insertSession(session);
      set({ isSubmitting: false });
      return session.id;
    } catch {
      set({ isSubmitting: false, error: '저장에 실패했습니다.' });
      throw new Error('저장에 실패했습니다.');
    }
  },

  reset: () => set({ isSubmitting: false, error: null }),
}));
