import { create } from 'zustand';
import { saveSession, withSessionLoad } from '@/lib/db/session-db';
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
    await withSessionLoad<ReportState>(sessionId, set, async (session, set) => {
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
      const bs = session.beliefSelection;
      const selectedBelief = bs?.selectedChoices?.join(' 그리고 ') ?? '';
      const { interpretation, actions, homework } = await generateInterpretation({
        sessionId: session.id,
        selectedBelief,
        restatement: session.restatement!,
      });
      const updated: LocalSession = {
        ...session,
        status: 'completed',
        completedAt: new Date().toISOString(),
        beliefSelection: { ...(session.beliefSelection!), interpretation },
        actionItems: actions,
        homework: homework ?? undefined,
      };
      await saveSession(updated);
      set({ session: updated, interpretation, actionItems: actions, homework, isLoading: false });
    }, '기록을 정리하다 멈췄어요.');
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
