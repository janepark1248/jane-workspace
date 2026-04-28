'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEmpathyStore } from '@/stores/empathy-store';
import { WaveLoading } from '@/app/components/WaveLoading';

export default function EmpathyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { empathyText, isLoading, error, load } = useEmpathyStore();

  useEffect(() => {
    load(id);
  }, [id, load]);

  if (isLoading && !empathyText) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <WaveLoading message="마음을 느끼고 있어요" />
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
      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-ove-surface rounded-xl p-6 border border-ove-border">
          <p className="text-ove-primary text-base leading-relaxed">{empathyText}</p>
        </div>
      </div>

      <button
        onClick={() => router.push(`/belief-hypothesis/${id}`)}
        className="w-full bg-ove-primary text-black py-4 rounded-md font-medium text-sm hover:brightness-110 transition-all"
      >
        계속하기
      </button>
    </main>
  );
}
