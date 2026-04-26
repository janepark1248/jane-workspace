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
    // version(2): 인덱스 변경 없음 — 비인덱스 필드(beliefHypotheses, deepChat 등) 추가를 위한 버전 증가
    this.version(2).stores({
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

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}
