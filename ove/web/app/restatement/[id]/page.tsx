'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRestatementStore } from '@/stores/restatement-store';
import { WaveLoading } from '@/app/components/WaveLoading';

export default function RestatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [correctionText, setCorrectionText] = useState('');
  const [showCorrection, setShowCorrection] = useState(false);

  const {
    session,
    isLoading,
    awaitingConfirmation,
    readyForFollowUp,
    error,
    load,
    confirmParaphrase,
    correctParaphrase,
  } = useRestatementStore();

  useEffect(() => {
    load(id);
  }, [id, load]);

  useEffect(() => {
    if (readyForFollowUp) {
      router.push(`/restatement/${id}/followup`);
    }
  }, [readyForFollowUp, id, router]);

  // 새 paraphrase 도착 시 correction 입력창 닫기
  useEffect(() => {
    if (awaitingConfirmation) setShowCorrection(false);
  }, [awaitingConfirmation]);

  if (isLoading && !awaitingConfirmation) {
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
        <button onClick={() => load(id)} className="text-ove-muted text-sm underline">
          다시 시도
        </button>
      </main>
    );
  }

  const paraphrase = session?.restatement?.paraphrase ?? '';

  const handleCorrect = async () => {
    if (!correctionText.trim()) return;
    setCorrectionText('');
    await correctParaphrase(id, correctionText.trim());
  };

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col justify-center">
        {paraphrase && (
          <div className="bg-ove-surface rounded-2xl p-6 border border-ove-border mb-8">
            <p className="text-ove-primary text-base leading-relaxed">{paraphrase}</p>
          </div>
        )}

        {!showCorrection ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowCorrection(true)}
              className="flex-1 py-3.5 rounded-md border border-ove-border text-ove-muted text-sm font-medium hover:border-ove-muted transition-colors"
            >
              아니에요
            </button>
            <button
              onClick={() => confirmParaphrase(id)}
              disabled={isLoading}
              className="flex-1 py-3.5 rounded-md bg-ove-primary text-black text-sm font-medium hover:brightness-110 transition-all disabled:opacity-30"
            >
              맞아요
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              placeholder="어떤 부분이 다른가요?"
              autoFocus
              className="w-full bg-ove-surface text-ove-primary rounded-xl p-4 resize-none text-sm leading-relaxed placeholder:text-ove-muted border border-ove-border focus:outline-none focus:border-ove-muted transition-colors min-h-24"
            />
            <button
              onClick={handleCorrect}
              disabled={!correctionText.trim() || isLoading}
              className="w-full py-3.5 rounded-md bg-ove-primary text-black text-sm font-medium disabled:opacity-30 hover:brightness-110 transition-all"
            >
              {isLoading ? '다시 듣고 있어요...' : '다시 들려줄게요'}
            </button>
            <button
              onClick={() => setShowCorrection(false)}
              className="text-ove-muted text-sm py-2"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
