# PRD: ove — CBT AI 웹 상담 앱

**Version:** 3.0 (Web)
**Status:** APPROVED
**Last Updated:** 2026-04-29
**Source:** Deep Interview 세션 → Flutter → Next.js 마이그레이션 완료

---

## 1. Overview

**ove**는 부정적인 감정이 들었을 때 텍스트로 상황을 입력하면 AI가 CBT(인지행동치료) 관점으로 구조화해주는 웹 상담 앱이다.
AI가 사용자의 말을 상황·생각·감정으로 분리하여 재진술하고, 소크라테스식 질문으로 핵심 신념을 탐색하며, 구체적인 행동 제안과 CBT 과제를 제공한다.
모든 대화 내역은 브라우저 IndexedDB에만 저장되며 서버로 전송되지 않는다.

**핵심 차별점:** 사용자가 그냥 텍스트로 상황을 입력하면 AI가 CBT 구조로 정리해주고, 핵심 신념을 선택지로 제안해 빠르게 자기 인식에 도달하게 한다.

---

## 2. Problem Statement

기존 CBT 앱(Woebot, Wysa 등)의 문제:
- 미리 짜인 스크립트 기반 → "너무 대본 같다"는 유저 불만
- Woebot 4주 이상 사용률 22% — 핵심 신념 탐색 전 이탈
- 긴 Socratic 질문 흐름 → 부정적 감정 상태에서 진입 장벽

---

## 3. Target Users

**Primary:** 자신의 감정 패턴을 이해하고 싶은 성인 (20-40대, 한국어 사용자)
**Not:** 중증 정신질환자, 위기 상황 (명시적 고지 필요)

---

## 4. Core User Flow

```
[홈] 최근 세션 목록 확인 + 텍스트 입력창
  ↓ 상황 텍스트 입력 (최대 2,000자)
[재진술] AI가 상황(Situation) / 생각(Thought) / 감정(Emotion) 분리하여 재진술
  ↓ 누락 요소가 있으면 → STE 보완 질문 (요소당 1회, 텍스트 답변)
  ↓ Socratic 질문 2라운드 (Round 1: 선택지 제공, Round 2: 자유 답변)
[공감] AI가 상황 전체를 공감하는 응답 제공
[핵심 신념 가설] AI가 CBT 관점의 핵심 신념 가설 2-4개 제시
[신념 선택] 선택지 중 선택 또는 커스텀 입력
[리포트] 선택된 신념에 대한 해석 + 행동 제안 3개 + CBT 과제
  ↓ (선택) 딥챗: 소크라테스식 심화 대화 3라운드 + 요약
[세션 완료] IndexedDB에 전체 대화 내역 저장
```

---

## 5. Functional Requirements

### 텍스트 입력 (FR-01)

- **FR-01** 홈 화면에서 텍스트로 상황 입력 (최대 2,000자)

### 재진술 (FR-02~04)

- **FR-02** 입력 텍스트를 분석해 상황(Situation) / 생각(Thought) / 감정(Emotion) 세 요소로 분리하여 재진술 생성 (paraphrase 포함)
- **FR-03** 세 요소 중 누락이 있을 경우 해당 요소에 대한 STE 보완 질문 제시 (텍스트 답변)
- **FR-04** 보완 후 소크라테스식 질문 2라운드 진행 (Round 1: 질문 + 선택지, Round 2: 자유 답변)

### 공감 응답 (FR-05)

- **FR-05** STE 및 Socratic 답변을 종합하여 공감 응답 텍스트 생성 (판단 없는 어조)

### 핵심 신념 탐색 (FR-06~08)

- **FR-06** 대화 맥락 기반으로 핵심 신념 가설 2-4개 생성 (구체적 표현, 추상적 표현 혼합)
- **FR-07** 가설에서 핵심 신념 선택지 2-4개 생성, "직접 입력" 옵션 포함
- **FR-08** 선택 또는 직접 입력 완료 후 신념에 대한 해석 텍스트 (2-3문장) 생성

