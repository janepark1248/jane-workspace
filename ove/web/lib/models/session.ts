import type { Restatement } from './restatement';
import type { ActionItem } from './action-item';
import type { BeliefSelection } from './belief-selection';
import type { Homework } from './homework';

export type SessionStatus = 'inProgress' | 'completed' | 'interrupted';

export interface FollowUpQA {
  targetElement?: 'situation' | 'thought' | 'emotion';
  question: string;
  answerText: string;
  phase: 'ste' | 'socratic';
  socraticRound?: 1 | 2;
}

export interface LocalSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: SessionStatus;
  transcript: string;
  restatement?: Restatement;
  followUpQA: FollowUpQA[];
  empathyResponse?: string;
  beliefHypothesis?: { text: string; belief: string };
  beliefSelection?: BeliefSelection;
  actionItems: ActionItem[];
  homework?: Homework;
}
