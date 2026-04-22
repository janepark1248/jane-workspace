'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/stores/chat-store';

const MIN_LENGTH = 10;

export default function ChatPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const { isSubmitting, error, submit } = useChatStore();

  const handleSubmit = async () => {
    if (text.trim().length < MIN_LENGTH || isSubmitting) return;
    const sessionId = await submit(text.trim());
    router.push(`/restatement/${sessionId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <button
        onClick={() => router.back()}
        className="text-ove-muted text-sm mb-8 self-start hover:text-ove-primary transition-colors"
      >
        ← 뒤로
      </button>

      <h2 className="text-xl font-light text-ove-primary mb-2">지금 어떤 일이 있었나요?</h2>
      <p className="text-ove-muted text-sm mb-6">자유롭게 이야기해주세요. Cmd+Enter로 전송할 수 있어요.</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="오늘 있었던 일을 말해주세요..."
        className="flex-1 min-h-56 bg-ove-surface text-ove-primary rounded-xl p-4 resize-none text-sm leading-relaxed placeholder:text-ove-muted border border-ove-border focus:outline-none focus:border-ove-muted transition-colors"
        autoFocus
      />

      <div className="mt-4">
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex items-center justify-between mb-3">
          <span className="text-ove-muted text-xs">
            {text.trim().length < MIN_LENGTH && text.length > 0
              ? `${MIN_LENGTH - text.trim().length}자 더 입력해주세요`
              : ''}
          </span>
          <span className="text-ove-muted text-xs">{text.length}자</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={text.trim().length < MIN_LENGTH || isSubmitting}
          className="w-full bg-ove-primary text-black py-4 rounded-xl font-medium text-sm disabled:opacity-30 hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? '분석 중...' : '이야기 시작하기'}
        </button>
      </div>
    </main>
  );
}
