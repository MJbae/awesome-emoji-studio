# @emoji/cli

AI 기반 이모티콘 팩 제작 CLI 도구입니다. macOS 로컬 환경에서 터미널 또는 AI 에이전트(OpenClaw 등)를 통해 이모티콘 생성 파이프라인을 실행할 수 있습니다.

---

## 빠른 시작

```bash
# 루트에서 의존성 설치
npm install

# API 키 설정
npm run dev:cli -- config set-key <GEMINI_API_KEY>

# 이모티콘 생성 (자동 모드)
npm run dev:cli -- generate -c "귀여운 고양이" --auto
```

### Gemini API Key 발급

1. [Google AI Studio](https://aistudio.google.com/apikey) 접속
2. **Create API Key** 클릭
3. 발급된 키(`AIza...`)를 위 명령어로 저장

> 키는 `~/.emoji-master/config.json`에 로컬 저장됩니다.

---

## 명령어

### generate

전체 이모티콘 생성 파이프라인을 실행합니다.

```bash
emoji-cli generate -c <컨셉> [옵션]
```

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-c, --concept <text>` | 캐릭터 컨셉 (필수) | - |
| `-l, --language <lang>` | 타깃 언어 (`ko`, `ja`, `zh-TW`) | `ko` |
| `--no-text` | 텍스트 없는 이모티콘 생성 | `false` |
| `--reference-image <path>` | 참조 이미지 경로 | - |
| `--api-key <key>` | Gemini API 키 (config 대신 직접 전달) | - |
| `--platforms <list>` | 대상 플랫폼 (쉼표 구분 또는 `all`) | `all` |
| `--bg-removal / --no-bg-removal` | 배경 제거 | `true` |
| `--outline <style>` | 아웃라인 스타일 (`none`, `white`, `black`) | `white` |
| `--outline-thickness <px>` | 아웃라인 두께 (px) | `3` |
| `--outline-opacity <pct>` | 아웃라인 불투명도 (0-100) | `100` |
| `--auto` | 자동 모드 (모든 컨펌 자동 승인) | `false` |
| `--json` | NDJSON 출력 (AI 에이전트용) | `false` |
| `-o, --output <dir>` | 출력 디렉토리 | `./output` |
| `-v, --verbose` | 상세 로그 | `false` |

#### 사용 예시

```bash
# 기본 실행 (인터랙티브 모드, 3단계 컨펌 필요)
emoji-cli generate -c "화난 토끼"

# 자동 모드 + 일본어 + LINE 전용
emoji-cli generate -c "angry rabbit" --auto -l ja --platforms line_sticker,line_emoji

# AI 에이전트용 JSON 모드
emoji-cli generate -c "귀여운 고양이" --json --auto -o ./output/cats

# 텍스트 없는 이모티콘 + 아웃라인 없이
emoji-cli generate -c "심플한 곰돌이" --no-text --outline none --auto

# 참조 이미지 기반 생성
emoji-cli generate -c "이 캐릭터 스타일로" --reference-image ./my-character.png --auto
```

### config

API 키를 관리합니다.

```bash
emoji-cli config set-key <key>     # API 키 저장
emoji-cli config get-key           # 저장된 키 확인 (마스킹)
emoji-cli config delete-key        # 키 삭제
```

---

## 파이프라인 & 컨펌 체크포인트

파이프라인은 4단계로 구성되며, 3곳의 컨펌 체크포인트가 있습니다.

```
컨셉 분석 → 캐릭터 생성 → [CONFIRM 1: 키 비주얼]
                                    ↓
                         스티커 45개 생성 (3개씩 청크)
                                    ↓
                         후처리 (배경 제거 + 아웃라인)
                                    ↓
                         [CONFIRM 2: 후처리 결과]
                                    ↓
                         메타데이터 생성 (3개 옵션)
                                    ↓
                         [CONFIRM 3: 메타데이터 선택]
                                    ↓
                         플랫폼별 내보내기 → ZIP
```

| 체크포인트 | 내용 | 액션 |
|-----------|------|------|
| `key_visual` | 키 비주얼 캐릭터 확인 | approve / reject / regenerate |
| `post_process` | 후처리 결과물 확인 | approve / reject / reprocess |
| `metadata` | 메타데이터 옵션 선택 | approve / reject / regenerate |

- **인터랙티브 모드** (기본): 터미널에서 사용자가 직접 선택
- **자동 모드** (`--auto`): 모든 컨펌을 자동 승인, 메타데이터는 첫 번째 옵션 선택

---

## AI 에이전트 연동 (NDJSON 프로토콜)

`--json` 플래그를 사용하면 stdout에 NDJSON(줄 단위 JSON)을 출력합니다. OpenClaw 등 AI 에이전트가 파이프라인을 프로그래밍 방식으로 제어할 수 있습니다.

### 출력 이벤트

```jsonc
// 진행 상황
{"type":"progress","stage":"concept-analysis","status":"started","message":"Analyzing concept..."}
{"type":"progress","stage":"sticker-generation","status":"running","current":12,"total":45,"message":"Generating stickers..."}

// 컨펌 요청 (auto 모드가 아닐 때)
{"type":"confirm","checkpoint":"key_visual","message":"Key visual generated","preview":{...},"options":["approve","reject","regenerate"],"awaiting_input":true}

// 자동 승인 (auto 모드)
{"type":"confirm","checkpoint":"key_visual","auto_approved":true,...}

// 최종 결과
{"type":"result","success":true,"session_id":"uuid","output_dir":"/path","exports":{"ogq_sticker":"/path/ogq.zip",...},"sticker_count":45,"elapsed_time":"13m 24s"}

// 에러
{"type":"error","code":"GEMINI","message":"API rate limit exceeded","retryable":true}
```

### 컨펌 응답 (stdin)

`--json` 모드에서 `--auto` 없이 실행하면, `confirm` 이벤트 후 stdin으로 JSON 응답을 보내야 합니다.

```jsonc
// 승인
{"action":"approve"}

// 메타데이터 선택 (0-indexed)
{"action":"approve","selectedOption":1}

// 거부
{"action":"reject","reason":"캐릭터 스타일이 마음에 들지 않음"}

// 재생성
{"action":"regenerate"}
```

> 5분 이내에 응답하지 않으면 타임아웃됩니다.

### 에이전트 실행 예시

```bash
# 자동 모드 (컨펌 불필요)
emoji-cli generate -c "귀여운 고양이" --json --auto 2>/dev/null | while read -r line; do
  echo "$line" | jq .
done

# 프로그래밍 방식 제어 (Node.js)
import { spawn } from 'child_process';
const cli = spawn('emoji-cli', ['generate', '-c', '귀여운 고양이', '--json']);
cli.stdout.on('data', (chunk) => {
  for (const line of chunk.toString().split('\n').filter(Boolean)) {
    const event = JSON.parse(line);
    if (event.type === 'confirm') {
      cli.stdin.write(JSON.stringify({ action: 'approve' }) + '\n');
    }
  }
});
```

---

## 출력 구조

```
output/
├── ogq_sticker/
│   ├── 01.png ~ 24.png    # 740x640
│   └── ogq_sticker.zip
├── line_sticker/
│   ├── 01.png ~ 40.png    # 370x320
│   └── line_sticker.zip
├── line_emoji/
│   ├── 001.png ~ 040.png  # 180x180
│   └── line_emoji.zip
└── metadata.json           # 선택된 메타데이터
```

### 지원 플랫폼

| 플랫폼 | 이미지 크기 | 스티커 수 |
|--------|-----------|----------|
| OGQ Sticker | 740 x 640 | 24 |
| LINE Sticker | 370 x 320 | 40 |
| LINE Emoji | 180 x 180 | 40 |

---

## 세션 데이터

각 실행마다 `~/.emoji-master/sessions/<session-id>/`에 세션 데이터가 저장됩니다.

```
~/.emoji-master/sessions/<uuid>/
├── session.json          # 실행 이력 (입력, 전략, 메타데이터 등)
├── main_character.png    # 키 비주얼
├── stickers/             # 원본 스티커 이미지
│   ├── 01.png ~ 45.png
└── processed/            # 후처리된 이미지
    ├── 1.png ~ 45.png
```

---

## 개발

```bash
# 개발 모드 (tsx)
npm run dev:cli -- generate -c "테스트" --auto

# 타입 체크
npm -w @emoji/cli run typecheck

# 빌드
npm run build:cli

# 빌드된 바이너리 실행
node packages/cli/dist/index.js generate --help
```

### 기술 스택

| 영역 | 기술 |
|------|------|
| CLI 프레임워크 | Commander 13 |
| 이미지 처리 | Sharp 0.33 (배경 제거, 아웃라인, 리사이즈) |
| AI | Google Gemini (`@google/genai`) |
| 출력 | Chalk 5 (터미널), Ora 8 (스피너) |
| 번들러 | tsup 8 (빌드), tsx 4 (개발) |
| 내보내기 | JSZip |

### 아키텍처

```
packages/cli/
├── src/
│   ├── index.ts               # CLI 엔트리 포인트 (Commander)
│   ├── commands/
│   │   ├── generate.ts        # generate 명령어
│   │   └── config.ts          # config 명령어
│   ├── io/
│   │   ├── output.ts          # 듀얼 모드 출력 (터미널 / NDJSON)
│   │   ├── confirm.ts         # 3단계 컨펌 핸들러
│   │   └── progress.ts        # Ora 스피너 래퍼
│   ├── services/
│   │   ├── gemini/            # shared Gemini 서비스 re-export
│   │   ├── image/             # Sharp 기반 이미지 처리
│   │   │   ├── core.ts        # 버퍼/Base64 유틸리티
│   │   │   ├── resize.ts      # 리사이즈
│   │   │   ├── backgroundRemoval.ts  # 배경 제거 (Sobel + Flood Fill)
│   │   │   ├── outlineGeneration.ts  # 아웃라인 생성
│   │   │   └── export.ts      # 플랫폼별 ZIP 내보내기
│   │   └── pipeline/          # 생성/후처리/풀 파이프라인
│   ├── platform/
│   │   └── adapter.ts         # 파일시스템 기반 플랫폼 어댑터
│   ├── bridge/
│   │   └── eventBus.ts        # Node.js EventEmitter 이벤트 버스
│   ├── store/
│   │   └── cliStore.ts        # Zustand vanilla 스토어
│   └── types/
│       └── cli.ts             # CLI 전용 타입 정의
└── package.json
```

`@emoji/shared`의 Gemini 서비스, 타입, 상수를 `@/*` 경로 별칭으로 직접 참조합니다. 브라우저 의존 코드(Canvas API, DOM)는 Sharp 기반으로 재구현되었습니다.
