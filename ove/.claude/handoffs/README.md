# Handoff Artifact 형식

세션 또는 에이전트 전환 시 `.claude/handoffs/{feature}-handoff.md`를 작성한다.
Generator → Evaluator, 또는 장기 세션 컨텍스트 리셋 시 이 파일이 출발점이다.

---

## 파일 명명 규칙

```
{feature}-handoff.md
```

예시:
- `recording-handoff.md`
- `session-flow-handoff.md`
- `seed-ui-handoff.md`

---

## 템플릿

```markdown
# Handoff: {Feature 이름}
Date: YYYY-MM-DD
Sprint: sprint-{n}-{feature}
From: {Generator | Planner | 세션 ID}
To: {Evaluator | 다음 세션 | Generator}

## 완료된 것
- [ ] 항목 1
- [ ] 항목 2

## 미완료 / 다음 액션
- [ ] 항목 1 — 이유: ...
- [ ] 항목 2 — 이유: ...

## 주요 결정 사항
- 결정 내용: 이유 (대안 대비 선택 근거)

## 알려진 이슈
- 이슈 설명 (심각도: LOW / MED / HIGH)

## 테스트 상태
- [ ] XCTest 단위 테스트 통과
- [ ] eval_seed.py 기준 충족 (해당 시)
- [ ] eval_emotion.py 기준 충족 (해당 시)
- [ ] XCUITest E2E 통과 (해당 시)

## 참고 파일
- `ios/Ove/Features/{Feature}/...`
- `prompts/...`
- `evals/...`
```

---

## 작성 시점

| 시점 | 작성자 | 수신자 |
|---|---|---|
| Generator → Evaluator 전달 | Generator | Evaluator |
| 세션 컨텍스트 리셋 전 | 현재 에이전트 | 다음 세션 |
| 스프린트 완료 | Generator | 다음 스프린트 Generator |

---

## 주의사항

- `evals/criteria.md` 기준 미충족 항목은 **완료로 표기 금지**
- Evaluator는 이 파일을 읽고 Generator의 완료 주장을 **독립적으로 검증**
- 컨텍스트 리셋 후 새 세션은 이 파일부터 읽는다
