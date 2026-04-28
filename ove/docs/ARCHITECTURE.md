# Architecture: ove Web

**Version:** 1.0
**Last Updated:** 2026-04-29
**Platform:** Next.js 16 (App Router) + React 19

---

## 1. 레이어 구조

```
┌──────────────────────────────────────────┐
│         Pages  (app/**/*.tsx)            │  UI 렌더링, 사용자 인터랙션
│  page.tsx → 스토어 구독 + 이벤트 발행   │  'use client'
└────────────────┬─────────────────────────┘
                 │ 읽기/쓰기
┌────────────────▼─────────────────────────┐
│         Stores  (stores/*.ts)            │  전역 상태 (Zustand 5)
│  비동기 액션 → /api/gemini 또는 DB 호출 │
└──────────┬───────────────┬───────────────┘
           │ fetch POST    │ put/get
┌──────────▼──────┐  ┌────▼──────────────────┐
│ /api/gemini     │  │  lib/db/session-db.ts  │
│ (route.ts)      │  │  Dexie (IndexedDB)     │
│  ↓              │  └────────────────────────┘
│ lib/ai/gemini.ts│  클라이언트 전용, 서버 전송 없음
│ (클라이언트     │
│  fetch 래퍼)    │
│  ↓              │
│ Gemini API      │  서버 환경변수: GEMINI_API_KEY
└─────────────────┘  모델: gemini-2.5-flash-lite
```

**의존성 방향:** Pages → Stores → (API Route | DB)
**역방향 참조 금지:** DB가 Store를 import하는 등

---

## 2. 파일 구조

```
web/
├── app/                               # Next.js App Router 루트
│   ├── layout.tsx                     # 전역 레이아웃 (폰트, 메타데이터)
│   ├── page.tsx                       # 홈 — 최근 세션 목록 + 새 입력창
│   ├── api/
│   │   └── gemini/
│   │       └── route.ts               # Gemini API 서버 엔드포인트 (서버 사이드)
│   ├── components/
│   │   ├── WaveLoading.tsx            # AI 응답 대기 중 파동 로딩 애니메이션
│   │   └── TypingIndicator.tsx        # 딥챗 ove 생각 중 세 점 bounce 인디케이터
│   ├── restatement/[id]/
│   │   ├── page.tsx                   # 재진술 확인 화면
│   │   └── followup/
│   │       └── page.tsx               # STE 보완 + Socratic 질문 화면
│   ├── empathy/[id]/
│   │   └── page.tsx                   # 공감 응답 화면
│   ├── belief-hypothesis/[id]/
│   │   └── page.tsx                   # 핵심 신념 가설 화면
│   ├── belief/[id]/
│   │   └── page.tsx                   # 신념 선택/커스텀 입력 화면
│   ├── report/[id]/
│   │   └── page.tsx                   # 최종 리포트 화면
│   ├── deep/[id]/
│   │   └── page.tsx                   # 딥챗 화면 (Socratic 3라운드 + 요약)
│   └── chat/
│       └── page.tsx                   # (레거시, 미사용)
├── lib/
│   ├── ai/
│   │   └── gemini.ts                  # /api/gemini 클라이언트 fetch 래퍼
│   ├── db/
│   │   └── session-db.ts              # Dexie(IndexedDB) 인스턴스 & 쿼리
│   ├── models/                        # TypeScript 타입 정의
│   │   ├── session.ts                 # LocalSession, FollowUpQA, DeepChatQA
│   │   ├── restatement.ts             # Restatement + 유틸 함수
│   │   ├── belief-selection.ts        # BeliefSelection
│   │   ├── action-item.ts             # ActionItem
│   │   └── homework.ts                # Homework
│   └── prompts/                       # AI 프롬프트 (코드 인라인 금지)
│       ├── restatement-prompt.ts      # 상황/생각/감정 분리 재진술
│       ├── followup-prompt.ts         # STE 보완 + Socratic 질문
│       ├── empathy-prompt.ts          # 공감 응답
│       ├── belief-hypothesis-prompt.ts # 핵심 신념 가설
│       ├── belief-choices-prompt.ts   # 신념 선택지
│       ├── interpretation-prompt.ts   # 해석 + 행동 제안 + CBT 과제
│       ├── deep-prompt.ts             # 딥챗 Socratic 프롬프트
│       └── guard-prompt.ts            # 위기 감지 / 가드 프롬프트
└── stores/                            # Zustand 전역 상태
    ├── restatement-store.ts           # 재진술 단계 상태
    ├── empathy-store.ts               # 공감 단계 상태
    ├── belief-hypothesis-store.ts     # 신념 가설 단계 상태
    ├── belief-store.ts                # 신념 선택 단계 상태
    ├── report-store.ts                # 리포트 단계 상태
    ├── deep-chat-store.ts             # 딥챗 상태 (Socratic 3라운드)
    └── chat-store.ts                  # (레거시, 미사용)
```

