'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBeliefStore } from '@/stores/belief-store';

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

  const canConfirm = isCustomInput ? customInput.trim().length > 0 : selected !== null;

  if (isLoading && choices.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ove-muted text-sm animate-pulse">신념 선택지 생성 중...</p>
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
      <h2 className="text-xl font-light text-ove-primary mb-2">핵심 신념을 선택해주세요</h2>
      <p className="text-ove-muted text-sm mb-8">
        이 대화에서 드러난 나의 믿음이에요. 가장 맞는 것을 선택해주세요.
      </p>

      <div className="space-y-3 mb-4">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => select(choice)}
            className={`w-full rounded-xl p-4 text-left border transition-colors text-sm leading-relaxed ${
              selected === choice && !isCustomInput
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
        className={`w-full rounded-xl p-4 text-left border text-sm transition-colors mb-6 ${
          isCustomInput
            ? 'border-ove-muted text-ove-muted bg-ove-surface'
            : 'border-ove-border text-ove-muted hover:border-ove-muted bg-transparent'
        }`}
      >
        ✏️ 직접 입력하기
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
          className="w-full bg-ove-primary text-black py-4 rounded-xl font-medium text-sm disabled:opacity-30 hover:opacity-90 transition-opacity"
        >
          {isLoading ? '처리 중...' : '이게 맞아요 →'}
        </button>
      </div>
    </main>
  );
}
