# ove — Claude Code 실행 지침

## 프로젝트 개요

ove는 iOS(SwiftUI) CBT AI 음성 상담 앱이다.
보이스 입력 → 감정 리포트 → Socratic 질문 → Seed(핵심 신념) 발견 → 액션 제안.

**앱 이름:** ove
**플랫폼:** iOS 17+ / SwiftUI
**언어:** 한국어 우선
**백엔드:** Supabase + OpenAI API (Whisper + GPT-4o)

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
  XCUITest 실행 → evals/ 스크립트 실행 → 품질 기준 충족 확인
  (Evaluator는 Generator와 다른 에이전트. 자기 평가 금지)

[Handoff]
  세션 종료 시 .claude/handoffs/{feature}-handoff.md 작성
```

---

## 코드 생성 규칙

### iOS / SwiftUI
- iOS 17+ API만 사용
- 기능별 디렉토리 구조 유지: `ios/Ove/Features/{Feature}/`
- `Core/AI/` 하위 코드만 OpenAI API 직접 호출
- 프롬프트는 `prompts/` 디렉토리에서 로드 (코드에 인라인 금지)
- Keychain으로만 API 키 저장 (UserDefaults, 코드 하드코딩 금지)

### 프롬프트
- `prompts/system_cbt.md` — CBT 시스템 프롬프트
- `prompts/emotion_classifier.md` — 감정 분류
- `prompts/seed_declarator.md` — Seed 선언
- 프롬프트 변경은 코드 변경 없이 이 파일만 수정

### 데이터
- 모든 DB 접근은 `Core/Network/SupabaseClient.swift`를 통해
- RLS 정책 준수 — 유저는 자신의 데이터만 접근
- 음성 파일은 전사 완료 즉시 삭제 (로컬 저장 금지)

---

## 테스트 실행

```bash
# XCTest 단위 테스트
xcodebuild test -project ios/Ove.xcodeproj -scheme Ove -destination 'platform=iOS Simulator,name=iPhone 16'

# AI 품질 eval (Python 3.11+, OPENAI_API_KEY 필요)
python evals/scripts/eval_seed.py
python evals/scripts/eval_emotion.py

# 스파이크 스크립트
python scripts/spike/whisper_benchmark.py
python scripts/spike/seed_prompt_test.py
```

---

## 금지 사항

- API 키 코드 하드코딩 ❌
- `prompts/` 파일 내용을 Swift 코드에 인라인 ❌
- Generator가 자신이 만든 코드를 Evaluator로서 평가 ❌
- `evals/criteria.md`의 기준 미충족 상태로 완료 처리 ❌
- 음성 파일 Supabase Storage 업로드 ❌ (개인정보 보호)

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
- `ios/Ove/Features/{Feature}/...`
```

---

## 스프린트 계획 (v1, 6주)

| Sprint | 기능 | 주요 파일 |
|---|---|---|
| 1 | 스파이크 + Xcode 스캐폴딩 + DB 스키마 | `scripts/spike/`, `supabase/migrations/` |
| 2 | 보이스 입력 + Whisper + 1차 리포트 | `Features/Recording/`, `Features/Report/` |
| 3 | CBT 질문 흐름 + 상태 머신 | `Features/Session/` |
| 4 | Seed 발견 + Seed 카드 UI | `Features/Seed/` |
| 5 | 세션 한도 + 자정 초기화 + 히스토리 | `supabase/functions/session-gate/` |
| 6+ | TestFlight 베타 → 피드백 | — |
