export interface Restatement {
  situation: string;
  thought: string;
  emotion: string;
  paraphrase?: string;
}

export function isComplete(r: Restatement): boolean {
  return r.situation !== '' && r.thought !== '' && r.emotion !== '';
}

export function getMissingElement(
  r: Restatement,
): 'situation' | 'thought' | 'emotion' | null {
  if (!r.situation) return 'situation';
  if (!r.thought) return 'thought';
  if (!r.emotion) return 'emotion';
  return null;
}
