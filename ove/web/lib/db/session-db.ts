'use client';

import Dexie, { type Table } from 'dexie';
import type { LocalSession } from '@/lib/models/session';

class OveDatabase extends Dexie {
  sessions!: Table<LocalSession>;

  constructor() {
    super('oveDatabase');
    this.version(1).stores({
      sessions: 'id, startedAt, status',
    });
    this.version(2).stores({
      sessions: 'id, startedAt, status',
    });
  }
}

const db = new OveDatabase();

export async function saveSession(session: LocalSession): Promise<void> {
  await db.sessions.put(session);
}

export async function getSession(id: string): Promise<LocalSession | undefined> {
  return db.sessions.get(id);
}

export async function getAllSessions(): Promise<LocalSession[]> {
  return db.sessions.orderBy('startedAt').reverse().toArray();
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}

export async function withSessionLoad<S extends { isLoading: boolean; error: string | null }>(
  sessionId: string,
  set: (partial: Partial<S>) => void,
  handler: (session: LocalSession, set: (partial: Partial<S>) => void) => Promise<void>,
  errorMessage: string,
): Promise<void> {
  set({ isLoading: true, error: null } as Partial<S>);
  try {
    const session = await getSession(sessionId);
    if (!session) throw new Error('세션을 찾을 수 없습니다.');
    await handler(session, set);
  } catch {
    set({ isLoading: false, error: errorMessage } as Partial<S>);
  }
}
