'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBeliefStore } from '@/stores/belief-store';
import { WaveLoading } from '@/app/components/WaveLoading';

export default function BeliefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customInput, setCustomInput] = useState('');
  const {
    choices,
    selected,
    isCustomInput,
    isLoading,
    error,
    load,
    select,
    toggleCustomInput,
    setCustomText,
    confirm,
  } = useBeliefStore();

  useEffect(() => {
    load(id);
  }, [id, load]);

  const handleConfirm = async () => {
    await confirm(id);
    router.push(`/report/${id}`);
  };

  const handleCustomChange = (v: string) => {
    setCustomInput(v);
    setCustomText(v);
  };

  const canConfirm = isCustomInput ? customInput.trim().length > 0 : selected.length > 0;

  if (isLoading && choices.length === 0) {
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

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <h2 className="text-xl font-light text-ove-primary mb-2">해당하는 믿음을 모두 골라보세요</h2>
      <p className="text-ove-muted text-sm mb-8">
        이 대화에서 드러난 나의 믿음이에요. 여러 개 선택할 수 있어요.
      </p>

      <div className="space-y-3 mb-4">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => select(choice)}
            className={`w-full rounded-md p-4 text-left border transition-colors text-sm leading-relaxed ${
              selected.includes(choice) && !isCustomInput
                ? 'bg-ove-primary text-black border-ove-primary'
                : 'bg-ove-surface text-ove-primary border-ove-border hover:border-ove-muted'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>

      <button
        onClick={toggleCustomInput}
        className={`w-full rounded-md p-4 text-left border text-sm transition-colors mb-6 ${
          isCustomInput
            ? 'border-ove-muted text-ove-muted bg-ove-surface'
            : 'border-ove-border text-ove-muted hover:border-ove-muted bg-transparent'
        }`}
      >
        직접 적기
      </button>

      {isCustomInput && (
        <input
          type="text"
          value={customInput}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder='예: "나는 완벽해야 한다"'
          className="w-full bg-ove-surface text-ove-primary rounded-xl px-4 py-3 text-sm placeholder:text-ove-muted border border-ove-muted focus:outline-none mb-6"
          autoFocus
        />
      )}

      <div className="mt-auto">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || isLoading}
          className="w-full bg-ove-primary text-black py-4 rounded-md font-medium text-sm disabled:opacity-30 hover:brightness-110 transition-all"
        >
          {isLoading
            ? '잠시만요...'
            : !isCustomInput && selected.length > 1
            ? `이걸로 할게요 (${selected.length}개)`
            : '이걸로 할게요'}
        </button>
      </div>
    </main>
  );
}
