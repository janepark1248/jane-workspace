'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllSessions, deleteSession } from '@/lib/db/session-db';
import { useChatStore } from '@/stores/chat-store';
import type { LocalSession } from '@/lib/models/session';

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { isSubmitting, error, submit } = useChatStore();

  useEffect(() => {
    getAllSessions().then((all) => setSessions(all.slice(0, 3)));
  }, []);

  const handleSubmit = async () => {
    if (text.trim().length < MIN_LENGTH || isSubmitting) return;
    const sessionId = await submit(text.trim());
    router.push(`/restatement/${sessionId}`);
  };

  const handleClose = () => {
    setIsOpen(false);
    setText('');
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    await deleteSession(confirmDeleteId);
    setSessions((prev) => prev.filter((s) => s.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <div className="flex-1">
        <h1 className="text-5xl font-light text-ove-primary tracking-tight text-center">ove</h1>
        <p className="text-ove-muted text-sm mt-2 mb-12 text-center">지금 느끼는 것을 담아두세요</p>

        {sessions.length > 0 && (
          <div className="space-y-3">
            <p className="text-ove-muted text-xs tracking-widest mb-4">지난 이야기</p>
            {sessions.map((session) => (
              <div key={session.id} className="relative group">
                <button
                  onClick={() => router.push(`/report/${session.id}`)}
                  className="w-full bg-ove-surface rounded-md p-4 text-left border border-ove-border hover:border-ove-muted hover:-translate-y-[3px] transition-all duration-200"
                >
                  <p className="text-ove-primary text-lg truncate pr-6">{session.transcript}</p>
                  <p className="text-ove-muted text-sm mt-1">
                    {new Date(session.startedAt).toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }}
                  className="absolute top-3 right-3 text-ove-muted hover:text-ove-primary transition-colors p-1"
                  aria-label="세션 삭제"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-ove-primary text-black py-4 rounded-md font-medium text-sm mt-8 hover:brightness-110 transition-all"
      >
        지금 이야기하기
      </button>

      {confirmDeleteId && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setConfirmDeleteId(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 px-6">
            <div className="bg-ove-surface rounded-2xl p-6 w-full max-w-[320px] border border-ove-border">
              <p className="text-ove-primary text-sm font-medium mb-2">세션 삭제</p>
              <p className="text-ove-muted text-xs mb-6">이 세션을 삭제할까요? 되돌릴 수 없습니다.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 rounded-md text-sm text-ove-muted border border-ove-border hover:border-ove-muted transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-md text-sm bg-red-900/40 text-red-400 border border-red-900/60 hover:bg-red-900/60 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={handleClose}
          />
          <div className="fixed bottom-0 inset-x-0 max-w-[390px] mx-auto bg-ove-surface rounded-t-2xl z-50 p-6 pb-10">
            <h2 className="text-base font-medium text-ove-primary mb-4">지금 어떤 일이 있었나요?</h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              maxLength={MAX_LENGTH}
              placeholder="지금 무슨 일이 있었나요..."
              autoFocus
              className="w-full min-h-[140px] bg-ove-bg text-ove-primary rounded-xl p-4 resize-none text-sm leading-relaxed placeholder:text-ove-muted border border-ove-border focus:outline-none focus:border-ove-muted transition-colors"
            />
            <div className="mt-3">
              {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
              <div className="flex items-center justify-between">
                <span className="text-ove-muted text-xs">{text.length}/{MAX_LENGTH}</span>
                <button
                  onClick={handleSubmit}
                  disabled={text.trim().length < MIN_LENGTH || isSubmitting}
                  className="bg-ove-primary text-black px-6 py-2.5 rounded-md font-medium text-sm disabled:opacity-30 hover:brightness-110 transition-all"
                >
                  {isSubmitting ? '잠시만요...' : '시작하기'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
