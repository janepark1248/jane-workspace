'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReportStore } from '@/stores/report-store';
import { WaveLoading } from '@/app/components/WaveLoading';

const ACTION_TYPE_LABELS: Record<string, string> = {
  cognitive: '생각',
  behavioral: '행동',
};

const HOMEWORK_TYPE_LABELS: Record<string, string> = {
  thoughtRecord: '생각 들여다보기',
  behavioralExperiment: '직접 해보기',
  activityScheduling: '활동 계획',
  evidenceLog: '실제로 확인해보기',
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
        <WaveLoading message="당신의 속마음을 관찰한 기록을 작성중이에요" />
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

  const beliefs = session?.beliefSelection?.selectedChoices ?? [];

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <h2 className="text-xl font-light text-ove-primary mb-8">오늘의 기록</h2>

      {session?.transcript && (
        <div className="mb-6 animate-card-in" style={{ animationDelay: '0ms' }}>
          <p className="text-ove-muted text-xs uppercase tracking-widest mb-2">내가 한 말</p>
          <div className="bg-ove-surface rounded-xl p-4 border border-ove-border">
            <p className="text-ove-primary text-sm leading-relaxed whitespace-pre-wrap">{session.transcript}</p>
          </div>
        </div>
      )}

      {beliefs.length > 0 && (
        <div className="mb-6 animate-card-in" style={{ animationDelay: '150ms' }}>
          <p className="text-ove-muted text-xs uppercase tracking-widest mb-2">드러난 믿음</p>
          <div className="bg-ove-surface rounded-xl p-4 border border-ove-border space-y-2">
            {beliefs.map((b) => (
              <p key={b} className="text-ove-primary text-sm font-medium">"{b}"</p>
            ))}
          </div>
        </div>
      )}

      {interpretation && (
        <div className="mb-6 animate-card-in" style={{ animationDelay: '300ms' }}>
          <p className="text-ove-muted text-xs uppercase tracking-widest mb-2">해석</p>
          <div className="bg-ove-surface rounded-xl p-4 border border-ove-border">
            <p className="text-ove-primary text-sm leading-relaxed">{interpretation}</p>
          </div>
        </div>
      )}

      {actionItems.length > 0 && (
        <div className="mb-6 animate-card-in" style={{ animationDelay: '450ms' }}>
          <p className="text-ove-muted text-xs uppercase tracking-widest mb-3">해볼 수 있는 것들</p>
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
        <div className="mb-8 animate-card-in" style={{ animationDelay: '600ms' }}>
          <p className="text-ove-muted text-xs uppercase tracking-widest mb-3">오늘 하나만</p>
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

      <div className="mt-auto flex flex-col gap-3 animate-card-in" style={{ animationDelay: '750ms' }}>
        <button
          onClick={() => router.push(`/deep/${id}`)}
          className="w-full border border-ove-border text-ove-primary py-4 rounded-md font-medium text-sm hover:bg-ove-surface transition-colors"
        >
          이에 관해 더 대화하기
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-ove-primary text-black py-4 rounded-md font-medium text-sm hover:brightness-110 transition-all"
        >
          마무리하기
        </button>
      </div>
    </main>
  );
}
