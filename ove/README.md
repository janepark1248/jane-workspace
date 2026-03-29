# ove

CBT 기반 AI 음성 상담 iOS 앱.
부정적 감정이 올라올 때 말로 털어놓으면, AI가 Socratic 질문으로 핵심 신념(Seed)을 발견하고 인지 재구조화를 돕는다.

**플랫폼:** iOS 17+ / SwiftUI
**언어:** 한국어
**백엔드:** Supabase + OpenAI (Whisper + GPT-4o)

---

## 핵심 플로우

```
보이스 입력 → 감정 리포트 → CBT 질문 (4-8턴) → Seed 발견 → 액션 제안
```

1. **Recording** — 말하고 싶을 때 마이크 버튼
2. **Report** — Whisper 전사 → 1차 감정 리포트 (감정 분류, 강도, 인사이트)
3. **Session** — GPT-4o Socratic 질문으로 핵심 신념 탐색
4. **Seed** — "나는 인정받지 못하면 존재 가치가 없다" 형태의 신념 카드
5. **Action** — 인지 재구조화 + 오늘 실천 제안

일 3회, 자정(Asia/Seoul) 초기화.

---

## 레포지터리 구조

```
ove/
├── docs/               ← PRD, DESIGN, ARCHITECTURE
├── ios/                ← SwiftUI 앱 (Xcode에서 직접 생성)
│   ├── Ove/Features/   ← Onboarding, Recording, Report, Session, Seed
│   ├── Ove/Core/       ← AI, Audio, Network, Storage
│   ├── OveTests/       ← XCTest
│   └── OveUITests/     ← XCUITest E2E
├── supabase/           ← 마이그레이션, Edge Functions
├── prompts/            ← GPT-4o 프롬프트 (코드와 분리)
├── evals/              ← AI 품질 하네스
│   ├── criteria.md     ← 측정 기준 (구현 전 확정)
│   ├── data/           ← 골든 케이스 JSONL
│   └── scripts/        ← eval_seed.py, eval_emotion.py
├── scripts/spike/      ← 개발 전 필수 스파이크
└── .claude/            ← Claude Code 하네스
    ├── agents/         ← Planner, Generator, Evaluator 역할 정의
    ├── handoffs/       ← 세션 간 인계 파일
    └── sprints/        ← 스프린트 계약
```

---

## 시작하기

### 필수 도구

- Xcode 16+
- Python 3.11+
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 환경 변수

```bash
export OPENAI_API_KEY=sk-...
```

iOS 앱의 API 키는 Keychain에만 저장한다 (코드 하드코딩 금지).

### AI 품질 검증

```bash
python evals/scripts/eval_seed.py
python evals/scripts/eval_emotion.py
```

### 스파이크 (Sprint 1 시작 전 필수)

```bash
python scripts/spike/whisper_benchmark.py --samples-dir ./samples/
python scripts/spike/seed_prompt_test.py
```

---

## 개발 워크플로우

Claude Code 기반 개발. `CLAUDE.md`와 `.claude/` 디렉토리 참고.

```
Planner → DESIGN.md, ARCHITECTURE.md 작성
Generator → TDD로 구현 (스프린트 단위)
Evaluator → 독립 검증 (자기 평가 금지)
```

스프린트 계획: `CLAUDE.md` 하단 표 참고.

---

## 문서

- [`docs/PRD.md`](docs/PRD.md) — 기능 요구사항, 데이터 모델
- [`evals/criteria.md`](evals/criteria.md) — AI 품질 측정 기준
- [`CLAUDE.md`](CLAUDE.md) — Claude Code 실행 지침
