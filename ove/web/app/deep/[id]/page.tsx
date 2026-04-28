'use client';

import { use, useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDeepChatStore } from '@/stores/deep-chat-store';
import { WaveLoading } from '@/app/components/WaveLoading';
import { TypingIndicator } from '@/app/components/TypingIndicator';

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

export default function DeepChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { session, round, showContinueChoice, currentQuestion, qa, summary, isLoading, pendingAnswer, error, load, submitAnswer, continueTalking, finishChat } =
    useDeepChatStore();

  const [inputText, setInputText] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load(id);
  }, [id, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qa, summary, currentQuestion, pendingAnswer]);

  const handleSubmit = async () => {
    const text = inputText.trim();
    if (!text || isLoading || round === 'summary') return;
    setInputText('');
    await submitAnswer(id, text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading && !session) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <WaveLoading message="대화를 준비하고 있어요" />
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

  const belief = session?.beliefSelection?.selectedChoices?.join(' 그리고 ');
  const interpretation = session?.beliefSelection?.interpretation;
  const actionItems = session?.actionItems ?? [];
  const homework = session?.homework;

  return (
    <main className="min-h-screen flex flex-col">
      {/* 접이식 리포트 패널 */}
      <div className="border-b border-ove-border">
        <button
          onClick={() => setReportOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <span className="text-ove-muted text-sm">오늘의 리포트 보기</span>
          <span className="text-ove-muted text-sm">{reportOpen ? '▲' : '▶'}</span>
        </button>

        {reportOpen && (
          <div className="px-6 pb-6 space-y-4">
            {belief && (
              <div>
                <p className="text-ove-muted text-xs uppercase tracking-widest mb-1">드러난 믿음</p>
                <div className="bg-ove-surface rounded-xl p-3 border border-ove-border">
                  <p className="text-ove-primary text-sm">"{belief}"</p>
                </div>
              </div>
            )}
            {interpretation && (
              <div>
                <p className="text-ove-muted text-xs uppercase tracking-widest mb-1">해석</p>
                <div className="bg-ove-surface rounded-xl p-3 border border-ove-border">
                  <p className="text-ove-primary text-sm leading-relaxed">{interpretation}</p>
                </div>
              </div>
            )}
            {actionItems.length > 0 && (
              <div>
                <p className="text-ove-muted text-xs uppercase tracking-widest mb-1">해볼 수 있는 것들</p>
                <div className="space-y-2">
                  {actionItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-ove-surface rounded-xl p-3 border border-ove-border flex gap-2"
                    >
                      <span className="text-ove-muted text-xs bg-ove-border rounded px-2 py-0.5 self-start shrink-0">
                        {ACTION_TYPE_LABELS[item.type] ?? item.type}
                      </span>
                      <p className="text-ove-primary text-sm leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {homework && (
              <div>
                <p className="text-ove-muted text-xs uppercase tracking-widest mb-1">오늘 하나만</p>
                <div className="bg-ove-surface rounded-xl p-3 border border-ove-border">
                  <span className="text-ove-muted text-xs bg-ove-border rounded px-2 py-0.5 mr-2">
                    {HOMEWORK_TYPE_LABELS[homework.type] ?? homework.type}
                  </span>
                  <p className="text-ove-primary text-sm leading-relaxed mt-2">{homework.description}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 대화 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {qa.map((item) => (
          <div key={item.round} className="space-y-3">
            {/* AI 질문 */}
            <div className="flex gap-3">
              <span className="text-ove-muted text-xs shrink-0 mt-1">ove</span>
              <div className="bg-ove-surface rounded-xl p-4 border border-ove-border flex-1">
                <p className="text-ove-primary text-sm leading-relaxed">{item.question}</p>
              </div>
            </div>
            {/* 사용자 답변 */}
            <div className="flex gap-3 justify-end">
              <div className="bg-ove-border rounded-xl p-4 max-w-xs">
                <p className="text-ove-primary text-sm leading-relaxed">{item.answer}</p>
              </div>
              <span className="text-ove-muted text-xs shrink-0 mt-1">나</span>
            </div>
          </div>
        ))}

        {/* 현재 라운드 질문 (아직 답변 전) */}
        {round !== 'summary' && currentQuestion && (
          <div
            key={currentQuestion}
            className="flex gap-3"
            style={{ animation: 'ove-fade-in-up 0.35s ease forwards' }}
          >
            <span className="text-ove-muted text-xs shrink-0 mt-1">ove</span>
            <div className="bg-ove-surface rounded-xl p-4 border border-ove-border flex-1">
              <p className="text-ove-primary text-sm leading-relaxed">{currentQuestion}</p>
            </div>
          </div>
        )}

        {/* 사용자 답변 즉시 표시 (optimistic) */}
        {pendingAnswer && (
          <div className="flex gap-3 justify-end">
            <div className="bg-ove-border rounded-xl p-4 max-w-xs">
              <p className="text-ove-primary text-sm leading-relaxed">{pendingAnswer}</p>
            </div>
            <span className="text-ove-muted text-xs shrink-0 mt-1">나</span>
          </div>
        )}

        {/* ove 생각 중 인디케이터 */}
        {isLoading && pendingAnswer !== null && <TypingIndicator />}

        {/* 마무리 요약 */}
        {round === 'summary' && summary && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-ove-muted text-xs shrink-0 mt-1">ove</span>
              <div className="bg-ove-surface rounded-xl p-4 border border-ove-border flex-1">
                <p className="text-ove-muted text-xs mb-2">오늘 대화를 마치며</p>
                <p className="text-ove-primary text-sm leading-relaxed">{summary}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      {showContinueChoice ? (
        <div className="px-6 py-4 border-t border-ove-border space-y-2">
          <p className="text-ove-muted text-xs text-center mb-3">더 이야기해볼까요?</p>
          <button
            onClick={() => continueTalking()}
            disabled={isLoading}
            className="w-full border border-ove-border text-ove-primary py-3.5 rounded-xl text-sm font-medium hover:border-ove-muted transition-colors disabled:opacity-30"
          >
            {isLoading ? '잠시만요...' : '계속 탐색할게요'}
          </button>
          <button
            onClick={() => finishChat()}
            disabled={isLoading}
            className="w-full bg-ove-primary text-black py-3.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            {isLoading ? '잠시만요...' : '여기서 마무리할게요'}
          </button>
        </div>
      ) : round !== 'summary' ? (
        <div className="px-6 py-4 border-t border-ove-border">
          <div className="flex gap-3 items-end">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="떠오르는 대로 적어보세요"
              rows={3}
              disabled={isLoading}
              autoFocus
              className="flex-1 bg-ove-surface border border-ove-border rounded-xl px-4 py-3 text-ove-primary text-sm placeholder:text-ove-muted resize-none focus:outline-none focus:border-ove-muted transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isLoading}
              className="bg-ove-primary text-black px-5 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              →
            </button>
          </div>
          <p className="text-ove-muted text-xs mt-2 text-right">Cmd+Enter로 제출</p>
        </div>
      ) : (
        <div className="px-6 py-4 border-t border-ove-border">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-ove-primary text-black py-4 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            마무리하기
          </button>
        </div>
      )}
    </main>
  );
}