### 리포트 (FR-09~10)

- **FR-09** 선택된 핵심 신념 기반으로 행동 제안 3개 생성 (인지적/행동적 혼합)
- **FR-10** CBT 과제 1개 생성 (thoughtRecord, behavioralExperiment, activityScheduling, evidenceLog, selfCompassion 중 하나)

### 딥챗 (FR-11~12)

- **FR-11** 리포트 이후 소크라테스식 심화 대화 3라운드 제공 (선택적)
- **FR-12** 3라운드 완료 후 전체 대화 요약 제공

### 데이터 저장 (FR-13~14)

- **FR-13** 세션 전체(재진술, 팔로우업, 공감, 신념, 행동 제안, CBT 과제, 딥챗) IndexedDB에 저장
- **FR-14** 홈 화면에서 이전 세션 목록 조회 및 재열람 가능

### 위기 감지 (FR-15)

- **FR-15** 자해·자살 관련 키워드 감지 시 AI 응답 중단 + 위기상담전화(1393) 안내 메시지 반환

---

## 6. Non-functional Requirements

### 성능

- Gemini 재진술 생성: < 5초
- Gemini 기타 응답: < 5초
- 페이지 전환: < 200ms (클라이언트 사이드 라우팅)
- 앱 초기 로드: < 3초

### 보안 / 개인정보

- 대화 내용: 브라우저 IndexedDB에만 저장 (서버 전송 없음)
- Gemini API 요청: 프롬프트 + 사용자 텍스트만 포함 (개인 식별 정보 없음)
- API 키: 서버 환경변수(`GEMINI_API_KEY`)로만 관리, 클라이언트 노출 없음
- 입력 길이 제한: 2,000자 (서버 측 검증)

### 법적 고지

위기 키워드 감지 시:
```
"지금 많이 힘드신 것 같아요. 혼자 감당하기 어려우시다면
자살예방상담전화(1393)에 연락해보세요. 24시간 전화 상담을 받을 수 있어요."
```

---

## 7. Out of Scope (v1)

| 항목 | 이유 |
|---|---|
| 음성 입력 | 텍스트 우선 검증 후 v2 고려 |
| 계정/인증 | 로컬 전용, 클라우드 동기화 없음 |
| Truth of Source (누적 분석) | v2에서 IndexedDB 누적 데이터 기반으로 추가 |
| 세션 횟수 제한 | v1 무제한 (v2에서 필요 시 로컬 카운터로 구현) |
| 결제 / 인앱구매 | 유저 검증 후 v2 |
| 영어 / 다국어 지원 | 한국어 우선 검증 |
| Android 앱 | iOS 검증 후 (현재 Web) |
| 클라우드 백업 | 개인정보 보호 우선 |

---

## 8. AI Quality Requirements

구현 시 반드시 충족해야 할 AI 품질 기준 (`evals/criteria.md` 참고):

| 기능 | 기준 |
|---|---|
| 재진술 | 상황/생각/감정 세 요소 명확히 분리, 원문 왜곡 없음, paraphrase 포함 |
| STE 보완 질문 | 직접 "왜?" 없음, 누락 요소 1개에 집중, 1회 1질문 |
| Socratic 질문 | Round 1 선택지 3개 이상, Round 2 자유 질문 |
| 공감 응답 | 판단/평가 없는 공감 어조, 2-3문장 |
| 핵심 신념 가설 | 대화에서 사용된 표현 기반, 2-4개, 과도하게 추상적이지 않음 |
| 신념 선택지 | 가설에서 도출, 2-4개, 직접 입력 옵션 포함 |
| 해석 텍스트 | 판단 없는 어조, 2-3문장 |
| 행동 제안 | 인지적/행동적 혼합, 구체적, 3개 |
| 위기 감지 | 자해·자살 키워드 감지 → AI 응답 대신 위기상담 안내 |

---

## 9. Data Model

### 클라이언트 (IndexedDB / Dexie)

