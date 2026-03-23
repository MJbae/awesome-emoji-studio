# 작업 계획: generateEmoteIdeas 최적화

## 목표

스티커 생성 단계(Stage 4) 진입 시 로딩 스피너가 과도하게 오래 도는 문제 해결 및 생성되는 이모지 컨셉 품질 개선.

## 현재 문제

| 문제 | 원인 | 위치 |
|------|------|------|
| 스피너 10~30초 블로킹 | `gemini-3.1-pro-preview` (thinking model)로 45개 JSON 생성 | `orchestrator.ts:253` → `generateText()` |
| 테마 미반영 | 프롬프트 카테고리 예시가 범용적 (eating, coffee, work...) | `characterGen.ts:143-148` |
| imagePrompt 비대 | 길이 제약 없음 + 캐릭터 설명 중복 포함 | `characterGen.ts:154-157` |
| buildSingleEmotePrompt 중복 | referenceImage 이미 전달하면서 텍스트로 캐릭터 재설명 | `characterGen.ts:168-191` |
| EmoteIdea 불필요 필드 | expression, action, text, useCase가 imagePrompt와 중복 | `orchestrator.ts:264-271` |

---

## 작업 항목

### Task 1: 모델 변경 — Pro → Flash

**파일**: `packages/shared/src/services/gemini/orchestrator.ts`

`generateEmoteIdeas` 내부에서 `generateText()` → `generateWithFlash()`로 변경.

아이디어 기획은 thinking model이 불필요. Flash로 충분하며 응답 속도 2~5배 개선 기대.

```ts
// Before
const response = await generateText({ ... });

// After
const response = await generateWithFlash({ ... });
```

**예상 효과**: 응답 시간 10~30초 → 3~8초

---

### Task 2: EmoteIdea 스키마 축소

**파일**: `packages/shared/src/types/domain.ts`, `packages/shared/src/services/gemini/orchestrator.ts`

불필요한 필드 제거로 출력 토큰 수를 줄여 응답 속도 추가 개선.

```ts
// Before (6 fields)
interface EmoteIdea {
  id: number;
  expression: string;   // 삭제
  action: string;       // 삭제
  category: string;
  useCase: string;      // 삭제
  imagePrompt: string;
}

// After (3 fields)
interface EmoteIdea {
  id: number;
  category: string;
  imagePrompt: string;
}
```

`orchestrator.ts`의 `responseSchema`에서도 해당 필드 및 required 배열에서 제거.

**영향 범위 확인 필요**: EmoteIdea의 expression, action, text, useCase를 참조하는 UI 컴포넌트가 있는지 확인 후 제거.

---

### Task 3: 프롬프트에 테마 강제 로직 추가

**파일**: `packages/shared/src/services/gemini/prompts/characterGen.ts`

`buildEmoteIdeasPrompt` 함수에서 컨셉의 핵심 테마를 명시적으로 강제.

변경 포인트:

**(A)** 범용 카테고리 예시 제거 — 현재 하드코딩된 예시가 LLM을 범용 방향으로 유도함:

```
// 삭제 대상 (characterGen.ts:143-148)
3. Daily Actions (8) - Eating, coffee, work, study, gaming, music
4. Emphasis Reactions (8) - Amazing, thumbs up, fighting, congrats, shy, rage
5. Trending/Humor (6) - Money, lucky, healing, flex, TMI, lazy
6. Special Occasions (4) - Birthday, new year, christmas, rainy day, cold
```

**(B)** 테마 기반 지시문 추가:

```
CORE THEME: "${concept}"
CRITICAL: Every emoji must naturally incorporate this theme's identity.
Do NOT generate generic emotions disconnected from the theme.

Example — if theme is "골프하는 귀여운 안경남":
  Good: "excited birdie celebration", "frustrated sand bunker", "relaxed clubhouse rest"
  Bad: "happy face", "eating ramen", "studying at desk"

Categories (${targetCount} total):
1. Core Theme Emotions (10) — feelings directly tied to the theme
2. Theme-Specific Actions (10) — actions/situations unique to the theme
3. Daily Life with Theme (10) — everyday moments filtered through the theme lens
4. Social Reactions (8) — greetings and responses incorporating theme elements
5. Special Moments (7) — celebrations and events related to the theme
```

