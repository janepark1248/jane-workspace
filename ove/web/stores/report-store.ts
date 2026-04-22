import { create } from 'zustand';
import { getSession, updateSession } from '@/lib/db/session-db';
import { generateInterpretation } from '@/lib/ai/gemini';
import type { LocalSession } from '@/lib/models/session';
import type { ActionItem } from '@/lib/models/action-item';
import type { Homework } from '@/lib/models/homework';

interface ReportState {
  session: LocalSession | null;
  interpretation: string;
  actionItems: ActionItem[];
  homework: Homework | null;
  isLoading: boolean;
  error: string | null;
  load: (sessionId: string) => Promise<void>;
  reset: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  session: null,
  interpretation: '',
  actionItems: [],
  homework: null,
  isLoading: false,
  error: null,

  load: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await getSession(sessionId);
      if (!session) throw new Error('세션을 찾을 수 없습니다.');

      if (session.beliefSelection?.interpretation) {
        set({
          session,
          interpretation: session.beliefSelection.interpretation,
          actionItems: session.actionItems,
          homework: session.homework ?? null,
          isLoading: false,
        });
        return;
      }

      const selectedBelief = session.beliefSelection?.selectedChoice ?? '';
      const { interpretation, actions, homework } = await generateInterpretation({
        sessionId,
        selectedBelief,
        restatement: session.restatement!,
      });

      const updated: LocalSession = {
        ...session,
        status: 'completed',
        completedAt: new Date().toISOString(),
        beliefSelection: {
          ...(session.beliefSelection!),
          interpretation,
        },
        actionItems: actions,
        homework: homework ?? undefined,
      };
      await updateSession(updated);

      set({ session: updated, interpretation, actionItems: actions, homework, isLoading: false });
    } catch {
      set({ isLoading: false, error: '리포트 생성 중 오류가 발생했습니다.' });
    }
  },

  reset: () =>
    set({
      session: null,
      interpretation: '',
      actionItems: [],
      homework: null,
      isLoading: false,
      error: null,
    }),
}));