```typescript
// LocalSession: 세션 전체 (로컬만 저장)
interface LocalSession {
  id: string;
  startedAt: string;           // ISO timestamp
  completedAt?: string;
  status: 'inProgress' | 'completed' | 'interrupted';
  transcript: string;          // 사용자 원문 입력
  restatement?: Restatement;
  followUpQA: FollowUpQA[];
  empathyResponse?: string;
  beliefHypotheses?: Array<{ text: string; belief: string }>;
  beliefSelection?: BeliefSelection;
  actionItems: ActionItem[];
  homework?: Homework;
  deepChat?: DeepChatQA[];
  deepChatSummary?: string;
}

// Restatement: 상황/생각/감정 재진술
interface Restatement {
  situation: string;
  thought: string;
  emotion: string;
  paraphrase?: string;
}

// FollowUpQA: 팔로우업 질답 (STE 보완 + Socratic)
interface FollowUpQA {
  targetElement?: 'situation' | 'thought' | 'emotion';
  question: string;
  answerText: string;
  phase: 'ste' | 'socratic';
  socraticRound?: 1 | 2;
}

// BeliefSelection: 핵심 신념 선택 결과
interface BeliefSelection {
  choices: string[];            // AI 제안 선택지 2-4개
  selectedChoices: string[];    // 선택된 신념
  isCustomInput: boolean;
  interpretation: string;       // AI 해석 텍스트
}

// ActionItem: 행동 제안
interface ActionItem {
  id: string;
  sessionId: string;
  text: string;
  type: 'cognitive' | 'behavioral';
  createdAt: string;
}

// Homework: CBT 과제
interface Homework {
  type: 'thoughtRecord' | 'behavioralExperiment' | 'activityScheduling' | 'evidenceLog' | 'selfCompassion';
  description: string;
}

// DeepChatQA: 딥챗 질답
interface DeepChatQA {
  question: string;
  answer: string;
  round: number;
}
```

### 서버

서버 측 데이터베이스 없음. Gemini API 키만 서버 환경변수로 관리.

---

## 10. AI API

- **모델:** `gemini-2.5-flash-lite` (Google Gemini)
- **엔드포인트:** `/api/gemini` (Next.js API Route, 서버 사이드)
- **액션:** `restatement` | `followup` | `socraticFollowup` | `empathy` | `beliefHypothesis` | `beliefChoices` | `interpretation` | `deepChat`
- **Safety:** `HARM_CATEGORY_DANGEROUS_CONTENT`, `HARM_CATEGORY_HARASSMENT` → BLOCK_MEDIUM_AND_ABOVE

---

## 11. Success Metrics

| 지표 | 목표 | 측정 방법 |
|---|---|---|
| 세션 완료율 | > 80% | completed 세션 / 전체 시작 세션 (IndexedDB) |
| 핵심 신념 선택률 | > 85% | beliefSelection 완료 세션 / 전체 |
| 딥챗 진입률 | > 30% | deepChat 데이터 있는 세션 / 전체 |

---

## 12. Glossary

| 용어 | 정의 |
|---|---|
| **재진술 (Restatement)** | AI가 사용자의 말에서 상황(Situation) / 생각(Thought) / 감정(Emotion)을 분리하여 구조화한 요약 |
| **STE 보완 질문** | 재진술에서 누락된 요소를 확인하기 위한 AI의 단일 질문 |
| **Socratic 질문** | STE 파악 후 핵심 신념 탐색을 위한 소크라테스식 심화 질문 (2라운드) |
| **핵심 신념 (Core Belief)** | CBT의 Core Belief. 반복적인 부정 감정의 근본 원인이 되는 깊은 믿음 |
| **딥챗 (Deep Chat)** | 리포트 이후 소크라테스식 심화 대화 3라운드 + 요약 (선택적) |
| **Session** | 사용자가 텍스트 입력부터 리포트 수신까지의 한 사이클 |
| **Handoff** | 클로드 코드 세션 간 컨텍스트 인계 파일 |
