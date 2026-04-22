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
  }
}

const db = new OveDatabase();

export async function insertSession(session: LocalSession): Promise<void> {
  await db.sessions.put(session);
}

export async function updateSession(session: LocalSession): Promise<void> {
  await db.sessions.put(session);
}

export async function getSession(id: string): Promise<LocalSession | undefined> {
  return db.sessions.get(id);
}

export async function getAllSessions(): Promise<LocalSession[]> {
  return db.sessions.orderBy('startedAt').reverse().toArray();
}
