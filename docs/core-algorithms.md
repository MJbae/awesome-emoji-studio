# Awesome Emoji Studio — 핵심 알고리즘 분석

> 소스코드 기반 단계별 이미지 처리 알고리즘 정리
> 대상: `packages/shared` (브라우저 Canvas 기반) + `packages/cli` (Node.js Sharp 기반)

---

## 목차

1. [전체 파이프라인 구조](#1-전체-파이프라인-구조)
2. [베이스 이미지 생성 (Generation Pipeline)](#2-베이스-이미지-생성-generation-pipeline)
3. [배경 제거 (Background Removal)](#3-배경-제거-background-removal)
4. [윤곽선 입히기 (Outline Generation)](#4-윤곽선-입히기-outline-generation)
5. [리사이징 (Resize)](#5-리사이징-resize)
6. [플랫폼별 내보내기 (Export)](#6-플랫폼별-내보내기-export)
7. [설정값 레퍼런스](#7-설정값-레퍼런스)

---

## 1. 전체 파이프라인 구조

```
fullPipeline.ts
├── Generation Pipeline (generationPipeline.ts)
│   ├── Stage 1: 컨셉 분석 (analyzeConcept)
│   ├── Stage 2: 베이스 캐릭터 생성 (generateBaseCharacter)
│   ├── Stage 3: 비주얼 스타일 적용 (generateVisualVariation)
│   ├── Stage 4: 캐릭터 스펙 추출 (extractCharacterSpec)
│   ├── Stage 5: 이모트 아이디어 생성 (generateEmoteIdeas)
│   └── Stage 6: 개별 스티커 이미지 생성 (generateSingleEmote × N)
│
└── Post-Process Pipeline (postProcessPipeline.ts)
    ├── 배경 제거 (backgroundRemoval)
    └── 윤곽선 생성 (outlineGeneration)
```

- **취소 지원**: `AbortController` + `AbortSignal` 조합으로 각 단계마다 `checkAborted()` 호출
- **진행 상황 추적**: `JobProgress` → `emitEvent()` → EventBus 브로드캐스트
- **청크 처리**: 스티커 생성 시 `CHUNK_SIZE=3`개씩 묶어 `Promise.all()`, 청크 간 `API_DELAY_MS=10000ms` 대기 (Rate Limiting 방지)

---

## 2. 베이스 이미지 생성 (Generation Pipeline)

> 소스: `packages/shared/src/services/pipeline/generationPipeline.ts`

### Stage 1: 컨셉 분석 (`analyzeConcept`)

- 사용자 입력(`concept`, `referenceImage`, `language`)을 LLM에 전달
- 출력: `LLMStrategy` — 비주얼 스타일 인덱스, 문화적 노트, 판매 전략, 페르소나 인사이트

### Stage 2: 베이스 캐릭터 생성 (`generateBaseCharacter`)

- 사용자 입력 기반으로 LLM(Gemini)이 초기 캐릭터 이미지 생성
- base64 인코딩된 PNG 이미지 반환

### Stage 3: 비주얼 스타일 적용 (`generateVisualVariation`)

- `VISUAL_STYLES` 상수에서 `selectedVisualStyleIndex`에 해당하는 스타일 선택
- 베이스 이미지 + 스타일 프롬프트를 LLM에 전달하여 스타일 변환된 메인 이미지 생성

### Stage 4: 캐릭터 스펙 추출 (`extractCharacterSpec`)

- 메인 이미지를 LLM에 전달하여 구조화된 캐릭터 명세 추출
- 출력: `CharacterSpec` (physicalDescription, facialFeatures, colorPalette, distinguishingFeatures, artStyle)

### Stage 5: 이모트 아이디어 생성 (`generateEmoteIdeas`)

- 입력, 스타일명, 캐릭터 스펙, 전략 정보를 LLM에 전달
- 출력: `EmoteIdea[]` — 각 아이디어에 expression, action, category, useCase, imagePrompt 포함

### Stage 6: 개별 스티커 생성 (`generateSingleEmote`)

```
emoteIdeas 배열 → CHUNK_SIZE(3)개씩 분할
각 청크 내에서 Promise.all()로 병렬 생성
청크 간 10초 딜레이 (API Rate Limiting)
```

- 각 이모트 아이디어 + 메인 이미지 + 캐릭터 스펙을 LLM에 전달
- 개별 스티커 이미지(base64) 반환
- 실패한 스티커는 `status: 'error'`로 마킹하고 계속 진행

---

## 3. 배경 제거 (Background Removal)

> 소스:
> - `packages/shared/src/services/image/backgroundRemoval.ts` (Canvas API)
> - `packages/cli/src/services/image/backgroundRemoval.ts` (Sharp)

### 알고리즘 구성 (4단계)

```
원본 이미지
  → detectBackgroundColor()     // 1) 배경색 감지
  → computeEdgeMap()            // 2) Sobel 엣지 맵 계산
  → floodFillRemoveBackground() // 3) Flood Fill 배경 제거
  → applyDefringing()           // 4) 디프린징 보정
  → 결과 이미지 (투명 배경)
```

### 3.1 배경색 감지 (`detectBackgroundColor`)

**목적**: 이미지 외곽의 지배적 색상을 배경색으로 판별

```
1. 이미지의 4개 가장자리(상단/하단/좌측/우측) 픽셀을 순회
2. 각 픽셀의 alpha > 128인 경우만 유효 샘플로 취급
3. RGB 색상별 빈도 카운팅 (Map<"r,g,b", count>)
4. 가장 높은 빈도의 RGB 값을 배경색(dominant color)으로 반환
```

- 유효 샘플이 없으면 `null` 반환 → 배경 제거 스킵

### 3.2 Sobel 엣지 맵 (`computeEdgeMap`)

**목적**: 오브젝트와 배경의 경계를 감지하여 Flood Fill이 오브젝트 내부로 침투하지 않도록 방어

```
1. 전체 이미지를 그레이스케일 변환
   grayscale[i] = 0.299*R + 0.587*G + 0.114*B  (ITU-R BT.601 가중치)

2. 3×3 Sobel 커널을 적용하여 수평/수직 그래디언트 계산

   Gx 커널:               Gy 커널:
   [-1  0 +1]             [-1 -2 -1]
   [-2  0 +2]             [ 0  0  0]
   [-1  0 +1]             [+1 +2 +1]

3. 엣지 강도 = sqrt(Gx² + Gy²)
4. 결과: Float32Array[width × height] — 각 픽셀의 엣지 강도 값
```

### 3.3 Flood Fill 배경 제거 (`floodFillRemoveBackground`)

**목적**: 가장자리에서 시작하여 배경 영역을 탐색하고 알파값을 0으로 설정

```
1. 시드 포인트: 이미지의 4개 가장자리 모든 픽셀을 큐에 추가

2. BFS 탐색 루프:
   while (queue is not empty):
     a. 현재 픽셀의 엣지 강도 ≥ SOBEL_EDGE_THRESHOLD(40) → 건너뜀 (경계선)
     b. 현재 픽셀과 bgColor의 유클리드 색상 거리 계산:
        distance = sqrt((R-bgR)² + (G-bgG)² + (B-bgB)²)
     c. distance ≥ BG_TOLERANCE(35) → 건너뜀 (오브젝트 픽셀)
     d. 조건 충족 시: alpha = 0 (투명 처리)
     e. 4방향 이웃(상하좌우)을 큐에 추가

3. visited 배열로 중복 방문 방지 (Uint8Array)
```

**핵심 파라미터**:
| 파라미터 | 값 | 역할 |
|---|---|---|
| `BG_TOLERANCE` | 35 | 배경색과의 최대 허용 색상 거리 |
| `SOBEL_EDGE_THRESHOLD` | 40 | 엣지로 판별하는 최소 그래디언트 강도 |

### 3.4 디프린징 (`applyDefringing`)

**목적**: 배경 제거 후 반투명 경계 픽셀의 색상 번짐(fringing) 보정

```
전체 픽셀 순회:
  - alpha = 0 또는 255 → 스킵 (완전 투명 또는 완전 불투명)
  - alpha < DEFRINGE_ALPHA_BG(20) → alpha = 0 (거의 투명한 잔여 픽셀 제거)
  - 그 외 반투명 픽셀:
      alphaRatio = alpha / 255
      보정 공식 (Un-premultiply):
        R' = clamp( (R - (1 - alphaRatio) × bgR) / alphaRatio )
        G' = clamp( (G - (1 - alphaRatio) × bgG) / alphaRatio )
        B' = clamp( (B - (1 - alphaRatio) × bgB) / alphaRatio )
```

이 공식은 **premultiplied alpha의 역연산**으로, 배경색이 혼합된 반투명 픽셀에서 배경색 성분을 수학적으로 분리하는 기법이다.

---

## 4. 윤곽선 입히기 (Outline Generation)

> 소스:
> - `packages/shared/src/services/image/outlineGeneration.ts` (Canvas API)
> - `packages/cli/src/services/image/outlineGeneration.ts` (Sharp)

### 알고리즘: 원형 오프셋 렌더링 (Circular Offset Rendering)

```
원본 이미지
  → 확장된 캔버스 생성 (width + 2×radius, height + 2×radius)
  → 원형 오프셋으로 이미지 복사본 배치
  → source-in 합성으로 윤곽선 색상 적용
  → 원본 이미지를 중앙에 오버레이
  → 결과 이미지 (윤곽선 적용)
```

### 상세 동작

#### Step 1: 원형 오프셋 복사

```
for angle = 0 to 359, step = ANGLE_STEP(15°):
    radian = angle × π / 180
    x = radius + radius × cos(radian)
    y = radius + radius × sin(radian)
    drawImage(원본, x, y)
```

- 15° 간격 = **24개 방향**으로 원본 이미지를 오프셋 배치
- `radius` = `outlineThickness` (기본 4px, 범위 1~12px)
- 결과: 원본 이미지의 실루엣이 모든 방향으로 확장된 "팽창된 마스크"

#### Step 2: 윤곽선 색상 적용

**Canvas 버전** (shared):
```
ctx.globalCompositeOperation = 'source-in'
ctx.fillStyle = rgba(R, G, B, opacity)
ctx.fillRect(0, 0, canvasWidth, canvasHeight)
```
- `source-in` 합성: 기존 픽셀이 있는 영역에만 새 색상 적용 → 실루엣 영역을 지정 색상으로 채움

**Sharp 버전** (cli):
```
1. extractChannel(3)으로 알파 채널 추출
2. 알파 기반으로 새 RGBA 버퍼 생성:
   for each pixel:
     R = outlineColor.r
     G = outlineColor.g
     B = outlineColor.b
     A = round((srcAlpha / 255) × opacityAlpha)
3. raw 버퍼 → sharp 이미지로 변환
```

#### Step 3: 원본 오버레이

```
ctx.globalCompositeOperation = 'source-over'
drawImage(원본, radius, radius)  // 중앙 정렬
```

- 색상이 적용된 팽창 마스크 위에 원본 이미지를 정중앙에 배치
- 결과: 원본 바깥으로 `radius`만큼의 균일한 윤곽선

### 윤곽선 옵션

| 옵션 | 값 | 설명 |
|---|---|---|
| `outlineStyle` | `'none'` / `'white'` / `'black'` | 윤곽선 색상 |
| `outlineThickness` | 1~12 (기본 4) | 윤곽선 두께(px) |
| `outlineOpacity` | 0~100 (기본 100) | 윤곽선 불투명도 (내부에서 /100 처리) |

---

## 5. 리사이징 (Resize)

> 소스:
> - `packages/shared/src/services/image/resize.ts` (Canvas API)
> - `packages/cli/src/services/image/resize.ts` (Sharp)

### 두 가지 리사이징 모드

#### 5.1 `resizeImage` — Contain (Fit) 모드

```
scale = min(targetWidth / imgWidth, targetHeight / imgHeight)
w = imgWidth × scale
h = imgHeight × scale
x = (targetWidth - w) / 2    // 수평 중앙 정렬
y = (targetHeight - h) / 2   // 수직 중앙 정렬

배경: 투명 (alpha = 0)
```

- 이미지 전체가 타겟 영역에 들어가도록 축소
- 비율 유지, 남는 공간은 투명 패딩
- **용도**: 후처리된 이미지의 플랫폼별 리사이징

#### 5.2 `resizeAndCrop` — Fit 또는 Crop 모드

**Fit 모드** (`mode = 'fit'`):
```
scale = min(targetWidth / imgWidth, targetHeight / imgHeight)
배경: 흰색 (#FFFFFF)
```

**Crop 모드** (`mode = 'crop'`):
```
scale = max(targetWidth / imgWidth, targetHeight / imgHeight)
배경: 흰색 (#FFFFFF)
```

- Crop 모드는 타겟 영역을 완전히 채우도록 확대 → 넘치는 부분 잘림
- **용도**: 스티커 내보내기 시 플랫폼 규격에 맞춤 (Awesome Emoji는 crop, 나머지는 fit)

### CLI 버전 차이

CLI는 Sharp의 내장 `resize()` 사용:
- Fit → `sharp.resize({ fit: 'contain', background: transparent })`
- Crop → `sharp.resize({ fit: 'cover', background: white })`

---

## 6. 플랫폼별 내보내기 (Export)

> 소스:
> - `packages/shared/src/services/image/export.ts`
> - `packages/shared/src/constants/platforms.ts`

### 지원 플랫폼 및 규격

| 플랫폼 | 콘텐츠 크기 | 메인 이미지 | 탭 이미지 | 개수 | 리사이즈 모드 |
|---|---|---|---|---|---|
| OGQ Sticker | 740×640 | 240×240 | 96×74 | 24 | fit |
| Awesome Sticker | 370×320 | 240×240 | 96×74 | 40 | fit |
| Awesome Emoji | 180×180 | — | 96×74 | 40 | **crop** |
| 카카오톡 이모티콘 | 360×360 | 240×240 | 96×74 | 40 | fit |
| 카카오톡 미니 | 180×180 | — | 96×74 | 45 | fit |

### ZIP 생성 흐름

**`generateStickerZip()`** — 생성 파이프라인 결과물 내보내기:
```
├── 각 스티커 이미지 → resizeAndCrop(플랫폼 규격, fit/crop) → ZIP에 추가
│   └── Awesome Emoji만 crop 모드, 나머지 플랫폼은 fit 모드
├── 메인 캐릭터 이미지 → resizeAndCrop(main 규격, fit) → main.png
├── 메인 캐릭터 이미지 → resizeAndCrop(tab 규격, crop) → tab.png
├── 메타데이터 → metadata.json (선택)
└── ZIP blob 반환
※ resizeAndCrop 사용 → 흰색(#FFFFFF) 배경
```

**`generatePostProcessedZip()`** — 후처리 파이프라인 결과물 내보내기:
```
├── 각 처리된 이미지 → resizeImage(플랫폼 규격) → ZIP에 추가
├── 첫 번째 처리된 이미지(images[0]) → resizeImage(tab 규격) → tab.png
├── 첫 번째 처리된 이미지(images[0]) → resizeImage(main 규격) → main.png
├── 메타데이터 → metadata.json (선택)
└── ZIP blob 반환
※ resizeImage 사용 → 투명 배경, contain(fit) 모드 고정
```

- 파일 이름: `fileNameFormat(index)` — 플랫폼별 패딩 형식 (`01.png`, `001.png` 등)
- 메인 스레드 블로킹 방지: 5개 이미지마다 `yieldToMain()` (setTimeout 0)

### 스티커 수량 계산

```typescript
calculateRequiredStickers(platforms):
  maxCount = max(각 플랫폼의 count)
  basePlus10 = ceil(maxCount × 1.1)   // 10% 여유분
  return basePlus10 + 4                // +2 main, +2 tab
```

---

## 7. 설정값 레퍼런스

> 소스: `packages/shared/src/constants/imageProcessing.ts`

### 배경 제거 설정 (`BG_REMOVAL_CONFIG`)

| 상수 | 값 | 설명 |
|---|---|---|
| `BG_TOLERANCE` | 35 | 배경색으로 판별하는 최대 유클리드 색상 거리 |
| `SOBEL_EDGE_THRESHOLD` | 40 | 엣지(경계선)로 판별하는 최소 Sobel 그래디언트 강도 |
| `DEFRINGE_ALPHA_BG` | 20 | 디프린징 시 완전 투명으로 처리하는 알파 임계값 |

### 윤곽선 설정 (`OUTLINE_CONFIG`)

| 상수 | 값 | 설명 |
|---|---|---|
| `DEFAULT_THICKNESS` | 4 | 기본 윤곽선 두께 (px) |
| `MIN_THICKNESS` | 1 | 최소 두께 |
| `MAX_THICKNESS` | 12 | 최대 두께 |
| `DEFAULT_OPACITY` | 1.0 | 기본 불투명도 (100%) |
| `ANGLE_STEP` | 15 | 원형 오프셋 각도 간격 (°) → 360/15 = 24개 방향 |

### 이미지 설정 (`IMAGE_CONFIG`)

| 상수 | 값 | 설명 |
|---|---|---|
| `TARGET_DIMENSION` | 720 | 기본 타겟 크기 (px) |
| `PADDING` | 60 | 기본 패딩 (px) |
| `MAX_IMAGES` | 120 | 최대 이미지 수 |

### API / 청크 설정

| 상수 | 값 | 설명 |
|---|---|---|
| `CHUNK_SIZE` | 3 | 동시 생성 스티커 수 (per chunk) |
| `API_DELAY_MS` | 10,000 | 청크 간 대기 시간 (ms) |

---

## 부록: 브라우저(Canvas) vs CLI(Sharp) 구현 비교

| 기능 | 브라우저 (shared) | CLI (cli) |
|---|---|---|
| 이미지 로딩 | `HTMLImageElement` + `new Image()` | `Buffer` + `sharp()` |
| 픽셀 접근 | `ctx.getImageData()` → `ImageData.data` | `sharp.raw().toBuffer()` → `Buffer` |
| 배경 제거 | Canvas 2D API 직접 조작 | Sharp + Buffer 직접 조작 |
| 윤곽선 합성 | `globalCompositeOperation: 'source-in'` | `sharp.extractChannel(3)` + 수동 RGBA 버퍼 생성 |
| 리사이징 | `ctx.drawImage()` 수동 계산 | `sharp.resize({ fit })` 내장 기능 |
| 결과 포맷 | `canvas.toDataURL('image/png')` | `sharp.png().toBuffer()` → base64 변환 |

**알고리즘은 동일하되**, 런타임 환경에 맞는 I/O 레이어만 다름.
