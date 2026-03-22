# @emoji/electron

Emoticon Studio의 **데스크톱 앱** 버전입니다. macOS와 Windows를 지원하며, 네이티브 파일 다이얼로그, OS 키체인 보안 저장소, 자동 업데이트 등 데스크톱 고유 기능을 제공합니다.

---

## 빠른 시작

```bash
# 프로젝트 루트에서 실행
npm install
npm run dev:electron
```

Electron 창이 자동으로 열리며, API Key 입력 화면이 나타납니다.

### 필요한 것

- **Node.js** 18 이상
- **Gemini API Key** — 앱 첫 실행 시 모달에서 입력

> API Key는 [Google AI Studio](https://aistudio.google.com/apikey)에서 무료로 발급받을 수 있습니다.

---

## 웹 버전과의 차이

| 기능 | 웹 | 데스크톱 |
|------|-----|----------|
| API Key 저장 | 브라우저 localStorage | OS 키체인 (electron-store) |
| 파일 저장 | 브라우저 다운로드 | 네이티브 저장 다이얼로그 |
| 파일 열기 | 파일 입력 요소 | 네이티브 열기 다이얼로그 |
| 자동 업데이트 | N/A | GitHub Releases 기반 |
| 외부 링크 | 새 탭 | 시스템 기본 브라우저 |

모든 핵심 기능(이모티콘 생성, 후처리, 내보내기)은 `@emoji/shared` 패키지를 공유하므로 동일하게 동작합니다.

---

## 사용 방법

1. 앱을 실행하면 **API Key 입력 모달**이 나타납니다
2. Gemini API Key를 입력하고 **Save & Continue** 클릭
3. 캐릭터 컨셉을 입력하고 7단계 파이프라인을 따라 진행합니다
4. 완성된 이모티콘 팩을 원하는 폴더에 저장합니다

전체 워크플로우 설명은 [루트 README](../../README.md)를 참고하세요.

### API Key 저장 위치

데스크톱 버전에서 API Key는 OS 키체인(`electron-store`)에 안전하게 저장됩니다. 앱을 삭제하기 전까지 유지됩니다.

---

## 스크립트

프로젝트 루트에서 실행:

| 명령어 | 설명 |
|--------|------|
| `npm run dev:electron` | Electron 개발 모드 (HMR 지원) |
| `npm run build:electron` | Electron 프로덕션 빌드 |

패키지 디렉토리에서 직접 실행:

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | electron-vite 개발 서버 |
| `npm run build` | electron-vite 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run package:mac` | macOS 패키지 (DMG + ZIP, Universal) |
| `npm run package:win` | Windows 패키지 (NSIS 인스톨러, x64) |
| `npm run package:all` | macOS + Windows 동시 패키지 |
| `npm run test` | 단위 테스트 (Vitest, main process) |
| `npm run test:e2e` | E2E 테스트 (Playwright, Electron) |

---

## 패키징 (배포용 빌드)

### macOS

```bash
npm -w @emoji/electron run package:mac
```

- **출력**: `packages/electron/dist/` 폴더에 `.dmg`(인스톨러)와 `.zip`(포터블) 생성
- **아키텍처**: Universal (Apple Silicon + Intel)
- **코드 서명**: `electron-builder.yml`에서 `identity` 설정 필요 (기본값: null = 미서명)
- **공증(Notarize)**: 환경 변수로 Apple ID 인증 정보 설정 필요

### Windows

```bash
npm -w @emoji/electron run package:win
```

- **출력**: `packages/electron/dist/` 폴더에 `.exe` NSIS 인스톨러 생성
- **아키텍처**: x64
- **설치 옵션**: 설치 경로 선택 가능, 사용자별 설치

### 코드 서명 설정 (CI/CD)

macOS 공증에 필요한 환경 변수:

```bash
# 방법 1: Apple ID
APPLE_ID=your@email.com
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=XXXXXXXXXX

# 방법 2: App Store Connect API
APPLE_API_KEY=AuthKey_XXXXX.p8
APPLE_API_KEY_ID=XXXXXXXXXX
APPLE_API_ISSUER=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 자동 업데이트

GitHub Releases를 통한 자동 업데이트를 지원합니다. `electron-builder.yml`의 `publish` 섹션에서 GitHub 저장소를 설정하세요:

```yaml
publish:
  provider: github
  owner: your-username
  repo: emoticon-studio
  releaseType: release
```

앱 실행 시 자동으로 새 버전을 확인하고, 업데이트가 있으면 사용자에게 알립니다.

---

## 프로젝트 구조

```
packages/electron/
├── src/
│   ├── main/                   # 메인 프로세스 (Node.js)
│   │   ├── index.ts            # 앱 초기화, BrowserWindow 생성
│   │   ├── menu.ts             # 네이티브 메뉴 구성
│   │   ├── updater.ts          # 자동 업데이트 로직
│   │   └── ipc/                # IPC 핸들러
│   │       ├── secureStore.ts  # API Key 보안 저장 (electron-store)
│   │       ├── fileService.ts  # 네이티브 파일 다이얼로그
│   │       └── appInfo.ts      # 앱 버전, 경로 정보
│   ├── preload/
│   │   └── index.ts            # 렌더러에 노출할 IPC 브릿지
│   ├── shared/
│   │   └── ipc.ts              # IPC 채널 타입 정의
│   └── renderer/
│       ├── index.html          # Electron용 HTML (CSP 포함)
│       └── src/
│           ├── main.tsx        # React 엔트리포인트
│           └── vite-env.d.ts   # DesktopAPI 타입 선언
├── resources/                  # 앱 아이콘, 권한 설정
│   ├── icon.icns               # macOS 아이콘
│   ├── icon.ico                # Windows 아이콘
│   ├── icon.png                # 범용 아이콘
│   └── entitlements.mac.plist  # macOS 권한
├── tests/
│   ├── unit/main/              # 메인 프로세스 단위 테스트
│   └── e2e-electron/           # Electron E2E 테스트
├── electron.vite.config.ts     # electron-vite 설정 (main/preload/renderer)
├── electron-builder.yml        # 패키징 설정 (macOS + Windows)
├── vitest.config.main.ts       # Vitest 설정
├── playwright-electron.config.ts # Playwright E2E 설정
└── package.json
```

### 3-프로세스 아키텍처

Electron은 세 가지 프로세스로 분리되어 있습니다:

| 프로세스 | 역할 | 위치 |
|---------|------|------|
| **Main** | 앱 생명주기, 창 관리, 파일 시스템, 키체인 | `src/main/` |
| **Preload** | Main ↔ Renderer 간 안전한 IPC 브릿지 | `src/preload/` |
| **Renderer** | React UI (shared 패키지의 앱 코드) | `src/renderer/` |

Renderer 프로세스에서는 `window.desktop` 객체를 통해 네이티브 기능에 접근합니다:

```typescript
// API Key 관리
await window.desktop.secure.getApiKey();
await window.desktop.secure.setApiKey({ key: 'AIza...' });

// 파일 저장
await window.desktop.file.saveBinary({
  data: zipData,
  defaultName: 'stickers.zip',
});

// 앱 정보
const version = await window.desktop.app.getVersion();
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Electron 40 |
| 빌드 | electron-vite 5 |
| 패키징 | electron-builder 26 |
| 보안 저장소 | electron-store 8 |
| 자동 업데이트 | electron-updater 6 |
| 렌더러 | React 19 + Tailwind CSS 4 (shared 패키지) |
| 테스트 | Vitest 3 + Playwright |

---

## 테스트

```bash
# 메인 프로세스 단위 테스트 (IPC 핸들러 등)
npm -w @emoji/electron run test

# Electron E2E 테스트
npm -w @emoji/electron run test:e2e
```

---

## CI/CD

`.github/workflows/build-release.yml` 워크플로우가 설정되어 있습니다. `main` 브랜치에 `packages/shared/` 또는 `packages/electron/` 변경이 푸시되면 자동으로 빌드 및 릴리즈됩니다.
