# Emoji Master CLI 구현 계획서

> AI 이모티콘 팩 생성기의 맥 로컬 CLI 버전 구현 계획

## 1. 프로젝트 개요

### 1.1 목적
기존 Emoji Master 웹/일렉트론 서비스의 핵심 파이프라인을 macOS 로컬 환경에서 CLI로 실행할 수 있도록 한다.
OpenClaw 등 AI 에이전트가 프로그래밍 방식으로 이모티콘 팩을 생성·관리할 수 있는 AI 친화적 인터페이스를 제공한다.

### 1.2 핵심 요구사항
| 항목 | 내용 |
|------|------|
| 실행 환경 | macOS 로컬, Node.js 20+ |
| AI 친화성 | 구조화된 JSON I/O, NDJSON 진행률, `--auto` 모드 |
| 컨펌 체크포인트 | 키 비주얼 생성 후, 후처리 후, 메타데이터 후 |
| 자동 모드 | `--auto` 시 모든 컨펌을 AI(OpenClaw)에 위임 |
| 내보내기 대상 | 모든 플랫폼 (OGQ Sticker, LINE Sticker, LINE Emoji) |
| 코드 관리 | `packages/cli` — 기존 web/electron과 독립 디렉토리 |

### 1.3 워크플로우 단계 (8단계)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐
│ 1. Setup │───▶│ 2. Input │───▶│3.Strategy│───▶│4. Character  │
│ (API Key)│    │(Concept) │    │(AI분석)  │    │(키 비주얼)   │
└──────────┘    └──────────┘    └──────────┘    └──────┬───────┘
                                                       │
                                              ⚡ CONFIRM (interactive)
                                              🤖 AUTO-APPROVE (auto)
                                                       │
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──┴───────┐
│ 8. Export │◀──│7.Metadata│◀──│6. PostProcess│◀──│5.Stickers│
│(모든 플랫폼)│  │(제목/태그)│    │(배경제거/윤곽)│    │(개별생성) │
└──────────┘    └──┬───────┘    └──────┬───────┘    └──────────┘
                   │                    │
          ⚡ CONFIRM              ⚡ CONFIRM
          🤖 AUTO-APPROVE        🤖 AUTO-APPROVE
