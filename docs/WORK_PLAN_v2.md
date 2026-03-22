# LINE Emoji Master - 작업 계획서 (v2 - 전면 재검토)

> **프로젝트**: LINE Emoji 전용 AI 스튜디오  
> **기반**: emoji_master (텍스트 이모티콘 스튜디오)  
> **작성일**: 2026-02-19  
> **상태**: v2 - 구현 가능성 재검토 완료

---

## 0. v1 작업계획 비판적 검토

### v1의 핵심 문제점 요약

v1 작업계획서를 코드 레벨에서 검증한 결과, **6가지 구조적 문제**가 확인되었습니다.

---

### 문제 1: Gemini 모델 다운그레이드 (치명적)

**v1 제안**: gemini-2.5-flash-preview-image-generation 사용  
**현재 코드**: gemini-3-flash-preview, gemini-3.1-pro-preview 사용

```typescript
// 현재 emoji_master (packages/shared/src/constants/gemini.ts)
export const GEMINI_MODELS = {
  TEXT_PRIMARY: "gemini-3.1-pro-preview", // Gemini 3
  IMAGE_PRIMARY: "gemini-3-pro-image-preview", // Gemini 3
  FLASH_PRIMARY: "gemini-3-flash-preview", // Gemini 3
  // ...
};
```

요구사항은 "최신 Flash 모델"인데, **현재 프로젝트가 이미 Gemini 3 (최신)을 사용 중**입니다.  
v1은 이를 Gemini 2.5로 **다운그레이드**하는 오류를 범했습니다.

**결론**: 현재 모델 구성을 그대로 유지합니다. 이미 Flash 최신(gemini-3-flash-preview)을 사용 중이며, noText=true가 되면 전략 수립 단계도 자동으로 Flash를 사용하므로 비용 절감 효과를 얻습니다.

---

### 문제 2: 과잉 엔지니어링 — 이미 존재하는 noText 모드 무시

현재 코드에 **noText 모드가 완전히 구현**되어 있습니다:

```typescript
// App.tsx (line 302-311) — noText일 때 자동으로 더미 TextStyleOption 주입
const isNoText = state.userInput.noText ?? false;
const effectiveTextStyle: TextStyleOption = isNoText
  ? { id: 'no-text', title: 'No Text', ... }
  : state.strategy.selectedTextStyle;
```

```typescript
// orchestrator.ts (line 166) — noText일 때 Flash 모델 자동 사용
const useFlash = input.noText ?? false;
```

```typescript
// characterGen.ts (line 168-171) — 프롬프트에서 텍스트 자동 제거
const isNoText = textStyle.id === 'no-text';
const textInstruction = isNoText
  ? 'ABSOLUTELY NO TEXT. PURE IMAGE ONLY.'
  : /* text overlay instruction */;
```

**v1의 오류**: TextStyleOption 타입 삭제, EmoteIdea.text 삭제, 함수 시그니처 전부 변경 → **20개+ 파일 수정 필요**

**올바른 접근**: `noText: true`를 기본값으로 고정하고 토글 UI만 제거. 나머지 코드는 그대로 동작합니다. **변경 파일: 2~3개**.

---

### 문제 3: 불필요한 리네이밍 (`language` → `targetMarket`)

`language` 필드의 실제 사용처:

| 함수                                          | 용도                    |
| --------------------------------------------- | ----------------------- |
| `getCulturalContext(language)`                | 시장별 문화적 맥락 생성 |
| `buildMarketAnalystPrompt(concept, language)` | 시장 분석 프롬프트      |
| `getLanguageSpecificCategories(language)`     | 인기 카테고리 제안      |

**모두 텍스트 출력과 무관** — 타깃 시장의 문화적 맥락을 결정하는 용도입니다. 리네이밍은 10개+ 파일에 불필요한 변경을 유발합니다.

**결론**: 필드명 `language` 유지, UI 라벨만 "타깃 시장"으로 변경.

---

### 문제 4: 파이프라인 단계 병합의 역효과

