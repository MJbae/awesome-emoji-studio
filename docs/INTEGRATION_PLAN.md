# Emoticon Studio - 통합 서비스 작업 계획서

> **프로젝트명**: Emoticon Studio  
> **작성일**: 2026-02-13  
> **버전**: v1.1 (구현 가능성 전면 검토 반영)  
> **원본 프로젝트**: `emoticon_generator` + `emoticon_post_processing`

---

## 목차

1. [Executive Summary](#1-executive-summary)
2. [현재 프로젝트 분석](#2-현재-프로젝트-분석)
3. [통합 아키텍처 설계](#3-통합-아키텍처-설계)
4. [LLM 친화적 인터페이스 설계](#4-llm-친화적-인터페이스-설계)
5. [단계별 구현 계획](#5-단계별-구현-계획)
6. [테스트 전략](#6-테스트-전략)
7. [위험 요소 및 완화 전략](#7-위험-요소-및-완화-전략)
8. [기술 결정 사항](#8-기술-결정-사항)

---

## 1. Executive Summary

### 목적
두 개의 독립 프로젝트(이모티콘 생성기 + 이모티콘 후처리기)를 하나의 프런트엔드 전용 웹 서비스로 통합합니다. 핵심 차별점은 **LLM 에이전트가 1차 사용자**라는 점입니다. 인간 사용자는 LLM을 통해 간접적으로 서비스에 접근합니다.

### 핵심 요구사항

| # | 요구사항 | 구현 전략 |
|---|---------|----------|
| 1 | 두 프로젝트 통합 | 7단계 파이프라인 (생성→후처리→내보내기) |
| 2 | LLM 친화적 서비스 | `window.emoticon` API + Semantic HTML + Custom Events |
| 3 | 프런트엔드 전용 | React 19 + Vite 6 + Zustand (백엔드 없음) |
| 4 | Gemini Key 관리 | 최초 입력 → localStorage 영구 저장 |
| 5 | 포괄적 테스트 | 4계층 테스트 (Unit + Integration + E2E + Visual Regression) |

### 통합 파이프라인 개요

```
[API Key 설정] → [입력] → [AI 전략 수립] → [캐릭터 생성] → [스티커 일괄 생성]
                                                                    ↓
                  [내보내기] ← [메타데이터 생성] ← [후처리 (배경제거/아웃라인)]
```

---

## 2. 현재 프로젝트 분석

### 2.1 emoticon_generator (프로젝트 A)

| 항목 | 상세 |
|------|-----|
| **기술 스택** | React 19 + Vite 6 + TypeScript 5.8 + Tailwind v4 (PostCSS) |
| **핵심 기능** | AI 전문가 패널 컨설팅 → 캐릭터 생성 → 45개 스티커 일괄 생성 |
| **AI 모델** | gemini-3.1-pro-preview (텍스트), gemini-3-pro-image-preview (이미지) |
| **상태 관리** | React local state (App.tsx에서 prop drilling) |
| **테스트** | 없음 |

**핵심 서비스**:
- `services/gemini.ts` — 멀티 페르소나 컨설팅 시스템 (시장 분석가, 아트 디렉터, 문화 전문가, 크리에이티브 디렉터)
- `services/imageProcessing.ts` — Canvas 리사이즈 + JSZip 패키징

**데이터 모델**: `UserInput`, `LLMStrategy`, `CharacterSpec`, `EmoteIdea`, `Sticker`, `PlatformConfig`, `TextStyleOption`, `VisualStyle`, `PlatformType`, `PersonaInsight`

### 2.2 emoticon_post_processing (프로젝트 B)

| 항목 | 상세 |
|------|-----|
| **기술 스택** | React 19 + Vite 6 + TypeScript 5.8 + Tailwind CDN |
| **핵심 기능** | 배경 제거 + 아웃라인 생성 → AI 메타데이터 → 플랫폼별 내보내기 |
| **AI 모델** | gemini-3-flash-preview (메타데이터) |
| **상태 관리** | React local state (App.tsx에서 prop drilling) |
| **테스트** | 없음 |

**핵심 서비스**:
- `services/imageProcessingService.ts` — Sobel 에지 검출 + 플러드 필 배경 제거 + 아웃라인 생성
- `services/geminiService.ts` — 다국어 메타데이터 생성 (3옵션 × 2언어(영어+대상언어), 품질 자체 평가 루프 최대 3회)

**데이터 모델**: `Emoji`, `ProcessingOptions`, `MetaResult`, `ProcessedImage`

### 2.3 기술 충돌 사항

| 충돌 지점 | 프로젝트 A | 프로젝트 B | 해결 방향 |
|-----------|-----------|-----------|----------|
| Tailwind 방식 | v4 PostCSS (빌드 타임) | CDN (런타임) | **PostCSS 채택** (빌드 최적화) |
| Gemini 모델 | pro-preview / flash | flash-preview | 용도별 분리 유지 |
| API Key 변수명 | `GEMINI_API_KEY` | `API_KEY` | 통일: `GEMINI_API_KEY` |
| 타입 정의 | `Sticker`, `PlatformConfig` | `Emoji`, `ProcessingOptions` | 통합 도메인 모델로 병합 |
| 이미지 처리 | 단순 리사이즈 | Sobel + 플러드 필 + 아웃라인 | B의 로직 흡수 + A의 리사이즈 통합 |

---

## 3. 통합 아키텍처 설계

### 3.1 애플리케이션 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    Emoticon Studio                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ LLM API  │  │  Human UI    │  │  Event Bus   │  │
│  │ Bridge   │  │  (React)     │  │  (Progress)  │  │
│  │ window.  │  │              │  │              │  │
│  │ emoticon │  │  7-Stage     │  │  Custom      │  │
│  │          │  │  Stepper     │  │  Events      │  │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  │
│       │               │                 │           │
│  ┌────┴───────────────┴─────────────────┴────────┐  │
│  │              Zustand Store                     │  │
│  │  ┌──────┐ ┌────────┐ ┌──────┐ ┌─────────┐    │  │
│  │  │Config│ │Workflow │ │Assets│ │  Jobs   │    │  │
│  │  │Slice │ │ Slice  │ │Slice │ │  Slice  │    │  │
│  │  └──────┘ └────────┘ └──────┘ └─────────┘    │  │
│  └────────────────────┬──────────────────────────┘  │
│                       │                             │
│  ┌────────────────────┴──────────────────────────┐  │
│  │              Service Layer                     │  │
│  │  ┌────────┐ ┌────────────┐ ┌─────────────┐   │  │
│  │  │Gemini  │ │  Image     │ │  Pipeline   │   │  │
│  │  │Service │ │  Processing│ │  Orchestrator│   │  │
│  │  │        │ │  Service   │ │             │   │  │
│  │  │-client │ │-background │ │-generation  │   │  │
│  │  │-prompts│ │-outline    │ │-postprocess │   │  │
│  │  │-orches.│ │-resize     │ │-full        │   │  │
│  │  └────────┘ └────────────┘ └─────────────┘   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 3.2 통합 워크플로우 (7단계)

```
Stage 0: Setup         — Gemini API Key 입력 (최초 1회)
Stage 1: Input         — 캐릭터 컨셉, 참조 이미지, 언어 선택
Stage 2: Strategy      — AI 전문가 패널 4인 컨설팅 → 전략 수립
Stage 3: Character     — 베이스 캐릭터 생성 → 스타일 변환 → 스펙 추출
Stage 4: Stickers      — 45개 이모트 아이디어 생성 → 일괄 이미지 생성
Stage 5: PostProcess   — 배경 제거 + 아웃라인 (선택적 적용)
Stage 6: Metadata      — AI 메타데이터 생성 (제목/설명/태그 × 3옵션 × 다국어)
Stage 7: Export        — 플랫폼별 리사이즈 → ZIP 다운로드 (metadata.json 포함)
```

**워크플로우 모드**:
- **Full Pipeline**: Stage 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 (생성부터 내보내기까지)
- **Post-Process Only**: Stage 0 → 이미지 업로드 → 5 → 6 → 7 (기존 이미지 후처리만)

### 3.3 디렉터리 구조

```
emoticon-studio/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── .env.example                    # GEMINI_API_KEY=
├── src/
│   ├── main.tsx                    # React 엔트리포인트
│   ├── App.tsx                     # 앱 셸 + 라우팅
│   │
│   ├── types/
│   │   ├── domain.ts               # UserInput, Sticker, CharacterSpec, etc.
│   │   ├── api.ts                  # EmoticonAPI, JobProgress, ServiceError
│   │   └── jobs.ts                 # JobSnapshot, JobStatus
│   │
│   ├── constants/
│   │   ├── platforms.ts            # OGQ, LINE Sticker, LINE Emoji 스펙
│   │   ├── styles.ts               # 비주얼 스타일 5종 + 텍스트 스타일
│   │   ├── imageProcessing.ts      # BG_TOLERANCE, SOBEL_THRESHOLD, etc.
│   │   └── gemini.ts               # 모델명, 온도, 재시도 설정
│   │
│   ├── store/
│   │   ├── appStore.ts             # Zustand 메인 스토어
│   │   └── slices/
│   │       ├── configSlice.ts      # apiKey, language, platform
│   │       ├── workflowSlice.ts    # stage, mode (full/postprocess-only)
│   │       ├── assetsSlice.ts      # sourceImages, stickers, processedImages
│   │       └── jobsSlice.ts        # 작업 상태 추적
│   │
│   ├── services/
│   │   ├── gemini/
│   │   │   ├── client.ts           # Gemini SDK 래퍼 (모델 폴백, 재시도)
│   │   │   ├── orchestrator.ts     # 전문가 패널 오케스트레이션
│   │   │   └── prompts/
│   │   │       ├── expertPanel.ts  # 4인 페르소나 프롬프트
│   │   │       ├── characterGen.ts # 캐릭터/스티커 생성 프롬프트
│   │   │       └── metadata.ts     # 메타데이터 생성 프롬프트
│   │   │
│   │   ├── image/
│   │   │   ├── core.ts             # Canvas 헬퍼, blob 변환
│   │   │   ├── backgroundRemoval.ts # Sobel + 플러드 필 + 디프린징
│   │   │   ├── outlineGeneration.ts # 원형 오프셋 렌더링
│   │   │   ├── resize.ts           # 플랫폼별 리사이즈
│   │   │   └── export.ts           # ZIP 패키징 + metadata.json
│   │   │
│   │   ├── pipeline/
│   │   │   ├── generationPipeline.ts    # 전체 생성 파이프라인
│   │   │   ├── postProcessPipeline.ts   # 후처리 전용 파이프라인
│   │   │   └── fullPipeline.ts          # 생성+후처리 통합 파이프라인
│   │   │
│   │   └── config/
│   │       ├── apiKeyManager.ts    # localStorage 읽기/쓰기/검증
│   │       └── platforms.ts        # 플랫폼 설정 로더
│   │
│   ├── bridge/
│   │   ├── windowApi.ts            # window.emoticon API 노출
│   │   ├── eventBus.ts             # CustomEvent 발행/구독
│   │   └── domState.ts             # data-* 어트리뷰트 동기화
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # 헤더 + 사이드바 + 콘텐츠
│   │   │   └── StageStepper.tsx    # 단계 네비게이션
│   │   │
│   │   ├── setup/
│   │   │   └── ApiKeyModal.tsx     # Gemini Key 입력 모달
│   │   │
│   │   ├── stages/
│   │   │   ├── InputStage.tsx      # Stage 1: 컨셉 입력
│   │   │   ├── StrategyStage.tsx   # Stage 2: AI 전략 수립
│   │   │   ├── CharacterStage.tsx  # Stage 3: 캐릭터 생성
│   │   │   ├── StickerBatchStage.tsx # Stage 4: 스티커 일괄 생성
│   │   │   ├── PostProcessStage.tsx  # Stage 5: 배경제거/아웃라인
│   │   │   ├── MetadataStage.tsx     # Stage 6: 메타데이터 생성
│   │   │   └── ExportStage.tsx       # Stage 7: 내보내기
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Loader.tsx
│   │       ├── FileUpload.tsx
│   │       ├── SelectionGrid.tsx
│   │       └── ProcessingOptions.tsx
│   │
│   ├── hooks/
│   │   ├── useApiKey.ts            # API Key 상태 + localStorage 동기화
│   │   ├── useExposeApi.ts         # window.emoticon 바인딩
│   │   └── usePipeline.ts         # 파이프라인 실행 + 진행률 추적
│   │
│   └── utils/
│       ├── errors.ts               # ServiceError 클래스
│       ├── validators.ts           # Zod 스키마 검증
│       └── base64.ts               # Base64 ↔ Blob 변환
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── gemini/
│   │   │   │   ├── client.test.ts
│   │   │   │   ├── orchestrator.test.ts
│   │   │   │   └── prompts.test.ts      # 프롬프트 스냅샷 테스트
│   │   │   ├── image/
│   │   │   │   ├── backgroundRemoval.test.ts
│   │   │   │   ├── outlineGeneration.test.ts
│   │   │   │   ├── resize.test.ts
│   │   │   │   └── export.test.ts
│   │   │   └── metadata/
│   │   │       └── metadataGeneration.test.ts
│   │   ├── ui/
│   │   │   ├── ApiKeyModal.test.tsx
│   │   │   ├── FileUpload.test.tsx
│   │   │   ├── ProcessingOptions.test.tsx
│   │   │   └── SelectionGrid.test.tsx
│   │   └── bridge/
│   │       └── windowApi.test.ts
│   │
│   ├── integration/
│   │   ├── wizardFlow.integration.test.tsx
│   │   ├── servicesPipeline.integration.test.ts
│   │   ├── apiKeyPersistence.integration.test.tsx
│   │   └── llmDomAttributes.integration.test.tsx
│   │
│   ├── e2e/
│   │   ├── full-pipeline.spec.ts
│   │   ├── postprocess-only.spec.ts
│   │   ├── api-key-flow.spec.ts
│   │   └── llm-window-api.spec.ts
│   │
│   ├── fixtures/
│   │   ├── images/                 # 테스트용 이미지
│   │   ├── gemini/                 # Mock API 응답
│   │   └── exports/                # 기대 출력 매니페스트
│   │
│   └── goldens/                    # Visual regression 기준 이미지
│       ├── background-removal/
│       ├── outline/
│       └── resize/
│
└── msw/
    ├── handlers.ts                 # MSW 요청 핸들러
    └── server.ts                   # MSW 서버 설정
```

### 3.4 상태 관리: Zustand

**선택 이유**:
- React 외부에서 `useStore.getState()`로 접근 가능 → `window.emoticon` API에 필수
- Context API 대비 불필요한 리렌더링 방지
- Redux Toolkit 대비 보일러플레이트 최소화
- 미들웨어로 localStorage 자동 동기화 가능

```typescript
// store/appStore.ts 구조
interface AppStore {
  // Config Slice
  config: {
    apiKey: string | null;
    language: 'Korean' | 'Japanese' | 'Traditional Chinese';
    defaultPlatform: PlatformId;
  };
  
  // Workflow Slice
  workflow: {
    mode: 'full' | 'postprocess-only';
    stage: Stage; // 'setup' | 'input' | 'strategy' | 'character' | 'stickers' | 'postprocess' | 'metadata' | 'export'
    canGoBack: boolean;
    canGoForward: boolean;
  };
  
  // Assets Slice
  assets: {
    userInput: UserInput | null;
    strategy: LLMStrategy | null;
    mainImage: string | null;       // base64
    characterSpec: CharacterSpec | null;
    stickers: Sticker[];
    processedImages: ProcessedImage[];
    metadata: MetaResult[];
  };
  
  // Jobs Slice
  jobs: Record<string, JobSnapshot>;
  
  // Actions
  actions: {
    setApiKey: (key: string) => void;
    setStage: (stage: Stage) => void;
    updateJob: (jobId: string, update: Partial<JobSnapshot>) => void;
    reset: () => void;
  };
}
```

**localStorage 영구 저장 대상** (persist 미들웨어):
- `config.apiKey` — Gemini API Key
- `config.language` — 선호 언어
- `config.defaultPlatform` — 선호 플랫폼

**메모리 전용** (저장하지 않음):
- 이미지 데이터 (base64 문자열은 용량이 크므로)
- 작업 상태 (jobs)
- 워크플로우 단계

---

## 4. LLM 친화적 인터페이스 설계

### 4.1 설계 원칙

LLM 에이전트는 Playwright MCP를 통해 웹 앱과 상호작용합니다. Playwright MCP는 **접근성 스냅샷**(accessibility snapshot)을 통해 페이지를 이해합니다. 따라서:

1. **모든 인터랙티브 요소에 aria-label 필수**
2. **시맨틱 HTML 사용** (div 남발 금지, button/input/select/progress 사용)
3. **`role="status"` + `aria-live="polite"`로 동적 상태 변경 알림**
4. **`data-*` 어트리뷰트로 기계 판독 가능한 상태 노출**
5. **`window.emoticon` API로 프로그래밍 방식 접근 제공**

### 4.2 3계층 LLM 인터페이스

```
┌─────────────────────────────────────────────┐
│ Layer 1: window.emoticon (프로그래밍 API)     │  ← page.evaluate() 호출
├─────────────────────────────────────────────┤
│ Layer 2: Semantic HTML + ARIA               │  ← 접근성 스냅샷으로 탐색
├─────────────────────────────────────────────┤
│ Layer 3: Custom Events + data-*             │  ← 상태 변화 감지
└─────────────────────────────────────────────┘
```

### 4.3 `window.emoticon` API 명세

```typescript
type Stage = 'setup' | 'input' | 'strategy' | 'character' 
           | 'stickers' | 'postprocess' | 'metadata' | 'export';
type Lang = 'Korean' | 'Japanese' | 'Traditional Chinese';
type PlatformId = 'ogq_sticker' | 'line_sticker' | 'line_emoji';

interface ServiceError {
  code: 'VALIDATION' | 'GEMINI' | 'IMAGE_PROCESSING' | 'EXPORT' | 'CANCELLED' | 'UNKNOWN';
  message: string;
  stage: Stage;
  retryable: boolean;
  details?: unknown;
}

interface JobProgress {
  jobId: string;
  stage: Stage;
  percent: number;           // 0-100
  message: string;           // 사람 + LLM 읽기 가능한 메시지
  completedItems?: number;
  totalItems?: number;
}

interface JobSnapshot {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage: Stage;
  progress: number;
  result?: unknown;
  error?: ServiceError;
  createdAt: number;
  updatedAt: number;
}

interface EmoticonAPI {
  // === 서비스 디스커버리 (LLM이 사용 가능한 기능 파악) ===
  describe(): {
    version: string;
    actions: string[];
    stages: Stage[];
    currentStage: Stage;
    apiKeyConfigured: boolean;
  };

  // === API Key 관리 ===
  setApiKey(key: string): void;
  getApiKeyStatus(): { configured: boolean };

  // === 파이프라인 실행 ===
  runFullPipeline(input: {
    concept: string;
    language: Lang;
    referenceImage?: string;  // base64
  }): Promise<{ jobId: string }>;

  runPostProcessOnly(input: {
    images: string[];         // base64 배열
  }): Promise<{ jobId: string }>;

  // === 개별 단계 실행 ===
  runStage(stage: Stage, input?: unknown): Promise<{ jobId: string }>;

  // === 작업 모니터링 ===
  getJob(jobId: string): JobSnapshot;
  subscribe(jobId: string, callback: (progress: JobProgress) => void): () => void;
  cancelJob(jobId: string): void;

  // === 결과 조회 ===
  getStickers(): Array<{ id: number; imageUrl: string; status: string }>;
  getProcessedImages(): Array<{ id: string; imageUrl: string }>;
  getMetadata(): MetaResult[];

  // === 내보내기 ===
  export(platform: PlatformId): Promise<{ blobUrl: string; filename: string }>;
}

// 전역 타입 선언
declare global {
  interface Window {
    emoticon: EmoticonAPI;
  }
}
```

### 4.4 LLM 에이전트 사용 시나리오

```typescript
// LLM 에이전트가 Playwright의 page.evaluate()로 호출하는 예시

// 1. 기능 확인
const info = await page.evaluate(() => window.emoticon.describe());
// → { version: "1.0.0", actions: [...], apiKeyConfigured: true, currentStage: "input" }

// 2. 전체 파이프라인 실행
const { jobId } = await page.evaluate(() =>
  window.emoticon.runFullPipeline({
    concept: "귀여운 분홍색 햄스터",
    language: "Korean"
  })
);

// 3. 완료 대기
await page.waitForFunction(
  (id) => window.emoticon.getJob(id).status === 'completed',
  jobId,
  { timeout: 600_000, polling: 3000 }
);

// 4. 결과 확인 및 내보내기
const stickers = await page.evaluate(() => window.emoticon.getStickers());
const { blobUrl } = await page.evaluate(() => window.emoticon.export('line_sticker'));
```

### 4.5 시맨틱 HTML 가이드라인

```tsx
// ✅ LLM 친화적 — 접근성 스냅샷에서 명확하게 식별됨
<button 
  aria-label="Generate 45 Stickers"
  data-testid="generate-stickers-btn"
  data-stage="stickers"
>
  Generate
</button>

<progress 
  value={completedCount} 
  max={totalCount}
  aria-label={`Generation: ${completedCount} of ${totalCount} stickers`}
/>

<div 
  role="status" 
  aria-live="polite"
  aria-label="Current workflow status"
  data-phase={currentStage}
  data-job-status={jobStatus}
>
  {statusMessage}
</div>

// ❌ LLM 비친화적 — 스냅샷에서 "div" 또는 알 수 없는 요소
<div onClick={handleGenerate}>
  <svg>...</svg>
</div>
```

### 4.6 Custom Events

```typescript
// 발행되는 이벤트 목록
type EmoticonEvent =
  | { type: 'emoticon:stage-change'; detail: { from: Stage; to: Stage } }
  | { type: 'emoticon:progress'; detail: JobProgress }
  | { type: 'emoticon:job-complete'; detail: { jobId: string; result: unknown } }
  | { type: 'emoticon:job-error'; detail: { jobId: string; error: ServiceError } }
  | { type: 'emoticon:sticker-generated'; detail: { index: number; total: number } };

// LLM 에이전트가 이벤트 수신하는 방법
await page.evaluate(() => {
  window.addEventListener('emoticon:progress', (e) => {
    console.log(e.detail); // { jobId, stage, percent, message }
  });
});
```

---

## 5. 단계별 구현 계획

### Phase 1: 프로젝트 부트스트랩 (예상: 1일)

**목표**: 빈 프로젝트 초기화 + 빌드 파이프라인 + 테스트 인프라 구축

| # | 작업 | 산출물 | 검증 기준 |
|---|-----|-------|----------|
| 1.1 | Vite + React + TypeScript 프로젝트 생성 | `package.json`, `vite.config.ts`, `tsconfig.json` | `npm run dev` 성공 |
| 1.2 | Tailwind v4 설정 (CSS-first) | `src/index.css`에 `@import "tailwindcss"` + `@theme {}` 블록, `@tailwindcss/vite` 플러그인 (⚠️ v4는 `tailwind.config.ts` 미사용) | 스타일 적용 확인 |
| 1.3 | Vitest 설정 + Canvas Mock | `vitest.config.ts`, `vitest.setup.ts` | `npm run test` 성공 |
| 1.4 | Playwright 설정 | `playwright.config.ts` | `npx playwright test` 성공 |
| 1.5 | MSW 설정 | `msw/handlers.ts`, `msw/server.ts` | Mock 서버 동작 확인 |
| 1.6 | Zustand 스토어 스캐폴딩 | `store/appStore.ts` + 4개 슬라이스 | 유닛 테스트 통과 |
| 1.7 | ESLint + Prettier 설정 | `.eslintrc`, `.prettierrc` | `npm run lint` 성공 |

**테스트**:
- `tests/unit/store/configSlice.test.ts` — apiKey CRUD
- `tests/unit/store/workflowSlice.test.ts` — stage 전환 로직

**의존성 설치**:
```bash
npm install react react-dom zustand zod jszip file-saver uuid lucide-react @google/genai
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react
npm install -D tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D vitest-canvas-mock jsdom msw pixelmatch pngjs
npm install -D @playwright/test
```

---

### Phase 2: 타입 시스템 + 서비스 레이어 통합 (예상: 2일)

**목표**: 두 프로젝트의 타입과 핵심 서비스를 통합 도메인 모델로 병합

| # | 작업 | 소스 | 산출물 |
|---|-----|-----|-------|
| 2.1 | 통합 도메인 타입 정의 | A: `types.ts` + B: `types.ts` | `types/domain.ts` |
| 2.2 | API/Job 타입 정의 | 신규 | `types/api.ts`, `types/jobs.ts` |
| 2.3 | Gemini Client 통합 | A: `services/gemini.ts` | `services/gemini/client.ts` |
| 2.4 | 전문가 패널 오케스트레이터 | A: `services/gemini.ts` | `services/gemini/orchestrator.ts` |
| 2.5 | 프롬프트 모듈 분리 | A: `services/gemini.ts` 내 인라인 프롬프트 | `services/gemini/prompts/*.ts` |
| 2.6 | 배경 제거 서비스 | B: `services/imageProcessingService.ts` | `services/image/backgroundRemoval.ts` |
| 2.7 | 아웃라인 생성 서비스 | B: `services/imageProcessingService.ts` | `services/image/outlineGeneration.ts` |
| 2.8 | 리사이즈 서비스 | A+B 병합 | `services/image/resize.ts` |
| 2.9 | 내보내기 서비스 | A+B 병합 | `services/image/export.ts` |
| 2.10 | 메타데이터 생성 서비스 | B: `services/geminiService.ts` | `services/gemini/prompts/metadata.ts` |
| 2.11 | 상수/설정 통합 | A: `constants.ts` + B: `constants.ts` | `constants/*.ts` |

**테스트** (각 서비스별):
```
tests/unit/services/gemini/client.test.ts
  ├── gemini-3.1-pro-preview 정상 응답 처리
  ├── 모델 폴백 (pro → flash)
  ├── 양쪽 모델 실패 시 에러 전파
  ├── JSON 응답 파싱 (정상/비정상)
  └── API Key 미설정 시 에러

tests/unit/services/gemini/orchestrator.test.ts
  ├── 4인 페르소나 순차/병렬 실행
  ├── 전략 종합 결과 구조 검증
  ├── 45개 이모트 아이디어 생성 (필드 완전성)
  └── CharacterSpec 추출 (5개 필드 존재)

tests/unit/services/image/backgroundRemoval.test.ts
  ├── 단색 배경 감지 정확도
  ├── Sobel 에지 검출 (합성 이미지 기준)
  ├── 플러드 필 경계 조건 (좁은 틈 누출 방지)
  ├── 디프린징 처리 (반투명 경계 제거)
  └── 전경 알파 보존

tests/unit/services/image/outlineGeneration.test.ts
  ├── 요청 두께만큼 아웃라인 생성
  ├── 불투명도 적용 검증
  ├── 스타일 변형 (흰색/검정)
  └── 주체 중심 이동 없음

tests/unit/services/image/export.test.ts
  ├── OGQ 리사이즈 740×640
  ├── LINE 스티커 리사이즈 370×320
  ├── LINE 이모지 리사이즈 180×180
  ├── tab.png + main.png 생성
  ├── ZIP 파일 유효성 (파일명 패턴, PNG 매직 바이트)
  └── metadata.json 포함 여부

tests/unit/services/gemini/prompts.test.ts (스냅샷 테스트)
  ├── 각 페르소나 프롬프트 스냅샷
  ├── 캐릭터 생성 프롬프트 스냅샷
  ├── 메타데이터 프롬프트 스냅샷
  └── 의도치 않은 프롬프트 변경 감지
```

**커버리지 목표**: 서비스 레이어 90%+

---

### Phase 3: Zustand 스토어 + API Key 관리 (예상: 1일)

**목표**: 전역 상태 관리 + API Key localStorage 영구 저장

| # | 작업 | 산출물 |
|---|-----|-------|
| 3.1 | Config Slice (apiKey persist) | `store/slices/configSlice.ts` |
| 3.2 | Workflow Slice (stage machine) | `store/slices/workflowSlice.ts` |
| 3.3 | Assets Slice (이미지/스티커 관리) | `store/slices/assetsSlice.ts` |
| 3.4 | Jobs Slice (작업 추적) | `store/slices/jobsSlice.ts` |
| 3.5 | API Key Manager | `services/config/apiKeyManager.ts` |
| 3.6 | useApiKey 훅 | `hooks/useApiKey.ts` |

**API Key 흐름**:
```
앱 로드 → localStorage 확인 → Key 있음? → 서비스 초기화
                                  ↓ (없음)
                            ApiKeyModal 표시 → 입력 → localStorage 저장 → 서비스 초기화
```

**테스트**:
```
tests/unit/store/configSlice.test.ts
  ├── apiKey 설정 시 localStorage에 저장
  ├── 앱 재로드 시 localStorage에서 복원
  ├── apiKey 삭제 시 localStorage에서 제거
  └── 유효하지 않은 키 거부

tests/unit/store/workflowSlice.test.ts
  ├── stage 순방향 전환 (input → strategy → character → ...)
  ├── stage 역방향 전환 허용/차단 규칙
  ├── mode 전환 (full ↔ postprocess-only)
  └── 초기화(reset) 동작

tests/integration/apiKeyPersistence.integration.test.tsx
  ├── 최초 방문 시 모달 표시
  ├── Key 입력 후 모달 사라짐
  ├── 페이지 새로고침 후 Key 유지
  ├── Key 변경 가능
  └── 멀티탭 동기화 (storage 이벤트)
```

---

### Phase 4: UI 컴포넌트 구현 (예상: 3일)

**목표**: 7단계 워크플로우 UI + 공통 컴포넌트

| # | 작업 | 소스 |
|---|-----|-----|
| 4.1 | AppShell + StageStepper | 신규 |
| 4.2 | ApiKeyModal | 신규 구현 (A: `App.tsx` API Key 환경변수 패턴 참고, localStorage 기반으로 전환) |
| 4.3 | InputStage | A: `Step1Input.tsx` |
| 4.4 | StrategyStage | A: `Step2AutoGenerate.tsx` (전략 부분) |
| 4.5 | CharacterStage | A: `Step2AutoGenerate.tsx` (캐릭터 부분) |
| 4.6 | StickerBatchStage | A: `Step4Generation.tsx` |
| 4.7 | PostProcessStage | B: `ProcessingPanel.tsx` + `SelectionGrid.tsx` |
| 4.8 | MetadataStage | B: `MetadataView.tsx` |
| 4.9 | ExportStage | A: `Step5Download.tsx` + B: `ExportPanel.tsx` 병합 |
| 4.10 | 공통 UI 컴포넌트 | A+B 병합: Button, Card, Loader, FileUpload 등 |

**LLM 친화적 UI 규칙** (모든 컴포넌트에 적용):
- 모든 `<button>`: `aria-label` + `data-testid`
- 모든 `<input>`: `aria-label` 또는 `<label>` 연결
- 진행률: `<progress>` 요소 + `aria-valuetext`
- 상태 변경: `role="status"` + `aria-live="polite"`
- 기계 판독: `data-stage`, `data-phase`, `data-job-status`

**테스트**:
```
tests/unit/ui/ApiKeyModal.test.tsx
  ├── Key 입력 후 저장 버튼 활성화
  ├── 유효하지 않은 키 입력 시 에러 표시
  └── 저장 시 onSave 콜백 호출 + localStorage 반영

tests/unit/ui/FileUpload.test.tsx
  ├── PNG/JPG 파일 수락
  ├── ZIP 파일 수락 (이미지 추출)
  ├── 미지원 파일 거부
  ├── 드래그 앤 드롭 동작
  └── 최대 파일 수 제한 (120)

tests/unit/ui/ProcessingOptions.test.tsx
  ├── 배경 제거 토글
  ├── 아웃라인 스타일/두께/불투명도 조정
  └── 라이브 프리뷰 업데이트

tests/unit/ui/SelectionGrid.test.tsx
  ├── 이미지 선택/해제
  ├── 전체 선택/해제
  └── 선택 카운트 표시
```

**커버리지 목표**: UI 레이어 80%+

---

### Phase 5: 파이프라인 오케스트레이터 + LLM Bridge (예상: 2일)

**목표**: 서비스 레이어를 파이프라인으로 조합 + window.emoticon API 노출

| # | 작업 | 산출물 |
|---|-----|-------|
| 5.1 | Generation Pipeline | `services/pipeline/generationPipeline.ts` |
| 5.2 | PostProcess Pipeline | `services/pipeline/postProcessPipeline.ts` |
| 5.3 | Full Pipeline | `services/pipeline/fullPipeline.ts` |
| 5.4 | window.emoticon API 구현 | `bridge/windowApi.ts` |
| 5.5 | EventBus 구현 | `bridge/eventBus.ts` |
| 5.6 | DOM State 동기화 | `bridge/domState.ts` |
| 5.7 | useExposeApi 훅 | `hooks/useExposeApi.ts` |

**파이프라인 실행 모델**:
```typescript
// 각 파이프라인은 Job을 생성하고 비동기로 실행
// Progress는 subscribe() 또는 CustomEvent로 수신
async function runFullPipeline(input: FullPipelineInput): Promise<{ jobId: string }> {
  const jobId = crypto.randomUUID();
  const store = useAppStore.getState();
  
  store.actions.updateJob(jobId, { status: 'running', stage: 'input' });
  
  try {
    // Stage 2: AI Strategy
    emitProgress(jobId, 'strategy', 0, 'Starting expert panel consultation...');
    const strategy = await runExpertPanel(input);
    
    // Stage 3: Character Generation
    emitProgress(jobId, 'character', 0, 'Generating base character...');
    const { mainImage, characterSpec } = await generateCharacter(input, strategy);
    
    // Stage 4: Sticker Batch (45개)
    emitProgress(jobId, 'stickers', 0, 'Generating 45 stickers...');
    const stickers = await generateStickerBatch(characterSpec, strategy, (i, total) => {
      emitProgress(jobId, 'stickers', (i / total) * 100, `Sticker ${i}/${total}`);
    });
    
    // Stage 5: Post-Processing
    emitProgress(jobId, 'postprocess', 0, 'Applying post-processing...');
    const processed = await postProcessAll(stickers);
    
    // Stage 6: Metadata
    emitProgress(jobId, 'metadata', 0, 'Generating metadata...');
    const metadata = await generateMetadata(processed);
    
    store.actions.updateJob(jobId, { status: 'completed', stage: 'export' });
    return { jobId };
    
  } catch (error) {
    store.actions.updateJob(jobId, { 
      status: 'failed', 
      error: normalizeError(error) 
    });
    throw error;
  }
}
```

**테스트**:
```
tests/unit/bridge/windowApi.test.ts
  ├── window.emoticon 정의 확인
  ├── describe() 반환 구조 검증
  ├── setApiKey() → getApiKeyStatus() 연동
  ├── runFullPipeline() → Job 생성 확인
  ├── subscribe() → 진행률 콜백 수신
  ├── cancelJob() → 작업 중단
  └── 에러 응답 구조 (ServiceError) 검증

tests/integration/servicesPipeline.integration.test.ts
  ├── 전체 파이프라인 (모든 단계 순차 실행, Mock Gemini)
  ├── 후처리 전용 파이프라인
  ├── 단계별 진행률 이벤트 순서 검증
  └── 중간 실패 시 에러 전파 + 이전 결과 보존

tests/e2e/llm-window-api.spec.ts
  ├── page.evaluate로 describe() 호출
  ├── page.evaluate로 전체 파이프라인 실행
  ├── waitForFunction으로 완료 대기
  ├── 결과 조회 및 내보내기
  └── 에러 시나리오 (잘못된 API Key)
```

---

### Phase 6: E2E 테스트 + Visual Regression (예상: 2일)

**목표**: 주요 사용자 여정 E2E 테스트 + 이미지 처리 비주얼 회귀 테스트

| # | 작업 | 산출물 |
|---|-----|-------|
| 6.1 | Full Pipeline E2E | `tests/e2e/full-pipeline.spec.ts` |
| 6.2 | PostProcess Only E2E | `tests/e2e/postprocess-only.spec.ts` |
| 6.3 | API Key Flow E2E | `tests/e2e/api-key-flow.spec.ts` |
| 6.4 | LLM Window API E2E | `tests/e2e/llm-window-api.spec.ts` |
| 6.5 | Visual Regression 기준 이미지 생성 | `tests/goldens/*` |
| 6.6 | CI/CD 설정 | `.github/workflows/test.yml` |

**E2E 테스트 전략**:
- **Fast E2E** (Mock Gemini, ~2분): 전체 UI 워크플로우, 파일 업로드/다운로드
- **Slow E2E** (Real Gemini, ~10분): Nightly CI에서만, 1-2개 스티커만 생성
- **Visual E2E**: 배경 제거/아웃라인 결과를 Golden 이미지와 비교 (`pixelmatch`, 허용 오차 0.5%)

**Playwright 설정**:
```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 120_000,     // 2분 기본
  retries: 1,
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'fast-e2e', testMatch: /.*\.(spec|e2e)\.ts/, timeout: 120_000 },
    { name: 'slow-e2e', testMatch: /full-pipeline\.spec\.ts/, timeout: 600_000 },
  ],
});
```

---

### Phase 7: 통합 검증 + 릴리스 준비 (예상: 1일)

| # | 작업 | 검증 기준 |
|---|-----|----------|
| 7.1 | 전체 테스트 스위트 실행 | Unit + Integration + E2E 모두 통과 |
| 7.2 | 커버리지 보고서 확인 | 서비스 90%+, UI 80%+, 전체 85%+ |
| 7.3 | 빌드 최적화 | `npm run build` 성공, 번들 사이즈 확인 |
| 7.4 | LLM 에이전트 시나리오 수동 검증 | Playwright MCP로 전체 파이프라인 실행 |
| 7.5 | README 작성 | 설치, 사용법, LLM 에이전트 가이드 |
| 7.6 | .env.example 완성 | 환경 변수 템플릿 |

---

## 6. 테스트 전략

### 6.1 테스트 피라미드

```
          ┌────────────┐
          │   E2E (6)  │  Playwright — 주요 여정 4개 + Visual 2개
         ─┤            ├─
        ┌─┤ Integration│  Vitest + RTL — 파이프라인, 상태, UI 통합 (4개 파일)
       ─┤ │   (12)     ├─
      ┌─┤ │            │
     ─┤ │ │  Unit (35+)│  Vitest — 서비스, UI, Bridge (8개 모듈 × ~5 케이스)
      │ └─┤            ├─
      └───┴────────────┘
```

### 6.2 테스트 프레임워크 스택

| 도구 | 역할 |
|------|------|
| **Vitest** | Unit + Integration 테스트 러너 |
| **@testing-library/react** | React 컴포넌트 테스트 |
| **@testing-library/user-event** | 사용자 이벤트 시뮬레이션 |
| **vitest-canvas-mock** | Canvas API 모킹 (jsdom 환경) |
| **MSW (Mock Service Worker)** | HTTP 요청 모킹 (Gemini API) |
| **@playwright/test** | E2E 브라우저 테스트 |
| **pixelmatch + pngjs** | 이미지 비주얼 회귀 비교 |
| **Zod** | 런타임 스키마 검증 (API 응답 계약) |

### 6.3 Mocking 전략

| 대상 | Mock 방식 | 이유 |
|------|----------|------|
| **Gemini API** | `vi.mock('@google/genai')` + JSON Fixture | 결정적, 빠름, API 비용 없음 |
| **Canvas API** | `vitest-canvas-mock` | jsdom에 Canvas 없음 |
| **localStorage** | Vitest 내장 jsdom | 자동 지원 |
| **File/Blob** | `vitest-canvas-mock` | toBlob, toDataURL 모킹 |
| **HTTP 요청** | MSW 핸들러 | Integration 테스트용 네트워크 모킹 |

### 6.4 Gemini API Mock Fixture 예시

```json
// tests/fixtures/gemini/market-analyst-response.json
{
  "response": {
    "candidates": [{
      "content": {
        "parts": [{
          "text": "{\"selectedVisualStyleIndex\": 0, \"textStyle\": {...}, \"culturalNotes\": \"...\", \"salesReasoning\": \"...\"}"
        }]
      }
    }]
  }
}
```

### 6.5 회귀 테스트 전략

| 회귀 유형 | 방법 | 트리거 |
|-----------|------|--------|
| **API 계약 회귀** | Zod 스키마 스냅샷 | Gemini 응답 구조 변경 감지 |
| **프롬프트 회귀** | 인라인 스냅샷 (`toMatchInlineSnapshot`) | 의도치 않은 프롬프트 변경 감지 |
| **이미지 처리 회귀** | Golden 이미지 비교 (pixelmatch, ≤0.5%) | 배경 제거/아웃라인 알고리즘 변경 감지 |
| **내보내기 회귀** | ZIP 매니페스트 검증 (파일명, 개수, 크기) | 내보내기 포맷 변경 감지 |
| **UI 회귀** | Playwright 스크린샷 비교 | 레이아웃/스타일 변경 감지 |
| **타입 회귀** | TypeScript strict mode + CI | 타입 호환성 깨짐 감지 |

### 6.6 커버리지 목표

| 모듈 | Lines | Branches | Functions |
|------|-------|----------|-----------|
| `services/gemini/**` | 90% | 88% | 90% |
| `services/image/**` | 90% | 90% | 90% |
| `services/export/**` | 90% | 90% | 90% |
| `bridge/**` | 85% | 80% | 85% |
| `components/**` | 80% | 75% | 80% |
| **전체** | **85%** | **80%** | **85%** |

### 6.7 CI/CD 파이프라인

```yaml
# .github/workflows/test.yml
name: Test Suite
on:
  push:
  pull_request:
  schedule:
    - cron: '0 3 * * *'  # 매일 새벽 3시 (나이틀리)
jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - npm ci
      - npm run test:unit -- --coverage
      - npm run test:integration
      # 커버리지 임계값 미달 시 실패

  e2e-fast:
    runs-on: ubuntu-latest
    steps:
      - npx playwright install chromium
      - npm run test:e2e  # Mock Gemini

  e2e-nightly:  # Nightly only
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - npm run test:e2e:real  # Real Gemini (1-2 stickers)

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - npm run test:visual  # pixelmatch golden comparison
```

---

## 7. 위험 요소 및 완화 전략

### 7.1 기술적 위험

| # | 위험 | 영향도 | 발생 확률 | 완화 전략 |
|---|------|--------|----------|----------|
| 1 | **Gemini preview 모델 중단** | 🔴 Critical | 중간 | 3개 preview 모델 모두 폴백 체인 구현 필수. 특히 **post-processor에 폴백 없음** → 반드시 추가 |
| 2 | **Rate Limit 충돌** | 🔴 높음 | 높음 | 통합 시 세션당 최대 30+ API 호출. 공유 Rate Limiter + 큐 + backoff 필수 |
| 3 | **브라우저 메모리 초과** | 🔴 높음 | 중간 | 45 원본 + 45 처리 = 90개 base64 이미지. Object URL 사용, 미사용 즉시 해제, IndexedDB 고려 |
| 4 | **이미지 처리 UI 프리즈** | 중간 | 높음 | Sobel + 플러드 필이 메인 스레드 점유. Web Worker로 분리 검토 |
| 5 | **플랫폼 스펙 불일치** | 🔴 높음 | 중간 | 두 프로젝트의 `PLATFORMS`/`PLATFORM_SPECS` 값이 다를 수 있음. 실제 OGQ/LINE 제출 가이드와 대조 감사 필수 |
| 6 | **Canvas 크로스 브라우저** | 중간 | 낮음 | Chromium 기준 개발, Playwright가 Chromium 사용하므로 LLM 에이전트와 동일 환경 보장 |
| 7 | **API Key 클라이언트 노출** | 중간 | 높음 | 프런트엔드 전용이므로 불가피. README에 보안 주의사항 명시, 개인용 도구 명시 |

### 7.2 프로젝트 위험

| 위험 | 완화 전략 |
|------|----------|
| **스코프 확장** | Phase별 명확한 산출물 정의, 추가 요구사항은 별도 이슈로 관리 |
| **테스트 인프라 복잡도** | Phase 1에서 인프라 선행 구축, 이후 Phase에서 테스트 작성 부담 감소 |
| **LLM 인터페이스 설계 미숙** | window.emoticon API를 Phase 5에서 구현, E2E로 실제 LLM 시나리오 검증 |

### 7.3 "LLM 친화적"의 모호성 해소 (Metis 분석 반영)

> ⚠️ **핵심 발견**: "LLM 친화적"과 "프런트엔드 전용"은 잠재적으로 상충됩니다. 
> Metis 분석 결과, 프런트엔드 전용 제약을 유지하면서 LLM이 접근할 수 있는 유일한 방법은 
> **Playwright MCP 브라우저 자동화**입니다. Canvas 이미지 처리가 브라우저 컨텍스트를 
> 요구하므로 이 접근 방식이 기술적으로도 자연스럽습니다.

**"LLM 친화적"의 5가지 해석과 결정**:

| 해석 | 프런트엔드 전용 호환 | 본 계획서 채택 여부 |
|------|---------------------|-------------------|
| Playwright MCP 브라우저 자동화 (ARIA 트리) | ✅ 호환 | ✅ **Phase 1 채택** |
| `window.emoticon` 프로그래밍 API | ✅ 호환 | ✅ **Phase 1 채택** (보조) |
| MCP 서버 사이드카 | ❌ 서버 필요 | ❌ Phase 2 옵션 |
| REST/OpenAPI 엔드포인트 | ❌ 서버 필요 | ❌ 미채택 |
| MCP Apps (채팅 내 UI) | ❌ 서버+호스트 필요 | ❌ 미채택 |

**본 계획서에서 "LLM 친화적"이란**:

1. **접근성 우선 HTML**: Playwright MCP의 접근성 스냅샷에서 모든 요소가 명확하게 식별
   - 모든 인터랙티브 요소: `aria-label` + `data-testid`
   - 시맨틱 HTML (`<button>`, `<input>`, `<progress>` — `<div onClick>` 금지)
   - 텍스트 기반 상태 표시 (`role="status"` + `aria-live="polite"`)
2. **프로그래밍 API**: `window.emoticon` — LLM이 `page.evaluate()`로 직접 호출 (빠른 경로)
3. **기계 판독 가능한 상태**: `data-stage`, `data-phase`, `data-job-status` 어트리뷰트
4. **비동기 작업 추적**: `subscribe()` + CustomEvent + `waitForFunction()`
5. **구조화된 에러**: `ServiceError` 타입으로 LLM이 에러를 파싱하고 재시도 가능 여부 판단
6. **API Key 프로그래밍 주입 지원**: LLM이 `page.evaluate(() => localStorage.setItem(...))` 가능

**"LLM 친화적"이 아닌 것** (Phase 1 범위 외):
- MCP 서버 구현 (프런트엔드 전용 제약 위반)
- REST API (백엔드 필요)
- LLM에게 별도의 토큰/인증 제공

### 7.4 동시 세션 격리

Playwright 브라우저 자동화 특성상, 각 LLM 에이전트는 **독립된 브라우저 컨텍스트**를 사용합니다. 
모든 상태가 React 컴포넌트 상태 + localStorage에 있으므로, 동시 세션은 자연스럽게 격리됩니다.
**추가 작업 불필요** — 무료로 멀티에이전트 지원.

---

## 8. 기술 결정 사항

### 확정된 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| **프레임워크** | React 19 + Vite 6 | 두 프로젝트 공통, 최신 안정 버전 |
| **상태 관리** | Zustand | React 외부 접근 가능 (window API), 보일러플레이트 최소 |
| **스타일링** | Tailwind v4 (CSS-first: `@import "tailwindcss"` + `@theme {}`, `@tailwindcss/vite` 플러그인. ⚠️ `tailwind.config.ts` 미사용) | 빌드 최적화, CDN 대비 번들 사이즈 감소. 클래스 리네임 주의: `shadow-sm`→`shadow-xs`, `ring`→`ring-3`, `rounded-sm`→`rounded-xs` |
| **테스트 러너** | Vitest + Playwright | Vite 네이티브 호환, 빠른 실행 |
| **런타임 검증** | Zod | LLM API 입력 검증, Gemini 응답 검증 |
| **라우터** | 사용하지 않음 | 단일 페이지 + Stage Machine으로 충분 |
| **API Key 저장** | localStorage | 쿠키 대비 용량 제한 없음, 서버 불필요 |

### 신규 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `zustand` | latest | 상태 관리 |
| `zod` | latest | 런타임 스키마 검증 |
| `vitest` | latest | 테스트 러너 |
| `vitest-canvas-mock` | latest | Canvas 모킹 |
| `msw` | latest | HTTP 요청 모킹 |
| `pixelmatch` | latest | 이미지 비교 |
| `pngjs` | latest | PNG 파싱 |
| `@playwright/test` | latest | E2E 테스트 |

### 기존 의존성 (유지)

| 패키지 | 출처 | 용도 |
|--------|------|------|
| `react`, `react-dom` | A+B | UI 프레임워크 |
| `@google/genai` | A+B | Gemini AI |
| `jszip` | A+B | ZIP 생성 |
| `file-saver` | B | 파일 다운로드 |
| `uuid` | B | 고유 ID 생성 |
| `lucide-react` | A+B | 아이콘 |

---

## 부록 A: 일정 요약

| Phase | 작업 | 예상 소요 | 누적 |
|-------|------|----------|------|
| 1 | 프로젝트 부트스트랩 | 1일 | 1일 |
| 2 | 타입 + 서비스 레이어 | 2일 | 3일 |
| 3 | Zustand 스토어 + API Key | 1일 | 4일 |
| 4 | UI 컴포넌트 구현 | 3일 | 7일 |
| 5 | 파이프라인 + LLM Bridge | 2일 | 9일 |
| 6 | E2E + Visual Regression | 2일 | 11일 |
| 7 | 통합 검증 + 릴리스 | 1일 | **12일** |

**총 예상 소요**: 약 12 작업일 (2.5주)

---

## 부록 B: 에이전트 팀 구성 및 역할

본 계획서는 다음 5명의 전문 에이전트 팀이 협업하여 작성되었습니다:

| # | Agent | 역할 | 기여 영역 |
|---|-------|------|----------|
| 1 | **Metis** (요구사항 분석가) | 숨겨진 요구사항, 모호성, 위험 요소 식별 | §7 위험 요소, §4 LLM 친화성 정의 |
| 2 | **Oracle** (아키텍트) | 통합 아키텍처 및 LLM 친화 API 설계 | §3 아키텍처, §4 API 명세, §8 기술 결정 |
| 3 | **Librarian** (리서처) | LLM 친화 웹앱 패턴 + 테스팅 전략 조사 | §4 Playwright MCP 패턴, §6 테스트 전략 |
| 4 | **Ultrabrain** (테스트 전략가) | 포괄적 테스트 계획 수립 | §6 테스트 피라미드, 커버리지 목표, CI/CD |
| 5 | **Momus** (검토자) | 최종 계획서 품질 검증 | 전체 계획서 리뷰 및 개선 |

---

---

## 부록 C: 구현 가능성 검토 정오표 (v1.1)

> 본 섹션은 5명의 에이전트 팀(Explore ×2, Librarian, Oracle, Momus)이 소스코드 대조, 
> SDK 검증, 아키텍처 심층 분석을 수행한 결과를 반영합니다.

### C.1 팩트 오류 (소스코드 vs 계획서 불일치)

| # | 계획서 기술 | 실제 코드 | 심각도 | 수정 사항 |
|---|-----------|----------|--------|----------|
| F1 | `new GoogleGenAI(apiKey)` (문자열 인자) | `new GoogleGenAI({ apiKey })` (객체 인자) | 🔴 런타임 에러 | 계획서 내 모든 GoogleGenAI 생성자 호출을 객체 형태로 수정 |
| F2 | Tailwind v4 설정: `tailwind.config.ts` 사용 | v4는 CSS-first 설정: `@import "tailwindcss"` + `@theme {}` | 🔴 빌드 실패 | Phase 1.2를 CSS-first 설정으로 변경 (✅ 반영 완료) |
| F3 | 메타데이터: "3옵션 × 4언어" | 실제: 3옵션 × 2언어 (영어 + 대상 언어) | 🟡 스펙 오해 | "4언어" → "2언어(영어+대상언어)" (✅ 반영 완료) |
| F4 | 타입 목록: 6개 | 실제: 10개 (TextStyleOption, VisualStyle, PlatformType, PersonaInsight 누락) | 🟡 불완전 | 누락 타입 4개 추가 (✅ 반영 완료) |
| F5 | Step 번호: "4단계 위저드, Step 3 스킵" | 실제: 상태값 1-4, 컴포넌트명 Step1/Step2/Step4/Step5 (상태3→Step4Generation) | 🟡 혼동 유발 | 통합 시 Stage 이름 통일 필요, 기존 번호 불일치는 역사적 산물 |
| F6 | Post-processor API Key: `API_KEY` | Generator: `GEMINI_API_KEY` | 🔴 통합 시 충돌 | 런타임 localStorage 기반으로 통일, 모든 `process.env.*` 제거 |
| F7 | `PlatformType` (string union) vs `ExportPlatform` (enum) | 같은 개념, 다른 타입명/형태 | 🔴 타입 에러 | 통합 도메인 모델에서 단일 `PlatformId` 타입으로 통일 |
| F8 | `Sticker` vs `Emoji` 타입 | 같은 엔티티(처리된 이미지), 다른 필드 구조 | 🔴 병합 필수 | 파이프라인 단계별 타입 설계: `GeneratedSticker` → `ProcessedImage` → `ExportItem` |
| F9 | 파일명 포맷: '2digit' (string enum) vs `padStart(2,'0')` (함수) | 같은 결과, 다른 표현 | 🟡 일관성 | 함수 기반으로 통일 |
| F10 | 누락 의존성: `file-saver`, `uuid`, `react-dom` | Generator에 없고 PostProcessor에만 있음 | 🟡 빌드 누락 | 통합 package.json에 모두 포함 |
| F11 | Post-processor Gemini 서비스에 모델 폴백 없음 | Generator만 fallback 로직 보유 | 🟡 안정성 | 통합 Gemini Client에 모든 호출 fallback 적용 |
| F12 | `vitest-canvas-mock`이 실제 픽셀 데이터 반환하지 않음 | `getImageData()` 반환값이 모두 0 | 🟡 테스트 한계 | Sobel/flood fill 테스트는 합성 ImageData 배열로 별도 테스트, canvas mock은 파이프라인 통합 테스트용으로만 사용 |

### C.2 아키텍처 결함 (Oracle 심층 분석)

> 아래 항목은 계획서대로 구현할 경우 런타임에 발생할 **잠재적 버그**입니다.
> 각 항목에 대한 해결책을 구현 시 반드시 적용해야 합니다.

#### 🔴 Critical (구현 필수)

| # | 결함 | 증상 | 해결책 |
|---|------|------|--------|
| A1 | **동시 파이프라인 실행 시 공유 상태 덮어쓰기** | 에이전트 A, B가 동시에 `runFullPipeline()` 호출 시 `assets.stickers`가 뒤섞임 | 모든 출력물을 `jobId`로 스코핑: `jobResults[jobId].stickers` 또는 단일 활성 파이프라인 강제 |
| A2 | **`cancelJob()` 선언만 있고 실제 취소 메커니즘 없음** | cancel 호출 후에도 Gemini API 요청 계속 발생, 비용 낭비 | 작업별 `AbortController` 생성 → `signal`을 서비스에 전달 → 각 단계/반복 사이 `signal.aborted` 체크 |
| A3 | **base64 이미지 90개를 Zustand 스토어에 저장** | 4.5~18MB 문자열 + React 리렌더링마다 직렬화 → 모바일 OOM | Zustand에는 ID/상태만 저장, 이미지 바이너리는 `Map<string, string>` 또는 IndexedDB에 분리 보관. `releaseImage(id)` API 추가 |
| A4 | **45개 이미지 Canvas 처리가 메인 스레드 점유** | Sobel+FloodFill+Outline = 이미지당 60~200ms × 45개 = 2.7~9초 UI 프리즈 | **Web Worker 필수** (Phase 5에 추가). 최소한 `requestIdleCallback`으로 청크 처리 |
| A5 | **피크 메모리 >150MB 미언급** | base64 팽창(33%) + RGBA 버퍼(720×720×4=2MB/장) + JSZip 중복 → 모바일 탭 크래시 | 동시 처리 개수 제한 (2-3개), 처리 완료 후 즉시 버퍼 해제, Object URL 사용 후 `revokeObjectURL()` |

#### 🟡 High (안정성/신뢰성)

| # | 결함 | 해결책 |
|---|------|--------|
| A6 | **취소된 Job이 나중에 `completed`로 전환 가능** | 상태 전이를 단방향으로 강제: `running → cancelled/failed/completed`는 터미널 상태, 되돌릴 수 없음 |
| A7 | **`subscribe()` 콜백이 동기적으로 상태 재진입** | `queueMicrotask`로 비동기 디스패치, 리스너를 `try/catch`로 감싸서 에러 격리 |
| A8 | **실행 중 `setApiKey()` 호출 시 혼합 자격증명** | Job 시작 시 API Key 스냅샷 → Job 컨텍스트에 바인딩, 이후 키 변경은 신규 Job에만 적용 |
| A9 | **`localStorage` 쓰기 실패 가능** (할당량/보안/시크릿 모드) | try/catch 가드 + 인메모리 폴백, `persistenceUnavailable` 상태 노출 |
| A10 | **`jobs: Record<string, JobSnapshot>` 무한 증가** | TTL/LRU 정책: `maxJobs=10`, 터미널 상태 도달 후 리소스 해제 |
| A11 | **부분 성공 결과 유실** (19/45 스티커 생성 후 실패 시) | 스티커별 증분 저장 → `getJobResult(jobId, { partial: true })` API → 부분 집합 내보내기 허용 |
| A12 | **`ServiceError.retryable` 매핑 미정의** | Gemini SDK 에러 정규화: 네트워크/429/5xx → retryable, 인증/검증 → non-retryable |
| A13 | **`describe()` API가 너무 정적** | `allowedTransitions`, `stateVersion` 추가, `actions: string[]` → 리터럴 유니온으로 타입 강화 |
| A14 | **CustomEvent 동기 디스패치가 파이프라인 블록 가능** | 비동기 큐로 이벤트 발행, 리스너 수 상한(maxListeners), 슬로 리스너 격리 |
| A15 | **구독 해제 누수** (LLM 에이전트 연결 끊김 시) | Job 터미널 상태 도달 시 자동 구독 해제, 타임아웃 기반 stale 리스너 정리 |

### C.3 구현 계획 수정 사항

위 발견사항에 따라 **Phase 수정 및 추가 작업**:

#### Phase 1 수정
- 1.2: ~~`tailwind.config.ts`~~ → CSS-first 설정 (`@import "tailwindcss"` + `@theme {}`)

#### Phase 2 추가 작업
- 2.12: `GoogleGenAI` 생성자를 `{ apiKey }` 객체 형태로 통일
- 2.13: `PlatformType`/`ExportPlatform` → `PlatformId` 단일 타입으로 통합
- 2.14: `Sticker`/`Emoji` → 파이프라인 단계별 타입 재설계
- 2.15: Post-processor Gemini 서비스에 모델 폴백 로직 추가

#### Phase 3 추가 작업
- 3.7: Zustand 스토어에서 이미지 바이너리 분리 (ID만 저장, 바이너리는 별도 Map/IndexedDB)
- 3.8: `localStorage` try/catch 가드 + 인메모리 폴백
- 3.9: Job 상태 전이 단방향 강제 (터미널 상태 보호)
- 3.10: Job TTL/LRU 정리 정책

#### Phase 5 추가 작업 (⚠️ 가장 큰 변경)
- 5.8: **Job별 AbortController + 취소 체크포인트 구현** (모든 단계/반복 사이)
- 5.9: **이미지 처리 Web Worker 분리** (Sobel + FloodFill + Outline을 Worker로 이동)
- 5.10: **동시 파이프라인 실행 방지** (단일 활성 Job 강제 또는 Job별 출력 격리)
- 5.11: **부분 결과 증분 저장** (스티커별 즉시 저장 → 실패 시 기존 결과 보존)
- 5.12: **subscribe() 비동기 디스패치** + 자동 구독 해제
- 5.13: **ServiceError 정규화** (Gemini SDK 에러 코드 매핑)
- 5.14: **피크 메모리 관리** (동시 처리 2-3개 제한, 버퍼 즉시 해제)

#### Phase 6 추가 작업
- 6.7: Canvas 이미지 처리 테스트에 합성 ImageData 배열 사용 (vitest-canvas-mock 한계 보완)

#### 일정 영향

| Phase | 기존 | 수정 | 변경분 |
|-------|------|------|--------|
| Phase 1 | 1일 | 1일 | 변경 없음 |
| Phase 2 | 2일 | **2.5일** | +0.5일 (타입 통합, 폴백 추가) |
| Phase 3 | 1일 | **1.5일** | +0.5일 (이미지 분리 저장, Job 정책) |
| Phase 5 | 2일 | **4일** | +2일 (**Web Worker, AbortController, 동시성 제어, 부분 결과**) |
| Phase 6 | 2일 | **2.5일** | +0.5일 (합성 ImageData 테스트) |
| Phase 7 | 1일 | 1일 | 변경 없음 |
| **합계** | **12일** | **15.5일** | **+3.5일** |

### C.4 MSW 테스트 참고사항

Librarian 검증 결과, `@google/genai` SDK는 내부적으로 `fetch()`를 사용하므로 MSW가 정상 가로챕니다.

```typescript
// MSW 핸들러 예시 — Gemini API 엔드포인트 mock
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('https://generativelanguage.googleapis.com/v1beta/models/*', () => {
    return HttpResponse.json({ /* mock Gemini response */ })
  }),
]
```

### C.5 vitest-canvas-mock 테스트 전략 수정

Canvas mock은 API 표면만 모킹하며 **실제 픽셀 연산을 수행하지 않습니다**. 따라서:

| 테스트 유형 | 도구 | 테스트 대상 |
|------------|------|-----------|
| **알고리즘 정확성** | Vitest + 합성 ImageData 배열 | Sobel 커널 연산, 플러드 필 경계 조건, 디프린징 알파값 |
| **파이프라인 통합** | vitest-canvas-mock | 함수 호출 시퀀스, 에러 전파, Canvas API 호출 검증 |
| **시각적 회귀** | Playwright 스크린샷 + pixelmatch | 실제 브라우저 Canvas 렌더링 결과 비교 |

---

## 부록 D: 사전 결정 필요 사항 (Metis 분석)

> 아래 사항은 구현 착수 전 확정이 필요합니다.

### 결정 1 🔴 — 워크플로우 구조: 순차 파이프라인 vs 모듈형 탭

| | 순차 파이프라인 (본 계획서 기본안) | 모듈형 탭 |
|---|---|---|
| **흐름** | 입력→전략→생성→후처리→메타데이터→내보내기 (7단계) | 탭1: 생성기, 탭2: 후처리기, 공유: 설정/내보내기 |
| **상태 복잡도** | 🔴 높음 — 전체 파이프라인 상태 통합 | 🟡 중간 — 격리된 상태 트리 |
| **에이전트 UX** | 🟢 단일 선형 워크플로우, 자동화 용이 | 🟡 탭 전환 이해 필요 |
| **개발 난이도** | 🔴 높음 — 깊은 상태 리팩토링 | 🟢 낮음 — 인프라 병합 위주 |
| **사용자 가치** | 🟢 심리스 경험 | 🟡 두 개 도구를 하나의 껍질에 |

**본 계획서 기본안**: 순차 파이프라인 (Oracle 추천) — LLM 에이전트에게 더 자연스러운 단일 흐름  
**대안**: 모듈형 탭 (Metis 추천) — 병합 위험 최소화, 각 워크플로우 독립 테스트 가능

### 결정 2 🟡 — 플랫폼 스펙 정본

두 프로젝트의 OGQ/LINE Sticker/LINE Emoji 스펙이 다를 수 있습니다. **실제 플랫폼 제출 가이드와 대조 감사** 후 단일 정본(single source of truth)을 확정해야 합니다.

### 결정 3 🟡 — 테스트 깊이 상한

| 수준 | 소요 | 가치 |
|------|------|------|
| Unit + E2E 기본 | ~3일 | LLM 에이전트 경험 직접 검증 |
| + Canvas Visual Regression | +2일 | 이미지 처리 알고리즘 변경 감지 |
| + 성능 벤치마크 | +1일 | 메모리/CPU 병목 조기 발견 |
| + 나이틀리 Real Gemini | +1일 | API 변경 조기 감지 |

---

*본 계획서는 v1.0입니다. 5명의 에이전트 팀이 작성 및 검토를 완료했습니다.*
