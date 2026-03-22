# LINE Emoji Master - 작업 계획서

> **프로젝트**: LINE Emoji 전용 AI 스튜디오  
> **기반**: emoji_master (텍스트 이모티콘 스튜디오)  
> **작성일**: 2026-02-19  
> **상태**: 계획 수립

---

## 1. 프로젝트 개요

### 1.1 목적

`emoji_master` 프로젝트를 기반으로 **텍스트가 없는 LINE Emoji 전용 스튜디오**를 구축합니다.

- 모든 텍스트 관련 기능을 제거
- LINE Emoji 규격(180x180px)에 최적화
- 최신 Gemini Flash 모델을 활용한 고품질 이미지 생성
- 매출 극대화를 위한 컨셉/아이디어 자동 생성

### 1.2 핵심 변경 사항 요약

| 영역        | emoji_master (현재)                               | line-emoji-master (신규)                                   |
| ----------- | ------------------------------------------------- | ---------------------------------------------------------- |
| 플랫폼      | OGQ / LINE Sticker / LINE Emoji                   | **LINE Emoji 전용**                                        |
| 텍스트      | 텍스트 오버레이 지원 (noText 옵션)                | **텍스트 완전 제거**                                       |
| AI 모델     | gemini-3.1-pro-preview / gemini-3-pro-image-preview | **gemini-2.5-flash-preview-image-generation (최신 Flash)** |
| 이미지 크기 | 740x640 / 370x320 / 180x180                       | **180x180 전용**                                           |
| 생성 수     | 45개 생성 → 플랫폼별 선택                         | **45개 생성 → 40개 선택 (LINE Emoji 규격)**                |
| 언어 선택   | Korean / Japanese / Traditional Chinese           | **프롬프트 전용 (출력 텍스트 없음)**                       |

---

## 2. LINE Emoji 시장 분석 & 전략

### 2.1 LINE Emoji 기술 규격

| 항목        | 규격                                        |
| ----------- | ------------------------------------------- |
| 이미지 크기 | **180 x 180 px** (W x H)                    |
| 탭 이미지   | **96 x 74 px**                              |
| 메인 이미지 | **없음** (스티커와 달리 불필요)             |
| 파일 형식   | PNG, **투명 배경 필수**                     |
| 세트 수량   | 16 / 24 / 32 / **40개** (본 프로젝트: 40개) |
| 파일 크기   | 이미지당 최대 1MB                           |
| 파일명      | 001.png ~ 040.png (3자리 패딩)              |
| 색상 모드   | RGB                                         |

### 2.2 시장 트렌드 & 매출 최적화 전략

#### 인기 카테고리 (매출 상위)

1. **귀여운 동물 캐릭터** - 고양이, 토끼, 곰, 햄스터 등 (가장 높은 판매율)
2. **일상 리액션** - 웃음, 울음, 분노, 놀람 등 감정 표현
3. **푸드/음료 마스코트** - 음식 캐릭터화, 카페/식사 상황
4. **직장/학교 생활** - 업무, 공부, 야근, 월요일 등
5. **커플/우정** - 하트, 응원, 격려 표현

#### 아트 스타일 트렌드

| 스타일         | 인기도 | 특징                         |
| -------------- | ------ | ---------------------------- |
| 카와이/라운드  | ★★★★★  | 둥글둥글, 파스텔 색상, 큰 눈 |
| 심플 라인 아트 | ★★★★☆  | 최소한의 선, 깔끔한 디자인   |
| 3D 렌더링      | ★★★☆☆  | 입체감, 광택, 그림자         |
| 픽셀 아트      | ★★★☆☆  | 레트로, 게임 감성            |
| 표현주의 애니  | ★★★★☆  | 과장된 표정, 역동적 포즈     |

#### 필수 포함 이모지 카테고리 (40개 구성)

> 45개를 생성한 후 가장 품질 좋은 40개를 선택하는 전략

