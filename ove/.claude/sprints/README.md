# Sprint 계약 형식

각 스프린트는 `.claude/sprints/sprint-{n}-{feature}.md` 파일로 관리한다.
Generator는 구현 시작 전 해당 스프린트 파일을 반드시 읽는다.

---

## 파일 명명 규칙

```
sprint-{n}-{feature}.md
```

예시:
- `sprint-1-scaffold.md`
- `sprint-2-recording.md`
- `sprint-3-session-flow.md`

---

## 템플릿

```markdown
# Sprint {n}: {Feature 이름}
Date: YYYY-MM-DD ~ YYYY-MM-DD
Status: PLANNED | IN_PROGRESS | DONE

## 목표 (Definition of Done)
이 스프린트가 완료되었다는 것은 다음이 모두 참일 때다:
- [ ] 조건 1
- [ ] 조건 2
- [ ] XCTest 통과
- [ ] evals/ 기준 충족 (AI 기능 포함 시)

## 구현 범위 (In Scope)
- 항목 1
- 항목 2

## 제외 범위 (Out of Scope)
- 항목 1 (→ Sprint {n+1}로 이월)

## 주요 파일
- `ios/Ove/Features/{Feature}/`
- `prompts/...`
- `supabase/...`

## 의존성
- Sprint {n-1} 완료 필요: ...
- 외부 의존: OPENAI_API_KEY, Supabase 프로젝트

## 테스트 계획
- Unit: `ios/OveTests/{Feature}Tests.swift`
- E2E: `ios/OveUITests/{Feature}UITests.swift`
- Eval: `evals/scripts/eval_{module}.py` (해당 시)

## 메모
- 설계 결정 사항, 주의사항 등
```

---

## 스프린트 상태 전환 규칙

```
PLANNED → IN_PROGRESS : Generator가 구현 시작 시
IN_PROGRESS → DONE    : Evaluator가 Definition of Done 모두 검증 완료 시
```

- Generator는 스스로 DONE으로 변경할 수 없다
- Evaluator가 독립적으로 검증 후 DONE 처리

---

## v1 스프린트 목록

| Sprint | Feature | Status |
|---|---|---|
| 1 | 스파이크 + Xcode 스캐폴딩 + DB 스키마 | PLANNED |
| 2 | 보이스 입력 + Whisper + 1차 리포트 | PLANNED |
| 3 | CBT 질문 흐름 + 상태 머신 | PLANNED |
| 4 | Seed 발견 + Seed 카드 UI | PLANNED |
| 5 | 세션 한도 + 자정 초기화 + 히스토리 | PLANNED |
| 6 | TestFlight 베타 준비 | PLANNED |
