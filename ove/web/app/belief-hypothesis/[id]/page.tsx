'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBeliefHypothesisStore } from '@/stores/belief-hypothesis-store';

export default function BeliefHypothesisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hypothesisText, hypothesisBelief, isLoading, error, load, confirmHypothesis } =
    useBeliefHypothesisStore();

  useEffect(() => {
    load(id);
  }, [id, load]);

  const handleConfirm = async () => {
    await confirmHypothesis(id);
    router.push(`/report/${id}`);
  };

  const handleDeny = () => {
    router.push(`/belief/${id}`);
  };

  if (isLoading && !hypothesisText) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ove-muted text-sm animate-pulse">신념 가설 생성 중...</p>
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

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <h2 className="text-xl font-light text-ove-primary mb-2">하나 여쭤봐도 될까요?</h2>
      <p className="text-ove-muted text-sm mb-8">대화를 들으면서 든 생각이에요.</p>

      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-ove-surface rounded-xl p-6 border border-ove-border mb-4">
          <p className="text-ove-primary text-sm leading-relaxed">{hypothesisText}</p>
        </div>
        {hypothesisBelief && (
          <p className="text-ove-muted text-xs text-center">"{hypothesisBelief}"</p>
        )}
      </div>

      <div className="space-y-3 mt-8">
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full bg-ove-primary text-black py-4 rounded-xl font-medium text-sm disabled:opacity-30 hover:opacity-90 transition-opacity"
        >
          {isLoading ? '처리 중...' : '맞아요, 그런 것 같아요'}
        </button>
        <button
          onClick={handleDeny}
          className="w-full border border-ove-border text-ove-muted py-4 rounded-xl font-medium text-sm hover:border-ove-muted transition-colors"
        >
          다른 것 같아요
        </button>
      </div>
    </main>
  );
}