| 카테고리        | 수량 | 예시                                                             |
| --------------- | ---- | ---------------------------------------------------------------- |
| **기본 감정**   | 10개 | 기쁨, 슬픔, 분노, 놀람, 사랑, 멘붕, 무표정, 울음, 졸림, 설렘     |
| **인사/응답**   | 8개  | 안녕, 바이, 굿모닝, 굿나잇, OK, NO, 고마워(제스처), 미안(제스처) |
| **일상 행동**   | 8개  | 식사, 커피, 운동, 공부, 일, 쇼핑, 게임, 음악듣기                 |
| **강조 리액션** | 8개  | 대박, 최고(엄지), 파이팅, 축하, 부끄, 분노폭발, 감동, 멘탈붕괴   |
| **트렌드/유머** | 6개  | 돈, 럭키, 힐링, 플렉스, TMI, 귀찮                                |
| **특수 상황**   | 5개  | 생일, 새해, 크리스마스, 비오는날, 추위                           |

#### 매출 극대화 포인트

1. **180x180px에서의 가독성** — 과장된 표정, 굵은 아웃라인, 높은 대비 색상
2. **캐릭터 일관성** — 동일 캐릭터가 다양한 감정/상황을 표현
3. **첫인상 어필** — 스토어 썸네일(96x74)에서도 매력적으로 보여야 함
4. **일상 사용빈도** — 매일 보내고 싶은 이모지가 70% 이상
5. **시즌 이벤트 대응** — 크리스마스, 새해 등 시즌 이모지 포함

---

## 3. Gemini 모델 전략

### 3.1 모델 선택

현재 `emoji_master`의 모델 구성:

```typescript
// emoji_master 현재 설정
GEMINI_MODELS = {
  TEXT_PRIMARY: "gemini-3.1-pro-preview",
  IMAGE_PRIMARY: "gemini-3-pro-image-preview",
  FLASH_PRIMARY: "gemini-3-flash-preview",
  // fallbacks...
};
```

**line-emoji-master 모델 구성:**

```typescript
// 신규 프로젝트 설정
GEMINI_MODELS = {
  // 텍스트 분석용 (전략 수립, 캐릭터 스펙 추출, 메타데이터)
  TEXT_PRIMARY: "gemini-2.5-flash-preview-04-17",
  TEXT_FALLBACK: "gemini-2.5-flash",

  // 이미지 생성용 (캐릭터, 이모지)
  IMAGE_PRIMARY: "gemini-2.5-flash-preview-image-generation",
  IMAGE_FALLBACK: "gemini-2.0-flash-exp",

  // 경량 작업용 (메타데이터, 품질 검증)
  FLASH_PRIMARY: "gemini-2.5-flash-preview-04-17",
  FLASH_FALLBACK: "gemini-2.0-flash",
};
```

### 3.2 Gemini Flash 이미지 생성 모델 특징

**gemini-2.5-flash-preview-image-generation**:

- 네이티브 이미지 생성/편집 지원
- 텍스트-투-이미지 + 이미지-투-이미지
- 비용 효율적 (Pro 대비 ~70% 저렴)
- 1:1 비율 생성 지원 (이모지에 최적)
- API 파라미터: `responseModalities: ['IMAGE', 'TEXT']`

### 3.3 이미지 생성 최적화 전략

```typescript
// 이모지 생성 최적 설정
config: {
  responseModalities: ['IMAGE', 'TEXT'],
  imageConfig: {
    aspectRatio: '1:1',     // 정사각형 (180x180에 최적)
  },
  temperature: 0.7,          // 다양성과 일관성 밸런스
}
```

**캐릭터 일관성 유지 방법:**

1. 첫 번째 생성 이미지에서 `CharacterSpec`을 추출
2. 모든 후속 이모지 프롬프트에 CharacterSpec을 포함
3. 참조 이미지(referenceImage)를 매 생성 시 함께 전송
4. 프롬프트에 "FACIAL FEATURES LOCK" 지시를 포함

---

## 4. 아키텍처 설계

### 4.1 프로젝트 구조

