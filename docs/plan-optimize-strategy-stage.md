# 작업 계획: 전략 분석 단계 (Strategy Stage) 최적화

## 목표

전략 분석 단계의 로딩 시간 단축 및 결과물 간결화.

## 현재 문제 분석

### 아키텍처: 4단계 순차/반순차 LLM 호출 체인

```
analyzeConcept(input)
  │
  ├─ ① consultMarketAnalyst(input)        ← generateText (Pro), 순차 대기
  │        ↓ marketInsight.analysis
  ├─ ② consultArtDirector(input, market)  ← generateText (Pro), ①에 의존
  ├─ ③ consultCulturalExpert(input)       ← generateText (Pro), ②와 병렬
  │        ↓ [①, ②, ③] 결과 합산
  └─ ④ synthesizeStrategy(input, all)     ← generateText (Pro), JSON 출력
```

**위치**: `orchestrator.ts:136-144`

### 속도 문제

| 호출 | 모델 | 의존성 | 예상 소요 |
|------|------|--------|-----------|
| ① Market Analyst | `gemini-3.1-pro-preview` | 없음 | 8~15초 |
| ② Art Director | `gemini-3.1-pro-preview` | ①에 의존 | 8~15초 |
| ③ Cultural Expert | `gemini-3.1-pro-preview` | 없음 (②와 병렬) | 8~15초 |
| ④ Synthesis | `gemini-3.1-pro-preview` | ①②③ 완료 후 | 8~15초 |

- ②와 ③은 `Promise.all`로 병렬 실행되지만, ①이 먼저 완료되어야 함
- ④는 ①②③ 전부 끝나야 시작
- **총 소요: 최소 3 라운드 × 8~15초 = 24~45초**
- 4개 호출 모두 `generateText` = `gemini-3.1-pro-preview` (thinking model)

### 결과물 문제

- **personaInsights**: 3개 페르소나 분석이 각각 3~5문단의 자유 텍스트 → UI에서 대부분 접힌 상태
- **culturalNotes / salesReasoning**: synthesize 단계에서 재요약하지만 여전히 길고 중복적
- 실제 다음 단계에서 사용되는 핵심 값은 `selectedVisualStyleIndex`, `culturalNotes`, `salesReasoning` 3개
- `personaInsights`는 UI 표시 + metadata 프롬프트에서 참조 (각 200자 잘라서 사용)

---

## 재검토를 통한 설계 판단

### "4회→1회 통합" 대신 "모델만 교체"를 선택한 이유

1회 통합 시 Art Director가 Market Analyst 결과를 입력받는 chain-of-thought 패턴이 사라짐.
추가 6~7초 단축 (9~15초→3~8초)을 위해 아키텍처 전면 재설계는 비용 대비 효과가 낮음.
**모델만 Flash로 교체하면 기존 구조를 유지하면서 24~45초→9~15초로 단축 가능.**

### "personaInsights 제거" 하지 않는 이유

- `metadata.ts:17-19`에서 실제 사용 중 — 각 페르소나 분석의 첫 200자를 메타데이터 프롬프트에 주입
- UI에서 "AI가 분석한 근거"를 보여주는 신뢰감 요소 — 기능적 가치가 아닌 UX 가치
- 제거는 기술적 판단이 아니라 제품 판단이므로 이 작업 범위에서 제외

### 결과물 길이는 프롬프트 수정만으로 해결 가능

각 프롬프트의 출력 지시만 변경하면 결과물 길이가 1/3로 줄어듦.
아키텍처 변경 없이 텍스트 수정만으로 달성 가능.

---

## 작업 항목

### Task 1: 모델 변경 — Pro → Flash (4개 함수)

**파일**: `packages/shared/src/services/gemini/orchestrator.ts`

4개 consult/synthesize 함수에서 `generateText` → `generateWithFlash`로 변경.

| 함수 | 라인 | 변경 |
|------|------|------|
| `consultMarketAnalyst` | 46 | `generateText` → `generateWithFlash` |
| `consultArtDirector` | 66 | `generateText` → `generateWithFlash` |
| `consultCulturalExpert` | 78 | `generateText` → `generateWithFlash` |
| `synthesizeStrategy` | 100 | `generateText` → `generateWithFlash` |

각 함수의 `useFlash` 분기도 이제 불필요 — `generateWithFlash`로 통일하고 `useFlash` 파라미터 제거.

