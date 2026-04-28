'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBeliefHypothesisStore } from '@/stores/belief-hypothesis-store';
import { WaveLoading } from '@/app/components/WaveLoading';

export default function BeliefHypothesisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hypotheses, selectedIndex, isLoading, error, load, selectHypothesis, confirmHypothesis } =
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

  if (isLoading && hypotheses.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <WaveLoading message="깊이 들여다보고 있어요" />
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

  const selected = selectedIndex !== null ? hypotheses[selectedIndex] : null;

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <h2 className="text-xl font-light text-ove-primary mb-2">하나 여쭤봐도 될까요?</h2>
      <p className="text-ove-muted text-sm mb-8">대화를 들으면서 든 생각이에요. 가장 와닿는 걸 골라주세요.</p>

      <div className="flex-1 flex flex-col justify-center gap-3">
        {hypotheses.map((h, i) => {
          const isSelected = selectedIndex === i;
          return (
            <button
              key={h.belief}
              onClick={() => selectHypothesis(i)}
              className={`w-full text-left rounded-md p-5 border transition-all ${
                isSelected
                  ? 'bg-ove-primary text-black border-ove-primary'
                  : 'bg-ove-surface text-ove-primary border-ove-border hover:border-ove-muted'
              }`}
            >
              <p className="text-sm leading-relaxed">{h.text}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 mt-8">
        <button
          onClick={handleConfirm}
          disabled={selectedIndex === null || isLoading}
          className="w-full bg-ove-primary text-black py-4 rounded-md font-medium text-sm disabled:opacity-30 hover:brightness-110 transition-all"
        >
          {isLoading ? '잠시만요...' : selected ? `"${selected.belief}" 이게 맞는 것 같아요` : '선택해주세요'}
        </button>
        <button
          onClick={handleDeny}
          className="w-full border border-ove-border text-ove-muted py-4 rounded-md font-medium text-sm hover:border-ove-muted transition-colors"
        >
          다른 것 같아요
        </button>
      </div>
    </main>
  );
}
