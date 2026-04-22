'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReportStore } from '@/stores/report-store';

const ACTION_TYPE_LABELS: Record<string, string> = {
  cognitive: '생각',
  behavioral: '행동',
};

const HOMEWORK_TYPE_LABELS: Record<string, string> = {
  thoughtRecord: '자동적 사고 기록',
  behavioralExperiment: '행동 실험',
  activityScheduling: '활동 계획',
  evidenceLog: '증거 수집',
  selfCompassion: '자기 자비',
};

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { session, interpretation, actionItems, homework, isLoading, error, load } =
    useReportStore();

  useEffect(() => {
    load(id);
  }, [id, load]);

  if (isLoading && !session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ove-muted text-sm animate-pulse">리포트 생성 중...</p>
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

  const belief = session?.beliefSelection?.selectedChoice;

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <h2 className="text-xl font-light text-ove-primary mb-8">오늘의 리포트</h2>

      {belief && (
        <div className="mb-6">
          <p className="text-ove-muted text-xs uppercase tracking-widest mb-2">핵심 신념</p>
          <div className="bg-ove-surface rounded-xl p-4 border border-ove-border">
            <p className="text-ove-primary text-sm font-medium">"{belief}"</p>
          </div>
        </div>
      )}

      {interpretation && (
        <div className="mb-6">
          <p className="text-ove-muted text-xs uppercase tracking-widest mb-2">해석</p>
          <div className="bg-ove-surface rounded-xl p-4 border border-ove-border">
            <p className="text-ove-primary text-sm leading-relaxed">{interpretation}</p>
          </div>
        </div>
      )}

      {actionItems.length > 0 && (
        <div className="mb-6">
          <p className="text-ove-muted text-xs uppercase tracking-widest mb-3">행동 제안</p>
          <div className="space-y-3">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="bg-ove-surface rounded-xl p-4 border border-ove-border flex gap-3"
              >
                <span className="text-ove-muted text-xs bg-ove-border rounded px-2 py-0.5 self-start shrink-0 mt-0.5">
                  {ACTION_TYPE_LABELS[item.type] ?? item.type}
                </span>
                <p className="text-ove-primary text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {homework && (
        <div className="mb-8">
          <p className="text-ove-muted text-xs uppercase tracking-widest mb-3">오늘의 과제</p>
          <div className="bg-ove-surface rounded-xl p-4 border border-ove-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-ove-muted text-xs bg-ove-border rounded px-2 py-0.5">
                {HOMEWORK_TYPE_LABELS[homework.type] ?? homework.type}
              </span>
            </div>
            <p className="text-ove-primary text-sm leading-relaxed">{homework.description}</p>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={() => router.push('/')}
          className="w-full bg-ove-primary text-black py-4 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
        >
          완료
        </button>
      </div>
    </main>
  );
}