```ts
// Before
async function consultMarketAnalyst(input: UserInput, useFlash = false): Promise<PersonaInsight> {
  ...
  const generateFn = useFlash ? generateWithFlash : generateText;

// After
async function consultMarketAnalyst(input: UserInput): Promise<PersonaInsight> {
  ...
  const response = await generateWithFlash({
```

**예상 효과**: 3라운드 × 8~15초 = 24~45초 → 3라운드 × 3~5초 = **9~15초**

---

### Task 2: 프롬프트 길이 제약 추가

**파일**: `packages/shared/src/services/gemini/prompts/expertPanel.ts`

4개 프롬프트 함수의 출력 지시를 간결하게 변경.

**(A) `buildMarketAnalystPrompt` (라인 28)**

```
// Before
Cover these points in 3-5 short paragraphs:
1. Current market trends relevant to this concept in the ${language} LINE emoji store.
2. Target demographics and their purchasing patterns for this category.
3. Competition level — how saturated is this concept category?
4. Recommended pricing tier (low/mid/premium) and pack positioning strategy.

// After
Respond in 3-4 sentences total covering: market trends, target demographics, competition level, and pricing tier for this concept.
```

**(B) `buildArtDirectorPrompt` (라인 64)**

```
// Before
Cover these points concisely:
1. Which visual style index (0-4) best fits this concept AND market? Why?
2. Color palette strategy for maximum shelf appeal at tiny emoji sizes (180x180px).
3. How does this concept translate visually for the ${language} audience?

// After
Respond in 3-4 sentences total: recommend ONE visual style index (0-4) with reason, color palette strategy, and visual translation for the ${language} audience.
```

**(C) `buildCulturalExpertPrompt` (라인 82)**

```
// Before
Cover these points concisely:
1. Deep cultural nuances for the ${language} market that affect emoji purchasing.
2. Taboo topics, gestures, colors, or symbols to AVOID for this concept.
3. Current cultural trends in the ${language} market that could boost sales.
4. Localization recommendations for text expressions and emotional tone.

// After
Respond in 3-4 sentences total: key cultural nuances, taboos to avoid, and current trends for this concept in the ${language} market.
```

**(D) `buildSynthesisPrompt` (라인 115-121)**

```
// Before
YOUR TASK: Make the definitive creative and commercial decisions by integrating all expert inputs.

1. SELECT the single best visual style index (0-4).
2. EXPLAIN cultural considerations that shaped your decisions.
3. PROVIDE the commercial reasoning behind your final strategy.

Be decisive. This is the final call — no hedging.

// After
YOUR TASK: Integrate all expert inputs into a final decision.

1. SELECT the single best visual style index (0-4).
2. culturalNotes: 2-3 sentences on cultural considerations.
3. salesReasoning: 2-3 sentences on commercial strategy.

Be decisive. Keep each field under 3 sentences.
```

---

### Task 3: StrategyStage UI 간소화 (선택적)

**파일**: `packages/shared/src/components/stages/StrategyStage.tsx`

결과물이 짧아진 후, CollapsibleStrategyCard가 불필요해지면 단순 Card로 교체.

**이 Task는 Task 1+2 적용 후 실제 결과물 길이를 확인하고 진행 여부를 결정.**

변경 시:
- culturalNotes, salesReasoning 카드: CollapsibleStrategyCard → 단순 Card (항상 펼침)
- personaInsights 카드: 접기/펼치기 유지 (내용이 여전히 상대적으로 길 수 있음)

---

## 작업 순서 및 의존성

```
Task 1 (모델 변경) ← 독립, 즉시 가능
Task 2 (프롬프트 길이 제약) ← 독립, 즉시 가능 (Task 1과 병렬)
Task 3 (UI 간소화) ← Task 1+2 효과 확인 후 진행 여부 결정
```

**Task 1과 Task 2는 다른 파일이므로 병렬 실행 가능.**

---

## 예상 결과

| 지표 | 현재 | 개선 후 |
|------|------|---------|
| 모델 | `gemini-3.1-pro-preview` × 4회 | `gemini-2.5-flash` × 4회 |
| 호출 구조 | ①→②③→④ (chain-of-thought 유지) | 동일 (변경 없음) |
| 총 로딩 시간 | 24~45초 | 9~15초 |
| personaInsights | 각 3~5문단 | 각 3~4문장 |
| culturalNotes / salesReasoning | 장문 | 각 2~3문장 |
| 코드 변경량 | — | 4줄 모델 변경 + 프롬프트 텍스트 수정 |
| 아키텍처 변경 | — | 없음 |
| 리스크 | — | 최소 (기존 구조 유지) |
