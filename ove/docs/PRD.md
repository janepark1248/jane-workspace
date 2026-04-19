# PRD: ove — CBT AI 음성 상담 앱

**Version:** 2.0
**Status:** APPROVED
**Last Updated:** 2026-04-14
**Source:** Deep Interview 세션 (`ove/.omc/specs/deep-interview-prd-v2.md`)

---

## 1. Overview

**ove**는 부정적인 감정이 들었을 때 말만 하면 되는 iOS 상담 앱이다.
AI가 사용자의 말을 듣고 상황·생각·감정을 분리하여 재진술하고, 인지행동심리 관점에서 근본적인 핵심 신념을 선택지로 제안하며, 구체적인 행동을 제안한다.
대화 내역은 기기에 로컬 저장되고, 누적 세션을 기반으로 사용자의 성격·성향·가치관을 담은 **Truth of Source** 리포트를 생성한다.

**핵심 차별점:** 기존 앱이 CBT 기법을 "숙제"로 전달하거나 긴 Socratic 대화를 강요하는 반면, ove는 사용자가 그냥 말하면 AI가 구조화해주고, 핵심 신념을 선택지로 제안해 빠르게 자기 인식에 도달하게 한다.

---

## 2. Problem Statement

기존 CBT 앱(Woebot, Wysa 등)의 문제:
- 미리 짜인 스크립트 기반 → "너무 대본 같다"는 유저 불만
- Woebot 4주 이상 사용률 22% — 핵심 신념 탐색 전 이탈
- 텍스트 기반 / 긴 Socratic 질문 흐름 → 부정적 감정 상태에서 진입 장벽

---

## 3. Target Users

**Primary:** 자신의 감정 패턴을 이해하고 싶은 성인 (20-40대, 한국어 사용자)
**Not:** 중증 정신질환자, 위기 상황 (명시적 고지 필요)

---

## 4. Core User Flow

```
[홈] 하루 잔여 세션 확인 (최대 3회)
  ↓ "지금 말하기"
[녹음] AVAudioRecorder → 음성 입력 (최소 10초, 최대 5분)
  ↓ Whisper API 전사
[재진술] AI가 상황(Situation) / 생각(Thought) / 감정(Emotion) 분리하여 재진술
  ↓ 세 요소 중 빠진 것이 있으면 → 보완 질문 (빠진 요소당 1회, 최대 3회)
  ↓ 사용자가 보이스로 답변
[핵심 신념 선택지] AI가 인지행동심리 관점에서 근본 신념 2-4개 선택지로 제안
  ↓ 없으면 직접 입력
[행동 제안] 선택된 신념에 대한 구체적 해석 + 행동 아이템 3개
  ↓ 행동 아이템 로컬 저장
[세션 완료] 대화 내역 로컬 저장 + Truth of Source 업데이트 (3회 이후)
```

---

## 5. Functional Requirements

### 음성 입력 (FR-01~03)
- **FR-01** 앱 내에서 음성 녹음 가능 (AVAudioRecorder, m4a 포맷)
- **FR-02** 녹음 완료 후 OpenAI Whisper API로 한국어 전사
- **FR-03** 녹음 파일은 전사 완료 후 즉시 삭제 (저장 안 함)

### 재진술 (FR-04~06)
- **FR-04** 전사 텍스트를 분석해 상황(Situation) / 생각(Thought) / 감정(Emotion) 세 요소로 분리하여 재진술 텍스트 생성
- **FR-05** 재진술을 화면에 표시하고 사용자가 내용을 확인
- **FR-06** 세 요소 중 하나라도 누락되었을 경우, 해당 요소에 대한 보완 질문을 1개씩 제시 (빠진 요소당 최대 1-3회, 보이스 답변)

### 핵심 신념 선택지 (FR-07~09)
- **FR-07** 상황/생각/감정이 모두 파악된 후, AI가 해당 대화 기반의 구체적 표현으로 핵심 신념 선택지 2-4개 생성 (예: "나는 실패하면 안 된다", "나는 인정받아야 가치 있다")
- **FR-08** 선택지 외에 "직접 입력" 옵션 제공
- **FR-09** 선택지 선택 또는 직접 입력 완료 후, 해당 신념에 대한 구체적 해석 텍스트(2-3문장) 표시

### 행동 제안 및 저장 (FR-10~12)
- **FR-10** 선택된 핵심 신념을 기반으로 구체적 행동 아이템 3개 제안 (인지 재구조화 + 행동적 개입 혼합)
- **FR-11** 제안된 행동 아이템은 로컬에 저장되고 히스토리 화면에서 다시 열람 가능
- **FR-12** 세션 완료 후 전체 대화 내역(전사 텍스트, 재진술, 보완 질문/답변, 선택된 신념, 행동 아이템)을 기기 로컬에 저장