```
line-emoji-master/
├── packages/
│   ├── shared/              # 공통 코드 (서비스, 타입, 상수, 상태관리)
│   │   └── src/
│   │       ├── components/  # React UI 컴포넌트
│   │       │   ├── stages/  # 단계별 페이지 컴포넌트
│   │       │   ├── layout/  # 레이아웃 (AppShell, Stepper)
│   │       │   ├── setup/   # API Key 모달
│   │       │   └── ui/      # 공통 UI (Button, Card, Loader)
│   │       ├── services/
│   │       │   ├── gemini/  # Gemini AI 클라이언트 + 오케스트레이터
│   │       │   │   ├── client.ts
│   │       │   │   ├── orchestrator.ts
│   │       │   │   └── prompts/
│   │       │   │       ├── characterGen.ts   # 캐릭터 + 이모지 프롬프트
│   │       │   │       ├── expertPanel.ts    # AI 전문가 패널 프롬프트
│   │       │   │       └── metadata.ts       # 메타데이터 프롬프트
│   │       │   ├── image/   # 이미지 처리 (배경제거, 리사이즈, 내보내기)
│   │       │   ├── pipeline/ # 파이프라인 오케스트레이션
│   │       │   └── config/  # API Key 관리
│   │       ├── store/       # Zustand 상태관리
│   │       ├── hooks/       # React hooks
│   │       ├── types/       # TypeScript 타입 정의
│   │       ├── constants/   # 상수 (모델, 플랫폼 규격)
│   │       ├── utils/       # 유틸리티
│   │       └── bridge/      # 이벤트 버스, window API
│   ├── web/                 # 웹 SPA (Vite)
│   ├── electron/            # 데스크톱 앱 (Electron)
│   └── cli/                 # CLI 도구
├── docs/                    # 프로젝트 문서
└── package.json             # 모노레포 루트
```

### 4.2 파이프라인 재설계 (6단계)

기존 7단계에서 텍스트 관련을 제거하고 LINE Emoji에 최적화한 **6단계 파이프라인**:

```
1. 입력 → 2. AI 전략 → 3. 캐릭터 생성 → 4. 이모지 일괄 생성
                                                   ↓
                        6. 내보내기 ← 5. 후처리 & 메타데이터
```

| 단계                       | 설명                              | 변경사항                                       |
| -------------------------- | --------------------------------- | ---------------------------------------------- |
| **1. 입력**                | 캐릭터 컨셉 + 참조 이미지         | 언어 선택 제거, noText 토글 제거               |
| **2. AI 전략**             | 전문가 패널 분석 (시장/아트/문화) | 텍스트 스타일 분석 제거, 이모지 시장 분석 강화 |
| **3. 캐릭터 생성**         | 베이스 캐릭터 + 스타일 변환       | 변경 없음 (텍스트 무관)                        |
| **4. 이모지 생성**         | 45개 아이디어 → 이미지 생성       | 텍스트 필드 제거, 이모지 최적 프롬프트         |
| **5. 후처리 & 메타데이터** | 배경 제거 + 아웃라인 + 메타데이터 | 텍스트 자연스러움 검사 제거, 단계 병합         |
| **6. 내보내기**            | LINE Emoji ZIP                    | LINE Emoji 단일 포맷                           |

---

## 5. 상세 변경 명세

### 5.1 제거 대상 (텍스트 관련)

#### 타입 정의 (`types/domain.ts`)

```diff
- export interface TextStyleOption {
-   id: string;
-   title: string;
-   colorDescription: string;
-   styleDescription: string;
-   reasoning: string;
-   score: number;
- }

  export interface LLMStrategy {
    selectedVisualStyleIndex: number;
-   selectedTextStyle: TextStyleOption;
    culturalNotes: string;
    salesReasoning: string;
    personaInsights: PersonaInsight[];
  }

  export interface EmoteIdea {
    id: number;
    expression: string;
    action: string;
-   text: string;
    category: string;
    useCase: string;
    imagePrompt: string;
  }

  export interface UserInput {
    concept: string;
    referenceImage: string | null;
-   language: 'Korean' | 'Japanese' | 'Traditional Chinese';
-   noText?: boolean;
+   targetMarket: 'Korean' | 'Japanese' | 'Traditional Chinese';
  }
```

#### 오케스트레이터 (`services/gemini/orchestrator.ts`)

- `checkTextNaturalness()` 함수 완전 제거
- `generateEmoteIdeas()` 에서 `textStyle` 파라미터 제거
- `generateSingleEmote()` 에서 `textStyle` 파라미터 제거
- `synthesizeStrategy()` 에서 textStyle JSON 스키마 제거

