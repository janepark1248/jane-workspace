# ove — Claude Code 실행 지침

## 프로젝트 개요

ove는 CBT(인지행동치료) 기반 AI 웹 상담 앱이다.
텍스트 입력 → 재진술 → Socratic 질문 → 핵심 신념 발견 → 해석 + 행동 제안.

**앱 이름:** ove
**플랫폼:** Web (Next.js 16.2.4 + React 19)
**언어:** 한국어 우선
**AI:** Google Gemini 2.5 Flash Lite (`GEMINI_API_KEY` 환경 변수)
**로컬 DB:** Dexie (IndexedDB) — 클라우드 DB 없음

---

## 작업 전 필수 읽기

새 기능 구현 전 반드시 이 순서로 읽는다:

1. `docs/PRD.md` — 기능 요구사항, 데이터 모델, 품질 기준
2. `docs/DESIGN.md` — UI/UX, 톤앤매너, 컴포넌트 가이드 (작성된 경우)
3. `docs/ARCHITECTURE.md` — 레이어 구조, 의존성 규칙 (작성된 경우)
4. `evals/criteria.md` — AI 품질 기준 (구현 전 확인 필수)
5. 해당 스프린트 파일: `.claude/sprints/sprint-{n}-{feature}.md`

---

## 워크플로우

```
[Planner 단계]
  PRD.md 읽기 → DESIGN.md 작성 → ARCHITECTURE.md 작성

[Generator 단계]
  스프린트 계약 확인 → 테스트 먼저 작성 (TDD) → 구현 → 로컬 테스트 통과

[Evaluator 단계]
  npm run build 통과 → evals/ 스크립트 실행 → 품질 기준 충족 확인
  (Evaluator는 Generator와 다른 에이전트. 자기 평가 금지)

[Handoff]
  세션 종료 시 .claude/handoffs/{feature}-handoff.md 작성
```

---

## 코드 생성 규칙

### Next.js / React
- `web/` 디렉토리가 웹 앱 루트
- 페이지는 App Router 방식: `web/app/{route}/page.tsx`
- 공유 컴포넌트: `web/app/components/`
- AI API 호출은 `web/app/api/gemini/route.ts`만 통해서 (클라이언트에서 직접 호출 금지)
- 프롬프트는 `web/lib/prompts/*.ts`에서 관리 (코드에 인라인 금지)
- 상태 관리는 Zustand 스토어(`web/stores/*.ts`)로 — 로컬 컴포넌트 state는 최소화
- DB 접근은 `web/lib/db/session-db.ts`를 통해서만

### 프롬프트
- `web/lib/prompts/restatement-prompt.ts` — 재진술 (상황/생각/감정 분리)
- `web/lib/prompts/followup-prompt.ts` — 팔로우업 & Socratic 질문
- `web/lib/prompts/empathy-prompt.ts` — 공감 응답
- `web/lib/prompts/belief-hypothesis-prompt.ts` — 핵심 신념 가설
- `web/lib/prompts/belief-choices-prompt.ts` — 신념 선택지
- `web/lib/prompts/interpretation-prompt.ts` — 해석 + 행동 제안 + CBT 과제
- 프롬프트 변경은 이 파일만 수정 (route.ts 건드리지 않음)

### 데이터
- 모든 세션 데이터는 브라우저 IndexedDB에만 저장 (서버 전송 없음)
- `LocalSession` 타입 정의: `web/lib/models/session.ts`
- 세션 스키마 변경 시 Dexie 버전 업그레이드 필수 (`session-db.ts`)

---

## 개발 명령

```bash
# 개발 서버 시작
cd web && npm run dev

# 빌드 검증
cd web && npm run build

# AI 품질 eval (Python 3.11+, GEMINI_API_KEY 필요)
python evals/scripts/eval_seed.py
python evals/scripts/eval_emotion.py

# 스파이크 스크립트
python scripts/spike/seed_prompt_test.py
```

---

## 사용자 플로우 (라우트 순서)

