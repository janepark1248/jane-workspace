@AGENTS.md

# ove/web — Next.js 웹 앱 실행 지침

## 기술 스택

- **프레임워크:** Next.js 16.2.4 (App Router)
- **UI:** React 19 + Tailwind CSS v4
- **상태 관리:** Zustand 5
- **AI:** Google Gemini 2.5 Flash Lite (`/app/api/gemini/route.ts`)
- **로컬 DB:** Dexie 4 (IndexedDB)

---

## 주요 파일 지도

| 역할 | 경로 |
|------|------|
| AI API 진입점 | `app/api/gemini/route.ts` |
| Gemini 래퍼 함수 | `lib/ai/gemini.ts` |
| 프롬프트 모음 | `lib/prompts/*.ts` |
| 세션 DB 접근 | `lib/db/session-db.ts` |
| 데이터 모델 | `lib/models/*.ts` |
| Zustand 스토어 | `stores/*.ts` |
| 공유 컴포넌트 | `app/components/` |
| 글로벌 스타일 | `app/globals.css` |

---

## 새 AI 액션 추가 패턴

1. `lib/prompts/{action}-prompt.ts` — 시스템 프롬프트 + 사용자 메시지 빌더 작성
2. `lib/ai/gemini.ts` — `generate{Action}()` 함수 추가
3. `app/api/gemini/route.ts` — `case '{action}'` 분기 추가
4. `stores/{feature}-store.ts` — 상태 및 호출 로직 추가
5. `app/{route}/page.tsx` — UI 구현

---

## 새 페이지 추가 패턴

```
app/{route}/page.tsx        ← 페이지 (use client)
stores/{route}-store.ts     ← Zustand 스토어
lib/models/{model}.ts       ← 타입 정의 (필요 시)
lib/prompts/{route}-prompt.ts  ← AI 프롬프트 (AI 연동 시)
```

---

## 색상 팔레트 (globals.css)

Warm Red 다크모드 + 유사색(±30°) 하모니 체계.

```
--color-ove-bg:          #100f0f   배경
--color-ove-surface:     #1e1b1a   카드
--color-ove-primary:     #e9e7e7   텍스트 & 버튼
--color-ove-muted:       #947e7a   보조 텍스트
--color-ove-border:      #2f2928   테두리
--color-ove-accent:      #e67965   강조 (Warm Red, 9°)
--color-ove-accent-warm: #e2af50   유사색 H+30° (39°, 황금)
--color-ove-accent-cool: #e25083   유사색 H-30° (339°, 로즈)
```

---

## 개발 명령

```bash
npm run dev     # 개발 서버 (포트 3000)
npm run build   # 프로덕션 빌드 검증
npm run start   # 프로덕션 서버
```

---

## 환경 변수

```
GEMINI_API_KEY=<Google AI Studio에서 발급>
```