**v1 제안**: PostProcess + Metadata → 하나로 병합

현재 각 단계의 관리 상태:

- **PostProcess**: processingOptions, selectedImageIds, previewSrc, naturalCheckLoading, excludedStickers
- **Metadata**: metaLanguages, metadataLoading, selectedMetaMap

병합 시 **하나의 Stage가 8개 독립 상태를 관리** → 복잡도 증가.

**결론**: 7단계 유지. checkTextNaturalness 호출만 제거하면 PostProcess가 자연스럽게 간소화됩니다.

---

### 문제 5: 범위 확대 (Scope Creep)

요구사항: "전체적인 이모지 생성 프로세스는 본 프로젝트와 차이가 없습니다"

v1이 추가한 **미요청 신규 기능**:

| 기능                                       | 예상 공수 |
| ------------------------------------------ | --------- |
| AI 이모지 품질 검증 (evaluateEmojiQuality) | 2~3일     |
| 드래그 앤 드롭 선택 UI                     | 1~2일     |
| 카테고리 분배 시각화                       | 0.5~1일   |
| 이모지 품질 점수 표시                      | 0.5~1일   |

이 기능들만으로 **4~7일 추가 공수**. MVP와 분리해야 합니다.

---

### 문제 6: 에이전트 병렬 실행 불가

v1 Phase 1: Agent 1(타입 수정) + Agent 2(오케스트레이터 수정)

**충돌**: Agent 1이 types/domain.ts를 변경하면 Agent 2의 orchestrator.ts가 타입 에러.  
**진정한 병렬이 아님** → 순차 실행 필요.

---

## 1. 프로젝트 개요

### 1.1 목적

`emoji_master`를 기반으로 **LINE Emoji 전용 스튜디오**를 구축합니다.

**핵심 원칙: 최소 변경, 최대 효과**

- 기존 noText 모드를 활용 (코드 이미 존재)
- LINE Emoji 플랫폼 고정 (UI 변경만)
- 프롬프트를 LINE Emoji 시장에 최적화
- 기존 파이프라인 7단계 구조 유지
- 타입 시스템 변경 없음

### 1.2 변경 범위 비교

|                    | v1                      | v2    |
| ------------------ | ----------------------- | ----- |
| 변경 파일 수       | ~20개                   | ~10개 |
| 타입 변경          | TextStyleOption 삭제 등 | 없음  |
| 함수 시그니처 변경 | 5개 함수                | 없음  |
| 신규 기능          | 4개                     | 없음  |

---

## 2. LINE Emoji 시장 분석

### 2.1 기술 규격

| 항목        | 규격                                       |
| ----------- | ------------------------------------------ |
| 이미지 크기 | **180 x 180 px**                           |
| 탭 이미지   | **96 x 74 px**                             |
| 메인 이미지 | 없음                                       |
| 파일 형식   | PNG, 투명 배경 필수                        |
| 세트 수량   | 16 / 24 / 32 / 40개 (**사용자 선택 가능**) |
| 파일 크기   | 이미지당 최대 1MB                          |
| 파일명      | 001.png ~ NNN.png (3자리 패딩)             |

### 2.2 이모지 카테고리 분배 (45개 생성)

| 카테고리        | 수량 | 핵심 표현                                                    |
| --------------- | ---- | ------------------------------------------------------------ |
| **기본 감정**   | 10개 | 기쁨, 슬픔, 분노, 놀람, 사랑, 무표정, 울음, 졸림, 설렘, 멘붕 |
| **인사/응답**   | 8개  | 안녕, 바이, 굿모닝, 굿나잇, OK, NO, 감사 제스처, 미안 제스처 |
| **일상 행동**   | 8개  | 식사, 커피, 운동, 공부, 일, 쇼핑, 게임, 음악                 |
| **강조 리액션** | 8개  | 대박, 엄지, 파이팅, 축하, 부끄, 분노폭발, 감동, 멘탈붕괴     |
| **트렌드/유머** | 6개  | 돈, 럭키, 힐링, 플렉스, TMI, 귀찮                            |
| **특수 상황**   | 5개  | 생일, 새해, 크리스마스, 비오는날, 추위                       |