---

## 3. AI 액션 패턴

새 AI 기능 추가 시 반드시 이 순서를 따른다:

```
1. lib/prompts/{action}-prompt.ts     시스템 프롬프트 + 사용자 메시지 빌더
2. app/api/gemini/route.ts            case '{action}' 분기 추가
3. lib/ai/gemini.ts                   generate{Action}() 클라이언트 래퍼 추가
4. stores/{feature}-store.ts          상태 및 호출 로직
5. app/{route}/page.tsx               UI 구현
```

`route.ts`의 generate/generateJson 선택 기준:
- **`generateJson<T>()`** — 구조화된 JSON 응답 필요 시 (재진술, 신념 선택지 등)
- **`generate()`** — 자유 텍스트 응답 (공감, 딥챗 등)

---

## 4. 데이터 플로우

```
사용자 텍스트 입력 (홈 page.tsx)
  → restatement-store.ts 액션 호출
  → POST /api/gemini { action: 'restatement', transcript }
  → route.ts: generateJson<Restatement>()
  → Gemini API 응답
  → saveSession() → IndexedDB
  → /restatement/[id] 라우트 이동

각 단계:
  스토어 액션 → POST /api/gemini → DB 저장 → 다음 라우트
  세션 ID([id])가 전체 플로우를 연결하는 공유 키

데이터 경계:
  - 서버 저장 없음 — 모든 세션 데이터는 IndexedDB에만 보관
  - Gemini API 요청에는 프롬프트 + 사용자 텍스트만 포함
```

---

## 5. 보안 설계

| 항목 | 구현 |
|---|---|
| API 키 | 서버 환경변수(`GEMINI_API_KEY`), 클라이언트 노출 없음 |
| 입력 검증 | `route.ts`에서 서버 측 길이 제한 (MAX_TEXT_LENGTH = 2,000자) |
| 위기 감지 | 자해·자살 키워드 → AI 응답 대신 위기상담 안내 반환 |
| Safety Settings | DANGEROUS_CONTENT, HARASSMENT → BLOCK_MEDIUM_AND_ABOVE |
| Gemini 호출 | 클라이언트에서 직접 Gemini SDK 호출 금지, `/api/gemini`만 경유 |

---

## 6. 사용자 플로우 (라우트 순서)

```
/ (홈 — 최근 세션 + 입력창)
  ↓
/restatement/[id]             재진술 확인
  ↓
/restatement/[id]/followup    STE 보완 질문 + Socratic 2라운드
  ↓
/empathy/[id]                 공감 응답
  ↓
/belief-hypothesis/[id]       핵심 신념 가설
  ↓
/belief/[id]                  신념 선택 또는 커스텀 입력
  ↓
/report/[id]                  최종 리포트 (해석 + 행동 제안 + CBT 과제)
  ↓ (선택)
/deep/[id]                    딥챗 (Socratic 3라운드 + 요약)
```

---

## 7. 색상 팔레트

Warm Red 다크모드 + 유사색(±30°) 하모니.

```
--color-ove-bg:          #100f0f   배경
--color-ove-surface:     #1e1b1a   카드
--color-ove-primary:     #e9e7e7   텍스트 & 버튼
--color-ove-muted:       #947e7a   보조 텍스트
--color-ove-border:      #2f2928   테두리
--color-ove-accent:      #e67965   강조 (Warm Red, 9°)
--color-ove-accent-warm: #e2af50   유사색 H+30° (39°, 황금)
--color-ove-accent-cool: #e25083   유사색 H-30° (339°, 로즈)
```

---

## 8. 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| 상태 관리 | Zustand 5 |
| 로컬 DB | Dexie 4 (IndexedDB) |
| AI | Google Gemini 2.5 Flash Lite |
| 언어 | TypeScript |