#### 프롬프트 (`services/gemini/prompts/`)

- `characterGen.ts`: 텍스트 오버레이 지시 제거, "ABSOLUTELY NO TEXT. PURE IMAGE ONLY." 항상 적용
- `expertPanel.ts`: 텍스트 스타일 추천 제거, LINE Emoji 시장 분석 강화
- `metadata.ts`: 텍스트 스타일 관련 컨텍스트 제거

#### UI 컴포넌트

- `InputStage.tsx`: noText 토글 제거, 언어 선택을 "타깃 시장"으로 변경
- `StrategyStage.tsx`: 텍스트 스타일 카드 제거
- `PostProcessStage.tsx`: 텍스트 자연스러움 검사 UI 제거
- `ExportStage.tsx`: 플랫폼 선택 제거 (LINE Emoji 고정)

### 5.2 수정 대상

#### 플랫폼 상수 (`constants/platforms.ts`)

```typescript
// LINE Emoji 전용
export const EMOJI_SPEC = {
  label: "LINE Emoji",
  description: "LINE Messenger Emoji",
  count: 40,
  content: { width: 180, height: 180 },
  main: null,
  tab: { width: 96, height: 74 },
  fileNameFormat: (i: number) => `${String(i + 1).padStart(3, "0")}.png`,
};

export const TOTAL_EMOJIS = 45; // 45개 생성 → 40개 선택
export const CHUNK_SIZE = 3;
export const API_DELAY_MS = 10000;
```

#### Gemini 모델 상수 (`constants/gemini.ts`)

```typescript
export const GEMINI_MODELS = {
  TEXT_PRIMARY: "gemini-2.5-flash-preview-04-17",
  TEXT_FALLBACK: "gemini-2.5-flash",
  IMAGE_PRIMARY: "gemini-2.5-flash-preview-image-generation",
  IMAGE_FALLBACK: "gemini-2.0-flash-exp",
  FLASH_PRIMARY: "gemini-2.5-flash-preview-04-17",
  FLASH_FALLBACK: "gemini-2.0-flash",
} as const;
```

#### 프롬프트 리뉴얼 — 이모지 아이디어 생성

```typescript
// LINE Emoji에 최적화된 45개 아이디어 카테고리
const EMOJI_CATEGORIES = {
  BASIC_EMOTIONS: { count: 10, description: "기본 감정 표현" },
  GREETINGS_RESPONSES: { count: 8, description: "인사 및 응답 제스처" },
  DAILY_ACTIONS: { count: 8, description: "일상 행동" },
  EMPHASIS_REACTIONS: { count: 8, description: "강조 리액션" },
  TRENDING_HUMOR: { count: 6, description: "트렌드/유머" },
  SPECIAL_OCCASIONS: { count: 5, description: "특수 상황/시즌" },
};
```

### 5.3 신규 추가

#### 이모지 선택 UI

45개 생성 후 → 40개를 선택하는 인터페이스:

- 자동 품질 평가 (AI 기반)
- 드래그 앤 드롭 순서 변경
- 썸네일 미리보기 (180x180 실제 크기)

#### 이모지 품질 검증

텍스트 자연스러움 검사를 대체하는 **이미지 품질 검증**:

- 캐릭터 일관성 체크 (참조 이미지 대비)
- 180x180에서의 가독성 체크
- 배경 깔끔함 체크
- 표정/포즈 다양성 체크

---

## 6. 에이전트 팀 구성

### 팀 구조 (5명)

```
┌─────────────────────────────────────────────┐
│           Agent 1: 아키텍트                   │
│     (프로젝트 설정, 전체 구조, 타입 시스템)      │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
┌────────┐ ┌──────────┐ ┌──────────┐
│Agent 2 │ │ Agent 3  │ │ Agent 4  │
│AI 파이프│ │ 프론트엔드│ │이미지처리 │
│라인     │ │ UI/UX    │ │& 내보내기 │
└────────┘ └──────────┘ └──────────┘
                 │
                 ▼
         ┌──────────────┐
         │   Agent 5    │
         │  QA & 통합   │
         └──────────────┘
```

---

### Agent 1: 아키텍트 (Architecture Lead)