### 2.3 180x180 최적화 포인트

1. **과장된 비율** — 얼굴이 전체의 60%+ 차지
2. **굵은 아웃라인** — 4px+ 라인
3. **높은 색상 대비** — 파스텔보다 선명한 색상
4. **단순 실루엣** — 디테일 최소화, 형태로 인식
5. **투명 배경 필수** — 배경 제거 단계에서 자동 처리

---

## 3. Gemini 모델 전략

### 3.1 모델 구성 — 현행 유지

```typescript
// 변경 없음 — 이미 최신 Gemini 3 사용 중
export const GEMINI_MODELS = {
  TEXT_PRIMARY: "gemini-3.1-pro-preview",
  TEXT_FALLBACK: "gemini-2.5-flash",
  IMAGE_PRIMARY: "gemini-3-pro-image-preview",
  IMAGE_FALLBACK: "gemini-2.5-flash-image",
  FLASH_PRIMARY: "gemini-3-flash-preview",
  FLASH_FALLBACK: "gemini-2.5-flash",
} as const;
```

### 3.2 noText=true의 자동 최적화 효과

```typescript
// orchestrator.ts — noText=true일 때 전략 수립도 Flash 사용
const useFlash = input.noText ?? false; // true → Flash
```

noText=true로 고정하면:

- 전략 수립 (Market Analyst, Art Director, Cultural Expert, Synthesis) → Flash
- 이모지 생성 (generateSingleEmote) → Flash
- **Pro 모델은 캐릭터 스펙 추출, 베이스 캐릭터 생성에만 사용**
- **비용 ~60% 자동 절감**

### 3.3 이미지 생성 설정

```typescript
// 변경 없음 — 1024x1024 생성 후 180x180 다운스케일
config: {
  imageConfig: { aspectRatio: '1:1', imageSize: '1K' }
}
```

---

## 4. 상세 변경 명세

### 4.1 Phase 1: 핵심 설정 변경 (Agent 1)

#### `InputStage.tsx` — noText 기본값 고정 & 토글 제거

```diff
  const [data, setData] = useState<UserInput>(
-   initialData ?? { concept: '', referenceImage: null, language: 'Korean', noText: false },
+   initialData ?? { concept: '', referenceImage: null, language: 'Korean', noText: true },
  );
```

noText 토글 UI 블록 전체 제거 (line 108~134):

```diff
- <div className="flex items-center justify-between p-4 rounded-lg border ...">
-   <div>
-     <p>텍스트 없는 스티커</p>
-     ...
-   </div>
-   <button type="button" role="switch" ... />
- </div>
```

language 셀렉터 라벨만 변경:

```diff
- <legend>Target Language</legend>
+ <legend>타깃 시장</legend>
```

#### `configSlice.ts` — defaultPlatform 고정

```diff
- defaultPlatform: 'line_sticker' as PlatformId,
+ defaultPlatform: 'line_emoji' as PlatformId,
```

#### `App.tsx` — checkTextNaturalness 호출 제거

postprocess 진입 시 실행되는 useEffect에서 텍스트 자연스러움 검사 제거:

```diff
  useEffect(() => {
    if (stage !== 'postprocess' || gridItems.length === 0) return;
    setSelectedImageIds(new Set(gridItems.map((i) => i.id)));
-   async function runNaturalnessCheck() { ... }
-   runNaturalnessCheck();
  }, [stage, gridItems]);
```

관련 상태 제거:

```diff
- const [naturalCheckLoading, setNaturalCheckLoading] = useState(false);
- const [excludedStickers, setExcludedStickers] = useState<Map<number, string>>(new Map());
```

#### `PostProcessStage.tsx` — 텍스트 검사 UI props 제거

```diff
  <PostProcessStage
    ...
-   naturalCheckLoading={naturalCheckLoading}
-   excludedStickers={excludedStickers}
    ...
  />
```

