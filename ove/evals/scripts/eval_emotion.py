#!/usr/bin/env python3
"""
Ove — 감정 분류 Eval
evals/criteria.md 기준으로 GPT-4o의 감정 분류 정확도를 측정한다.
독립 Evaluator 전용 스크립트. Generator와 분리 실행.

Usage:
    export OPENAI_API_KEY=sk-...
    python evals/scripts/eval_emotion.py
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("ERROR: openai 패키지 필요. pip install openai")
    sys.exit(1)

CASES_PATH = Path(__file__).parent.parent / "data" / "emotion_classification" / "cases.jsonl"
PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"
RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

# evals/criteria.md 기준
VALID_EMOTIONS = {"불안", "우울", "수치심", "분노", "외로움", "공허함", "무기력"}
MIN_INTENSITY = 1
MAX_INTENSITY = 10
PASS_THRESHOLD = 0.70


def load_emotion_prompt() -> str:
    prompt_path = PROMPTS_DIR / "emotion_classifier.md"
    if not prompt_path.exists():
        print(f"WARNING: {prompt_path} 없음. 기본 프롬프트 사용.")
        return "사용자 전사 텍스트에서 감정을 분류하세요. JSON으로만 응답."
    return prompt_path.read_text(encoding="utf-8")


def load_cases() -> list[dict]:
    cases = []
    with open(CASES_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                cases.append(json.loads(line))
    return cases


def run_emotion_classification(client: OpenAI, case: dict, prompt_template: str) -> dict:
    user_message = prompt_template.replace("{transcript}", case["transcript"])

    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "당신은 감정 분류 전문가입니다. JSON으로만 응답하세요."},
            {"role": "user", "content": user_message},
        ],
        temperature=0.1,
    )
    return json.loads(response.choices[0].message.content)


def evaluate_result(result: dict, expected: dict) -> tuple[bool, list[str]]:
    """criteria.md 기준으로 결과를 평가한다."""
    failures = []

    # emotion_primary 유효성
    emotion = result.get("emotion_primary", "")
    if emotion not in VALID_EMOTIONS:
        failures.append(f"emotion_primary '{emotion}' 유효하지 않음 (허용: {VALID_EMOTIONS})")
    elif expected.get("emotion_primary") and emotion != expected["emotion_primary"]:
        failures.append(f"emotion_primary 불일치: 기대 '{expected['emotion_primary']}', 실제 '{emotion}'")

    # intensity 범위
    intensity = result.get("intensity", 0)
    if not (MIN_INTENSITY <= intensity <= MAX_INTENSITY):
        failures.append(f"intensity {intensity} 범위 외 (허용: {MIN_INTENSITY}~{MAX_INTENSITY})")

    # intensity 기대 범위 확인
    intensity_range = expected.get("intensity_range", [])
    if intensity_range and not (intensity_range[0] <= intensity <= intensity_range[1]):
        failures.append(
            f"intensity {intensity} 기대 범위 외 ({intensity_range[0]}~{intensity_range[1]})"
        )

    # insight 존재 여부 (criteria: 감정 배경 설명)
    insight = result.get("insight", "")
    if not insight or len(insight) < 10:
        failures.append("insight 누락 또는 너무 짧음")

    return len(failures) == 0, failures


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY 환경 변수를 설정하세요.")
        sys.exit(1)

    client = OpenAI(api_key=api_key)
    prompt_template = load_emotion_prompt()
    cases = load_cases()

    print("=== Ove Emotion Classification Eval ===")
    print(f"케이스 수: {len(cases)}")
    print(f"통과 기준: {PASS_THRESHOLD * 100:.0f}%\n")

    results = []
    passed = 0

    for case in cases:
        case_id = case["id"]
        print(f"[{case_id}] 실행 중...", end=" ")

        try:
            result = run_emotion_classification(client, case, prompt_template)
            ok, failures = evaluate_result(result, case["expected"])

            status = "PASS" if ok else "FAIL"
            if ok:
                passed += 1
                print(
                    f"✅ PASS (emotion: {result.get('emotion_primary')}, "
                    f"intensity: {result.get('intensity')})"
                )
            else:
                print("❌ FAIL")
                for f in failures:
                    print(f"   - {f}")

            results.append({
                "id": case_id,
                "status": status,
                "result": result,
                "failures": failures,
            })

        except Exception as e:
            print(f"⚠️  ERROR: {e}")
            results.append({"id": case_id, "status": "ERROR", "error": str(e)})

    # 결과 출력
    accuracy = passed / len(cases)
    overall = "PASS" if accuracy >= PASS_THRESHOLD else "FAIL"

    print(f"\n{'='*40}")
    print(f"정확도: {passed}/{len(cases)} ({accuracy*100:.1f}%)")
    print(f"전체 결과: {'✅ PASS' if overall == 'PASS' else '❌ FAIL'}")

    # 결과 저장
    summary = {
        "timestamp": datetime.utcnow().isoformat(),
        "total": len(cases),
        "passed": passed,
        "accuracy": accuracy,
        "overall": overall,
        "details": results,
    }
    output_path = RESULTS_DIR / f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_emotion_eval.json"
    output_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"결과 저장: {output_path}")

    sys.exit(0 if overall == "PASS" else 1)


if __name__ == "__main__":
    main()