```
/ (홈 — 최근 세션 + 입력창)
  ↓
/restatement/[id]  (재진술 확인)
  ↓
/restatement/[id]/followup  (팔로우업 & Socratic, STE 2회 + Socratic 2라운드)
  ↓
/empathy/[id]  (공감 응답)
  ↓
/belief-hypothesis/[id]  (핵심 신념 가설)
  ↓
/belief/[id]  (신념 선택 또는 커스텀 입력)
  ↓
/report/[id]  (최종 리포트: 해석 + 행동 제안 3개 + CBT 과제)
```

---

## 웹 앱 구조 자동 동기화 규칙

`web/` 디렉토리 안에 파일이나 디렉토리를 **추가·삭제·이동**한 경우,
같은 세션 안에서 반드시 아래 작업을 수행한다:

1. `## 웹 앱 구조 (web/)` → `### 파일 트리` 섹션을 현재 구조에 맞게 업데이트
2. 새 컴포넌트를 `app/components/`에 추가한 경우 → `### 컴포넌트 목록` 테이블에 행 추가
3. 새 레이어(예: 새 `lib/` 하위 디렉토리)가 생긴 경우 → `### 레이어 아키텍처` 검토 후 필요 시 수정

**트리거 조건:**
- `Write` 도구로 `web/` 아래 새 파일 생성
- `Bash`로 파일·디렉토리 이동·삭제 (`mv`, `rm`, `mkdir`)
- 기존 파일 수정(`Edit`)은 트리거하지 않음 — 구조 변경이 없으므로

**업데이트 범위:**
- 파일 트리: 전체 재작성 (현재 디렉토리 구조 기준)
- 컴포넌트 목록: 추가된 항목만 테이블에 삽입
- 레이어 아키텍처·데이터 플로우: 새 레이어가 추가된 경우에만 수정

---

## 웹 앱 구조 (web/)

### 파일 트리

```
web/
├── app/                               # Next.js App Router 루트
│   ├── layout.tsx                     # 전역 레이아웃 (폰트, 메타데이터)
│   ├── page.tsx                       # 홈 — 최근 세션 목록 + 새 입력창
│   ├── api/
│   │   └── gemini/
│   │       └── route.ts               # Gemini API 단일 엔드포인트 (서버 사이드)
│   ├── components/
│   │   ├── WaveLoading.tsx            # 공유 로딩 애니메이션 컴포넌트
│   │   └── TypingIndicator.tsx        # deep 채팅 ove 생각 중 세 점 bounce 인디케이터
│   ├── restatement/[id]/
│   │   ├── page.tsx                   # 재진술 확인 화면
│   │   └── followup/
│   │       └── page.tsx               # 팔로우업 & Socratic 질문 화면
│   ├── empathy/[id]/
│   │   └── page.tsx                   # 공감 응답 화면
│   ├── belief-hypothesis/[id]/
│   │   └── page.tsx                   # 핵심 신념 가설 화면
│   ├── belief/[id]/
│   │   └── page.tsx                   # 신념 선택/커스텀 입력 화면
│   ├── report/[id]/
│   │   └── page.tsx                   # 최종 리포트 화면
│   └── deep/[id]/
│       └── page.tsx                   # 딥챗 화면 (소크라테틱 3라운드 + 요약)
├── lib/
│   ├── ai/
│   │   └── gemini.ts                  # Gemini SDK 래퍼 (서버 전용)
│   ├── db/
│   │   └── session-db.ts              # Dexie(IndexedDB) 인스턴스 & 쿼리
│   ├── models/                        # TypeScript 타입 정의
│   │   ├── session.ts                 # LocalSession (최상위 세션 타입)
│   │   ├── restatement.ts             # Restatement (상황/생각/감정)
│   │   ├── belief-selection.ts        # BeliefSelection
│   │   ├── action-item.ts             # ActionItem
│   │   └── homework.ts                # Homework (CBT 과제)
│   ├── prompts/                       # AI 프롬프트 (코드 인라인 금지)
│   │   ├── restatement-prompt.ts
│   │   ├── followup-prompt.ts
│   │   ├── empathy-prompt.ts
│   │   ├── belief-hypothesis-prompt.ts
│   │   ├── belief-choices-prompt.ts
│   │   ├── interpretation-prompt.ts
│   │   └── deep-prompt.ts             # 딥챗 소크라테틱 프롬프트
│   └── session-state.ts               # 세션 상태 유틸리티
└── stores/                            # Zustand 전역 상태
    ├── restatement-store.ts           # 재진술 단계 상태
    ├── empathy-store.ts               # 공감 단계 상태
    ├── belief-hypothesis-store.ts     # 신념 가설 단계 상태
    ├── belief-store.ts                # 신념 선택 단계 상태
    ├── report-store.ts                # 리포트 단계 상태
    ├── deep-chat-store.ts             # 딥챗 단계 상태 (소크라테틱 3라운드)
    └── chat-store.ts                  # (레거시) 채팅 상태
```