**역할**: 프로젝트 기반 구축 및 타입 시스템 정의

**담당 업무:**

1. **프로젝트 초기 설정**
   - emoji_master에서 코드 복사 및 정리
   - package.json 수정 (프로젝트명, 의존성)
   - tsconfig, eslint, prettier 설정
   - 모노레포 workspace 구성

2. **타입 시스템 리팩토링**
   - `TextStyleOption` 타입 제거
   - `EmoteIdea`에서 `text` 필드 제거
   - `UserInput`에서 `noText`, `language` → `targetMarket`으로 변경
   - `LLMStrategy`에서 `selectedTextStyle` 제거
   - `PlatformId` → LINE Emoji 단일 타입으로 변경
   - 새로운 타입 추가: `EmojiQualityScore`, `EmojiSelectionState`

3. **상수 재정의**
   - `GEMINI_MODELS` — 최신 Flash 모델로 업데이트
   - `PLATFORM_SPECS` → `EMOJI_SPEC` 단일 규격
   - `TOTAL_EMOJIS = 45`, `EXPORT_COUNT = 40`
   - 이모지 카테고리 분배 상수 정의

4. **스토어 수정**
   - Zustand 슬라이스에서 텍스트 관련 상태 제거
   - `workflowSlice`: 6단계 워크플로우로 변경
   - `assetsSlice`: 이모지 선택 상태 추가

**카테고리**: `quick` → 단순 구조 변경이 주 업무
**스킬**: `coding-standards`

**산출물:**

- [ ] 프로젝트 초기 설정 완료
- [ ] 타입 시스템 마이그레이션 완료
- [ ] 상수 파일 업데이트 완료
- [ ] 스토어 마이그레이션 완료
- [ ] 타입 에러 0건 확인

---

### Agent 2: AI 파이프라인 엔지니어 (AI Pipeline Engineer)

**역할**: Gemini 통합 및 이모지 생성 파이프라인 구축

**담당 업무:**

1. **Gemini 클라이언트 수정** (`services/gemini/client.ts`)
   - 최신 모델명으로 업데이트
   - Flash 이미지 생성 모델 fallback 로직 조정
   - `responseModalities` 설정 추가

2. **프롬프트 엔지니어링** (`services/gemini/prompts/`)

   **expertPanel.ts 수정:**
   - 텍스트 스타일 추천 로직 제거
   - LINE Emoji 시장에 특화된 분석 프롬프트
   - 이모지 카테고리별 최적 전략 수립 프롬프트
   - 180x180 소형 이미지에서의 시각적 매력도 분석 추가

   **characterGen.ts 수정:**
   - `buildBaseCharacterPrompt`: "DO NOT include any text" 강화
   - `buildEmoteIdeasPrompt`: 텍스트 필드 완전 제거, 45개 이모지 카테고리 분배 반영
   - `buildSingleEmotePrompt`: 텍스트 오버레이 지시 제거, "ABSOLUTELY NO TEXT" 항상 적용
   - LINE Emoji 특성 반영: 180x180에서 잘 보이는 과장된 표정, 선명한 실루엣

   **metadata.ts 수정:**
   - 텍스트 스타일 컨텍스트 제거
   - LINE Emoji 스토어 SEO 최적화 강화

3. **오케스트레이터 수정** (`services/gemini/orchestrator.ts`)
   - `checkTextNaturalness()` 제거
   - `synthesizeStrategy()`: textStyle 스키마 제거
   - `generateEmoteIdeas()`: textStyle 파라미터 제거
   - `generateSingleEmote()`: textStyle 파라미터 제거, Flash 모델 기본 사용
   - 신규: `evaluateEmojiQuality()` — 생성된 이모지의 품질 AI 검증

4. **파이프라인 수정** (`services/pipeline/`)
   - `generationPipeline.ts`: 텍스트 관련 로직 제거
   - `postProcessPipeline.ts`: 텍스트 검증 단계 제거
   - `fullPipeline.ts`: 6단계 파이프라인으로 축소

**카테고리**: `deep` → Gemini API 통합 + 프롬프트 엔지니어링은 깊은 이해 필요
**스킬**: `coding-standards`, `backend-patterns`

**산출물:**

