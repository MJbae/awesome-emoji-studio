# @emoji/web

Emoticon Studio의 **웹 브라우저 버전**입니다. 설치 없이 브라우저에서 바로 이모티콘 팩을 제작할 수 있습니다.

---

## 빠른 시작

```bash
# 프로젝트 루트에서 실행
npm install
npm run dev:web
```

브라우저에서 `http://localhost:5173`을 열면 바로 사용할 수 있습니다.

### 필요한 것

- **Node.js** 18 이상
- **Gemini API Key** — 앱 첫 실행 시 모달에서 입력

> API Key는 [Google AI Studio](https://aistudio.google.com/apikey)에서 무료로 발급받을 수 있습니다.

---

## 사용 방법

1. 앱을 열면 **API Key 입력 모달**이 나타납니다
2. Gemini API Key를 입력하고 **Save & Continue** 클릭
3. 캐릭터 컨셉을 입력하고 7단계 파이프라인을 따라 진행합니다
4. 완성된 이모티콘 팩을 ZIP으로 다운로드합니다

전체 워크플로우 설명은 [루트 README](../../README.md)를 참고하세요.

### API Key 저장 위치

웹 버전에서 API Key는 브라우저 `localStorage`에 저장됩니다. 서버로 전송되지 않으며, 브라우저 데이터를 삭제하면 함께 삭제됩니다.

---

## 스크립트

프로젝트 루트에서 실행:

| 명령어 | 설명 |
|--------|------|
| `npm run dev:web` | 개발 서버 (http://localhost:5173, HMR 지원) |
| `npm run build:web` | TypeScript 체크 + 프로덕션 빌드 |

패키지 디렉토리에서 직접 실행:

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | Vite 개발 서버 |
| `npm run build` | `tsc -b && vite build` |
| `npm run preview` | 빌드 결과 로컬 미리보기 |
| `npm run test` | 단위 테스트 (Vitest) |
| `npm run test:e2e` | E2E 테스트 (Playwright + Chromium) |
| `npm run test:coverage` | 커버리지 리포트 생성 |

---

## 프로덕션 빌드

```bash
npm run build:web
```

빌드 결과물은 `packages/web/dist/`에 생성됩니다. 정적 호스팅(Vercel, Netlify, GitHub Pages 등)에 바로 배포할 수 있습니다.

```bash
# 빌드 결과 로컬에서 확인
npm -w @emoji/web run preview
```

---

## 프로젝트 구조

```
packages/web/
├── src/
│   └── main.tsx              # React 엔트리포인트 (shared의 App 임포트)
├── index.html                # HTML 템플릿
├── public/                   # 정적 파일
├── e2e/                      # Playwright E2E 테스트
├── vite.config.ts            # Vite 설정 (React + Tailwind + @ 별칭)
├── vitest.config.ts          # Vitest 단위 테스트 설정
├── vitest.setup.ts           # 테스트 셋업 (canvas mock, testing-library)
├── playwright.config.ts      # Playwright E2E 설정
├── tsconfig.json             # TypeScript 설정
├── tsconfig.app.json         # 앱 빌드용 TypeScript 설정
└── package.json
```

웹 패키지는 **얇은 진입점** 역할만 합니다. 모든 React 컴포넌트, 서비스, 상태관리 코드는 `@emoji/shared` 패키지에 있으며, `@` 경로 별칭으로 임포트됩니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 번들러 | Vite 6 |
| UI | React 19 + TypeScript 5.8 |
| 스타일 | Tailwind CSS 4 (@tailwindcss/vite) |
| 테스트 | Vitest 3 + Testing Library + Playwright |
| API 모킹 | MSW 2 (Mock Service Worker) |

---

## 환경 변수 (선택)

`.env` 파일을 생성하여 API Key를 미리 설정할 수 있습니다:

```env
VITE_GEMINI_API_KEY=AIza...
```

설정하지 않아도 앱 내 모달에서 직접 입력할 수 있습니다.

---

## 테스트

```bash
# 단위 테스트
npm -w @emoji/web run test

# E2E 테스트 (Chromium 브라우저 사용)
npm -w @emoji/web run test:e2e

# 커버리지 리포트
npm -w @emoji/web run test:coverage
```

E2E 테스트는 dev 서버를 자동으로 시작합니다. 별도로 서버를 실행할 필요가 없습니다.

---

## 배포

### GitHub Actions

`.github/workflows/deploy-web.yml` 워크플로우가 설정되어 있습니다. `main` 브랜치에 `packages/shared/` 또는 `packages/web/` 변경이 푸시되면 자동으로 빌드됩니다.

### 수동 배포

```bash
npm run build:web
# packages/web/dist/ 디렉토리를 정적 호스팅에 업로드
```

---

## 브라우저 호환성

최신 버전의 Chrome, Edge, Safari, Firefox를 지원합니다. 이미지 처리에 Canvas API를 사용하므로 모던 브라우저가 필요합니다.
