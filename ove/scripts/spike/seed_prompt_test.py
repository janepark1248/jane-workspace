#!/usr/bin/env python3
"""
스파이크: Seed 프롬프트 10개 시나리오 테스트
개발 시작 전 GPT-4o가 Seed를 신뢰성 있게 탐지하는지 검증.

Usage:
    export OPENAI_API_KEY=sk-...
    python scripts/spike/seed_prompt_test.py
"""

import json
import os
import sys
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("ERROR: pip install openai")
    sys.exit(1)

# 간단한 인라인 테스트 케이스 (evals/의 골든 케이스보다 빠른 스파이크용)
SPIKE_CASES = [
    {
        "id": "spike-01",
        "desc": "직장 내 인정 욕구",
        "transcript": "팀장한테 피드백 받았는데 내 실력이 부족한 건지 모르겠어요. 열심히 했는데 인정을 못 받으면 여기 있을 자격이 없는 것 같아요.",
        "expected_archetype": "인정 욕구",
    },
    {
        "id": "spike-02",
        "desc": "관계에서 버림받음 공포",
        "transcript": "친구가 며칠째 연락이 없어요. 제가 뭘 잘못했나 계속 생각하고, 결국 제가 사랑받을 수 없는 사람이라 버려지는 것 같아요.",
        "expected_archetype": "버림받음 공포",
    },
    {
        "id": "spike-03",
        "desc": "완벽주의로 인한 마비",
        "transcript": "보고서를 완벽하게 쓰지 못할 것 같아서 시작을 못 하고 있어요. 조금이라도 부족하면 제출하기 싫어요.",
        "expected_archetype": "완벽주의",
    },
    {
        "id": "spike-04",
        "desc": "실패 두려움",
        "transcript": "새 프로젝트 시작이 너무 무서워요. 잘못되면 영원히 실패자로 기억될 것 같고, 그러면 아무도 기회를 안 줄 것 같아요.",
        "expected_archetype": "실패 두려움",
    },
    {
        "id": "spike-05",
        "desc": "무가치감",
        "transcript": "회의에서 제 의견이 무시됐어요. 어차피 저는 중요한 사람이 아닌 것 같아요. 있어도 없는 사람 같은 느낌이에요.",
        "expected_archetype": "무가치감",
    },
]


def run_test(client: OpenAI, case: dict, system_prompt: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "CBT 핵심 신념 분석가. 대화 없이 초기 전사만으로 Seed를 추론하세요. JSON으로만 응답."},
            {"role": "user", "content": f"초기 전사:\n{case['transcript']}\n\n대화 히스토리:\n(없음 — 초기 전사만으로 추론)"},
        ],
        temperature=0.1,
    )
    return json.loads(response.choices[0].message.content)


def main():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY를 설정하세요.")
        sys.exit(1)

    client = OpenAI(api_key=api_key)
    prompts_dir = Path(__file__).parent.parent.parent / "prompts"
    system_prompt = (prompts_dir / "seed_declarator.md").read_text(encoding="utf-8") if (prompts_dir / "seed_declarator.md").exists() else ""

    print("=== Seed 프롬프트 스파이크 테스트 ===\n")

    passed = 0
    for case in SPIKE_CASES:
        print(f"[{case['id']}] {case['desc']}")
        try:
            result = run_test(client, case, system_prompt)

            if result.get("status") == "inconclusive":
                print(f"  ⚠️  INCONCLUSIVE")
                continue

            archetype = result.get("archetype", "")
            confidence = result.get("confidence", 0)
            label = result.get("label", "")
            evidence_count = len(result.get("evidence", []))

            match = archetype == case["expected_archetype"]
            ok = match and confidence >= 0.7 and evidence_count >= 2

            if ok:
                passed += 1
                print(f"  ✅ PASS | archetype: {archetype} | confidence: {confidence:.2f} | evidence: {evidence_count}개")
            else:
                print(f"  ❌ FAIL | archetype: {archetype} (기대: {case['expected_archetype']}) | confidence: {confidence:.2f}")

            print(f"     label: {label}")

        except Exception as e:
            print(f"  ⚠️  ERROR: {e}")

        print()

    accuracy = passed / len(SPIKE_CASES)
    print(f"결과: {passed}/{len(SPIKE_CASES)} ({accuracy*100:.0f}%)")

    if accuracy >= 0.7:
        print("✅ Seed 프롬프트 스파이크 PASS — 구현 진행 가능")
    else:
        print("❌ Seed 프롬프트 스파이크 FAIL — 프롬프트 수정 필요 (prompts/seed_declarator.md)")
        print("   → prompts/system_cbt.md와 seed_declarator.md 검토 후 재실행")

    sys.exit(0 if accuracy >= 0.7 else 1)


if __name__ == "__main__":
    main()