---

### Task 4: imagePrompt 길이 제약

**파일**: `packages/shared/src/services/gemini/prompts/characterGen.ts`

`buildEmoteIdeasPrompt` 내 imagePrompt 지시문 교체:

```
// Before (characterGen.ts:154-157)
Each imagePrompt must be a SINGLE SENTENCE that:
1. Describes the character doing a specific action/expression
2. Incorporates the strategy direction naturally
3. Is vivid enough to guide image generation but not overly detailed

// After
imagePrompt rules:
- Maximum 10 words
- Action and emotion keywords only
- Do NOT describe the character's appearance (reference image is provided separately)
- Focus on WHAT the character is doing and HOW they feel

Example: "joyfully celebrating after hole-in-one"
NOT: "A cute round character with glasses wearing a golf outfit jumping with joy while holding a golf club after making a hole-in-one shot"
```

---

### Task 5: buildSingleEmotePrompt 축소

**파일**: `packages/shared/src/services/gemini/prompts/characterGen.ts`

현재 `generateSingleEmote`은 이미 `referenceImage`를 인라인 이미지로 전달함 (`orchestrator.ts:298`). 텍스트로 캐릭터를 재설명하는 것은 중복이며, 오히려 텍스트와 이미지 간 불일치 시 혼란 유발.

```ts
// Before (24줄)
`Generate a LINE messenger emoji (will display at 180x180px).

CHARACTER IDENTITY (MUST MAINTAIN EXACTLY):
- Appearance: ${characterSpec.physicalDescription}
- Colors: ${characterSpec.colorPalette}
- Key Features: ${characterSpec.distinguishingFeatures}
- Art Style: ${characterSpec.artStyle}

FACIAL FEATURES LOCK (CRITICAL - DO NOT DEVIATE):
${characterSpec.facialFeatures}
The face structure, eye shape, nose, mouth...

STICKER SCENE: ${idea.imagePrompt}
ABSOLUTELY NO TEXT. PURE IMAGE ONLY.

RULES:
1. The character MUST look identical...
2. Only the expression, pose...
3. SOLID WHITE BACKGROUND...
4. Design for TINY size...`

// After (5줄)
`LINE emoji sticker, 180x180px, square, solid white background.
Match the character in the reference image exactly.
Only change the expression and pose — not the character design.
Scene: ${idea.imagePrompt}
No text. Single character only. Bold lines, exaggerated expression.`
```

---

## 작업 순서 및 의존성

```
Task 1 (모델 변경)         — 독립, 즉시 가능
Task 2 (스키마 축소)       — 영향 범위 확인 후 진행
Task 3 (프롬프트 테마 강제) — 독립, 즉시 가능
Task 4 (imagePrompt 제약)  — Task 3과 같은 파일, 함께 진행
Task 5 (단일 프롬프트 축소) — Task 4 완료 후 진행 (imagePrompt 형식 변경에 의존)
```

**권장 진행 순서**: Task 1 → Task 3+4 → Task 2 → Task 5

- Task 1 단독으로 속도 개선 효과 즉시 검증 가능
- Task 3+4는 같은 함수 내 수정이라 한 번에 처리
- Task 2는 타입 변경이므로 영향 범위 확인 필요
- Task 5는 imagePrompt 형식이 확정된 후 진행

---

## 예상 결과

| 지표 | 현재 | 개선 후 |
|------|------|---------|
| 스피너 대기 시간 | 10~30초 | 3~8초 |
| imagePrompt 길이 | 20~40 단어 | 10단어 미만 |
| 테마 반영도 | 낮음 (범용 이모지 다수) | 높음 (컨셉 중심) |
| buildSingleEmotePrompt | 24줄 (캐릭터 설명 중복) | 5줄 (참조 이미지 의존) |
| 코드 복잡도 변화 | — | 아키텍처 변경 없음 (동일 구조 유지) |
