#!/usr/bin/env python3
"""
스파이크: 한국어 Whisper API 정확도 벤치마크
개발 시작 전 필수 실행. 결과에 따라 음성 파이프라인 확정.

Usage:
    export OPENAI_API_KEY=sk-...
    python scripts/spike/whisper_benchmark.py --samples-dir ./samples/

샘플 준비:
    samples/{id}.m4a  (한국어 음성 파일)
    samples/{id}.txt  (정답 전사 텍스트)
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    print("ERROR: pip install openai")
    sys.exit(1)


def cer(reference: str, hypothesis: str) -> float:
    """Character Error Rate 계산 (낮을수록 좋음)"""
    r = list(reference.replace(" ", ""))
    h = list(hypothesis.replace(" ", ""))
    d = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        d[i][0] = i
    for j in range(len(h) + 1):
        d[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            cost = 0 if r[i - 1] == h[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    return d[len(r)][len(h)] / max(len(r), 1)


def benchmark(samples_dir: Path, client: OpenAI):
    audio_files = sorted(samples_dir.glob("*.m4a"))
    if not audio_files:
        print(f"ERROR: {samples_dir}에 .m4a 파일이 없습니다.")
        sys.exit(1)

    print(f"=== Whisper 한국어 벤치마크 ===")
    print(f"샘플 수: {len(audio_files)}\n")

    total_cer = 0.0
    results = []

    for audio_path in audio_files:
        ref_path = audio_path.with_suffix(".txt")
        if not ref_path.exists():
            print(f"⚠️  [{audio_path.name}] 정답 파일 없음. 건너뜀.")
            continue

        reference = ref_path.read_text(encoding="utf-8").strip()

        with open(audio_path, "rb") as f:
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                language="ko",
            )

        hypothesis = response.text.strip()
        error_rate = cer(reference, hypothesis)
        total_cer += error_rate

        status = "✅" if error_rate < 0.1 else ("⚠️ " if error_rate < 0.2 else "❌")
        print(f"{status} [{audio_path.stem}] CER: {error_rate:.3f}")
        print(f"   정답: {reference[:60]}...")
        print(f"   결과: {hypothesis[:60]}...")

        results.append({"file": audio_path.name, "cer": error_rate})

    avg_cer = total_cer / len(results) if results else 1.0
    print(f"\n평균 CER: {avg_cer:.3f}")

    if avg_cer < 0.10:
        print("✅ Whisper 품질 PASS — 음성 파이프라인으로 확정 가능")
    elif avg_cer < 0.20:
        print("⚠️  Whisper 품질 보통 — 노이즈 전처리 고려")
    else:
        print("❌ Whisper 품질 미흡 — 대안 STT 검토 필요")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples-dir", default="./samples", help="음성 샘플 디렉토리")
    args = parser.parse_args()

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY를 설정하세요.")
        sys.exit(1)

    client = OpenAI(api_key=api_key)
    benchmark(Path(args.samples_dir), client)


if __name__ == "__main__":
    main()
