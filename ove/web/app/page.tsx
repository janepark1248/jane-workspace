'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllSessions } from '@/lib/db/session-db';
import { useChatStore } from '@/stores/chat-store';
import type { LocalSession } from '@/lib/models/session';

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<LocalSession[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
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

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <div className="flex-1">
        <h1 className="text-5xl font-light text-ove-primary tracking-tight text-center">ove</h1>
        <p className="text-ove-muted text-sm mt-2 mb-12 text-center">나의 감정을 이야기하세요</p>

        {sessions.length > 0 && (
          <div className="space-y-3">
            <p className="text-ove-muted text-xs uppercase tracking-widest mb-4">최근 세션</p>
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => router.push(`/report/${session.id}`)}
                className="w-full bg-ove-surface rounded-xl p-4 text-left border border-ove-border hover:border-ove-muted transition-colors"
              >
                <p className="text-ove-primary text-sm truncate">{session.transcript}</p>
                <p className="text-ove-muted text-xs mt-1">
                  {new Date(session.startedAt).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-ove-primary text-black py-4 rounded-xl font-medium text-sm mt-8 hover:opacity-90 transition-opacity"
      >
        지금 이야기하기
      </button>

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
              placeholder="오늘 있었던 일을 말해주세요..."
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
                  className="bg-ove-primary text-black px-6 py-2.5 rounded-xl font-medium text-sm disabled:opacity-30 hover:opacity-90 transition-opacity"
                >
                  {isSubmitting ? '분석 중...' : '시작하기'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
