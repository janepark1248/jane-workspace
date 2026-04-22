export type HomeworkType =
  | 'thoughtRecord'
  | 'behavioralExperiment'
  | 'activityScheduling'
  | 'evidenceLog'
  | 'selfCompassion';

export interface Homework {
  type: HomeworkType;
  description: string;
}