### 4.2 Phase 2A: 프롬프트 최적화 (Agent 2)

#### `characterGen.ts`

```diff
  // buildBaseCharacterPrompt
- Create a character design for LINE messenger stickers.
+ Create a character design for LINE messenger emoji (180x180px display size).

  CRITICAL REQUIREMENTS:
  ...
- 5. Cute but expressive. Optimized for LINE messenger sticker sales.
+ 5. Cute but expressive. Optimized for LINE emoji sales at 180x180px.
+ 6. Design for TINY display: exaggerated proportions, minimal detail, maximum expression clarity.
  DO NOT include any text.
```

```diff
  // buildEmoteIdeasPrompt — 카테고리 분배 최적화
- Generate 45 unique emote/sticker ideas optimized for LINE messenger sales.
+ Generate 45 unique emoji ideas optimized for LINE messenger emoji sales.
+ These will display at 180x180px — prioritize clear, bold designs.

  Categories to distribute (45 total):
- 1. Basic Reactions (12) - Universal emotions
- 2. Daily Communication (11) - Greetings, responses
- 3. Emotional Emphasis (11) - Strong feelings
- 4. Trending/Cultural (6) - Market-specific trends
- 5. Special Situations (5) - Unique scenarios
+ 1. Basic Emotions (10) - Universal emotions that get used most frequently
+ 2. Greetings & Responses (8) - Gestures for hi, bye, thanks, sorry, OK, NO
+ 3. Daily Actions (8) - Eating, coffee, work, study, gaming, music
+ 4. Emphasis Reactions (8) - Amazing, thumbs up, fighting, congrats, shy, rage
+ 5. Trending/Humor (6) - Money, lucky, healing, flex, TMI, lazy
+ 6. Special Occasions (5) - Birthday, new year, christmas, rainy day, cold
```

```diff
  // buildSingleEmotePrompt
- Generate a LINE messenger sticker.
+ Generate a LINE messenger emoji (will display at 180x180px).
  ...
  RULES:
  ...
+ 4. Design for TINY size: exaggerated expression, minimal background elements, bold lines.
```

#### `expertPanel.ts`

```diff
  // getCulturalContext — 모든 언어별 컨텍스트
- Optimize for Korean LINE sticker market.
+ Optimize for Korean LINE emoji market.
  // (동일 패턴으로 Japanese, Traditional Chinese도 변경)

  // buildMarketAnalystPrompt
- You are a Senior LINE Sticker Market Analyst
+ You are a Senior LINE Emoji Market Analyst
  // (모든 "sticker" → "emoji" 변경)
```

#### `metadata.ts`

```diff
- You are a world-class emoji/sticker pack metadata writer
+ You are a world-class LINE emoji pack metadata writer
```

#### `ExportStage.tsx` — 플랫폼 선택 제거

플랫폼 선택 드롭다운/카드를 LINE Emoji 고정 표시로 교체.

### 4.3 Phase 2B: UI/브랜딩 변경 (Agent 3)

#### `AppShell.tsx`

