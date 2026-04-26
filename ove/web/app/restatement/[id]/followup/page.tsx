'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRestatementStore } from '@/stores/restatement-store';
import { WaveLoading } from '@/app/components/WaveLoading';

export default function FollowUpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [answerText, setAnswerText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const {
    isLoading,
    followUpQuestion,
    socraticChoices,
    currentPhase,
    readyForEmpathy,
    error,
    loadFollowUp,
    submitFollowUp,
  } = useRestatementStore();

  useEffect(() => {
    loadFollowUp(id);
  }, [id, loadFollowUp]);

  useEffect(() => {
    if (readyForEmpathy) {
      router.push(`/empathy/${id}`);
    }
  }, [readyForEmpathy, id, router]);

  useEffect(() => {
    setAnswerText('');
    setShowCustomInput(false);
  }, [followUpQuestion]);

  const handleSubmit = async () => {
    if (!answerText.trim()) return;
    const text = answerText.trim();
    setAnswerText('');
    await submitFollowUp(id, text);
  };

  const handleChoiceSelect = async (choice: string) => {
    await submitFollowUp(id, choice);
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

  const hasChoices = currentPhase === 'socratic' && socraticChoices && socraticChoices.length > 0;

  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="bg-ove-surface rounded-2xl p-6 border border-ove-border">
          <p className="text-ove-primary text-base leading-relaxed">{followUpQuestion}</p>
        </div>

        {hasChoices && !showCustomInput ? (
          <div className="flex flex-col gap-2">
            {socraticChoices!.map((choice) => (
              <button
                key={choice}
                onClick={() => handleChoiceSelect(choice)}
                disabled={isLoading}
                className="w-full text-left bg-ove-surface border border-ove-border rounded-xl px-4 py-3 text-ove-primary text-sm leading-relaxed hover:border-ove-muted transition-colors disabled:opacity-30"
              >
                {choice}
              </button>
            ))}
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-ove-muted text-xs text-center mt-1 hover:text-ove-primary transition-colors"
            >
              직접 입력할게요
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              placeholder="생각나는 대로 적어보세요..."
              autoFocus
              className="w-full bg-ove-surface text-ove-primary rounded-xl p-4 resize-none text-sm leading-relaxed placeholder:text-ove-muted border border-ove-border focus:outline-none focus:border-ove-muted transition-colors min-h-24"
            />
            {hasChoices && (
              <button
                onClick={() => setShowCustomInput(false)}
                className="text-ove-muted text-xs text-center -mt-3 hover:text-ove-primary transition-colors"
              >
                선택지로 돌아가기
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!answerText.trim() || isLoading}
              className="w-full py-3.5 rounded-xl bg-ove-primary text-black text-sm font-medium disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              {isLoading ? '잠시만요...' : '계속하기'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
