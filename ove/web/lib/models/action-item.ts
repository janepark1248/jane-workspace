export type ActionType = 'cognitive' | 'behavioral';

export interface ActionItem {
  id: string;
  sessionId: string;
  text: string;
  type: ActionType;
  createdAt: string;
}