### 세션 관리 (FR-13~15)
- **FR-13** 하루 최대 3회 세션, 자정(Asia/Seoul 00:00) 초기화
- **FR-14** 한도 초과 시 다음 리셋까지 카운트다운 표시
- **FR-15** 세션 중단 시 상태 저장, 재접속 시 이어서 진행 가능

### Truth of Source (FR-16~20)
- **FR-16** 3회 이상 세션 완료 후 Truth of Source 리포트 최초 생성
- **FR-17** 매 세션 완료 시 Truth of Source 자동 업데이트, 업데이트 시 유저에게 알림 표시
- **FR-18** Truth of Source는 기기 로컬에 저장 (Supabase 전송 없음)
- **FR-19** Truth of Source 내용:
  - **성격/성향/가치관 프로파일**: 누적 대화에서 드러난 유저의 성향 요약
  - **반복된 핵심 신념 패턴**: 여러 세션에 걸쳐 반복 등장한 신념 목록
  - **감정 히스토리 패턴**: 어떤 상황에서 어떤 감정이 반복되는지
- **FR-20** ove는 세션 시작 시 Truth of Source를 AI 프롬프트 컨텍스트로 활용하여 개인화된 재진술과 선택지를 생성

---

## 6. Non-functional Requirements

### 성능
- Whisper 전사 응답: < 5초 (2분 미만 녹음 기준)
- GPT-4o 재진술 생성: < 5초
- GPT-4o 핵심 신념 선택지 생성: < 5초
- 앱 콜드 스타트: < 3초

### 보안 / 개인정보 (PIPA 준수)
- 음성 파일: 전사 완료 후 즉시 삭제
- 대화 내용: 기기 로컬 저장만 (Supabase 전송 없음)
- 계정 정보 / 세션 메타데이터 (세션 수, 타임스탬프): Supabase RLS + HTTPS
- Truth of Source: 기기 로컬만 저장 (외부 전송 없음)
- 데이터 보유: 앱 삭제 또는 로컬 데이터 초기화 시 즉시 삭제
- API 키: iOS Keychain 저장, 코드 하드코딩 금지

### 법적 고지 (첫 세션 시작 전 모달)
```
"ove는 전문 심리치료를 대체하지 않습니다.
위기 상황 시 정신건강 위기상담 전화(1577-0199)로 연락하세요."
```

---

## 7. Out of Scope (v1)

| 항목 | 이유 |
|---|---|
| AI 음성 응답 (TTS) | 한국어 TTS 품질 + 개발 공수 리스크 |
| 결제 / 인앱구매 | 유저 검증 후 v2에서 StoreKit 2 추가 |
| 텍스트 입력 대안 | 보이스 퍼스트 검증 후 v2 고려 |
| 영어 / 다국어 지원 | 한국어 우선 검증 |
| 전문 상담사 연결 | 범위 외 |
| Android | iOS 검증 후 |
| Truth of Source 클라우드 동기화 | v2에서 선택적 백업 기능 추가 고려 |

---

## 8. AI Quality Requirements

Claude Code가 구현 시 반드시 충족해야 할 AI 품질 기준 (`evals/criteria.md` 참고):

| 기능 | 기준 |
|---|---|
| 재진술 | 상황/생각/감정 세 요소를 명확히 분리, 원문을 왜곡하지 않음 |
| 보완 질문 | 직접 "왜?" 없음, 빠진 요소 1개에 집중, 1회 1질문 |
| 핵심 신념 선택지 | 해당 대화에서 실제 사용된 표현 기반, 2-4개, 과도하게 추상적이지 않음 |
| 해석 텍스트 | 판단/평가 없는 공감 어조, 2-3문장 |
| Truth of Source | 3회 이상 데이터 기반, 성향 추론은 근거 인용 포함 |
| INCONCLUSIVE 처리 | 보완 질문 3회 후에도 요소 미확인 시, 부분 정보로 선택지 진행 |

---

## 9. Session Quota Model

```swift
// 하루 3회 한도 로직
let today = Date.today(timezone: "Asia/Seoul")
let sessionCount = supabase.sessions.count(where: date == today, userId: currentUser)
if sessionCount >= 3 { return .quotaExceeded }
```

- 서버 사이드 강제: `session-gate` Edge Function이 429 반환
- 클라이언트는 로컬 카운터로 UX 처리 (서버 응답 전 즉시 피드백)
- 세션 메타데이터(카운트, 타임스탬프)만 Supabase에 기록, 대화 내용은 포함하지 않음

