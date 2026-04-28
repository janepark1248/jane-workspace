import { create } from 'zustand';
import { saveSession, withSessionLoad } from '@/lib/db/session-db';
import { generateEmpathy } from '@/lib/ai/gemini';
import type { LocalSession } from '@/lib/models/session';

interface EmpathyState {
  session: LocalSession | null;
  empathyText: string;
  isLoading: boolean;
  error: string | null;
  load: (sessionId: string) => Promise<void>;
  reset: () => void;
}

export const useEmpathyStore = create<EmpathyState>((set) => ({
  session: null,
  empathyText: '',
  isLoading: false,
  error: null,

  load: async (sessionId: string) => {
    await withSessionLoad<EmpathyState>(sessionId, set, async (session, set) => {
      if (session.empathyResponse) {
        set({ session, empathyText: session.empathyResponse, isLoading: false });
        return;
      }
      const followUpAnswers = session.followUpQA.map((qa) => qa.answerText);
      const empathyText = await generateEmpathy({
        restatement: session.restatement!,
        followUpAnswers,
      });
      const updated: LocalSession = { ...session, empathyResponse: empathyText };
      await saveSession(updated);
      set({ session: updated, empathyText, isLoading: false });
    }, '응답을 만들다 멈췄어요.');
  },

  reset: () => set({ session: null, empathyText: '', isLoading: false, error: null }),
}));