- 앱 타이틀: "LINE Emoji Studio"
- LINE 그린(#06C755) 포인트 컬러 적용

#### 용어 통일 (각 Stage 컴포넌트)

| 변경 전              | 변경 후              |
| -------------------- | -------------------- |
| 스티커 세트 시작하기 | 이모지 세트 시작하기 |
| 스티커 생성          | 이모지 생성          |
| 45개 스티커          | 45개 이모지          |

### 4.4 건드리지 않는 것 (명시)

| 대상                                | 이유                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| `TextStyleOption` 타입              | 파이프라인 내부에서 no-text 더미로 사용됨. 삭제 시 연쇄 수정 |
| `EmoteIdea.text` 필드               | JSON 스키마에 포함. 항상 빈 문자열("")이 들어감. 무해        |
| `LLMStrategy.selectedTextStyle`     | no-text 더미가 자동 주입됨. 파이프라인 동작에 영향 없음      |
| `checkTextNaturalness` 함수 정의    | 호출만 제거. 함수 자체는 dead code로 남겨도 무해             |
| `UserInput.language` 필드명         | 리네이밍 불필요. UI 라벨만 변경                              |
| 7단계 파이프라인 구조               | 병합 시 복잡도 증가. 유지가 안정적                           |
| `WorkflowMode ('postprocess-only')` | 유용한 기능. 유지                                            |

---

## 5. 에이전트 팀 구성 (3명)

### 팀 구조

```
Phase 1 (순차): Agent 1 — 기반 구축 (선행 조건)
    │
Phase 2 (병렬): Agent 2 + Agent 3 (파일 충돌 없음)
    │
    ├── Agent 2: 프롬프트 최적화
    │     characterGen.ts, expertPanel.ts, metadata.ts, ExportStage.tsx
    │
    └── Agent 3: UI/브랜딩
          AppShell.tsx, InputStage.tsx(라벨), StageStepper, 기타 라벨
    │
Phase 3 (순차): Agent 1 재투입 — 빌드 & 통합 검증
```

### Agent 1: 기반 엔지니어

| 구분     | 내용                |
| -------- | ------------------- |
| Phase    | 1 (순차) + 3 (검증) |
| 카테고리 | `quick`             |
| 스킬     | `coding-standards`  |

**Phase 1 업무:**

1. emoji_master → line-emoji-master 전체 코드 복사
2. git init, package.json 프로젝트명 변경
3. `InputStage.tsx`: noText 기본값 `true` 고정
4. `configSlice.ts`: defaultPlatform → `'line_emoji'`
5. `App.tsx`: checkTextNaturalness 호출 제거, 관련 상태 제거
6. `PostProcessStage.tsx`: naturalCheckLoading, excludedStickers props 제거

**Phase 3 업무 (재투입):** 7. `npm run build:web` 성공 확인 8. tsc 타입 체크 통과 확인 9. `npm run lint` 통과 확인 10. 전체 diff 검토

**산출물:**

- [ ] 프로젝트 복사 & 초기 설정
- [ ] noText=true 기본값 고정
- [ ] defaultPlatform=line_emoji 고정
- [ ] checkTextNaturalness 호출 및 관련 상태 제거
- [ ] 빌드/타입/린트 통과

---

### Agent 2: 프롬프트 엔지니어

| 구분     | 내용                                   |
| -------- | -------------------------------------- |
| Phase    | 2 (Agent 1 완료 후)                    |
| 카테고리 | `deep`                                 |
| 스킬     | `coding-standards`, `backend-patterns` |

**업무:**

1. `characterGen.ts`: "sticker" → "emoji", 180x180 최적화 지시, 카테고리 분배
2. `expertPanel.ts`: "sticker" → "emoji", LINE Emoji 시장 특화
3. `metadata.ts`: "sticker" → "emoji"
4. `ExportStage.tsx`: 플랫폼 선택 UI 제거, LINE Emoji 고정

**산출물:**

- [ ] 전체 프롬프트 LINE Emoji 최적화
- [ ] 이모지 카테고리 분배 반영 (10/8/8/8/6/5)
- [ ] ExportStage 플랫폼 고정

---

### Agent 3: 프론트엔드 엔지니어

| 구분     | 내용                                                      |
| -------- | --------------------------------------------------------- |
| Phase    | 2 (Agent 1 완료 후, Agent 2와 병렬)                       |
| 카테고리 | `visual-engineering`                                      |
| 스킬     | `frontend-ui-ux`, `frontend-patterns`, `coding-standards` |

**업무:**

1. `AppShell.tsx`: 앱 타이틀 "LINE Emoji Studio", LINE 그린 포인트
2. `InputStage.tsx`: noText 토글 UI 제거, language 라벨 "타깃 시장"
3. 전체 Stage 컴포넌트 용어: "스티커" → "이모지"
4. StageStepper 라벨 업데이트

**산출물:**

- [ ] LINE Emoji 브랜딩 적용
- [ ] 용어 통일 (스티커 → 이모지)
- [ ] noText 토글 UI 제거
- [ ] 타깃 시장 라벨 변경

---

## 6. 파일 충돌 분석

### Phase 2 병렬 안전성

| 파일                  | Agent 2       | Agent 3 | 충돌? |
| --------------------- | ------------- | ------- | ----- |
| characterGen.ts       | 프롬프트 수정 | —       | 없음  |
| expertPanel.ts        | 프롬프트 수정 | —       | 없음  |
| metadata.ts           | 프롬프트 수정 | —       | 없음  |
| ExportStage.tsx       | 플랫폼 고정   | —       | 없음  |
| AppShell.tsx          | —             | 브랜딩  | 없음  |
| InputStage.tsx        | —             | 라벨/UI | 없음  |
| StageStepper.tsx      | —             | 라벨    | 없음  |
| StrategyStage.tsx     | —             | 라벨    | 없음  |
| StickerBatchStage.tsx | —             | 라벨    | 없음  |

**Agent 2와 Agent 3은 완전히 독립된 파일을 수정** → 진정한 병렬 가능

---

## 7. 일정

| Phase     | 작업                 | 에이전트    | 예상 소요 |
| --------- | -------------------- | ----------- | --------- |
| Phase 1   | 기반 구축            | Agent 1     | 2~3시간   |
| Phase 2   | 프롬프트 + UI (병렬) | Agent 2 + 3 | 3~4시간   |
| Phase 3   | 빌드 & 검증          | Agent 1     | 1시간     |
| **Total** |                      |             | **1일**   |

---

## 8. 리스크 및 대응

| 리스크               | 영향도 | 대응                                           |
| -------------------- | ------ | ---------------------------------------------- |
| Gemini 모델 API 변경 | 높음   | Fallback 체인이 client.ts에 구현 완료          |
| 캐릭터 일관성        | 높음   | CharacterSpec + 참조 이미지 메커니즘 변경 없음 |
| 180x180 품질         | 중간   | 1024x1024 생성 → 다운스케일 (기존 로직)        |
| dead code 잔존       | 낮음   | 호출되지 않는 코드는 무해. 향후 정리           |

---

## 9. 성공 기준

- [ ] `noText: true`가 기본값으로 고정됨 — `grep 'noText: false' packages/` 결과 없음
- [ ] `defaultPlatform`이 `'line_emoji'`로 고정됨
- [ ] `checkTextNaturalness` 호출이 App.tsx에서 제거됨
- [ ] 프롬프트에서 "sticker" → "emoji" 반영, 180x180 최적화 지시 포함
- [ ] UI에서 noText 토글이 보이지 않음
- [ ] ExportStage에서 플랫폼 선택이 보이지 않음 (LINE Emoji 고정)
- [ ] `npm run build:web` 성공 (exit code 0)
- [ ] `tsc --noEmit` 타입 에러 0건
- [ ] `npm run lint` 통과

---

## 10. v1 vs v2 비교

| 항목                   | v1                               | v2                      |
| ---------------------- | -------------------------------- | ----------------------- |
| **변경 파일 수**       | ~20개                            | ~10개                   |
| **에이전트 수**        | 5명                              | 3명                     |
| **Phase 수**           | 3 (Phase 1 병렬 불가)            | 3 (Phase 2 진정한 병렬) |
| **예상 소요**          | 3~5일                            | 1일                     |
| **타입 시스템 변경**   | TextStyleOption 제거 (연쇄 수정) | 없음                    |
| **함수 시그니처 변경** | 5개 함수                         | 없음                    |
| **Gemini 모델**        | 다운그레이드 (2.5)               | 현행 유지 (3.x 최신)    |
| **파이프라인 단계**    | 7→6 (병합)                       | 7단계 유지              |
| **신규 기능**          | 4개 추가 (scope creep)           | 없음                    |
| **리네이밍**           | language→targetMarket            | 없음 (라벨만)           |
| **리스크**             | 높음 (연쇄 수정)                 | 낮음 (최소 변경)        |
