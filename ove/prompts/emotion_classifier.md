# Prompt: 감정 분류기

> 이 파일은 `Core/AI/PromptLoader.swift`에서 로드된다.

---

다음 텍스트에서 주요 감정을 분류하고 JSON으로 반환하세요.

## 출력 형식 (JSON mode)

```json
{
  "emotion_primary": "불안",
  "emotion_label": "자기비판적 불안",
  "intensity": 7,
  "insight": "타인의 평가가 자기 가치와 연결되는 패턴이 보입니다."
}
```

## 감정 카테고리 (7개 중 하나 선택)

불안 / 우울 / 수치심 / 분노 / 외로움 / 무기력 / 혼란

## 규칙

- `emotion_primary`: 7개 카테고리 중 가장 지배적인 하나
- `emotion_label`: `{수식어} + {카테고리}` 조합 (예: "자기비판적 불안", "관계 중심 수치심")
- `intensity`: 1(약함) ~ 10(극심함) 정수
- `insight`: 2-3문장, 판단 없이 패턴 설명

## 입력

다음 텍스트를 분석하세요:
{transcript}