- [ ] Gemini 클라이언트 최신 모델 적용
- [ ] 텍스트 제거된 프롬프트 전체 리뉴얼
- [ ] LINE Emoji 특화 프롬프트 (45개 카테고리 분배)
- [ ] 이모지 품질 검증 함수 구현
- [ ] 파이프라인 6단계 동작 확인

---

### Agent 3: 프론트엔드 엔지니어 (Frontend UI/UX)

**역할**: UI 컴포넌트 수정 및 LINE Emoji 전용 인터페이스 구축

**담당 업무:**

1. **InputStage 수정**
   - noText 토글 제거 (항상 텍스트 없음)
   - `language` 셀렉터 → `targetMarket` 셀렉터로 변경 (프롬프트용)
   - 프로젝트 타이틀/설명을 "LINE Emoji 스튜디오"로 변경
   - LINE Emoji 가이드라인 안내 추가

2. **StrategyStage 수정**
   - 텍스트 스타일 카드 제거
   - LINE Emoji 시장 분석 결과 강조 표시
   - 추천 카테고리 분배 시각화 추가

3. **CharacterStage** — 변경 최소화 (텍스트 무관)

4. **StickerBatchStage → EmojiBatchStage 리네이밍**
   - "스티커" → "이모지" 용어 통일
   - 180x180 실제 크기 미리보기 추가
   - 이모지 카테고리별 그룹 표시

5. **PostProcessStage 수정**
   - 텍스트 자연스러움 검사 UI 제거
   - 이모지 품질 점수 표시 추가
   - 45개 중 40개 선택 인터페이스 추가
   - 드래그 앤 드롭 순서 변경

6. **MetadataStage** — 텍스트 스타일 컨텍스트 UI 제거

7. **ExportStage 수정**
   - 플랫폼 선택 제거 (LINE Emoji 고정)
   - LINE Creators Market 제출 가이드 표시
   - 내보내기 미리보기 (40개 그리드)

8. **StageStepper 수정**
   - 6단계 워크플로우 반영
   - 단계명 변경 (stickers → emojis 등)

