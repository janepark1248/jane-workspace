# Evals — AI 품질 하네스

ove의 AI 기능(Seed 탐지, 감정 분류)의 품질을 독립적으로 측정한다.
Generator가 아닌 **Evaluator 전용** 스크립트다. 자기 평가 금지.

---

## 실행 전 준비

```bash
export OPENAI_API_KEY=sk-...
pip install openai  # 또는 uv pip install openai
```

---

## Eval 스크립트

### Seed 탐지 정확도

```bash
python evals/scripts/eval_seed.py
```

- 골든 케이스: `evals/data/seed_detection/cases.jsonl` (5개)
- 통과 기준: 70% 이상 (≥ 3/5)
- 평가 항목: archetype 정확도, confidence ≥ 0.7, evidence ≥ 2개, label "나는..." 형식

### 감정 분류 정확도

```bash
python evals/scripts/eval_emotion.py
```

- 골든 케이스: `evals/data/emotion_classification/cases.jsonl` (5개)
- 통과 기준: 70% 이상 (≥ 3/5)
- 평가 항목: emotion_primary 정확도, intensity 범위, insight 존재

---

## 결과 파일

`evals/results/{YYYYMMDD_HHMMSS}_{type}_eval.json`

- 전체 요약: `timestamp`, `total`, `passed`, `accuracy`, `overall`
- 케이스별 상세: `details[].status`, `details[].failures`
- `.gitignore`: 개별 결과 파일은 커밋 제외. 요약만 선택적으로 커밋.

---

## 기준 정의

`evals/criteria.md` — 구현 전에 확정된 측정 기준.
기준 변경은 Planner 에이전트를 통해 PRD 검토 후 진행한다.

---

## 골든 케이스 추가

```bash
# evals/data/seed_detection/cases.jsonl 에 JSONL 형식으로 추가
{"id": "sd-006", "transcript": "...", "conversation": [...], "expected": {"archetype": "...", "label_contains": "...", "min_confidence": 0.75}}

# evals/data/emotion_classification/cases.jsonl 에 추가
{"id": "ec-006", "transcript": "...", "expected": {"emotion_primary": "...", "intensity_range": [5, 9]}}
```

케이스 추가 시 `expected` 필드의 기준은 `evals/criteria.md`에서 확인한다.

---

## 스파이크 스크립트 (개발 시작 전)

```bash
# 한국어 Whisper 정확도 (CER < 0.10 목표)
python scripts/spike/whisper_benchmark.py --samples-dir ./samples/

# Seed 프롬프트 빠른 검증 (API 키 없이 구조 확인)
python scripts/spike/seed_prompt_test.py
```

스파이크는 Sprint 1에서 반드시 실행하고 결과를 확인한 후 음성 파이프라인을 확정한다.