### 레이어 아키텍처

```
┌──────────────────────────────────────────┐
│         Pages  (app/**/*.tsx)            │  UI 렌더링, 사용자 인터랙션
│  page.tsx → 스토어 구독 + 이벤트 발행   │
└────────────────┬─────────────────────────┘
                 │ 읽기/쓰기
┌────────────────▼─────────────────────────┐
│         Stores  (stores/*.ts)            │  전역 상태 (Zustand)
│  비동기 액션 → /api/gemini 호출         │
└──────────┬───────────────┬───────────────┘
           │ API 호출      │ DB 저장
┌──────────▼──────┐  ┌────▼──────────────┐
│ /api/gemini     │  │  session-db.ts    │  서버 엔드포인트 / 로컬 DB
│ (route.ts       │  │  (Dexie/IndexedDB)│
│  → gemini.ts)   │  └───────────────────┘
└─────────────────┘

의존성 방향: Pages → Stores → (API | DB)
역방향 참조 금지 (DB가 Store를 import하는 등)
```

### 컴포넌트 목록

| 컴포넌트 | 경로 | 역할 |
|----------|------|------|
| `WaveLoading` | `app/components/WaveLoading.tsx` | AI 응답 대기 중 파동 로딩 애니메이션 |
| `TypingIndicator` | `app/components/TypingIndicator.tsx` | deep 채팅 ove 생각 중 세 점 bounce 인디케이터 |

> 공유 컴포넌트는 `app/components/`에만 추가한다. 페이지 전용 UI는 각 `page.tsx` 안에 인라인으로 작성한다.

### 데이터 플로우

```
사용자 입력 (홈 page.tsx)
  → restatement-store.ts: callRestatement()
  → POST /api/gemini  (route.ts → gemini.ts → Gemini API)
  → 응답 파싱 → session-db.ts: saveSession()
  → /restatement/[id] 이동

각 단계마다:
  스토어 액션 → /api/gemini 호출 → DB 저장 → 다음 라우트로 이동
  세션 ID([id])가 전체 플로우를 연결하는 공유 키

데이터 경계:
  - 서버 전송 없음 — 모든 세션 데이터는 IndexedDB에만 보관
  - Gemini API 요청에는 프롬프트 + 사용자 텍스트만 포함 (개인 식별 정보 없음)
```

---

## 금지 사항

- `GEMINI_API_KEY` 코드 하드코딩 ❌
- 프롬프트를 컴포넌트나 스토어에 인라인 ❌
- 클라이언트 컴포넌트에서 Gemini API 직접 호출 ❌ (`/api/gemini`를 통해서만)
- Generator가 자신이 만든 코드를 Evaluator로서 평가 ❌
- `evals/criteria.md`의 기준 미충족 상태로 완료 처리 ❌
- 세션 데이터를 외부 서버로 전송 ❌ (개인정보 보호, IndexedDB 로컬 전용)

---

## Handoff 파일 형식

세션 종료 시 `.claude/handoffs/{feature}-handoff.md`를 작성한다:

```markdown
# Handoff: {Feature 이름}
Date: YYYY-MM-DD
Sprint: sprint-{n}-{feature}

## 완료된 것
- ...

## 미완료 / 다음 액션
- ...

## 주요 결정 사항
- ...

## 참고 파일
- `web/app/{route}/page.tsx`
- `web/stores/{feature}-store.ts`
- `web/lib/prompts/{feature}-prompt.ts`
```