9. **AppShell 수정**
   - 앱 타이틀: "LINE Emoji Studio"
   - 브랜딩 색상 LINE 그린(#06C755) 반영

**카테고리**: `visual-engineering`
**스킬**: `frontend-ui-ux`, `frontend-patterns`, `coding-standards`

**산출물:**

- [ ] 전체 UI 컴포넌트 텍스트 관련 제거
- [ ] LINE Emoji 브랜딩 적용
- [ ] 이모지 선택 인터페이스 구현
- [ ] 용어 통일 (스티커 → 이모지)
- [ ] 반응형 레이아웃 동작 확인

---

### Agent 4: 이미지 처리 엔지니어 (Image Processing & Export)

**역할**: 이미지 후처리, 리사이즈, LINE Emoji 규격 내보내기

**담당 업무:**

1. **이미지 처리 수정** (`services/image/`)
   - `backgroundRemoval.ts`: 변경 없음 (텍스트 무관)
   - `outlineGeneration.ts`: 변경 없음
   - `resize.ts`: LINE Emoji 180x180 전용 최적화
   - `core.ts`: 불필요한 크기 변환 로직 정리

2. **내보내기 수정** (`services/image/export.ts`)
   - OGQ/LINE Sticker 관련 코드 제거
   - LINE Emoji 전용 ZIP 생성:
     - `tab.png` (96x74) — 자동 생성
     - `001.png` ~ `040.png` (180x180)
   - 메타데이터 JSON 포함 옵션

3. **이미지 품질 최적화**
   - 180x180으로 다운스케일 시 품질 보존 (sharp: lanczos3)
   - PNG 최적화 (파일 크기 1MB 이내)
   - 투명 배경 검증

4. **탭 이미지 자동 생성**
   - 대표 이모지에서 96x74 크롭
   - 또는 AI로 탭 이미지 별도 생성

5. **CLI 패키지 수정** (`packages/cli/`)
   - LINE Emoji 전용 명령어
   - `--format line-emoji` 고정
   - 이미지 처리 파이프라인 업데이트

**카테고리**: `unspecified-low`
**스킬**: `coding-standards`, `backend-patterns`

**산출물:**

- [ ] LINE Emoji 전용 내보내기 기능
- [ ] 180x180 리사이즈 최적화
- [ ] 탭 이미지 자동 생성
- [ ] ZIP 파일 구조 검증
- [ ] CLI 명령어 업데이트

---

### Agent 5: QA & 통합 엔지니어 (Quality Assurance & Integration)

**역할**: 테스트, 빌드 검증, 전체 통합 테스트

**담당 업무:**

1. **기존 테스트 마이그레이션**
   - 텍스트 관련 테스트 케이스 제거
   - 이모지 전용 테스트 케이스 추가
   - MSW 핸들러 업데이트

2. **단위 테스트**
   - 프롬프트 빌더 함수 테스트
   - 이미지 리사이즈/내보내기 테스트
   - 스토어 액션 테스트
   - 타입 안전성 검증

3. **E2E 테스트** (Playwright)
   - 전체 6단계 파이프라인 워크플로우
   - API Key 설정 → 컨셉 입력 → 전략 확인 → 캐릭터 생성 → 이모지 생성 → 내보내기
   - 이모지 선택/해제 인터페이스
   - 에러 핸들링 (API 실패, 네트워크 오류)

4. **빌드 검증**
   - 웹 빌드 (`npm run build:web`)
   - Electron 빌드 (`npm run build:electron`)
   - CLI 빌드 (`npm run build:cli`)
   - 타입 체크 통과 확인
   - 린트 통과 확인

5. **통합 테스트**
   - Agent 1~4의 산출물 통합
   - 전체 파이프라인 end-to-end 동작 검증
   - 성능 테스트 (45개 이모지 생성 시간)
   - 내보내기 ZIP 파일 LINE 규격 준수 검증

**카테고리**: `deep`
**스킬**: `tdd-workflow`, `coding-standards`, `superpowers/verification-before-completion`

**산출물:**

- [ ] 단위 테스트 통과 (커버리지 80%+)
- [ ] E2E 테스트 통과
- [ ] 웹/Electron/CLI 빌드 성공
- [ ] 타입 에러 0건
- [ ] 린트 에러 0건

---

## 7. 작업 순서 및 의존성

```
Phase 1 (병렬): Agent 1 + Agent 2 (독립 작업)
    │
    ├── Agent 1: 타입/상수/스토어 마이그레이션
    └── Agent 2: 프롬프트 엔지니어링 (로컬 테스트)
    │
Phase 2 (병렬): Agent 3 + Agent 4 (Phase 1 결과 의존)
    │
    ├── Agent 3: UI 컴포넌트 수정 (Agent 1 타입 필요)
    └── Agent 4: 이미지 처리/내보내기 (Agent 1 상수 필요)
    │
Phase 3 (순차): Agent 5 (전체 통합)
    │
    └── Agent 5: 테스트 + 통합 + 빌드 검증
```

### 예상 일정

| Phase     | 작업                     | 예상 소요 |
| --------- | ------------------------ | --------- |
| Phase 1   | 아키텍처 + AI 파이프라인 | 1~2일     |
| Phase 2   | UI + 이미지 처리         | 1~2일     |
| Phase 3   | QA + 통합                | 1일       |
| **Total** |                          | **3~5일** |

---

## 8. 리스크 및 대응 방안

| 리스크                            | 영향도 | 대응 방안                                 |
| --------------------------------- | ------ | ----------------------------------------- |
| Gemini Flash 이미지 모델 API 변경 | 높음   | Fallback 모델 체인 유지, 모델명 상수화    |
| 캐릭터 일관성 저하                | 높음   | CharacterSpec 강화, 참조 이미지 항상 포함 |
| 180x180 해상도에서 품질 저하      | 중간   | 1024x1024 생성 후 고품질 다운스케일       |
| LINE 이모지 심사 반려             | 중간   | LINE 가이드라인 체크리스트 내장           |
| API 비용 초과                     | 낮음   | Flash 모델 사용으로 비용 70% 절감         |

---

## 9. 성공 기준

- [ ] 텍스트 관련 코드 **완전 제거** (grep 검증)
- [ ] 45개 이모지 생성 → 40개 선택 → LINE Emoji ZIP 내보내기 정상 동작
- [ ] Gemini Flash 최신 모델로 이미지 생성 정상 동작
- [ ] 웹/Electron/CLI 모두 빌드 성공
- [ ] 전체 파이프라인 E2E 테스트 통과
- [ ] 내보내기 ZIP이 LINE Emoji 규격 준수 (180x180, PNG, 투명 배경, 001~040 파일명)
- [ ] 타입 에러 0건, 린트 에러 0건

---

## 부록 A: 기존 코드베이스 참조

### 주요 파일 경로 (emoji_master)

| 파일                                                          | 역할                   | 수정 필요                                 |
| ------------------------------------------------------------- | ---------------------- | ----------------------------------------- |
| `packages/shared/src/types/domain.ts`                         | 도메인 타입 정의       | TextStyleOption, EmoteIdea.text 제거      |
| `packages/shared/src/constants/gemini.ts`                     | Gemini 모델 상수       | 최신 Flash 모델로 변경                    |
| `packages/shared/src/constants/platforms.ts`                  | 플랫폼 규격            | LINE Emoji 단일 규격                      |
| `packages/shared/src/constants/styles.ts`                     | 비주얼 스타일          | 변경 없음                                 |
| `packages/shared/src/services/gemini/client.ts`               | Gemini API 클라이언트  | 모델명 변경                               |
| `packages/shared/src/services/gemini/orchestrator.ts`         | AI 오케스트레이터      | checkTextNaturalness 제거, textStyle 제거 |
| `packages/shared/src/services/gemini/prompts/characterGen.ts` | 캐릭터/이모지 프롬프트 | 텍스트 지시 제거                          |
| `packages/shared/src/services/gemini/prompts/expertPanel.ts`  | 전문가 패널 프롬프트   | 텍스트 스타일 추천 제거                   |
| `packages/shared/src/services/gemini/prompts/metadata.ts`     | 메타데이터 프롬프트    | 텍스트 스타일 컨텍스트 제거               |
| `packages/shared/src/services/pipeline/fullPipeline.ts`       | 전체 파이프라인        | 6단계로 축소                              |
| `packages/shared/src/services/pipeline/generationPipeline.ts` | 생성 파이프라인        | 텍스트 로직 제거                          |
| `packages/shared/src/services/image/export.ts`                | ZIP 내보내기           | LINE Emoji 전용                           |
| `packages/shared/src/components/stages/InputStage.tsx`        | 입력 UI                | noText 토글, 언어 선택 제거               |
| `packages/shared/src/components/stages/StrategyStage.tsx`     | 전략 UI                | 텍스트 스타일 카드 제거                   |
| `packages/shared/src/components/stages/StickerBatchStage.tsx` | 배치 생성 UI           | EmojiBatchStage로 리네이밍                |
| `packages/shared/src/components/stages/PostProcessStage.tsx`  | 후처리 UI              | 텍스트 검사 제거                          |
| `packages/shared/src/components/stages/ExportStage.tsx`       | 내보내기 UI            | 플랫폼 선택 제거                          |
| `packages/shared/src/App.tsx`                                 | 메인 앱                | 6단계 워크플로우, 텍스트 로직 제거        |

### 에이전트 실행 명령 (task 호출 예시)

```typescript
// Agent 1: 아키텍트
task(
  (category = "quick"),
  (load_skills = ["coding-standards"]),
  (prompt = "..."),
);

// Agent 2: AI 파이프라인
task(
  (category = "deep"),
  (load_skills = ["coding-standards", "backend-patterns"]),
  (prompt = "..."),
);

// Agent 3: 프론트엔드
task(
  (category = "visual-engineering"),
  (load_skills = ["frontend-ui-ux", "frontend-patterns", "coding-standards"]),
  (prompt = "..."),
);

// Agent 4: 이미지 처리
task(
  (category = "unspecified-low"),
  (load_skills = ["coding-standards", "backend-patterns"]),
  (prompt = "..."),
);

// Agent 5: QA
task(
  (category = "deep"),
  (load_skills = [
    "tdd-workflow",
    "coding-standards",
    "superpowers/verification-before-completion",
  ]),
  (prompt = "..."),
);
```
