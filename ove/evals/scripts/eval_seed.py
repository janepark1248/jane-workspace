#!/usr/bin/env python3
"""
Ove — Seed 탐지 Eval
evals/criteria.md 기준으로 GPT-4o의 Seed 탐지 정확도를 측정한다.
독립 Evaluator 전용 스크립트. Generator와 분리 실행.

Usage:
    export OPENAI_API_KEY=sk-...
    python evals/scripts/eval_seed.py
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

CASES_PATH = Path(__file__).parent.parent / "data" / "seed_detection" / "cases.jsonl"
PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"
RESULTS_DIR = Path(__file__).parent.parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

# evals/criteria.md 기준
MIN_CONFIDENCE = 0.7
MIN_EVIDENCE_COUNT = 2
VALID_ARCHETYPES = {
    "인정 욕구", "완벽주의", "통제 불안",
    "버림받음 공포", "무가치감", "관계 의존", "실패 두려움"
}
PASS_THRESHOLD = 0.70  # 전체 골든 케이스 중 70% 이상 일치


def load_system_prompt() -> str:
    prompt_path = PROMPTS_DIR / "seed_declarator.md"
    if not prompt_path.exists():
        print(f"WARNING: {prompt_path} 없음. 기본 프롬프트 사용.")
        return "사용자 대화에서 핵심 신념(Seed)을 JSON으로 반환하세요."
    return prompt_path.read_text(encoding="utf-8")


def load_cases() -> list[dict]:
    cases = []
    with open(CASES_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                cases.append(json.loads(line))
    return cases


def run_seed_detection(client: OpenAI, case: dict, system_prompt: str) -> dict:
    conversation_text = "\n".join(
        f"{turn['role'].upper()}: {turn['text']}"
        for turn in case.get("conversation", [])
    )
    user_message = system_prompt.replace(
        "{initial_transcript}", case["transcript"]
    ).replace(
        "{conversation_history}", conversation_text
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "당신은 CBT 핵심 신념 분석 전문가입니다. JSON으로만 응답하세요."},
            {"role": "user", "content": user_message},
        ],
        temperature=0.1,
    )
    return json.loads(response.choices[0].message.content)


def evaluate_result(result: dict, expected: dict) -> tuple[bool, list[str]]:
    """criteria.md 기준으로 결과를 평가한다."""
    failures = []

    # INCONCLUSIVE 체크
    if result.get("status") == "inconclusive":
        failures.append("INCONCLUSIVE 반환 (confidence 부족)")
        return False, failures

    # confidence 기준
    confidence = result.get("confidence", 0)
    if confidence < MIN_CONFIDENCE:
        failures.append(f"confidence {confidence:.2f} < {MIN_CONFIDENCE}")

    # archetype 유효성
    archetype = result.get("archetype", "")
    if archetype not in VALID_ARCHETYPES:
        failures.append(f"archetype '{archetype}' 유효하지 않음")
    elif expected.get("archetype") and archetype != expected["archetype"]:
        failures.append(f"archetype 불일치: 기대 '{expected['archetype']}', 실제 '{archetype}'")

    # evidence 개수
    evidence = result.get("evidence", [])
    if len(evidence) < MIN_EVIDENCE_COUNT:
        failures.append(f"evidence {len(evidence)}개 < {MIN_EVIDENCE_COUNT}개")

    # label 형식 ("나는 ..." 포함 여부)
    label = result.get("label", "")
    if not label.startswith("나는"):
        failures.append(f"label 형식 오류: '{label[:30]}...'")

    # 기대 키워드 포함 여부
    expected_keyword = expected.get("label_contains", "")
    if expected_keyword and expected_keyword not in label:
        failures.append(f"label에 '{expected_keyword}' 미포함")

    return len(failures) == 0, failures


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY 환경 변수를 설정하세요.")
        sys.exit(1)

    client = OpenAI(api_key=api_key)
    system_prompt = load_system_prompt()
    cases = load_cases()

    print(f"=== Ove Seed Detection Eval ===")
    print(f"케이스 수: {len(cases)}")
    print(f"통과 기준: {PASS_THRESHOLD * 100:.0f}%\n")

    results = []
    passed = 0

    for case in cases:
        case_id = case["id"]
        print(f"[{case_id}] 실행 중...", end=" ")

        try:
            result = run_seed_detection(client, case, system_prompt)
            ok, failures = evaluate_result(result, case["expected"])

            status = "PASS" if ok else "FAIL"
            if ok:
                passed += 1
                print(f"✅ PASS (archetype: {result.get('archetype')}, confidence: {result.get('confidence', 0):.2f})")
            else:
                print(f"❌ FAIL")
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
    output_path = RESULTS_DIR / f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_seed_eval.json"
    output_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"결과 저장: {output_path}")

    sys.exit(0 if overall == "PASS" else 1)


if __name__ == "__main__":
    main()
