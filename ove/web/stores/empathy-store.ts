import { create } from 'zustand';
import { getSession, updateSession } from '@/lib/db/session-db';
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
    set({ isLoading: true, error: null });
    try {
      const session = await getSession(sessionId);
      if (!session) throw new Error('세션을 찾을 수 없습니다.');

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
      await updateSession(updated);
      set({ session: updated, empathyText, isLoading: false });
    } catch {
      set({ isLoading: false, error: '공감 응답 생성 중 오류가 발생했습니다.' });
    }
  },

  reset: () => set({ session: null, empathyText: '', isLoading: false, error: null }),
}));
