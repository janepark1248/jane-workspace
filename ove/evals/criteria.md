# Ove — AI Gradable Criteria

구현 전에 확정된 측정 기준. Evaluator는 이 기준으로 독립 검증한다.

---

## 1. Seed 탐지 (`evals/scripts/eval_seed.py`)

| 기준 | 통과 조건 |
|---|---|
| confidence 점수 | ≥ 0.7 |
| archetype 매핑 | 7개 카테고리 중 정확히 하나 |
| evidence 인용 | 대화에서 2개 이상 직접 인용 |
| label 형식 | 1인칭 현재형 문장 ("나는 ...") |
| 전체 정확도 | 골든 케이스 대비 ≥ 70% 일치 |

**7개 Archetype:**
1. 인정 욕구
2. 완벽주의
3. 통제 불안
4. 버림받음 공포
5. 무가치감
6. 관계 의존
7. 실패 두려움

---

## 2. 감정 분류 (`evals/scripts/eval_emotion.py`)

| 기준 | 통과 조건 |
|---|---|
| 카테고리 | 7개 중 정확히 하나 |
| 강도 | 1-10 정수 |
| emotion_label | `{감정 수식어} + {카테고리}` 형식 |
| 골든 케이스 정확도 | ≥ 75% 일치 |

**7개 감정 카테고리:**
불안 / 우울 / 수치심 / 분노 / 외로움 / 무기력 / 혼란

---

## 3. CBT 질문 품질

| 기준 | 통과 조건 |
|---|---|
| 직접 "왜?" 금지 | 질문에 "왜" 포함 시 실패 |
| 한 번에 하나 | 질문 내 `?` 1개만 허용 |
| 수렴 | 8턴 이내 Seed 선언 |
| INCONCLUSIVE 비율 | 전체 세션 중 < 20% |

---

## 4. 전체 세션 품질

| 지표 | 목표 |
|---|---|
| 세션 완료율 | > 80% |
| Seed 발견율 | > 80% |
| 유저 "맞다" 피드백 | > 70% |

---

## Eval 실행 방법

```bash
# 환경 변수 설정
export OPENAI_API_KEY=sk-...

# Seed 탐지 eval
python evals/scripts/eval_seed.py

# 감정 분류 eval
python evals/scripts/eval_emotion.py

# 결과는 evals/results/{timestamp}_summary.json 저장
```