---

## 10. Data Model

### 클라우드 (Supabase)

```sql
-- users: 유저 계정
users (id UUID PK, email TEXT, created_at TIMESTAMP)

-- session_meta: 세션 메타데이터 (카운트 관리용, 내용 없음)
session_meta (
  id UUID PK,
  user_id UUID FK,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status TEXT    -- 'completed' | 'interrupted'
)
```

### 로컬 (Core Data / SwiftData)

```swift
// LocalSession: 세션 전체 내용 (로컬만 저장)
LocalSession {
  id: UUID
  userId: String        // Supabase user ID 참조용
  startedAt: Date
  completedAt: Date?
  status: String        // 'completed' | 'interrupted'
  transcript: String    // Whisper 전사 텍스트
  restatement: Restatement
  followUpQA: [FollowUpQA]
  beliefSelection: BeliefSelection
  actionItems: [ActionItem]
}

// Restatement: 상황/생각/감정 재진술
Restatement {
  situation: String
  thought: String
  emotion: String
  isComplete: Bool     // 세 요소 모두 파악 여부
}

// FollowUpQA: 보완 질문/답변 쌍
FollowUpQA {
  targetElement: String   // 'situation' | 'thought' | 'emotion'
  question: String
  answerTranscript: String
}

// BeliefSelection: 핵심 신념 선택 결과
BeliefSelection {
  choices: [String]        // AI 제안 선택지 2-4개
  selectedChoice: String   // 선택된 신념
  isCustomInput: Bool      // 직접 입력 여부
  interpretation: String   // AI 해석 텍스트
}

// ActionItem: 행동 아이템
ActionItem {
  id: UUID
  sessionId: UUID
  text: String
  type: String      // 'cognitive' | 'behavioral'
  createdAt: Date
  isReviewed: Bool  // 히스토리에서 확인 여부
}

// TruthOfSource: 누적 분석 리포트 (1개, 매 세션 후 업데이트)
TruthOfSource {
  userId: String
  personalityProfile: String    // 성격/성향/가치관 요약
  beliefPatterns: [BeliefPattern]
  emotionPatterns: [EmotionPattern]
  sessionCount: Int              // 생성/업데이트 기준 세션 수
  generatedAt: Date
  updatedAt: Date
}

BeliefPattern {
  belief: String        // 핵심 신념 표현
  frequency: Int        // 등장 세션 수
  firstSeenAt: Date
}

EmotionPattern {
  emotion: String       // 감정 유형
  triggerPattern: String // 주로 어떤 상황에서 등장하는지
  frequency: Int
}
```

---

## 11. Success Metrics

| 지표 | 목표 | 측정 방법 |
|---|---|---|
| 세션 완료율 | > 80% | session_meta 완료 수 / 시작 수 |
| 핵심 신념 선택률 | > 85% | BeliefSelection 완료 세션 / 전체 |
| 선택지 만족도 ("맞다" 반응) | > 70% | 세션 종료 후 간단 피드백 (👍/👎) |
| Truth of Source 열람률 | > 50% | 생성 후 1주 내 열람한 유저 비율 |
| 일일 재방문율 (D7) | > 30% | 7일 후 재사용 유저 비율 |
| 보완 질문 평균 횟수 | < 2회 | FollowUpQA 평균 count per session |

---

## 12. Glossary

| 용어 | 정의 |
|---|---|
| **재진술 (Restatement)** | AI가 사용자의 말에서 상황(Situation) / 생각(Thought) / 감정(Emotion)을 분리하여 구조화한 요약 |
| **보완 질문 (Follow-up Question)** | 재진술에서 누락된 요소를 확인하기 위한 AI의 단일 질문 (요소당 최대 1-3회) |
| **핵심 신념 (Core Belief)** | CBT의 Core Belief. 반복적인 부정 감정의 근본 원인이 되는 깊은 믿음. 해당 대화의 구체적 표현으로 제시 |
| **Truth of Source** | 누적 세션 데이터(3회 이상)를 기반으로 ove가 분석한 유저의 성격/성향/가치관/신념 패턴 리포트. 유저가 열람 가능하며 다음 세션의 AI 컨텍스트로 활용됨 |
| **Session** | 유저가 녹음 시작부터 행동 제안 수신까지의 한 사이클 |
| **Quota** | 하루 최대 세션 수 (v1: 3회) |
| **Handoff** | 클로드 코드 세션 간 컨텍스트 인계 파일 |
