'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRestatementStore } from '@/stores/restatement-store';
import { WaveLoading } from '@/app/components/WaveLoading';

export default function FollowUpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [answerText, setAnswerText] = useState('');

  const { isLoading, followUpQuestion, readyForEmpathy, error, loadFollowUp, submitFollowUp } =
    useRestatementStore();

  useEffect(() => {
    loadFollowUp(id);
  }, [id, loadFollowUp]);

  useEffect(() => {
    if (readyForEmpathy) {
      router.push(`/empathy/${id}`);
    }
  }, [readyForEmpathy, id, router]);

  const handleSubmit = async () => {
    if (!answerText.trim()) return;
    const text = answerText.trim();
    setAnswerText('');
    await submitFollowUp(id, text);
  };

  if (isLoading && !followUpQuestion) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <WaveLoading />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-red-400 text-sm">{error}</p>
      </main>
    );
  }

  if (!followUpQuestion) return null;

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="bg-ove-surface rounded-2xl p-6 border border-ove-border">
          <p className="text-ove-primary text-base leading-relaxed">{followUpQuestion}</p>
        </div>

        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          placeholder="답변을 입력해주세요..."
          autoFocus
          className="w-full bg-ove-surface text-ove-primary rounded-xl p-4 resize-none text-sm leading-relaxed placeholder:text-ove-muted border border-ove-border focus:outline-none focus:border-ove-muted transition-colors min-h-24"
        />

        <button
          onClick={handleSubmit}
          disabled={!answerText.trim() || isLoading}
          className="w-full py-3.5 rounded-xl bg-ove-primary text-black text-sm font-medium disabled:opacity-30 hover:opacity-90 transition-opacity"
        >
          {isLoading ? '처리 중...' : '답변하기'}
        </button>
      </div>
    </main>
  );
}
