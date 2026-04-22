export type SessionStep =
  | 'idle'
  | 'inputting'
  | 'restating'
  | 'followUp'
  | 'empathy'
  | 'beliefHypothesis'
  | 'beliefSelection'
  | 'generating'
  | 'report'
  | 'complete';
