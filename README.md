# LINE Emoji Studio

**https://line-emoji-master.vercel.app**

캐릭터 컨셉만 입력하면 AI가 LINE 이모지 세트를 자동으로 만들어 줍니다.
전략 수립부터 이미지 생성, 후처리, 메타데이터, ZIP 내보내기까지 한 번에 처리됩니다.

---

## 사용법

### 1. Gemini API Key 준비

[Google AI Studio](https://aistudio.google.com/apikey)에서 무료로 발급받습니다.

1. **Create API Key** 클릭
2. 발급된 키(`AIza...`)를 복사

> 키는 브라우저 localStorage에만 저장됩니다. 서버로 전송되지 않습니다.

### 2. 이모지 만들기

[line-emoji-master.vercel.app](https://line-emoji-master.vercel.app)에 접속하면 API Key 입력 화면이 나타납니다. 키를 입력하면 6단계 파이프라인이 시작됩니다.

```
1. 컨셉 입력 → 2. AI 전략 → 3. 캐릭터 생성 → 4. 이모지 일괄 생성 → 5. 후처리 → 6. 메타 · 내보내기
```

| 단계                   | 설명                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **1. 컨셉 입력**       | 캐릭터 컨셉 텍스트 입력, 참고 이미지 첨부(선택), 타깃 시장 선택(한국 / 일본 / 대만)     |
| **2. AI 전략**         | 4명의 AI 전문가(시장 분석가, 아트 디렉터, 문화 전문가, 크리에이티브 디렉터)가 순차 분석 |
| **3. 캐릭터 생성**     | AI가 베이스 캐릭터를 생성하고 스타일 변환. 마음에 들지 않으면 재생성 가능               |
| **4. 이모지 생성**     | 45개 이모지 아이디어를 자동 생성한 뒤 3개씩 병렬로 이미지 생성 (약 15~25분)             |
| **5. 후처리**          | 배경 제거(Sobel 에지 검출 + 플러드 필), 아웃라인 추가(두께/불투명도 조절)               |
| **6. 메타 · 내보내기** | 다국어 메타데이터(제목/설명/태그) 자동 생성 후 ZIP 다운로드                             |

### 캐릭터 생성 건너뛰기

1단계에서 참고 이미지를 업로드하면 **"참고 이미지를 베이스 캐릭터로 사용"** 토글이 활성화됩니다.
이 토글을 켜면 3단계(캐릭터 생성)를 건너뛰고, 업로드한 이미지를 바로 베이스 캐릭터로 사용합니다.

### 후처리 전용 모드

이미 만들어둔 이모지가 있다면 생성 과정을 건너뛸 수 있습니다.

1. 기존 이미지(PNG/JPG) 또는 ZIP 업로드 (최대 120장)
2. 배경 제거, 아웃라인 적용
3. 메타데이터 생성 → ZIP 내보내기

---

## 내보내기 형식

| 플랫폼      | 이모지 크기 | 포함 파일                   |
| ----------- | ----------- | --------------------------- |
| OGQ 이모지  | 740 x 640   | tab.png + main.png + 이모지 |
| LINE 이모지 | 370 x 320   | tab.png + main.png + 이모지 |
| LINE Emoji  | 180 x 180   | tab.png + 이모지            |

---

## OpenClaw(텔레그램)에서 CLI 조작하기

### /emoji (사진 필수) — 추천 사용법

OpenClaw에 `emoji` 스킬이 설치되어 있으면, 텔레그램에서 아래처럼 실행할 수 있습니다.

- 사진(참조 이미지) **필수**
- 컨셉 텍스트 **필수**

예)
`/emoji 귀엽지만 직장인 공감형 토끼`
(위 메시지에 참조 이미지를 같이 첨부)

OpenClaw는 내부적으로 다음 CLI를 실행합니다:

```bash
cd /Users/bot/emoji-studio
npm run dev:cli -- generate \
  -c "귀엽지만 직장인 공감형 토끼" \
  --reference-image "/path/to/ref.jpg" \
  --auto \
  -o ./output
```

---

OpenClaw 워크스페이스에 `emoji-studio` 스킬이 설치되어 있으면(예: `./skills/emoji-studio`), 채팅에서 CLI 작업을 시킬 수 있습니다.

### 1) 키 설정(영구 저장)
CLI는 키를 로컬에 저장합니다: `~/.emoji-master/config.json`

한 번만 실행:
```bash
cd /Users/bot/emoji-studio
npm run dev:cli -- config set-key <GEMINI_API_KEY>
```

(참고) OpenClaw 쪽에서 `GEMINI_API_KEY` 환경변수를 주입하면, CLI는 환경변수를 **우선** 사용하므로 `--api-key`를 매번 넣을 필요가 없습니다.

### 2) 실행 예시(에이전트가 내부적으로 실행)

```bash
cd /Users/bot/emoji-studio
npm run dev:cli -- generate \
  -c "귀여운 고양이" \
  --reference-image "/path/to/ref.jpg" \
  --auto \
  -o ./output
```

### 3) 결과물
- 결과는 `./output/<session>/` 아래에 생성되며,
- ZIP이 생성되는 경우 OpenClaw가 텔레그램으로 파일을 다시 전송하도록 연결할 수 있습니다.

---

## 로컬 개발

### 사전 준비

- **Node.js** 18 이상
- **npm** 9 이상
- **Gemini API Key**

### 설치 및 실행

```bash
npm install
npm run dev:web          # http://localhost:5173
npm run dev:electron     # 데스크톱 앱
npm run dev:cli -- config set-key <GEMINI_API_KEY>
npm run dev:cli -- generate -c "귀여운 고양이" --auto
```

### 스크립트

| 명령어                      | 설명                                 |
| --------------------------- | ------------------------------------ |
| `npm run dev:web`           | 웹 개발 서버 (http://localhost:5173) |
| `npm run dev:electron`      | Electron 개발 모드                   |
| `npm run dev:cli -- <args>` | CLI 개발 모드                        |
| `npm run build:web`         | 웹 프로덕션 빌드                     |
| `npm run build:electron`    | Electron 프로덕션 빌드               |
| `npm run build:cli`         | CLI 프로덕션 빌드                    |
| `npm run test`              | 전체 테스트                          |
| `npm run lint`              | ESLint 검사                          |

---

## 프로젝트 구조

npm workspaces 기반 모노레포입니다.

```
line-emoji-master/
├── packages/
│   ├── shared/    # 공통 코드 (React 컴포넌트, Gemini AI, 이미지 처리, Zustand 스토어)
│   ├── web/       # 웹 SPA (Vite)
│   ├── electron/  # 데스크톱 앱 (Electron)
│   └── cli/       # CLI (Commander + Sharp)
└── package.json
```

## 기술 스택

| 영역        | 기술                                                             |
| ----------- | ---------------------------------------------------------------- |
| UI          | React 19, TypeScript 5.8, Tailwind CSS 4                         |
| AI          | Google Gemini (`gemini-2.5-flash-image`, `gemini-3.1-pro-preview`) |
| 상태관리    | Zustand 5                                                        |
| 빌드        | Vite 6, electron-vite 5                                          |
| 이미지 처리 | Canvas API (웹), Sharp (CLI)                                     |
| 내보내기    | JSZip                                                            |
| 테스트      | Vitest 3, Playwright                                             |

---

## 보안

- API Key는 브라우저 localStorage에만 저장됩니다.
- 서버가 없는 클라이언트 전용 앱이므로 키가 외부로 전송되지 않습니다.
- 개인용 도구로 설계되었습니다. 공개 배포 시 API Key 노출에 주의하세요.

---

## 라이선스

Private
