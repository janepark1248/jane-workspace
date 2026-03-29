# Prompt: Seed 선언기

> 이 파일은 CBT 질문 흐름이 완료된 후 Seed를 확정할 때 사용한다.

---

다음 대화 내용에서 사용자의 핵심 신념(Seed)을 분석하고 JSON으로 반환하세요.

## 출력 형식 (JSON mode)

```json
{
  "label": "나는 실패하면 모든 것을 잃는다",
  "archetype": "실패 두려움",
  "evidence": [
    "팀장한테 피드백 받았는데 내 실력이 부족한 건지 모르겠어요",
    "한 번 실수하면 회복이 안 될 것 같아서"
  ],
  "confidence": 0.85,
  "actions": [
    {
      "type": "cognitive",
      "text": "실수 = 정보, 실패 = 끝이 아님. '이번 피드백이 내게 알려준 것은 무엇인가?'로 리프레이밍"
    },
    {
      "type": "behavioral",
      "text": "오늘 내가 잘 한 일 1가지를 저녁에 메모장에 적어보기"
    },
    {
      "type": "behavioral",
      "text": "다음 주 피드백 받을 때 '어떻게 개선하면 좋을까요?'로 바꿔 물어보기"
    }
  ]
}
```

## Archetype 목록

인정 욕구 / 완벽주의 / 통제 불안 / 버림받음 공포 / 무가치감 / 관계 의존 / 실패 두려움

## 규칙

- `label`: "나는 ..." 형식의 1인칭 현재형
- `evidence`: 대화에서 직접 인용, 2개 이상 필수
- `confidence`: 0.0~1.0 (0.7 미만이면 inconclusive 반환)
- `actions`: cognitive(인지 재구조화) 1개 + behavioral(행동) 2개 권장

## INCONCLUSIVE 형식

confidence < 0.7이면:
```json
{
  "status": "inconclusive",
  "partial_insight": "탐색 중 발견한 패턴 요약 (1-2문장)"
}
```

## 입력

초기 전사:
{initial_transcript}

대화 히스토리:
{conversation_history}