```

---

## 2. 아키텍처 설계

### 2.1 모노레포 구조

```
emoji_master/
├── packages/
│   ├── shared/          # 기존 공유 코드 (React 컴포넌트 + 서비스)
│   ├── web/             # 기존 웹 SPA
│   ├── electron/        # 기존 데스크톱 앱
│   └── cli/             # ★ 신규 CLI 패키지
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── src/
│       │   ├── index.ts              # CLI 진입점 (bin)
│       │   ├── commands/             # CLI 명령어
│       │   │   ├── generate.ts       # 전체 파이프라인 실행
│       │   │   ├── postprocess.ts    # 후처리만 실행
│       │   │   ├── export.ts         # 내보내기만 실행
│       │   │   └── config.ts         # API 키 설정
│       │   ├── services/             # CLI 전용 서비스
│       │   │   ├── image/            # sharp 기반 이미지 처리
│       │   │   │   ├── core.ts       # sharp 래퍼 (Canvas 대체)
│       │   │   │   ├── resize.ts     # 이미지 리사이즈
│       │   │   │   ├── backgroundRemoval.ts
│       │   │   │   ├── outlineGeneration.ts
│       │   │   │   └── export.ts     # ZIP → 파일시스템 저장
│       │   │   ├── gemini/           # shared에서 re-export
│       │   │   │   └── index.ts      # 래퍼 (API키 주입 방식 변경)
│       │   │   └── pipeline/         # 컨펌 체크포인트 포함 파이프라인
│       │   │       ├── generationPipeline.ts
│       │   │       ├── postProcessPipeline.ts
│       │   │       └── fullPipeline.ts
│       │   ├── platform/             # CLI 플랫폼 어댑터
│       │   │   └── adapter.ts        # env/파일 기반 API키, fs 저장
│       │   ├── store/                # 경량 인메모리 상태
│       │   │   └── cliStore.ts       # Zustand (persist 없음)
│       │   ├── bridge/               # EventEmitter 기반 이벤트
│       │   │   └── eventBus.ts       # Node.js EventEmitter
│       │   ├── io/                   # 입출력 처리
│       │   │   ├── output.ts         # JSON/인간 친화적 출력
│       │   │   ├── progress.ts       # 진행률 리포터
│       │   │   └── confirm.ts        # 컨펌 체크포인트
│       │   ├── types/                # CLI 전용 타입
│       │   │   └── cli.ts
│       │   └── utils/                # 유틸리티
│       │       ├── imagePreview.ts   # iTerm2 이미지 프리뷰
│       │       └── config.ts         # 설정 파일 관리
│       └── tests/
│           ├── unit/
│           ├── integration/
│           └── fixtures/
```

### 2.2 공유 코드 재사용 전략

코드베이스 분석 결과, 각 모듈의 재사용 가능성:

| 모듈 | 재사용 | 전략 |
|------|--------|------|
| `types/*.ts` | ✅ 그대로 | `@emoji/shared` 패키지 exports 추가 |
| `constants/*.ts` | ✅ 그대로 | `@emoji/shared` 패키지 exports 추가 |
| `services/gemini/client.ts` | ✅ 그대로 | `@google/genai` SDK는 Node.js 호환 |
| `services/gemini/orchestrator.ts` | ✅ 그대로 | 순수 API 호출, 브라우저 의존성 없음 |
| `services/gemini/prompts/*.ts` | ✅ 그대로 | 순수 문자열 템플릿 |
| `services/config/apiKeyManager.ts` | ⚠️ 어댑터 | platform.getApiKey() 호출 → CLI 어댑터 필요 |
| `services/image/*.ts` | ❌ 재작성 | Canvas API → `sharp` 라이브러리 |
| `services/pipeline/*.ts` | ⚠️ 재작성 | 컨펌 체크포인트 삽입, 이미지 서비스 교체 |
| `bridge/eventBus.ts` | ❌ 재작성 | `window.dispatchEvent` → Node.js `EventEmitter` |
| `bridge/domState.ts` | ❌ 불필요 | CLI에서 DOM 상태 동기화 불필요 |
| `bridge/windowApi.ts` | ❌ 불필요 | Electron 전용 |
| `platform/adapter.ts` | ❌ 재작성 | localStorage → dotenv/config 파일 |
| `store/appStore.ts` | ⚠️ 어댑터 | Zustand Node.js 호환, persist 제거 |

**핵심 결정**: `@emoji/shared`에 새 exports를 추가하여 Gemini 서비스, 타입, 상수를 CLI에서 직접 import.
이미지 처리, 플랫폼 어댑터, 이벤트 버스는 CLI 패키지에서 Node.js 네이티브로 재작성.

### 2.3 `@emoji/shared` exports 변경

```jsonc
// packages/shared/package.json (수정)
{
  "exports": {
    ".": "./src/App.tsx",
    "./css": "./src/index.css",
    // ★ CLI를 위한 새 exports
    "./types": "./src/types/index.ts",
    "./constants": "./src/constants/index.ts",
    "./constants/platforms": "./src/constants/platforms.ts",
    "./constants/gemini": "./src/constants/gemini.ts",
    "./constants/styles": "./src/constants/styles.ts",
    "./constants/imageProcessing": "./src/constants/imageProcessing.ts",
    "./services/gemini/client": "./src/services/gemini/client.ts",
    "./services/gemini/orchestrator": "./src/services/gemini/orchestrator.ts",
    "./services/config/apiKeyManager": "./src/services/config/apiKeyManager.ts",
    "./utils/errors": "./src/utils/errors.ts"
  }
}
```

> **참고**: types, constants 디렉토리에 `index.ts` barrel export 파일 생성 필요

### 2.4 브라우저 의존성 대체 맵

| 브라우저 API | 사용 위치 | Node.js 대체 |
|-------------|----------|-------------|
| `HTMLCanvasElement` | image/core.ts | `sharp` 라이브러리 |
| `CanvasRenderingContext2D` | image/*.ts | `sharp` 합성/변환 API |
| `HTMLImageElement` / `Image()` | image/core.ts | `sharp(buffer)` |
| `canvas.toDataURL()` | image/*.ts | `sharp.toBuffer()` → base64 인코딩 |
| `ctx.getImageData()` | backgroundRemoval.ts | `sharp.raw().toBuffer()` |
| `document.createElement('canvas')` | image/core.ts | 불필요 (sharp 직접 사용) |
| `Blob` | image/export.ts | `Buffer` |
| `URL.createObjectURL` / `<a>.click()` | platform/adapter.ts | `fs.writeFile()` |
| `localStorage` | platform/adapter.ts | `~/.emoji-master/config.json` 또는 환경변수 |
| `window.dispatchEvent` | bridge/eventBus.ts | Node.js `EventEmitter` |
| `document.documentElement` | bridge/domState.ts | 불필요 |
| `window.desktop` | bridge/windowApi.ts | 불필요 |
| `queueMicrotask` | bridge/eventBus.ts | Node.js 내장 `queueMicrotask` (호환) |

---

## 3. AI 친화적 인터페이스 설계

### 3.1 CLI 명령어 구조

```bash
emoji-cli <command> [options]

Commands:
  generate       전체 파이프라인 실행 (이모티콘 팩 생성)
  postprocess    후처리만 실행 (배경 제거, 윤곽선)
  export         내보내기만 실행 (기존 결과를 ZIP으로)
  config         설정 관리 (API 키 등)

Global Options:
  --auto              자동 모드 (모든 컨펌 자동 승인)
  --json              JSON 출력 모드 (AI 파싱용)
  --output, -o        출력 디렉토리 (기본: ./output)
  --verbose, -v       상세 로그
  --quiet, -q         최소 출력
```

### 3.2 `generate` 명령어 상세

```bash
emoji-cli generate [options]

Options:
  --concept, -c       이모티콘 컨셉 (필수)
  --language, -l      대상 언어 (기본: ko)
  --no-text           텍스트 없는 이모티콘
  --reference-image   참조 이미지 경로
  --api-key           Gemini API 키 (미지정 시 설정 파일 사용)
  --platforms         대상 플랫폼 (기본: all)
  --bg-removal        배경 제거 활성화 (기본: true)
  --outline           윤곽선 스타일 (none/white/black, 기본: white)
  --outline-thickness 윤곽선 두께 (기본: 3)
  --auto              자동 모드
  --json              JSON 출력
  --output, -o        출력 디렉토리
```

### 3.3 출력 형식

#### 인간 친화적 출력 (기본)
```
🎨 Emoji Master CLI v0.1.0
━━━━━━━━━━━━━━━━━━━━━━━━━

[1/8] Setup ✓ API key loaded
[2/8] Input ✓ Concept: "귀여운 고양이"
[3/8] Strategy ✓ Visual style: Soft Pastel, Text style: Round Bubble
[4/8] Character generation...
  ├─ Base character generated ✓
  ├─ Visual style applied ✓
  └─ Character spec extracted ✓

⏸  키 비주얼 확인이 필요합니다.
   Preview: [iTerm2 inline image 또는 파일 경로]
   계속하시겠습니까? (Y/n):
```

#### AI 친화적 JSON 출력 (`--json`)
```jsonc
// 각 줄이 독립적인 JSON 객체 (NDJSON)
{"type":"progress","stage":"setup","status":"complete","message":"API key loaded"}
{"type":"progress","stage":"input","status":"complete","data":{"concept":"귀여운 고양이","language":"ko"}}
{"type":"progress","stage":"strategy","status":"complete","data":{"visualStyle":"Soft Pastel","textStyle":"Round Bubble"}}
{"type":"progress","stage":"character","status":"complete","substage":"base_character"}
{"type":"progress","stage":"character","status":"complete","substage":"visual_style"}
{"type":"progress","stage":"character","status":"complete","substage":"character_spec"}

// ★ 컨펌 요청 (AI 에이전트가 파싱)
{
  "type": "confirm",
  "checkpoint": "key_visual",
  "message": "키 비주얼이 생성되었습니다. 계속하시겠습니까?",
  "preview": {
    "mainImage": "/tmp/emoji-cli/session-abc123/main_character.png",
    "mainImageBase64": "iVBORw0KGgo...",
    "characterSpec": {
      "artStyle": "Soft Pastel",
      "physicalDescription": "...",
      "facialFeatures": "...",
      "distinguishingFeatures": "...",
      "colorPalette": "..."
    },
    "strategy": {
      "selectedVisualStyleIndex": 2,
      "selectedTextStyle": { "title": "Round Bubble", "..." : "..." },
      "salesReasoning": "...",
      "culturalNotes": "..."
    }
  },
  "options": ["approve", "reject", "regenerate"],
  "awaiting_input": true
}
// stdin으로 응답: {"action": "approve"} 또는 {"action": "reject", "reason": "..."} 또는 {"action": "regenerate"}
```

### 3.4 컨펌 체크포인트 설계

3개의 컨펌 포인트가 있으며, 각각 동일한 프로토콜을 사용:

| 체크포인트 | 단계 | 제공 데이터 | 가능한 액션 |
|-----------|------|------------|------------|
| `key_visual` | 4단계 (캐릭터) 후 | 메인 이미지, 캐릭터 스펙, 전략 | approve, reject, regenerate |
| `post_process` | 6단계 (후처리) 후 | 처리된 이미지 목록, 처리 옵션 | approve, reject, reprocess |
| `metadata` | 7단계 (메타데이터) 후 | 3종 메타데이터 옵션 (personality/utility/creative) | approve(option_index), reject, regenerate |

#### Interactive 모드 (인간 사용자)
```
⏸  키 비주얼 확인
   [iTerm2 이미지 프리뷰 또는 파일 경로 표시]

   캐릭터 스타일: Soft Pastel
   특징: 둥근 눈, 분홍 볼, 짧은 수염

   (1) 승인하고 계속
   (2) 거부하고 중단
   (3) 다시 생성
   선택 [1]:
```

#### Auto 모드 (`--auto`)
```jsonc
// 컨펌 요청을 stdout으로 출력하고 즉시 자동 승인
{"type":"confirm","checkpoint":"key_visual","auto_approved":true,...}
{"type":"progress","stage":"stickers","status":"started"}
```

Auto 모드에서 OpenClaw가 제어할 때:
1. `--auto` 플래그로 실행하면 모든 컨펌을 자동 승인
2. 또는 `--auto=false`로 실행하여 stdin/stdout JSON 프로토콜로 AI가 직접 판단

```bash
# 완전 자동 (모든 컨펌 자동 승인)
emoji-cli generate --concept "귀여운 고양이" --auto --json

# AI 제어 (각 컨펌에서 AI가 판단)
emoji-cli generate --concept "귀여운 고양이" --json
# AI가 stdin으로 {"action":"approve"} 전송
```

### 3.5 세션 관리

각 실행은 고유 세션 ID를 생성하여 중간 결과를 보존:

```
~/.emoji-master/
├── config.json          # API 키, 기본 설정
└── sessions/
    └── {session-id}/
        ├── session.json         # 세션 메타데이터 (진행 상태)
        ├── main_character.png   # 키 비주얼
        ├── stickers/            # 개별 스티커 이미지
        │   ├── 01.png
        │   ├── 02.png
        │   └── ...
        ├── processed/           # 후처리된 이미지
        └── export/              # 최종 ZIP 파일
            ├── ogq_sticker.zip
            ├── line_sticker.zip
            └── line_emoji.zip
```

---

## 4. 기술 스택

### 4.1 CLI 패키지 의존성

```jsonc
// packages/cli/package.json
{
  "name": "@emoji/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "emoji-cli": "./dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    // shared 패키지 의존
    "@emoji/shared": "workspace:*",

    // CLI 프레임워크
    "commander": "^13.0.0",

    // 이미지 처리 (Canvas API 대체)
    "sharp": "^0.33.0",

    // ZIP 생성
    "jszip": "^3.10.1",

    // 대화형 프롬프트
    "@inquirer/prompts": "^7.0.0",

    // 터미널 UI
    "chalk": "^5.3.0",
    "ora": "^8.0.0",

    // Gemini AI (shared에서 re-export하지만 직접 의존도 필요)
    "@google/genai": "latest",

    // 유틸리티
    "uuid": "^11.0.0",
    "zod": "^3.24.0",
    "zustand": "^5.0.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "tsx": "^4.0.0",
    "vitest": "^3.0.0",
    "typescript": "~5.8.0",
    "@types/node": "^22.0.0"
  }
}
```

### 4.2 TypeScript 설정

```jsonc
// packages/cli/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "paths": {
      "@shared/*": ["../shared/src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["tests", "dist"]
}
```

---

## 5. 단계별 구현 계획

### Phase 1: 프로젝트 스캐폴딩 (1일)

**목표**: CLI 패키지 생성 및 기본 인프라 구축

1. `packages/cli` 디렉토리 생성 및 package.json 작성
2. tsconfig.json 구성 (shared 코드 참조 경로 설정)
3. 빌드 설정 (tsup)
4. CLI 진입점 (`src/index.ts`) - commander 기반 명령어 구조
5. `@emoji/shared/package.json`에 새 exports 추가
6. shared의 `types/index.ts`, `constants/index.ts` barrel export 생성

**산출물**:
- `emoji-cli --help` 실행 가능
- `emoji-cli config set-key <key>` 동작
- shared 타입/상수 import 확인

### Phase 2: 플랫폼 어댑터 및 상태 관리 (1일)

**목표**: CLI 환경에 맞는 플랫폼 계층 구축

1. **CLI 플랫폼 어댑터** (`src/platform/adapter.ts`)
   - API 키: `~/.emoji-master/config.json` 또는 `GEMINI_API_KEY` 환경변수
   - 파일 저장: `fs.writeFile()` 기반
   - 설정 관리: JSON config 파일

2. **CLI 상태 관리** (`src/store/cliStore.ts`)
   - Zustand 사용 (Node.js 호환, persist 미사용)
   - shared의 슬라이스 구조 재사용 (configSlice, workflowSlice, assetsSlice, jobsSlice)
   - `getAppState()` 패턴 동일하게 유지

3. **CLI 이벤트 버스** (`src/bridge/eventBus.ts`)
   - Node.js `EventEmitter` 기반
   - shared의 `emitEvent`/`onEvent` 시그니처 호환

**산출물**:
- 환경변수 또는 config 파일에서 API 키 로드
- 인메모리 상태 관리 동작
- 이벤트 발행/구독 동작

### Phase 3: 이미지 처리 서비스 재작성 (2일)

**목표**: 브라우저 Canvas API를 sharp 기반으로 교체

1. **core.ts** - sharp 래퍼
   ```typescript
   // 브라우저: loadImage() → HTMLImageElement
   // CLI: loadImage() → sharp.Sharp 인스턴스

   // 브라우저: createCanvas() → { canvas, ctx }
   // CLI: 불필요 (sharp가 직접 처리)
   ```

2. **resize.ts** - sharp resize
   ```typescript
   // sharp(inputBuffer).resize(width, height, { fit: 'contain' }).png().toBuffer()
   ```

3. **backgroundRemoval.ts** - sharp raw 픽셀 접근
   ```typescript
   // sharp(input).raw().toBuffer({ resolveWithObject: true })
   // → { data: Buffer, info: { width, height, channels } }
   // 기존 Sobel/FloodFill 알고리즘을 raw Buffer 위에서 실행
   // sharp(processedRawBuffer, { raw: { width, height, channels: 4 } }).png().toBuffer()
   ```

4. **outlineGeneration.ts** - sharp 합성
   ```typescript
   // sharp.composite()로 윤곽선 합성
   // 원형 오프셋 렌더링을 sharp composite 배열로 변환
   ```

5. **export.ts** - 파일시스템 저장
   ```typescript
   // JSZip 생성 → Buffer로 출력 → fs.writeFile()
   // 모든 플랫폼에 대해 자동 생성
   ```

**산출물**:
- sharp 기반 이미지 리사이즈 동작
- sharp 기반 배경 제거 동작
- sharp 기반 윤곽선 생성 동작
- ZIP 파일 파일시스템 저장 동작

### Phase 4: Gemini 서비스 통합 (1일)

**목표**: shared의 Gemini 서비스를 CLI에서 사용

1. **shared Gemini 서비스 직접 import**
   - `@google/genai` SDK는 Node.js 완전 호환
   - `client.ts` — `GoogleGenAI` 인스턴스 생성, 모델 호출
   - `orchestrator.ts` — 모든 AI 오케스트레이션 함수
   - `prompts/*.ts` — 프롬프트 템플릿

2. **API 키 주입 방식 변경**
   - shared의 `getApiKey()` 대신 CLI 어댑터의 키 사용
   - `apiKeyManager.ts`의 `setApiKey()`로 인메모리 세팅
   - CLI 시작 시 config에서 로드 → `setApiKey()` 호출

3. **모델 설정**
   ```
   TEXT_PRIMARY: gemini-3.1-pro-preview
   TEXT_FALLBACK: gemini-2.5-flash
   IMAGE_PRIMARY: gemini-3-pro-image-preview
   IMAGE_FALLBACK: gemini-2.5-flash-image
   FLASH_PRIMARY: gemini-3-flash-preview
   FLASH_FALLBACK: gemini-2.5-flash
   ```

**산출물**:
- CLI에서 Gemini API 호출 성공
- 컨셉 분석, 캐릭터 생성, 스티커 생성 동작

### Phase 5: 파이프라인 재구성 (2일)

**목표**: 컨펌 체크포인트가 포함된 CLI 파이프라인 구축

1. **generation 파이프라인** 재작성
   - shared의 `runGenerationPipeline` 로직을 기반으로
   - Stage 1-3 (concept analysis, base character, visual style) 실행
   - **★ 컨펌 포인트 1**: 키 비주얼 확인
   - Stage 4-6 (character spec, emote ideation, sticker generation) 실행

2. **postProcess 파이프라인** 재작성
   - sharp 기반 이미지 처리 서비스 사용
   - 배경 제거 + 윤곽선 처리
   - **★ 컨펌 포인트 2**: 후처리 결과 확인

3. **metadata 파이프라인** 추가
   - Gemini `generateMetadata()` 호출
   - 3종 옵션 (personality/utility/creative) 생성
   - **★ 컨펌 포인트 3**: 메타데이터 선택 확인

4. **export 파이프라인**
   - 모든 플랫폼 (ogq_sticker, line_sticker, line_emoji) 대상
   - 각 플랫폼별 리사이즈 + ZIP 생성
   - 출력 디렉토리에 저장

5. **컨펌 미들웨어** 구현
   ```typescript
   interface ConfirmRequest {
     checkpoint: 'key_visual' | 'post_process' | 'metadata';
     data: unknown;
     options: string[];
   }

   interface ConfirmResponse {
     action: 'approve' | 'reject' | 'regenerate' | 'reprocess';
     selectedOption?: number;
     reason?: string;
   }

   async function requestConfirm(
     req: ConfirmRequest,
     mode: 'interactive' | 'auto' | 'json'
   ): Promise<ConfirmResponse> {
     if (mode === 'auto') return { action: 'approve' };
     if (mode === 'json') return awaitStdinJson(req);
     return promptUser(req);
   }
   ```

**산출물**:
- 전체 파이프라인 end-to-end 실행
- 3개 컨펌 포인트 동작 (interactive + auto)
- JSON I/O 프로토콜 동작

### Phase 6: I/O 및 UX (1일)

**목표**: 인간/AI 양쪽에 최적화된 입출력

1. **출력 포맷터** (`src/io/output.ts`)
   - `--json`: NDJSON 라인별 출력
   - 기본: chalk 기반 컬러 터미널 출력
   - 에러: 구조화된 에러 객체

2. **진행률 리포터** (`src/io/progress.ts`)
   - `--json`: `{"type":"progress","stage":"...","current":N,"total":M}`
   - 기본: ora 스피너 + 진행 바

3. **이미지 프리뷰** (`src/utils/imagePreview.ts`)
   - iTerm2: 인라인 이미지 프로토콜 (base64 이스케이프 시퀀스)
   - 기타 터미널: 파일 경로 출력 + `open` 명령
   - JSON 모드: base64 데이터 + 파일 경로

4. **최종 결과 요약**
   ```jsonc
   // --json 모드 최종 출력
   {
     "type": "result",
     "success": true,
     "session_id": "abc-123",
     "output_dir": "/Users/user/output/abc-123",
     "exports": {
       "ogq_sticker": "/Users/user/output/abc-123/ogq_sticker.zip",
       "line_sticker": "/Users/user/output/abc-123/line_sticker.zip",
       "line_emoji": "/Users/user/output/abc-123/line_emoji.zip"
     },
     "sticker_count": 24,
     "metadata": { "title": "귀여운 고양이", "tags": ["cat", "cute", "..."] },
     "elapsed_time": "3m 42s"
   }
   ```

**산출물**:
- 터미널에서 시각적으로 우수한 출력
- AI가 파싱 가능한 JSON 출력
- iTerm2 이미지 프리뷰

### Phase 7: 테스트 및 안정화 (2일)

**목표**: 80%+ 테스트 커버리지, 엣지 케이스 처리

1. **단위 테스트**
   - sharp 이미지 처리 함수 (resize, bg removal, outline)
   - CLI 플랫폼 어댑터 (config 읽기/쓰기)
   - 출력 포맷터 (JSON, 인간 친화적)
   - 컨펌 미들웨어 (auto/interactive/json)

2. **통합 테스트**
   - Gemini API mock → 파이프라인 전체 실행
   - JSON I/O 프로토콜 end-to-end
   - 컨펌 체크포인트 시나리오

3. **엣지 케이스**
   - API 키 미설정 시 명확한 에러
   - 네트워크 오류 시 재시도 로직
   - 이미지 생성 실패 시 부분 결과 보존
   - Ctrl+C (SIGINT) 시 세션 정리
   - 디스크 공간 부족 시 에러 처리

**산출물**:
- vitest 기반 테스트 스위트
- 80%+ 코드 커버리지
- 안정적인 에러 핸들링

---

## 6. OpenClaw 연동 시나리오

### 6.1 완전 자동 모드

OpenClaw가 모든 과정을 자동으로 실행:

```bash
# OpenClaw가 실행하는 명령
emoji-cli generate \
  --concept "귀여운 고양이가 다양한 감정 표현을 하는 이모티콘" \
  --language ko \
  --auto \
  --json \
  --output ./output
```

OpenClaw는 NDJSON 출력을 실시간으로 파싱하여 진행 상황 모니터링.

### 6.2 AI 제어 모드 (컨펌 위임)

OpenClaw가 각 체크포인트에서 판단:

```bash
# 1. OpenClaw가 CLI 실행 (auto 없이)
emoji-cli generate --concept "..." --json --output ./output

# 2. CLI가 key_visual 컨펌 요청 출력
# {"type":"confirm","checkpoint":"key_visual","preview":{...},"awaiting_input":true}

# 3. OpenClaw가 이미지를 분석하고 판단
# stdin으로: {"action":"approve"}
# 또는: {"action":"regenerate"}

# 4. 다음 컨펌 (post_process)까지 계속...
```

### 6.3 하이브리드 모드

일부만 자동, 일부는 수동:

```bash
# 키 비주얼만 확인, 나머지 자동
emoji-cli generate \
  --concept "..." \
  --auto-postprocess \
  --auto-metadata \
  --json
```

---

## 7. 내보내기 전략

### 7.1 모든 플랫폼 기본 대상

| 플랫폼 | 스티커 수 | 콘텐츠 사이즈 | 메인 이미지 | 탭 이미지 |
|--------|----------|-------------|-----------|----------|
| OGQ Sticker | 24 | 740x640 | 240x240 | 96x74 |
| LINE Sticker | 40 | 370x320 | 240x240 | 96x74 |
| LINE Emoji | 40 | 180x180 | N/A | 96x74 |

### 7.2 출력 디렉토리 구조

```
{output_dir}/
├── session.json           # 세션 메타데이터
├── ogq_sticker/
│   ├── ogq_sticker.zip    # 최종 ZIP
│   ├── 01.png ~ 24.png    # 개별 이미지 (리사이즈됨)
│   ├── main.png
│   └── tab.png
├── line_sticker/
│   ├── line_sticker.zip
│   ├── 01.png ~ 40.png
│   ├── main.png
│   └── tab.png
├── line_emoji/
│   ├── line_emoji.zip
│   ├── 001.png ~ 040.png
│   └── tab.png
└── metadata.json          # 선택된 메타데이터
```

### 7.3 스티커 수 전략

현재 시스템은 24개 스티커를 기본 생성 (`TOTAL_STICKERS` 상수).
LINE 플랫폼은 40개 필요 → 추가 16개 생성 또는 24개로 패딩.

**추천**: 40개 생성 후 OGQ는 24개만 사용, LINE은 40개 모두 사용.

---

## 8. 위험 요소 및 대응

| 위험 | 영향도 | 대응 방안 |
|------|--------|----------|
| sharp와 기존 Canvas 알고리즘 결과 차이 | 높음 | 동일 입력에 대한 비교 테스트, 허용 오차 설정 |
| Gemini API 호출 비용/속도 | 중간 | 청크 사이즈 조절, 딜레이 설정, 캐싱 고려 |
| `@emoji/shared` exports 변경의 side-effect | 낮음 | web/electron 빌드 테스트로 검증 |
| Node.js 20+ 의존성 (sharp 네이티브 바이너리) | 낮음 | sharp는 macOS arm64/x64 프리빌드 제공 |
| 40개 스티커 생성 시 Gemini Rate Limit | 중간 | 청크 간 딜레이, 지수 백오프, 재시도 로직 |
| iTerm2 이외 터미널에서 이미지 프리뷰 불가 | 낮음 | 파일 경로 출력 + `open` 명령 폴백 |

---

## 9. 구현 일정 요약

| Phase | 내용 | 예상 기간 | 의존성 |
|-------|------|----------|--------|
| 1 | 프로젝트 스캐폴딩 | 1일 | 없음 |
| 2 | 플랫폼 어댑터 & 상태 관리 | 1일 | Phase 1 |
| 3 | 이미지 처리 (sharp) | 2일 | Phase 1 |
| 4 | Gemini 서비스 통합 | 1일 | Phase 1, 2 |
| 5 | 파이프라인 & 컨펌 | 2일 | Phase 2, 3, 4 |
| 6 | I/O & UX | 1일 | Phase 5 |
| 7 | 테스트 & 안정화 | 2일 | Phase 6 |
| **합계** | | **~10일** | |

---

## 10. 사용 예시

### 기본 사용 (인간 사용자)
```bash
# API 키 설정
emoji-cli config set-key AIzaSy...

# 이모티콘 생성 (대화형)
emoji-cli generate -c "행복한 시바견" -l ko

# 후처리만 (기존 세션)
emoji-cli postprocess --session abc-123 --outline black --bg-removal
```

### AI 에이전트 사용 (OpenClaw)
```bash
# 완전 자동
emoji-cli generate -c "cute cat with various emotions" --auto --json -o ./output

# AI 제어 (stdin/stdout JSON 프로토콜)
echo '{"action":"approve"}' | emoji-cli generate -c "..." --json

# 특정 플랫폼만
emoji-cli generate -c "..." --platforms ogq_sticker,line_emoji --auto --json
```

### 파이프라인 조합
```bash
# 생성 → 후처리 → 내보내기를 개별 실행
emoji-cli generate -c "..." --skip-postprocess --skip-export --json
emoji-cli postprocess --session last --json
emoji-cli export --session last --platforms all --json
```
