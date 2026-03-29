# PRD: ove — CBT AI 음성 상담 앱

**Version:** 1.0
**Status:** APPROVED
**Last Updated:** 2026-03-29
**Source:** `/office-hours` 디자인 세션 → 설계 문서 기반

---

## 1. Overview

**ove**는 부정적인 감정이 들었을 때 말만 하면 되는 iOS 상담 앱이다.
AI가 대화를 분석해 1차 감정 리포트를 제공하고, CBT 기법의 Socratic 질문으로 감정의 뿌리 신념(Seed)을 발견하며, 생각을 바꾸는 방법과 구체적인 행동을 제안한다.

**핵심 차별점:** 기존 앱이 CBT 기법을 "숙제"로 전달하는 반면, ove는 핵심 신념 발견을 목적으로 삼고 기법을 수단으로 사용한다.

---

## 2. Problem Statement

기존 CBT 앱(Woebot, Wysa 등)의 문제:
- 미리 짜인 스크립트 기반 → "너무 대본 같다"는 유저 불만
- Woebot 4주 이상 사용률 22% — 핵심 신념 탐색 전 이탈
- Wysa Module 5(핵심 신념 작업) 진입 시점에 이탈율 급증
- 텍스트 기반 → 부정적 감정 상태에서 타이핑 장벽

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
[1차 리포트] 감정 분류 + 강도 + AI 인사이트 (무료 공개)
  ↓ "심화 탐색 시작"
[CBT 질문 흐름] AI Socratic 질문 (최대 8턴, 유저 보이스 답변)
  ↓ Seed 탐지 (confidence > 0.7) 또는 8턴 강제 수렴
[Seed 발견] 핵심 신념 카드 표시
  ↓
[액션 제안] 인지 재구조화 방법 + 구체적 행동 3가지
  ↓
[세션 완료] 히스토리 저장
```

---

## 5. Functional Requirements

### 음성 입력 (FR-01~03)
- **FR-01** 앱 내에서 음성 녹음 가능 (AVAudioRecorder, m4a 포맷)
- **FR-02** 녹음 완료 후 OpenAI Whisper API로 한국어 전사
- **FR-03** 녹음 파일은 전사 완료 후 즉시 삭제 (저장 안 함)

### 1차 리포트 (FR-04~06)
- **FR-04** 전사 텍스트 기반 감정 분류 (7개 카테고리)
- **FR-05** 감정 강도 1-10 점수 생성
- **FR-06** AI 인사이트 텍스트 생성 (2-3문장)

### CBT 질문 흐름 (FR-07~10)
- **FR-07** AI가 Socratic 질문 생성 (최대 8턴)
- **FR-08** 유저는 각 질문에 보이스로 답변
- **FR-09** 4-8턴 내 Seed 선언 또는 8턴 강제 수렴
- **FR-10** Seed 미확정 시(INCONCLUSIVE) 부분 리포트 저장 및 안내 메시지

### Seed 발견 (FR-11~12)
- **FR-11** Seed 카드 표시 (핵심 신념 한 문장 + 아키타입 라벨 + 대화 인용)
- **FR-12** 인지 재구조화 제안 + 액션 아이템 3개

### 세션 관리 (FR-13~15)
- **FR-13** 하루 최대 3회 세션, 자정(Asia/Seoul 00:00) 초기화
- **FR-14** 한도 초과 시 다음 리셋까지 카운트다운 표시
- **FR-15** 세션 중단 시 상태 저장, 재접속 시 이어서 진행 가능

---

## 6. Non-functional Requirements

### 성능
- Whisper 전사 응답: < 5초 (2분 미만 녹음 기준)
- GPT-4o 응답: < 5초 (질문 1개 기준)
- 앱 콜드 스타트: < 3초

### 보안 / 개인정보 (PIPA 준수)
- 음성 파일: 전사 완료 후 즉시 삭제
- 대화 내용: Supabase RLS + HTTPS 저장
- 데이터 보유: 12개월 (탈퇴 시 즉시 삭제)
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

---

## 8. AI Quality Requirements

Claude Code가 구현 시 반드시 충족해야 할 AI 품질 기준 (`evals/criteria.md` 참고):

| 기능 | 기준 |
|---|---|
| Seed 탐지 | confidence > 0.7, 7개 아키타입 중 매핑, 대화 인용 2개 이상 |
| 감정 분류 | 7개 카테고리 중 하나, 강도 1-10 |
| 질문 품질 | 직접 "왜?" 없음, 한 번에 하나, 8턴 내 수렴 |
| INCONCLUSIVE 비율 | < 20% (전체 세션 중) |

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

---

## 10. Data Model

```sql
-- users: 유저 계정
users (id UUID PK, email TEXT, created_at TIMESTAMP, daily_session_count INT)

-- sessions: 각 상담 세션
sessions (
  id UUID PK,
  user_id UUID FK,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  transcript TEXT,           -- 초기 음성 전사 텍스트
  state JSONB,               -- {step, conversation_history} 중단 복원용
  status TEXT                -- 'in_progress' | 'completed' | 'inconclusive'
)

-- reports: 1차 감정 리포트
reports (
  id UUID PK,
  session_id UUID FK,
  emotion_primary TEXT,      -- '불안'
  emotion_label TEXT,        -- '자기비판적 불안'
  intensity INT,             -- 1-10
  insight_text TEXT
)

-- seeds: Seed 발견 결과
seeds (
  id UUID PK,
  session_id UUID FK,
  label TEXT,                -- '나는 인정받아야만 가치 있다'
  archetype TEXT,            -- '인정 욕구'
  evidence_quotes JSONB,     -- ["대화 인용 1", "대화 인용 2"]
  confidence FLOAT,          -- 0.0-1.0
  actions JSONB              -- [{text: "...", type: "cognitive"|"behavioral"}]
)
```

---

## 11. Success Metrics

| 지표 | 목표 | 측정 방법 |
|---|---|---|
| 세션 완료율 (1차 리포트까지) | > 80% | sessions 완료 수 / 시작 수 |
| Seed 발견율 | > 80% | SEED_FOUND 상태 세션 / 전체 |
| Seed 정확도 ("맞다" 반응) | > 70% | 세션 종료 후 간단 피드백 (👍/👎) |
| 일일 재방문율 (D7) | > 30% | 7일 후 재사용 유저 비율 |
| INCONCLUSIVE 비율 | < 20% | evals 측정 |

---

## 12. Glossary

| 용어 | 정의 |
|---|---|
| **Seed** | CBT의 Core Belief(핵심 신념). 반복적인 부정 감정의 근본 원인이 되는 깊은 믿음. |
| **Session** | 유저가 녹음 시작부터 액션 제안 수신까지의 한 사이클 |
| **Archetype** | Seed를 분류하는 7개 카테고리: 인정 욕구 / 완벽주의 / 통제 불안 / 버림받음 공포 / 무가치감 / 관계 의존 / 실패 두려움 |
| **INCONCLUSIVE** | AI가 충분한 정보 없이 Seed를 확정하지 못한 세션 상태 |
| **Quota** | 하루 최대 세션 수 (v1: 3회) |
| **Handoff** | 클로드 코드 세션 간 컨텍스트 인계 파일 |
