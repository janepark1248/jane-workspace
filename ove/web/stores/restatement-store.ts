import { create } from 'zustand';
import { getSession, updateSession } from '@/lib/db/session-db';
import {
  generateRestatement,
  generateFollowUpQuestion,
  generateSocraticQuestion,
} from '@/lib/ai/gemini';
import { getMissingElement, isComplete } from '@/lib/models/restatement';
import type { LocalSession, FollowUpQA } from '@/lib/models/session';
import type { Restatement } from '@/lib/models/restatement';

interface RestatementState {
  session: LocalSession | null;
  isLoading: boolean;
  followUpQuestion: string | null;
  currentPhase: 'ste' | 'socratic';
  awaitingConfirmation: boolean;
  readyForFollowUp: boolean;
  readyForEmpathy: boolean;
  error: string | null;
  load: (sessionId: string) => Promise<void>;
  confirmParaphrase: (sessionId: string) => Promise<void>;
  correctParaphrase: (sessionId: string, correction: string) => Promise<void>;
  loadFollowUp: (sessionId: string) => Promise<void>;
  submitFollowUp: (sessionId: string, answer: string) => Promise<void>;
  reset: () => void;
}

const MAX_STE_FOLLOWUPS = 2;
const SOCRATIC_ROUNDS = 2;

export const useRestatementStore = create<RestatementState>((set, get) => ({
  session: null,
  isLoading: false,
  followUpQuestion: null,
  currentPhase: 'ste',
  awaitingConfirmation: false,
  readyForFollowUp: false,
  readyForEmpathy: false,
  error: null,

  // 최초 로드: restatement 생성 후 paraphrase 확인 대기
  load: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const session = await getSession(sessionId);
      if (!session) throw new Error('세션을 찾을 수 없습니다.');

      let current = session;
      if (!current.restatement) {
        const restatement = await generateRestatement(current.transcript);
        current = { ...current, restatement };
        await updateSession(current);
      }

      set({ session: current, isLoading: false, awaitingConfirmation: true });
    } catch {
      set({ isLoading: false, error: '분석 중 오류가 발생했습니다.' });
    }
  },

  // "맞아" 선택 시: follow-up 질문 생성 후 followup 화면으로
  confirmParaphrase: async (sessionId: string) => {
    const { session } = get();
    if (!session) return;
    set({ isLoading: true, awaitingConfirmation: false });
    try {
      await resolveFollowUp(session, set);
      set((s) => ({ ...s, readyForFollowUp: true }));
    } catch {
      set({ isLoading: false, error: '처리 중 오류가 발생했습니다.' });
    }
  },

  // "아니야" 후 보정 텍스트 제출: paraphrase 재생성
  correctParaphrase: async (sessionId: string, correction: string) => {
    const { session } = get();
    if (!session) return;
    set({ isLoading: true, awaitingConfirmation: false });
    try {
      const combined = `${session.transcript}\n\n추가 내용: ${correction}`;
      const restatement = await generateRestatement(combined);
      const updated = { ...session, restatement };
      await updateSession(updated);
      set({ session: updated, isLoading: false, awaitingConfirmation: true });
    } catch {
      set({ isLoading: false, error: '처리 중 오류가 발생했습니다.' });
    }
  },

  // followup 페이지 마운트 시: 이미 상태가 있으면 스킵, 없으면 재로드
  loadFollowUp: async (sessionId: string) => {
    const { session, followUpQuestion, readyForEmpathy } = get();
    if (session?.id === sessionId && (followUpQuestion !== null || readyForEmpathy)) return;

    set({ isLoading: true, error: null });
    try {
      const s = await getSession(sessionId);
      if (!s) throw new Error('세션을 찾을 수 없습니다.');
      await resolveFollowUp(s, set);
    } catch {
      set({ isLoading: false, error: '오류가 발생했습니다.' });
    }
  },

  submitFollowUp: async (sessionId: string, answer: string) => {
    const { session, followUpQuestion, currentPhase } = get();
    if (!session?.restatement || !followUpQuestion) return;

    set({ isLoading: true, error: null });
    try {
      let updatedRestatement: Restatement = session.restatement;
      let newQA: FollowUpQA;

      if (currentPhase === 'ste') {
        const missing = getMissingElement(session.restatement)!;
        updatedRestatement = { ...session.restatement, [missing]: answer };
        newQA = {
          targetElement: missing,
          question: followUpQuestion,
          answerText: answer,
          phase: 'ste',
        };
      } else {
        const socraticCount = session.followUpQA.filter((qa) => qa.phase === 'socratic').length;
        newQA = {
          question: followUpQuestion,
          answerText: answer,
          phase: 'socratic',
          socraticRound: (socraticCount + 1) as 1 | 2,
        };
      }

      const updated: LocalSession = {
        ...session,
        restatement: updatedRestatement,
        followUpQA: [...session.followUpQA, newQA],
      };
      await updateSession(updated);
      await resolveFollowUp(updated, set);
    } catch {
      set({ isLoading: false, error: '처리 중 오류가 발생했습니다.' });
    }
  },

  reset: () =>
    set({
      session: null,
      isLoading: false,
      followUpQuestion: null,
      currentPhase: 'ste',
      awaitingConfirmation: false,
      readyForFollowUp: false,
      readyForEmpathy: false,
      error: null,
    }),
}));

async function resolveFollowUp(
  session: LocalSession,
  set: (state: Partial<RestatementState>) => void,
) {
  const restatement = session.restatement!;
  const steQAs = session.followUpQA.filter((qa) => (qa.phase ?? 'ste') === 'ste');
  const socraticQAs = session.followUpQA.filter((qa) => qa.phase === 'socratic');

  // Phase 1: STE 빈 요소 채우기
  if (!isComplete(restatement) && steQAs.length < MAX_STE_FOLLOWUPS) {
    const followUpQuestion = await generateFollowUpQuestion({
      transcript: session.transcript,
      restatement,
    });
    set({ session, isLoading: false, followUpQuestion, currentPhase: 'ste', readyForEmpathy: false });
    return;
  }

  // Phase 2: Socratic 심화 질문
  if (socraticQAs.length < SOCRATIC_ROUNDS) {
    const round = (socraticQAs.length + 1) as 1 | 2;
    const followUpAnswers = session.followUpQA.map((qa) => qa.answerText);
    const followUpQuestion = await generateSocraticQuestion({
      restatement,
      followUpAnswers,
      round,
    });
    set({
      session,
      isLoading: false,
      followUpQuestion,
      currentPhase: 'socratic',
      readyForEmpathy: false,
    });
    return;
  }

  set({ session, isLoading: false, followUpQuestion: null, currentPhase: 'ste', readyForEmpathy: true });
}
