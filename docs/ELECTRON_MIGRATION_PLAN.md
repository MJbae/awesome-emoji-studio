# Emoticon Studio — Electron 크로스플랫폼 데스크탑 앱 마이그레이션 계획서

> **프로젝트명**: Emoticon Studio Desktop  
> **작성일**: 2026-02-13  
> **버전**: v1.2 (실현 가능성 검토 반영 — 17건 수정: CRITICAL 2, HIGH 3, MEDIUM 8, LOW 4)  
> **원본 프로젝트**: Emoticon Studio (React 19 + Vite 6 웹 앱)  
> **대상 플랫폼**: macOS (Intel + Apple Silicon), Windows (x64)

---

## 목차

1. [Executive Summary](#1-executive-summary)
2. [현재 프로젝트 마이그레이션 영향 분석](#2-현재-프로젝트-마이그레이션-영향-분석)
3. [Electron 아키텍처 설계](#3-electron-아키텍처-설계)
4. [Gemini API Key 보안 저장](#4-gemini-api-key-보안-저장)
5. [배포 전략 (Windows + macOS)](#5-배포-전략-windows--macos)
6. [단계별 구현 계획 (10 Phase)](#6-단계별-구현-계획-10-phase)
7. [테스트 전략](#7-테스트-전략)
8. [위험 요소 및 완화 전략](#8-위험-요소-및-완화-전략)
9. [기술 결정 사항](#9-기술-결정-사항)
10. [에이전트 팀 구성 및 역할](#10-에이전트-팀-구성-및-역할)

---

## 1. Executive Summary

### 목적

기존 React 19 + Vite 6 웹 앱인 Emoticon Studio를 Electron 기반 크로스플랫폼 데스크탑 애플리케이션으로 마이그레이션합니다. Windows와 macOS에서 설치형 앱으로 배포하여 사용자에게 네이티브 데스크탑 경험을 제공합니다.

### 핵심 요구사항

| #   | 요구사항                        | 구현 전략                                                                 |
| --- | ------------------------------- | ------------------------------------------------------------------------- |
| 1   | Electron 기반 크로스플랫폼      | `electron-vite` + `electron-builder` (macOS DMG + Windows NSIS)           |
| 2   | Windows/macOS 배포 및 전달 방법 | GitHub Releases + 자동 업데이트 (`electron-updater`) + 코드 서명/공증     |
| 3   | Gemini API Key 영구 저장        | Electron `safeStorage` API (OS 수준 암호화) + 최초 진입 시 모달           |
| 4   | 단계별 테스트 및 회귀 테스트    | Vitest (Unit/Integration) + Playwright `_electron` (E2E) + 회귀 방지 전략 |
| 5   | 기존 웹 UI/UX 유지              | 렌더러 프로세스에서 기존 React 앱 그대로 구동, 변경 최소화                |

### 마이그레이션 개요

```
┌─────────────────────────────────────────────────────────────┐
│                    변경 필요 영역 (~20%)                       │
│  ┌───────────────┬──────────────┬────────────────────────┐  │
│  │ API Key 저장  │ 파일 내보내기 │ 빌드/패키징 설정         │  │
│  │ localStorage  │ anchor.click │ vite.config.ts          │  │
│  │ → safeStorage │ → dialog.    │ → electron.vite.config  │  │
│  │   (3 files)   │ showSave()   │   + electron-builder    │  │
│  │               │  (2 files)   │   (config files)        │  │
│  └───────────────┴──────────────┴────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    변경 불필요 영역 (~80%)                     │
│  Canvas 이미지 처리 (4 files) ✅ Electron Chromium에서 동작   │
│  Gemini AI 서비스 (6 files)   ⚠️ @google/genai SDK, Phase 3 검증 │
│  React 컴포넌트 (18 files)    ✅ 렌더러에서 그대로 동작      │
│  window.emoticon 브릿지       ✅ 표준 DOM API, 변경 불필요   │
│  EventBus / CustomEvent       ✅ 표준 DOM API, 변경 불필요   │
│  Zustand 스토어 (4 slices)    ✅ apiKey만 persist에서 제거   │
└─────────────────────────────────────────────────────────────┘
```

### 일정 요약

| Phase | 작업                              | 예상 소요 | 누적     |
| ----- | --------------------------------- | --------- | -------- |
| 1     | 프로젝트 스캐폴딩 (electron-vite) | 1일       | 1일      |
| 2     | Electron 부팅 + 기존 앱 로드      | 0.5일     | 1.5일    |
| 3     | 기존 테스트 통과 검증             | 0.5일     | 2일      |
| 4     | IPC 기반 인프라 구축              | 1일       | 3일      |
| 5     | API Key 보안 마이그레이션         | 1일       | 4일      |
| 6     | 파일 내보내기 네이티브화          | 1일       | 5일      |
| 7     | 데스크탑 UX 완성                  | 1일       | 6일      |
| 8     | 패키징 (DMG + NSIS)               | 1일       | 7일      |
| 9     | 배포 (코드 서명 + 자동 업데이트)  | 1.5일     | 8.5일    |
| 10    | E2E 테스트 + 최종 검증            | 1.5일     | **10일** |

**총 예상 소요**: 약 10 작업일 (2주)

---

## 2. 현재 프로젝트 마이그레이션 영향 분석

### 2.1 코드베이스 탐색 결과 (Explore 에이전트 분석)

전체 소스 코드를 6개 카테고리로 스캔하여 Electron 마이그레이션 영향도를 평가했습니다.

#### 🔴 HIGH IMPACT — 반드시 수정 필요 (5 files)

| 파일                                    | 현재 패턴                                   | 문제점                                       | 마이그레이션 방향                     |
| --------------------------------------- | ------------------------------------------- | -------------------------------------------- | ------------------------------------- |
| `src/services/config/apiKeyManager.ts`  | `localStorage.setItem/getItem`              | Electron localStorage는 평문 파일로 저장됨   | IPC → main process `safeStorage`      |
| `src/store/appStore.ts:20-23`           | Zustand persist에 `apiKey` 포함             | API Key가 평문으로 persist됨                 | `partialize`에서 `apiKey` 제거        |
| `src/store/slices/configSlice.ts:29-35` | apiKeyManager 함수 호출 (간접 localStorage) | 보안 취약                                    | platform adapter 비동기 액션으로 교체 |
| `src/App.tsx:531-539`                   | `URL.createObjectURL` + `a.click()`         | 네이티브 저장 대화상자 없이 Downloads에 저장 | `dialog.showSaveDialog()` via IPC     |
| `src/services/image/export.ts`          | JSZip Blob 생성 후 반환                     | Blob → Buffer 변환 필요                      | JSZip 로직 유지, 호출부에서 IPC 사용  |

#### 🟡 MEDIUM IMPACT — 확인/소규모 수정 (3 files)

| 파일                                          | 현재 패턴                         | 영향                                | 조치                        |
| --------------------------------------------- | --------------------------------- | ----------------------------------- | --------------------------- |
| `src/components/stages/MetadataStage.tsx:204` | `navigator.clipboard.writeText()` | Electron에서 동작하나 CSP 확인 필요 | 동작 검증 후 유지           |
| `vite.config.ts:13-15`                        | `define: { 'process.env': {} }`   | electron-vite 전환 시 별도 처리     | electron-vite config로 대체 |
| `package.json:19`                             | `file-saver` 의존성               | 실제 import 없음 (죽은 코드)        | 제거                        |

#### 🟢 NO IMPACT — 변경 불필요 (전체의 ~80%)

| 카테고리                  | 파일 수 | 이유                                                                                           |
| ------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| Canvas 이미지 처리        | 4       | Electron Chromium에서 Canvas 2D 완벽 지원                                                      |
| Gemini AI 서비스          | 6       | `@google/genai` SDK 사용 (SDK 내부에서 fetch 호출), Electron renderer 호환 검증 필요 (Phase 3) |
| React 컴포넌트            | 18      | 렌더러 프로세스 = Chromium, 웹과 동일                                                          |
| window.emoticon 브릿지    | 2       | 표준 DOM API (`window`, `CustomEvent`)                                                         |
| EventBus / DOM State      | 2       | `window.dispatchEvent`, `data-*` 어트리뷰트                                                    |
| Zustand 슬라이스 (비민감) | 3       | `language`, `defaultPlatform`은 persist 유지 가능                                              |
| FileReader (파일 업로드)  | 2       | 표준 Web API, Electron renderer에서 동일 동작 (`InputStage.tsx`, `base64.ts`)                  |
| Blob + canvas.toDataURL() | 5       | Canvas 2D, Blob 생성자, toDataURL() 모두 Chromium 표준 지원                                    |
| img.crossOrigin           | 1       | data: URL만 사용하므로 안전. 외부 이미지 로드 시 CSP 조정 필요 (`core.ts`)                     |
| 유틸리티                  | 3       | 순수 함수, 환경 의존성 없음                                                                    |

### 2.2 현재 기술 스택 호환성

| 기술             | 버전    | Electron 호환성                                                 | 조치                                                |
| ---------------- | ------- | --------------------------------------------------------------- | --------------------------------------------------- |
| React 19         | ^19.0.0 | ✅ 완벽 호환                                                    | 없음                                                |
| Vite 6           | ^6.0.0  | ✅ electron-vite 5.x 지원                                       | `electron.vite.config.ts`로 전환                    |
| TypeScript 5.8   | ~5.8.0  | ✅ 완벽 호환                                                    | tsconfig 분리 (main/preload/renderer)               |
| Tailwind CSS v4  | ^4.0.0  | ✅ 렌더러에서 동일 동작                                         | 없음                                                |
| Zustand 5        | ^5.0.0  | ✅ persist storage adapter 교체 필요                            | apiKey만 safeStorage로 이전                         |
| @google/genai    | latest  | ⚠️ SDK 기반 (내부 fetch 사용), Electron renderer 호환 검증 필요 | Phase 3에서 검증 (sandbox 환경에서 SDK 동작 테스트) |
| JSZip 3.10.1     | ^3.10.1 | ✅ 완벽 호환                                                    | 없음                                                |
| file-saver 2.0.5 | ^2.0.5  | ❌ 브라우저 전용                                                | **제거** (미사용 코드)                              |
| lucide-react     | latest  | ✅ 완벽 호환                                                    | 없음                                                |
| Vitest 3.x       | ^3.0.0  | ✅ Node 환경 테스트 추가                                        | main process용 config 추가                          |
| Playwright       | ^1.49.0 | ✅ `_electron` fixture 지원                                     | Electron E2E config 추가                            |

---

## 3. Electron 아키텍처 설계

### 3.1 프로세스 아키텍처 (Oracle 에이전트 설계)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron App                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Main Process                           │   │
│  │                                                           │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐  │   │
│  │  │ Secure Store │ │ File Service │ │ Auto-Updater     │  │   │
│  │  │ (safeStorage│ │ (dialog +    │ │ (electron-       │  │   │
│  │  │  + electron │ │  fs.write)   │ │  updater)        │  │   │
│  │  │  -store)    │ │              │ │                  │  │   │
│  │  └──────┬──────┘ └──────┬───────┘ └────────┬─────────┘  │   │
│  │         │               │                   │            │   │
│  │  ┌──────┴───────────────┴───────────────────┴─────────┐  │   │
│  │  │              IPC Main Handlers                      │  │   │
│  │  │  ipcMain.handle('secure:*')                         │  │   │
│  │  │  ipcMain.handle('file:*')                           │  │   │
│  │  │  ipcMain.handle('app:*')                            │  │   │
│  │  │  ipcMain.handle('updater:*')                        │  │   │
│  │  └──────────────────────┬──────────────────────────────┘  │   │
│  └─────────────────────────┼─────────────────────────────────┘   │
│                            │ IPC (contextBridge)                  │
│  ┌─────────────────────────┼─────────────────────────────────┐   │
│  │                  Preload Script                            │   │
│  │  contextBridge.exposeInMainWorld('desktop', {             │   │
│  │    secure: { getApiKey, setApiKey, deleteApiKey },        │   │
│  │    file:   { showSaveDialog, saveBinary, showOpenDialog },│   │
│  │    app:    { getVersion, getPaths },                      │   │
│  │    updater:{ check, onAvailable, onDownloaded },          │   │
│  │    shell:  { openExternal }                               │   │
│  │  })                                                       │   │
│  └─────────────────────────┼─────────────────────────────────┘   │
│                            │ window.desktop                      │
│  ┌─────────────────────────┼─────────────────────────────────┐   │
│  │                  Renderer Process                          │   │
│  │                                                            │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │          기존 React 앱 (변경 최소화)                  │   │   │
│  │  │                                                     │   │   │
│  │  │  ┌──────────┐ ┌───────────┐ ┌──────────────────┐   │   │   │
│  │  │  │ Platform │ │ Gemini AI │ │ Canvas 이미지     │   │   │   │
│  │  │  │ Adapter  │ │ 서비스    │ │ 처리 서비스       │   │   │   │
│  │  │  │(web/elec)│ │(직접 호출)│ │(변경 없음)        │   │   │   │
│  │  │  └──────────┘ └───────────┘ └──────────────────┘   │   │   │
│  │  │                                                     │   │   │
│  │  │  window.emoticon (LLM 브릿지, 유지)                 │   │   │
│  │  │  window.desktop  (Electron IPC, 신규)               │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 핵심 설계 결정

#### 결정 1: Gemini API 호출 위치 → 렌더러 유지

| 옵션                         | 보안                            | 성능                                         | 복잡도  |
| ---------------------------- | ------------------------------- | -------------------------------------------- | ------- |
| **Main process에서 호출**    | 🟢 Key 노출 없음                | 🔴 22MB+ IPC 오버헤드 (45개 이미지 × ~500KB) | 🔴 높음 |
| **Renderer에서 호출 (채택)** | 🟡 Key가 renderer 메모리에 존재 | 🟢 IPC 불필요                                | 🟢 낮음 |

**결정**: 렌더러에서 직접 Gemini API 호출 유지. 개인용 도구이므로 renderer 메모리 내 Key 노출은 수용 가능한 수준. API Key 저장만 main process의 safeStorage로 이전.

#### 결정 2: 플랫폼 어댑터 패턴 → 웹/Electron 공존

개발 중에는 웹 모드(`npm run dev:web`)로 빠른 이터레이션이 가능하도록, 런타임에 플랫폼을 감지하여 적절한 구현체를 사용합니다.

> ⚠️ **v1.2 수정 — API Key 소유권 모델 명확화**
>
> **Zustand가 런타임 단일 소스 오브 트루스(SSOT)**이고, platform adapter는 **영속화 백엔드**입니다.
> 컴포넌트/훅은 반드시 Zustand 스토어 액션(`setApiKeyAsync`, `loadApiKeyAsync`)을 통해서만
> API Key를 읽고 씁니다. `platform.setApiKey()`를 직접 호출하면 Zustand 상태와 불일치(split-brain)가 발생합니다.
>
> ```
> ❌ 직접 호출 금지: await platform.setApiKey(key)  // Zustand 상태 업데이트 누락
> ✅ 스토어 액션 사용: useAppStore.getState().setApiKeyAsync(key)  // platform + Zustand 동시 업데이트
> ```

```typescript
// src/renderer/src/platform/adapter.ts
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.desktop;
}

// 내부 전용 — 컴포넌트에서 직접 호출 금지. Zustand 액션을 통해서만 사용.
export const platform = {
  async getApiKey(): Promise<string | null> {
    if (isElectron()) {
      return window.desktop!.secure.getApiKey();
    }
    return localStorage.getItem('emoticon_studio_api_key');
  },

  async setApiKey(key: string): Promise<void> {
    if (isElectron()) {
      await window.desktop!.secure.setApiKey({ key });
    } else {
      localStorage.setItem('emoticon_studio_api_key', key);
    }
  },

  async deleteApiKey(): Promise<void> {
    if (isElectron()) {
      await window.desktop!.secure.deleteApiKey();
    } else {
      localStorage.removeItem('emoticon_studio_api_key');
    }
  },

  async saveFile(data: Uint8Array, defaultName: string): Promise<boolean> {
    if (isElectron()) {
      const result = await window.desktop!.file.saveBinary({
        data,
        defaultName,
        mimeType: 'application/zip',
      });
      return !result.canceled;
    }
    // 웹 폴백: 기존 anchor.click 패턴
    const blob = new Blob([data], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  },
};
```

**Zustand 스토어 비동기 액션 (configSlice에 추가)**:

```typescript
// src/renderer/src/store/slices/configSlice.ts — 비동기 액션 추가
loadApiKeyAsync: async () => {
  const key = await platform.getApiKey();
  set({
    apiKey: key,
    keyHydrated: key ? 'present' : 'absent',
  });
},

setApiKeyAsync: async (key: string) => {
  await platform.setApiKey(key);  // 영속화 먼저
  set({ apiKey: key, keyHydrated: 'present' });  // 그 다음 런타임 상태 동기화
},

clearApiKeyAsync: async () => {
  await platform.deleteApiKey();
  set({ apiKey: null, keyHydrated: 'absent' });
},
```

### 3.3 IPC 통신 설계

#### 채널 정의 (TypeScript 타입 안전)

```typescript
// src/shared/ipc.ts — Main, Preload, Renderer 모두에서 참조
export const IPC = {
  // API Key 보안 저장
  secureGetApiKey: 'secure:getApiKey',
  secureSetApiKey: 'secure:setApiKey',
  secureDeleteApiKey: 'secure:deleteApiKey',

  // 파일 시스템
  fileShowSaveDialog: 'file:showSaveDialog',
  fileSaveBinary: 'file:saveBinary',
  fileShowOpenDialog: 'file:showOpenDialog',
  fileReadBinary: 'file:readBinary',

  // 앱 정보
  appGetVersion: 'app:getVersion',
  appGetPaths: 'app:getPaths',

  // 자동 업데이트
  updaterCheck: 'updater:check',

  // 외부 링크
  shellOpenExternal: 'shell:openExternal',
} as const;

// === 요청/응답 타입 ===

// ⚠️ v1.2 참고: Uint8Array는 structured clone으로 정상 직렬화됨 (TypedArray 지원).
// 다만 대용량 (>50MB) 전송 시 renderer jank 가능성 있음.
// 현재 최대 크기: 45개 스티커 × ~500KB ≈ 22MB → 허용 범위.
// 향후 대용량 처리 필요 시 main process에서 직접 fs.write + 진행률 IPC 방식 고려.
export type SaveBinaryReq = {
  data: Uint8Array;
  defaultName: string;
  defaultDirectory?: string;
  mimeType?: string;
};
export type SaveBinaryRes = { canceled: boolean; path: string | null };

export type ShowSaveDialogReq = {
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
};
export type ShowSaveDialogRes = { canceled: boolean; path: string | null };

export type SetApiKeyReq = { key: string };

export type UpdateInfo = {
  available: boolean;
  version?: string;
  notes?: string;
};

export type RecentExport = { path: string; createdAt: number; size: number };

// === Preload에서 노출하는 API 타입 ===

export type DesktopAPI = {
  secure: {
    getApiKey(): Promise<string | null>;
    setApiKey(req: SetApiKeyReq): Promise<void>;
    deleteApiKey(): Promise<void>;
  };
  file: {
    showSaveDialog(req: ShowSaveDialogReq): Promise<ShowSaveDialogRes>;
    saveBinary(req: SaveBinaryReq): Promise<SaveBinaryRes>;
    showOpenDialog(): Promise<{ canceled: boolean; paths: string[] }>;
    readBinary(path: string): Promise<Uint8Array>;
  };
  app: {
    getVersion(): Promise<string>;
    getPaths(): Promise<{ documents: string; userData: string }>;
  };
  updater: {
    check(): Promise<UpdateInfo>;
    // ⚠️ v1.2 수정: contextBridge는 콜백 함수를 직렬화할 수 없음.
    // preload에서 ipcRenderer.on()으로 내부 리스너를 등록하고,
    // renderer-facing API에서 콜백 레지스트리를 관리하는 패턴 사용.
    // 아래 preload 구현 참고.
    onAvailable(cb: (info: { version: string }) => void): () => void;
    onDownloaded(cb: () => void): () => void;
  };
  shell: {
    openExternal(url: string): Promise<void>;
  };
};

declare global {
  interface Window {
    desktop?: DesktopAPI;
    emoticon: EmoticonAPI; // 기존 LLM 브릿지 유지
  }
}
```

> ⚠️ **v1.2 추가 — Preload에서 updater 이벤트 브릿지 구현**
>
> `contextBridge.exposeInMainWorld()`는 structured clone으로 직렬화하므로 **콜백 함수를 전달할 수 없습니다**.
> updater의 `onAvailable`/`onDownloaded`는 preload 내부에서 `ipcRenderer.on()`으로 이벤트를 수신하고,
> 콜백 레지스트리를 관리하여 renderer에서 등록한 콜백을 호출합니다.

```typescript
// src/preload/index.ts — updater 이벤트 브릿지 부분
const updaterCallbacks = {
  available: new Set<(info: { version: string }) => void>(),
  downloaded: new Set<() => void>(),
};

// main → preload 이벤트 수신 (preload 컨텍스트에서 실행)
ipcRenderer.on('event:updater:available', (_, info) => {
  updaterCallbacks.available.forEach((cb) => cb(info));
});
ipcRenderer.on('event:updater:downloaded', () => {
  updaterCallbacks.downloaded.forEach((cb) => cb());
});

// contextBridge로 노출
contextBridge.exposeInMainWorld('desktop', {
  // ... 기존 secure, file, app, shell ...
  updater: {
    check: () => ipcRenderer.invoke(IPC.updaterCheck),
    onAvailable: (cb: (info: { version: string }) => void) => {
      updaterCallbacks.available.add(cb);
      return () => {
        updaterCallbacks.available.delete(cb);
      };
    },
    onDownloaded: (cb: () => void) => {
      updaterCallbacks.downloaded.add(cb);
      return () => {
        updaterCallbacks.downloaded.delete(cb);
      };
    },
  },
});
```

### 3.4 보안 모델

| 설정                          | 값      | 이유                               |
| ----------------------------- | ------- | ---------------------------------- |
| `contextIsolation`            | `true`  | 렌더러 JS 컨텍스트 격리 (필수)     |
| `nodeIntegration`             | `false` | 렌더러에서 Node.js API 차단 (필수) |
| `sandbox`                     | `true`  | OS 수준 렌더러 프로세스 샌드박싱   |
| `webSecurity`                 | `true`  | CORS 보안 유지                     |
| `allowRunningInsecureContent` | `false` | HTTP 콘텐츠 차단                   |
| `webviewTag`                  | `false` | webview 비활성화                   |

**추가 보안 조치**:

```typescript
// Main process: 네비게이션 차단 (XSS → 외부 사이트 이동 방지)
mainWindow.webContents.on('will-navigate', (event) => {
  event.preventDefault();
});

// shell.openExternal URL allowlist (HTTPS만 허용)
ipcMain.handle(IPC.shellOpenExternal, async (_, url: string) => {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }
  const allowedHosts = ['aistudio.google.com', 'github.com', 'developer.apple.com'];
  if (!allowedHosts.some((host) => parsed.hostname.endsWith(host))) {
    throw new Error(`Host not in allowlist: ${parsed.hostname}`);
  }
  await shell.openExternal(url);
});
```

**CSP (Content Security Policy)**:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'self' https://generativelanguage.googleapis.com;
worker-src 'self' blob:;
```

> ⚠️ **v1.2 참고**: `@google/genai` SDK는 현재 `generativelanguage.googleapis.com`만 사용하지만,
> 향후 live/streaming 기능 사용 시 `wss://generativelanguage.googleapis.com`을 `connect-src`에 추가해야 합니다.
> Phase 3에서 `securitypolicyviolation` 이벤트 리스너를 추가하여 CSP 위반을 모니터링할 것을 권장합니다:
>
> ```typescript
> document.addEventListener('securitypolicyviolation', (e) => {
>   console.warn('[CSP 위반]', e.violatedDirective, e.blockedURI);
> });
> ```

### 3.5 디렉터리 구조 (마이그레이션 후)

```
emoticon-studio/
├── src/
│   ├── main/                          # [신규] Electron Main Process
│   │   ├── index.ts                   # 앱 엔트리, BrowserWindow 생성
│   │   ├── ipc/
│   │   │   ├── secureStore.ts         # safeStorage 암호화 저장
│   │   │   ├── fileService.ts         # 네이티브 파일 대화상자 + fs
│   │   │   └── appInfo.ts            # 앱 정보, 경로
│   │   ├── updater.ts                 # electron-updater 자동 업데이트
│   │   └── menu.ts                    # macOS/Windows 메뉴 바
│   │
│   ├── preload/                       # [신규] Preload Script
│   │   └── index.ts                   # contextBridge.exposeInMainWorld
│   │
│   ├── shared/                        # [신규] Main/Renderer 공유 타입
│   │   └── ipc.ts                     # IPC 채널명 + 타입 정의
│   │
│   └── renderer/                      # [이동] 기존 src/ → src/renderer/src/
│       ├── index.html                 # [이동] 기존 index.html
│       └── src/
│           ├── App.tsx                # 기존 앱 (최소 수정)
│           ├── platform/              # [신규] 플랫폼 어댑터
│           │   └── adapter.ts
│           ├── types/                 # 기존 유지
│           ├── constants/             # 기존 유지
│           ├── services/              # 기존 유지 (apiKeyManager만 수정)
│           ├── store/                 # 기존 유지 (partialize에서 apiKey 제거)
│           ├── hooks/                 # 기존 유지
│           ├── bridge/                # 기존 유지 (window.emoticon)
│           ├── components/            # 기존 유지
│           └── utils/                 # 기존 유지
│
├── resources/                         # [신규] 앱 리소스
│   ├── icon.icns                      # macOS 아이콘
│   ├── icon.ico                       # Windows 아이콘
│   ├── icon.png                       # 공통 아이콘 (256x256)
│   └── entitlements.mac.plist         # macOS 권한
│
├── electron.vite.config.ts            # [신규] electron-vite 통합 설정
├── electron-builder.yml               # [신규] 패키징/배포 설정
├── tsconfig.json                      # 루트 (references)
├── tsconfig.node.json                 # main + preload용
├── tsconfig.web.json                  # renderer용
├── vitest.config.ts                   # 렌더러 단위 테스트 (기존)
├── vitest.config.main.ts              # [신규] main process 단위 테스트
├── playwright.config.ts               # 웹 E2E (기존, 개발용)
├── playwright-electron.config.ts      # [신규] Electron E2E
└── package.json
```

---

## 4. Gemini API Key 보안 저장

### 4.1 현재 구현의 문제점

현재 API Key는 두 곳에 중복 저장됩니다:

1. **`apiKeyManager.ts`**: `localStorage.setItem('emoticon_studio_api_key', key)`
2. **Zustand persist**: `localStorage.setItem('emoticon-studio-config', JSON.stringify({apiKey, ...}))`

Electron에서 localStorage는 `~/Library/Application Support/{app}/Local Storage/leveldb/` (macOS) 또는 `%APPDATA%/{app}/Local Storage/leveldb/` (Windows)에 **평문 파일**로 저장됩니다. 어떤 프로세스든 읽을 수 있어 보안에 취약합니다.

### 4.2 마이그레이션 후 구현

#### 저장 구조

```
앱 시작 → main process에서 safeStorage로 암호화된 Key 로드
                ↓ IPC
        renderer에서 Zustand 인메모리 상태에 설정
                ↓
        Gemini API 호출 시 인메모리 Key 사용
```

#### Main Process: 암호화 저장 서비스

```typescript
// src/main/ipc/secureStore.ts
import { safeStorage, app, ipcMain } from 'electron';
import Store from 'electron-store';
import { IPC } from '../../shared/ipc';

// ⚠️ electron-store v11+는 ESM 전용. electron-vite의 main process는 CJS로 빌드되므로
// 반드시 electron-store@^8.2.0 (마지막 CJS 호환 버전)을 사용할 것.
// 또는 electron-vite main 빌드를 ESM으로 전환 (build.lib.formats: ['es']).
const store = new Store({ name: 'secure-config' });

function encrypt(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value).toString('hex');
  }
  // 폴백 정책: 암호화 불가 시 디스크 저장 거부 (인메모리 세션만 허용)
  // 평문 디스크 저장은 보안상 허용하지 않음
  throw new Error(
    'OS encryption unavailable. API key will only be stored in memory for this session.',
  );
}

function decrypt(hex: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(Buffer.from(hex, 'hex'));
  }
  throw new Error('OS encryption unavailable. Cannot decrypt stored key.');
}

// ⚠️ 반드시 app.whenReady() 이후에 호출할 것.
// safeStorage.isEncryptionAvailable()은 Windows/Linux에서 ready 이전에 false를 반환함.
export function registerSecureStoreHandlers(): void {
  ipcMain.handle(IPC.secureGetApiKey, async () => {
    const encrypted = store.get('geminiApiKey') as string | undefined;
    if (!encrypted) return null;
    try {
      return decrypt(encrypted);
    } catch {
      store.delete('geminiApiKey');
      return null;
    }
  });

  ipcMain.handle(IPC.secureSetApiKey, async (_, req: { key: string }) => {
    store.set('geminiApiKey', encrypt(req.key));
  });

  ipcMain.handle(IPC.secureDeleteApiKey, async () => {
    store.delete('geminiApiKey');
  });
}
```

#### localStorage → safeStorage 자동 마이그레이션

최초 Electron 실행 시 기존 localStorage에 저장된 Key를 감지하여 자동 마이그레이션합니다:

```typescript
// src/renderer/src/hooks/useMigrateApiKey.ts
import { useEffect } from 'react';
import { isElectron } from '../platform/adapter';
import { useAppStore } from '../store/appStore';

export function useMigrateApiKey(): void {
  useEffect(() => {
    if (!isElectron()) return;

    const legacyKey = localStorage.getItem('emoticon_studio_api_key');
    if (legacyKey) {
      // ⚠️ v1.2: Zustand SSOT 원칙에 따라 스토어 비동기 액션 사용.
      // platform.setApiKey() 직접 호출 금지 — split-brain 방지.
      useAppStore
        .getState()
        .setApiKeyAsync(legacyKey)
        .then(() => {
          localStorage.removeItem('emoticon_studio_api_key');
          // Zustand persist에서도 제거
          const stored = localStorage.getItem('emoticon-studio-config');
          if (stored) {
            const parsed = JSON.parse(stored);
            delete parsed.state?.apiKey;
            localStorage.setItem('emoticon-studio-config', JSON.stringify(parsed));
          }
          console.log('[Migration] API Key migrated to secure storage');
        });
    }
  }, []);
}
```

### 4.3 사용자 흐름

> ⚠️ **v1.2 수정 — 시작 시 하이드레이션 상태 추가**
>
> 앱 시작 시 safeStorage에서 Key를 비동기 로드하는 동안, Zustand 기본값(`apiKey=null`)으로
> ApiKeyModal이 잠깐 표시되었다 사라지는 "플래시 현상" 방지를 위해 하이드레이션 상태를 도입합니다.

```
앱 시작
    ↓
renderer: Zustand keyHydrated = 'unknown' → 로딩 화면 또는 스플래시 표시
    ↓
renderer → IPC → main: safeStorage에서 Key 조회
    ↓
    ├─ Key 존재 → Zustand { apiKey: key, keyHydrated: 'present' } → 바로 사용 시작
    └─ Key 없음 → Zustand { apiKey: null, keyHydrated: 'absent' } → ApiKeyModal 표시
```

**하이드레이션 상태 타입**:

```typescript
// configSlice에 추가
type KeyHydrationState = 'unknown' | 'present' | 'absent';

// configSlice 초기값
keyHydrated: 'unknown' as KeyHydrationState,

// App.tsx 렌더링 조건
if (keyHydrated === 'unknown') return <SplashScreen />; // 또는 null
if (keyHydrated === 'absent') return <ApiKeyModal />;
// keyHydrated === 'present' → 정상 렌더링
```

**최초 설치 후 앱 실행** (Key 없음):

```
앱 시작 → 로딩 (keyHydrated='unknown')
    ↓
IPC 결과: null → keyHydrated='absent' → ApiKeyModal 표시
    ↓
사용자: Key 입력 → "Save" 클릭
    ↓
Zustand.setApiKeyAsync(key) → platform.setApiKey(key) → IPC → main: safeStorage 암호화 저장
    ↓
Zustand: { apiKey: key, keyHydrated: 'present' } → 앱 사용 시작
```

**다음 번 앱 실행** (Key 존재):

```
앱 시작 → 로딩 (keyHydrated='unknown')
    ↓
IPC 결과: 'AIza...' → Zustand: { apiKey: key, keyHydrated: 'present' } → 바로 사용 시작 (모달 없음)
```

---

## 5. 배포 전략 (Windows + macOS)

### 5.1 개요

| 항목                    | macOS                               | Windows                              |
| ----------------------- | ----------------------------------- | ------------------------------------ |
| **설치 파일 형식**      | DMG + ZIP                           | NSIS (.exe)                          |
| **아키텍처**            | Universal (Intel + Apple Silicon)   | x64                                  |
| **코드 서명**           | Apple Developer ID ($99/년)         | Authenticode OV 인증서 ($200~400/년) |
| **공증 (Notarization)** | Apple notarytool (필수)             | N/A                                  |
| **자동 업데이트**       | electron-updater + ZIP              | electron-updater + NSIS              |
| **배포 채널**           | GitHub Releases + DMG 직접 다운로드 | GitHub Releases + EXE 직접 다운로드  |
| **예상 파일 크기**      | DMG ~90-120MB                       | EXE ~80-100MB                        |

### 5.2 macOS 배포 상세

#### 5.2.1 코드 서명 + 공증 (권장)

macOS 10.15 (Catalina) 이후, 공증되지 않은 앱은 Gatekeeper가 실행을 **완전 차단**합니다.

**사전 요구사항**:

1. Apple Developer Program 가입 ($99/년, https://developer.apple.com/programs/)
2. "Developer ID Application" 인증서 발급 (Keychain Access → Certificate Assistant)
3. App-Specific Password 생성 (https://appleid.apple.com → Sign-In and Security)

**electron-builder.yml 설정**:

```yaml
# electron-builder.yml
appId: com.emoticonstudio.app
productName: Emoticon Studio

mac:
  category: public.app-category.graphics-design
  icon: resources/icon.icns
  target:
    - target: dmg
      arch:
        - universal # Intel + Apple Silicon 통합 바이너리
    - target: zip
      arch:
        - universal # 자동 업데이트에 ZIP 필수
  entitlementsInherit: resources/entitlements.mac.plist
  # notarize: true ← 불필요 (기본값). notarize는 "비활성화" 플래그임.
  # 공증은 환경변수로 활성화됨:
  #   APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID (또는)
  #   APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER
  identity: 'Developer ID Application: Your Name (TEAM_ID)'
  hardenedRuntime: true # 기본값 true이나 명시적 문서화 목적
  gatekeeperAssess: false

dmg:
  artifactName: ${name}-${version}-mac-universal.${ext}
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
```

**macOS 권한 파일 (entitlements)**:

```xml
<!-- resources/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
</dict>
</plist>
```

**빌드 및 배포 명령**:

```bash
# 로컬 빌드 (서명 + 공증)
CSC_LINK=~/path/to/certificate.p12 \
CSC_KEY_PASSWORD=your-password \
APPLE_ID=your@email.com \
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx \
APPLE_TEAM_ID=YOUR_TEAM_ID \
npx electron-builder --mac --universal --publish always
```

**사용자에게 전달하는 방법**:

1. GitHub Releases에 DMG 파일 업로드 (자동 또는 수동)
2. 사용자가 DMG 다운로드 → 더블클릭 → 앱을 Applications 폴더로 드래그
3. 최초 실행 시 "인터넷에서 다운로드한 앱" 경고 → "열기" 클릭 (공증 완료 시 정상)
4. 이후 자동 업데이트로 최신 버전 유지

#### 5.2.2 코드 서명 없이 배포 (개인용/무료)

개인용 도구로 본인 Mac에서만 사용하는 경우, 코드 서명 없이 배포할 수 있습니다.

**빌드**:

```bash
# 서명 없이 빌드
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac
```

**사용자(본인)가 앱을 실행하는 방법**:

> ⚠️ 서명되지 않은 앱은 Gatekeeper가 차단합니다. 아래 방법 중 하나로 우회해야 합니다.

**방법 A: 우클릭으로 열기** (가장 간단)

1. DMG에서 앱을 Applications로 복사
2. Finder에서 앱을 **우클릭** → **열기** 클릭
3. "확인되지 않은 개발자" 경고 → **열기** 클릭
4. 이후부터는 정상 실행

**방법 B: 터미널 명령** (한 번만)

```bash
# Gatekeeper 격리 속성 제거
xattr -cr /Applications/Emoticon\ Studio.app
```

**방법 C: 시스템 설정** (비권장)

```
시스템 설정 → 개인정보 및 보안 → 보안 → "다음에서 다운로드한 앱 허용" → "App Store 및 알려진 개발자"
→ 차단된 앱 실행 허용 버튼 클릭
```

**방법 D: Homebrew Cask** (개발자 친화적)

```ruby
# homebrew-cask/Casks/emoticon-studio.rb
cask "emoticon-studio" do
  version "1.0.0"
  sha256 "abc123..."
  url "https://github.com/your-org/emoticon-studio/releases/download/v#{version}/EmoticonStudio-#{version}-mac-universal.dmg"
  name "Emoticon Studio"
  homepage "https://github.com/your-org/emoticon-studio"
  app "Emoticon Studio.app"
end
```

사용자 설치:

```bash
brew install --cask emoticon-studio
# Homebrew가 자동으로 격리 속성을 제거하므로 경고 없이 실행 가능
```

### 5.3 Windows 배포 상세

#### 5.3.1 NSIS 인스톨러 (권장)

**electron-builder.yml 설정**:

```yaml
win:
  icon: resources/icon.ico
  target:
    - target: nsis
      arch:
        - x64
  publisherName: 'Emoticon Studio'

nsis:
  oneClick: false # 설치 옵션 표시
  perMachine: false # 사용자별 설치 (관리자 권한 불필요)
  allowToChangeInstallationDirectory: true # 설치 경로 변경 허용
  artifactName: ${name}-${version}-setup.${ext}
  shortcutName: Emoticon Studio
  uninstallDisplayName: Emoticon Studio
  installerIcon: resources/icon.ico
  uninstallerIcon: resources/icon.ico
  license: LICENSE
```

**빌드 명령**:

```bash
# Windows에서 빌드
npx electron-builder --win --x64 --publish always

# macOS/Linux에서 Windows 크로스 빌드 (Wine 필요)
npx electron-builder --win --x64
```

#### 5.3.2 코드 서명 (선택)

| 인증서 유형                      | 비용                       | SmartScreen 신뢰도              | 비고                         |
| -------------------------------- | -------------------------- | ------------------------------- | ---------------------------- |
| **EV (Extended Validation)**     | $350~600/년 + HSM 하드웨어 | 다운로드 횟수 누적 후 신뢰 확보 | 2024.3 이후 즉각 신뢰 제거됨 |
| **OV (Organization Validation)** | $200~400/년                | 다운로드 횟수 누적 후 신뢰 확보 | 가성비 좋음                  |
| **서명 없음**                    | 무료                       | SmartScreen 경고 표시           | 개인용 적합                  |

> **참고**: 2024년 3월부터 모든 Windows 코드 서명 인증서는 HSM(하드웨어 보안 모듈)에 저장이 필수입니다. EV 인증서도 더 이상 SmartScreen을 즉시 우회하지 않으며, OV와 동일하게 다운로드 횟수 기반 평판을 쌓아야 합니다.

**서명 없이 사용자에게 전달하는 방법**:

1. GitHub Releases에 `EmoticonStudio-x.x.x-setup.exe` 업로드
2. 사용자가 EXE 다운로드
3. **SmartScreen 경고 대응**:
   - "Windows가 PC를 보호했습니다" 메시지 표시
   - **"추가 정보"** 클릭 → **"실행"** 클릭
4. NSIS 인스톨러 진행 → 설치 완료
5. 바탕화면 및 시작 메뉴에 바로가기 생성

**서명 있는 빌드**:

```yaml
# electron-builder.yml (서명 추가)
win:
  signtoolOptions:
    sign: './scripts/sign.js' # 커스텀 서명 스크립트 (Cloud HSM 지원)
```

```javascript
// scripts/sign.js
exports.default = async function (configuration) {
  // Azure SignTool 또는 DigiCert KeyLocker 사용
  require('child_process').execSync(
    `AzureSignTool sign -kvu ${process.env.AZURE_KEY_VAULT_URI} ` +
      `-kvi ${process.env.AZURE_CLIENT_ID} ` +
      `-kvs ${process.env.AZURE_CLIENT_SECRET} ` +
      `-kvt ${process.env.AZURE_TENANT_ID} ` +
      `-kvc ${process.env.AZURE_CERT_NAME} ` +
      `-tr http://timestamp.digicert.com -td sha256 ` +
      `"${configuration.path}"`,
  );
};
```

#### 5.3.3 Chocolatey 배포 (선택)

```powershell
# tools/chocolateyInstall.ps1
$ErrorActionPreference = 'Stop'
$toolsDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
$url = 'https://github.com/your-org/emoticon-studio/releases/download/v1.0.0/EmoticonStudio-1.0.0-setup.exe'

Install-ChocolateyPackage `
  -PackageName 'emoticon-studio' `
  -FileType 'exe' `
  -SilentArgs '/S' `
  -Url64bit $url `
  -Checksum64 'SHA256_HASH_HERE' `
  -ChecksumType64 'sha256'
```

사용자 설치:

```powershell
choco install emoticon-studio
```

### 5.4 자동 업데이트

#### 구현

```typescript
// src/main/updater.ts
import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('event:updater:available', {
      version: info.version,
    });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('event:updater:downloaded');
  });

  // 앱 시작 3초 후 업데이트 확인
  setTimeout(() => autoUpdater.checkForUpdates(), 3000);

  // 이후 4시간마다 확인
  setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
}
```

#### 업데이트 배포 흐름

```
개발자: git tag v1.1.0 && git push --tags
    ↓
GitHub Actions: electron-builder --publish always
    ↓
GitHub Releases에 자동 업로드:
  - EmoticonStudio-1.1.0-mac-universal.dmg
  - EmoticonStudio-1.1.0-mac-universal.zip (자동 업데이트용)
  - EmoticonStudio-1.1.0-setup.exe
  - latest.yml / latest-mac.yml (업데이트 매니페스트)
    ↓
사용자의 앱: 백그라운드에서 latest.yml 확인 → 업데이트 알림
    ↓
사용자: "업데이트 설치" 클릭 → 앱 재시작 → 새 버전 실행
```

#### electron-builder publish 설정

```yaml
# electron-builder.yml
publish:
  provider: github
  owner: your-username
  repo: emoticon-studio
  releaseType: release
```

> **참고**: macOS 자동 업데이트는 **코드 서명이 필수**입니다. 서명되지 않은 앱은 수동 업데이트만 가능합니다.

### 5.5 CI/CD: GitHub Actions

```yaml
# .github/workflows/build-release.yml
name: Build & Release
on:
  push:
    tags: ['v*']

permissions:
  contents: write # GitHub Releases 업로드 권한

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Build & Package macOS
        run: npx electron-builder --mac --universal --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CSC_LINK: ${{ secrets.APPLE_CERTIFICATE_BASE64 }}
          CSC_KEY_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Build & Package Windows
        run: npx electron-builder --win --x64 --publish always
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # Windows 코드 서명 (선택)
          # AZURE_KEY_VAULT_URI: ${{ secrets.AZURE_KEY_VAULT_URI }}
          # AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          # AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
          # AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
          # AZURE_CERT_NAME: ${{ secrets.AZURE_CERT_NAME }}
```

### 5.6 사용자 전달 방법 요약

| 시나리오             | macOS                                               | Windows                                            |
| -------------------- | --------------------------------------------------- | -------------------------------------------------- |
| **가장 간단한 방법** | GitHub Releases에서 DMG 다운로드 → 드래그 설치      | GitHub Releases에서 EXE 다운로드 → 실행            |
| **코드 서명 있음**   | 다운로드 → 설치 → 바로 실행                         | 다운로드 → 설치 → 바로 실행                        |
| **코드 서명 없음**   | 다운로드 → 설치 → 우클릭 → 열기                     | 다운로드 → 설치 → SmartScreen "추가 정보" → "실행" |
| **패키지 매니저**    | `brew install --cask emoticon-studio`               | `choco install emoticon-studio`                    |
| **자동 업데이트**    | 앱 내 알림 → 자동 다운로드 → 재시작                 | 앱 내 알림 → 자동 다운로드 → 재시작                |
| **수동 업데이트**    | GitHub Releases에서 새 DMG 다운로드 → 덮어쓰기 설치 | GitHub Releases에서 새 EXE 다운로드 → 재설치       |

---

## 6. 단계별 구현 계획 (10 Phase)

### Phase 1: 프로젝트 스캐폴딩 (예상: 1일)

**목표**: electron-vite로 Electron 프로젝트 구조 생성, 기존 코드를 renderer로 이동

| #   | 작업                         | 산출물                                                              | 검증 기준            |
| --- | ---------------------------- | ------------------------------------------------------------------- | -------------------- |
| 1.1 | electron-vite 설치           | `package.json`에 electron, electron-vite 추가                       | `npm install` 성공   |
| 1.2 | 프로젝트 구조 재편           | `src/main/`, `src/preload/`, `src/renderer/`                        | 디렉터리 존재 확인   |
| 1.3 | 기존 소스 이동               | `src/*` → `src/renderer/src/`, `index.html` → `src/renderer/`       | 파일 이동 완료       |
| 1.4 | electron.vite.config.ts 작성 | 통합 빌드 설정                                                      | `npm run build` 성공 |
| 1.5 | tsconfig 분리                | `tsconfig.node.json` (main/preload), `tsconfig.web.json` (renderer) | 타입 체크 통과       |
| 1.6 | Main process 엔트리 작성     | `src/main/index.ts` (BrowserWindow 생성)                            | Electron 창 표시     |
| 1.7 | Preload script 기본 작성     | `src/preload/index.ts` (빈 contextBridge)                           | 에러 없음            |
| 1.8 | 앱 아이콘 준비               | `resources/icon.{icns,ico,png}`                                     | 파일 존재 확인       |

**electron.vite.config.ts**:

```typescript
import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
      },
    },
    plugins: [react(), tailwindcss()],
  },
});
```

**테스트**:

- `npm run build` 성공
- `npm run dev` 실행 시 Electron 창에 기존 앱 표시

**의존성 추가**:

```bash
# ⚠️ Electron 30+ 권장 (electron-store v8 호환성 + 최신 safeStorage 안정성)
npm install -D electron@latest electron-vite @electron-toolkit/utils
npm install electron-store@^8.2.0 electron-updater
# electron-store@^8.2.0 필수 — v11+는 ESM 전용이라 CJS main process와 비호환
```

---

### Phase 2: Electron 부팅 + 기존 앱 로드 (예상: 0.5일)

**목표**: Electron BrowserWindow에서 기존 React 앱이 정상 렌더링됨을 확인

| #   | 작업                             | 산출물                            | 검증 기준                   |
| --- | -------------------------------- | --------------------------------- | --------------------------- |
| 2.1 | Main process: BrowserWindow 생성 | `src/main/index.ts`               | 창 표시                     |
| 2.2 | 개발/프로덕션 URL 분기           | dev → localhost, prod → file://   | 양쪽 모드 동작              |
| 2.3 | 보안 설정 적용                   | contextIsolation, sandbox, CSP    | DevTools에서 CSP 확인       |
| 2.4 | 단일 인스턴스 잠금               | `app.requestSingleInstanceLock()` | 중복 실행 시 기존 창 포커스 |

**Main process 엔트리**:

```typescript
// src/main/index.ts
import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';

let mainWindow: BrowserWindow | null = null;

// 단일 인스턴스 잠금
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Emoticon Studio',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // 외부 링크는 시스템 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 개발/프로덕션 분기
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

**테스트**:

- `npm run dev` → Electron 창에서 기존 7단계 파이프라인 UI 표시
- `npm run build && npm run preview` → 프로덕션 빌드 로드 확인
- 두 번 실행 시 기존 창 포커스 (중복 인스턴스 방지)

---

### Phase 3: 기존 테스트 통과 검증 (예상: 0.5일)

**목표**: 마이그레이션 전 기존 테스트가 모두 통과하는지 확인하고, 실패 시 수정

| #   | 작업                            | 검증 기준                                     |
| --- | ------------------------------- | --------------------------------------------- |
| 3.1 | vitest 경로 업데이트            | `src/renderer/src/` 기준으로 import 경로 정리 |
| 3.2 | vitest.config.ts alias 업데이트 | `@` → `src/renderer/src`                      |
| 3.3 | `npm run test` 실행             | 기존 테스트 전체 통과                         |
| 3.4 | `npm run lint` 실행             | lint 에러 없음                                |
| 3.5 | `npm run build` 실행            | 타입 체크 + 빌드 성공                         |
| 3.6 | Main process용 vitest 설정 추가 | `vitest.config.main.ts` (Node 환경)           |

**v1.2 추가 — @google/genai SDK Electron 호환성 검증**:

| #   | 작업                                    | 검증 기준                                                       |
| --- | --------------------------------------- | --------------------------------------------------------------- |
| 3.7 | Electron dev 모드에서 Gemini API 테스트 | `npm run dev` → API Key 입력 → 간단한 generateContent 호출 성공 |
| 3.8 | sandbox:true 환경에서 SDK 동작 확인     | DevTools Console에서 에러 없이 응답 수신                        |

> SDK가 Electron sandbox에서 실패할 경우 대안:
>
> - **Option A**: main process로 Gemini 호출 이동 (IPC 오버헤드 증가)
> - **Option B**: SDK 대신 fetch로 Gemini REST API 직접 호출
> - **Option C**: sandbox:false (보안 절충 — 비권장)

**회귀 방지 기준점**: 이 시점의 테스트 결과를 기준으로, 이후 모든 Phase에서 `npm run test`를 실행하여 기존 기능이 깨지지 않았음을 확인합니다.

---

### Phase 4: IPC 기반 인프라 구축 (예상: 1일)

**목표**: Preload script + contextBridge로 타입 안전한 IPC 통신 인프라 구축

| #   | 작업                        | 산출물                                 | 검증 기준               |
| --- | --------------------------- | -------------------------------------- | ----------------------- |
| 4.1 | 공유 IPC 타입 정의          | `src/shared/ipc.ts`                    | 타입 체크 통과          |
| 4.2 | Preload script 구현         | `src/preload/index.ts`                 | `window.desktop` 정의됨 |
| 4.3 | Main IPC 핸들러 등록        | `src/main/ipc/*.ts`                    | 핸들러 등록 확인        |
| 4.4 | 플랫폼 어댑터 구현          | `src/renderer/src/platform/adapter.ts` | web/electron 분기 동작  |
| 4.5 | DesktopAPI 타입 글로벌 선언 | `src/shared/ipc.ts` global 선언        | TypeScript 자동완성     |

**테스트**:

```
tests/unit/main/ipc-handlers.test.ts
  ├── 모든 IPC 핸들러 등록 확인
  ├── 핸들러 호출 시 올바른 응답 반환
  └── 잘못된 인자 시 에러 처리

tests/unit/renderer/platform-adapter.test.ts
  ├── isElectron() → window.desktop 존재 시 true
  ├── isElectron() → window.desktop 미존재 시 false
  ├── getApiKey() → Electron 모드에서 IPC 호출
  └── getApiKey() → 웹 모드에서 localStorage 사용
```

**IPC 핸들러 테스트 패턴**:

```typescript
// tests/unit/main/ipc-handlers.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';

const handlers = new Map<string, Function>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      handlers.set(channel, handler);
    }),
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((s: string) => Buffer.from(`enc:${s}`)),
    decryptString: vi.fn((b: Buffer) => b.toString().replace('enc:', '')),
  },
  app: {
    getPath: vi.fn(() => '/tmp/test'),
    getVersion: vi.fn(() => '1.0.0'),
  },
}));

describe('IPC Handlers', () => {
  beforeEach(() => {
    handlers.clear();
    require('../../src/main/ipc/secureStore').registerSecureStoreHandlers();
  });

  it('handles secure:setApiKey → secure:getApiKey round-trip', async () => {
    const setHandler = handlers.get('secure:setApiKey')!;
    const getHandler = handlers.get('secure:getApiKey')!;

    await setHandler({}, { key: 'AIza-test-key' });
    const result = await getHandler({});
    expect(result).toBe('AIza-test-key');
  });
});
```

---

### Phase 5: API Key 보안 마이그레이션 (예상: 1일)

**목표**: API Key 저장소를 localStorage에서 Electron safeStorage로 전환

| #   | 작업                               | 산출물                                                 | 검증 기준                                                     |
| --- | ---------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| 5.1 | safeStorage 기반 저장 서비스       | `src/main/ipc/secureStore.ts`                          | 암호화/복호화 동작                                            |
| 5.2 | apiKeyManager 어댑터화             | `src/renderer/src/services/config/apiKeyManager.ts`    | platform.getApiKey() 사용                                     |
| 5.3 | Zustand partialize에서 apiKey 제거 | `src/renderer/src/store/appStore.ts`                   | apiKey가 localStorage에 저장되지 않음                         |
| 5.4 | configSlice 수정                   | `src/renderer/src/store/slices/configSlice.ts`         | IPC 기반 로드/저장                                            |
| 5.5 | 레거시 마이그레이션 훅             | `src/renderer/src/hooks/useMigrateApiKey.ts`           | localStorage → safeStorage 자동 이전                          |
| 5.6 | 앱 시작 시 Key 로드                | App.tsx에서 IPC로 Key 로드 → 인메모리 설정             | 재시작 시 Key 유지                                            |
| 5.7 | ⚠️ SSOT 검증 (v1.2)                | 코드 리뷰 — `platform.setApiKey()` 직접 호출 없음 확인 | grep 검사: 컴포넌트/훅에서 `platform.setApiKey` 직접 호출 0건 |

**테스트**:

```
tests/unit/main/secure-store.test.ts
  ├── API Key 암호화 저장
  ├── API Key 복호화 조회
  ├── API Key 삭제
  ├── safeStorage 사용 불가 시 폴백
  └── 손상된 데이터 처리 (삭제 후 null 반환)

tests/integration/api-key-migration.test.ts
  ├── localStorage에 Key 있는 상태에서 앱 시작 → safeStorage로 이전
  ├── 이전 후 localStorage에 Key 없음
  ├── safeStorage에 Key 있는 상태에서 앱 시작 → 모달 안 뜸
  ├── Key 없는 상태에서 앱 시작 → ApiKeyModal 표시
  └── Key 입력 → 저장 → 앱 재시작 → Key 유지
```

**회귀 테스트**: `npm run test` (기존 전체 테스트) 통과 확인

---

### Phase 6: 파일 내보내기 네이티브화 (예상: 1일)

**목표**: 브라우저 다운로드 패턴을 네이티브 파일 저장 대화상자로 교체

| #   | 작업                        | 산출물                        | 검증 기준                    |
| --- | --------------------------- | ----------------------------- | ---------------------------- |
| 6.1 | 파일 서비스 IPC 핸들러      | `src/main/ipc/fileService.ts` | 저장 대화상자 + fs.writeFile |
| 6.2 | App.tsx 내보내기 로직 수정  | platform.saveFile() 사용      | 네이티브 대화상자 표시       |
| 6.3 | Blob → Uint8Array 변환 유틸 | 기존 export.ts 수정           | Buffer 호환                  |
| 6.4 | 웹 모드 폴백 유지           | platform.saveFile() 분기      | 웹에서도 동작                |
| 6.5 | file-saver 의존성 제거      | package.json 수정             | `npm audit` 깨끗             |

**테스트**:

```
tests/unit/main/file-service.test.ts
  ├── showSaveDialog 호출 시 필터 전달
  ├── 사용자 취소 시 { canceled: true } 반환
  ├── saveBinary로 파일 기록
  ├── 기본 저장 경로 (Documents/EmoticonStudio/)
  ├── 디스크 용량 부족 (ENOSPC) 시 사용자 친화 에러 코드 반환
  ├── 경로 권한 거부 (EACCES) 시 재선택 안내
  └── 잘못된 경로 시 에러 처리

tests/e2e-electron/export.spec.ts (Phase 10에서 작성)
  ├── 전체 내보내기 플로우 (stubDialog 사용)
  └── 파일 실제 저장 검증
```

**회귀 테스트**: `npm run test` 통과 확인

---

### Phase 7: 데스크탑 UX 완성 (예상: 1일)

**목표**: 데스크탑 앱으로서의 기본 UX 완성 (메뉴, 윈도우 상태, 네이티브 동작)

| #   | 작업                  | 산출물                                   | 검증 기준                   |
| --- | --------------------- | ---------------------------------------- | --------------------------- |
| 7.1 | macOS 메뉴 바         | `src/main/menu.ts`                       | Cmd+C/V/X, Cmd+Q 동작       |
| 7.2 | Windows 메뉴 바       | `src/main/menu.ts`                       | Ctrl+C/V/X, Alt+F4 동작     |
| 7.3 | 윈도우 크기/위치 기억 | electron-store로 저장                    | 재시작 시 복원              |
| 7.4 | 외부 링크 처리        | 시스템 브라우저에서 열기                 | Google AI Studio 링크 등    |
| 7.5 | 앱 정보 IPC           | appGetVersion, appGetPaths               | 설정 페이지에서 버전 표시   |
| 7.6 | GPU 가속 폴백 옵션    | `app.disableHardwareAcceleration()` 토글 | Nvidia GPU 렌더링 이슈 대응 |

**macOS 메뉴 템플릿**:

```typescript
// src/main/menu.ts
import { Menu, type MenuItemConstructorOptions } from 'electron';

export function createMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: 'Emoticon Studio',
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
```

---

### Phase 8: 패키징 (예상: 1일)

**목표**: electron-builder로 macOS DMG + Windows NSIS 인스톨러 생성

| #   | 작업                      | 산출물                            | 검증 기준                  |
| --- | ------------------------- | --------------------------------- | -------------------------- |
| 8.1 | electron-builder.yml 작성 | 전체 패키징 설정                  | 설정 파일 완성             |
| 8.2 | macOS DMG 빌드            | `dist/EmoticonStudio-*-mac.dmg`   | DMG 마운트 → 앱 실행       |
| 8.3 | Windows NSIS 빌드         | `dist/EmoticonStudio-*-setup.exe` | 설치 → 앱 실행             |
| 8.4 | 설치/제거 테스트          | 수동 검증                         | 설치/실행/제거 사이클 정상 |
| 8.5 | 번들 사이즈 확인          | 로그 기록                         | DMG < 130MB, EXE < 110MB   |

**빌드 명령**:

```json
// package.json scripts 추가
{
  "scripts": {
    "dev": "electron-vite dev",
    "dev:web": "vite --config src/renderer/vite.config.ts",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package:mac": "electron-vite build && electron-builder --mac",
    "package:win": "electron-vite build && electron-builder --win",
    "package:all": "electron-vite build && electron-builder --mac --win"
  }
}
```

---

### Phase 9: 배포 인프라 (예상: 1.5일)

**목표**: 코드 서명, 공증, 자동 업데이트, CI/CD 파이프라인 구축

| #   | 작업                          | 산출물                                | 검증 기준                  |
| --- | ----------------------------- | ------------------------------------- | -------------------------- |
| 9.1 | macOS 코드 서명 설정          | entitlements + signing identity       | 서명된 DMG 생성            |
| 9.2 | macOS 공증 설정               | electron-builder notarize             | Apple 공증 통과            |
| 9.3 | Windows 코드 서명 설정 (선택) | sign.js 스크립트                      | 서명된 EXE 생성            |
| 9.4 | 자동 업데이트 통합            | `src/main/updater.ts`                 | 업데이트 감지 및 알림      |
| 9.5 | GitHub Actions 워크플로우     | `.github/workflows/build-release.yml` | tag push 시 자동 빌드/배포 |
| 9.6 | 업데이트 매니페스트 검증      | `latest.yml`, `latest-mac.yml`        | 매니페스트 생성 확인       |

---

### Phase 10: E2E 테스트 + 최종 검증 (예상: 1.5일)

**목표**: Electron 앱 전체 E2E 테스트 + 모든 기능 최종 검증

| #    | 작업                     | 산출물                               | 검증 기준                                                |
| ---- | ------------------------ | ------------------------------------ | -------------------------------------------------------- |
| 10.1 | Playwright Electron 설정 | `playwright-electron.config.ts`      | E2E 테스트 프레임워크 동작                               |
| 10.2 | API Key 플로우 E2E       | `tests/e2e-electron/api-key.spec.ts` | 입력 → 저장 → 재시작 → 유지                              |
| 10.3 | 파일 내보내기 E2E        | `tests/e2e-electron/export.spec.ts`  | 네이티브 대화상자 + 파일 저장                            |
| 10.4 | 전체 파이프라인 스모크   | `tests/e2e-electron/smoke.spec.ts`   | 7단계 UI 정상 렌더링                                     |
| 10.5 | window.emoticon 브릿지   | `tests/e2e-electron/bridge.spec.ts`  | LLM API 정상 동작 (⚠️ useEffect 타이밍 주의 — 아래 참고) |
| 10.6 | 크로스플랫폼 테스트      | macOS + Windows 수동 검증            | 양쪽 정상 동작                                           |
| 10.7 | 최종 회귀 테스트         | 전체 테스트 스위트 실행              | 모든 테스트 통과                                         |

> ⚠️ **v1.2 추가 — window.emoticon 타이밍 이슈**
>
> `useExposeApi()` 훅이 `useEffect()`에서 `window.emoticon`을 설정하므로, 첫 렌더링 직후에는
> `window.emoticon`이 아직 undefined일 수 있습니다. E2E 테스트에서는 반드시 아래와 같이 대기 후 접근:
>
> ```typescript
> await page.waitForFunction(() => typeof window.emoticon !== 'undefined');
> ```
>
> 또는 renderer entry(`src/renderer/src/main.tsx`)에서 React 앱 마운트 전에 동기적으로 등록하는 것을 권장합니다.

**Playwright Electron E2E**:

```typescript
// e2e-electron/api-key.spec.ts
import { test, expect, _electron as electron } from '@playwright/test';

test.describe('API Key Management', () => {
  test('shows modal on first launch, persists after restart', async () => {
    // 1차 실행: Key 입력
    // ⚠️ v1.2: args에 빌드된 main entry 경로를 명시 (공식 권장 패턴)
    const app = await electron.launch({ args: ['./out/main/index.js'] });
    const page = await app.firstWindow();

    // ApiKeyModal 표시 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.fill('[data-testid="api-key-input"]', 'AIza-test-key-12345');
    await page.click('[data-testid="api-key-save"]');

    // 모달 사라짐 확인
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await app.close();

    // 2차 실행: Key 유지 확인
    const app2 = await electron.launch({ args: ['./out/main/index.js'] });
    const page2 = await app2.firstWindow();

    // 모달 없이 바로 Input Stage 표시
    await expect(page2.getByRole('dialog')).not.toBeVisible();

    // renderer에서 IPC를 통해 저장된 Key 확인 (main process 직접 require 대신 API 사용)
    const storedKey = await page2.evaluate(async () => {
      return window.desktop?.secure.getApiKey();
    });
    expect(storedKey).toBe('AIza-test-key-12345');

    await app2.close();
  });
});
```

---

## 7. 테스트 전략

### 7.1 테스트 피라미드

```
              ┌────────────────────┐
              │  E2E Electron (5)  │  Playwright _electron
             ─┤                    ├─
            ┌─┤  Integration (6)   │  Vitest + RTL (렌더러)
           ─┤ │                    ├─
          ┌─┤ │                    │
         ─┤ │ │  Unit (20+)        │  Vitest (렌더러 + main)
          │ └─┤                    ├─
          └───┴────────────────────┘
```

### 7.2 Phase별 테스트 요구사항

각 Phase 완료 시 **반드시** 실행해야 하는 테스트:

| Phase    | 신규 테스트                                      | 회귀 테스트 (필수)                    |
| -------- | ------------------------------------------------ | ------------------------------------- |
| Phase 1  | 없음 (스캐폴딩)                                  | `npm run build` 성공                  |
| Phase 2  | Electron 부팅 수동 확인                          | `npm run build` 성공                  |
| Phase 3  | 없음 (기존 테스트 통과 확인)                     | **`npm run test`** (전체 기존 테스트) |
| Phase 4  | IPC 핸들러 Unit 4개 + 어댑터 Unit 4개            | `npm run test`                        |
| Phase 5  | SecureStore Unit 5개 + Migration Integration 5개 | `npm run test`                        |
| Phase 6  | FileService Unit 4개                             | `npm run test`                        |
| Phase 7  | 메뉴/윈도우 수동 확인                            | `npm run test`                        |
| Phase 8  | 설치/제거 수동 확인                              | `npm run test` + `npm run build`      |
| Phase 9  | CI 파이프라인 통과                               | `npm run test` + CI green             |
| Phase 10 | **E2E Electron 5개**                             | **전체 테스트 스위트**                |

### 7.3 회귀 테스트 상세 전략

#### 소스 코드 변경에 따른 기존 기능 검증

| 변경 영역                                     | 영향받는 기능          | 회귀 테스트 방법                                                        |
| --------------------------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| `apiKeyManager.ts` 수정                       | API Key 설정/조회/삭제 | Unit: set → get → delete 라운드트립                                     |
| Zustand `partialize` 수정                     | 앱 설정 persist        | Integration: 새로고침 후 language/platform 유지, apiKey는 persist 안 됨 |
| `App.tsx` 내보내기 수정                       | ZIP 다운로드           | Integration: Blob 생성 → 파일 쓰기 → ZIP 유효성                         |
| 파일 경로 이동 (`src/` → `src/renderer/src/`) | 전체 import 경로       | `npm run build` + `npm run test`                                        |
| Vite config 교체                              | 빌드 결과물            | `npm run build` → `dist/` 구조 확인                                     |

#### 테스트 도구별 역할

| 도구                            | 환경                    | 역할                        | 대상                                      |
| ------------------------------- | ----------------------- | --------------------------- | ----------------------------------------- |
| **Vitest** (Node 환경)          | `vitest.config.main.ts` | Main process Unit           | IPC 핸들러, safeStorage, 파일 서비스      |
| **Vitest** (jsdom 환경)         | `vitest.config.ts`      | Renderer Unit + Integration | React 컴포넌트, 훅, 스토어, 서비스        |
| **vitest-canvas-mock**          | jsdom                   | Canvas API 파이프라인 통합  | 함수 호출 시퀀스, 에러 전파               |
| **Playwright `_electron`**      | 실제 Electron           | E2E                         | API Key 영구 저장, 파일 내보내기, 전체 UI |
| **electron-playwright-helpers** | E2E 보조                | 네이티브 대화상자 스텁      | `stubDialog()` for file save dialog       |

#### 테스트 실행 스크립트

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "test:main": "vitest run --config vitest.config.main.ts",
    "test:e2e": "npx playwright test --config playwright.config.ts",
    "test:e2e:electron": "npx playwright test --config playwright-electron.config.ts",
    "test:all": "npm run test && npm run test:main && npm run test:e2e:electron",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 7.4 커버리지 목표

| 모듈                             | Lines 목표     | 비고                          |
| -------------------------------- | -------------- | ----------------------------- |
| `src/main/ipc/**`                | 90%+           | 신규 코드, 높은 커버리지 필수 |
| `src/preload/**`                 | 80%+           | 얇은 레이어, IPC 위임만       |
| `src/renderer/src/platform/**`   | 90%+           | 분기 로직, 모든 경로 테스트   |
| `src/renderer/src/services/**`   | 기존 수준 유지 | 변경된 파일만 추가 테스트     |
| `src/renderer/src/components/**` | 기존 수준 유지 | 변경 없음                     |
| `src/shared/**`                  | 100%           | 타입 정의 + 상수만            |

---

## 8. 위험 요소 및 완화 전략

### 8.1 기술적 위험 (Metis 에이전트 분석)

| #   | 위험                                                                                           | 심각도      | 발생 확률 | 완화 전략                                                            |
| --- | ---------------------------------------------------------------------------------------------- | ----------- | --------- | -------------------------------------------------------------------- |
| R1  | **API Key 평문 노출** — Electron localStorage가 파일 시스템에 평문 저장                        | ⛔ CRITICAL | 확정      | `safeStorage` 암호화 (Phase 5)                                       |
| R2  | **파일 내보내기 UX 깨짐** — anchor.click이 네이티브 대화상자 없이 동작                         | ⛔ CRITICAL | 확정      | `dialog.showSaveDialog()` via IPC (Phase 6)                          |
| R3  | **macOS Gatekeeper 차단** — 서명 없는 앱 실행 불가                                             | 🔴 HIGH     | 배포 시   | Apple Developer ID + 공증 (Phase 9)                                  |
| R4  | **Windows SmartScreen 경고** — 서명 없는 앱에 무서운 경고                                      | 🔴 HIGH     | 배포 시   | Authenticode 인증서 또는 사용자 안내                                 |
| R5  | **Zustand에 apiKey 이중 저장** — apiKeyManager + persist 모두 저장                             | 🔴 HIGH     | 확정      | partialize에서 apiKey 제거 + 단일화 (Phase 5)                        |
| R6  | **Electron 앱 크기 ~200MB** — Chromium 번들 포함                                               | 🟠 MEDIUM   | 확정      | 수용 (Electron 특성), 사용자에게 고지                                |
| R7  | **Nvidia GPU 렌더링 이슈** — Canvas 처리 시 화면 깨짐 보고 있음                                | 🟠 MEDIUM   | 낮음      | `app.disableHardwareAcceleration()` 폴백 옵션 (Phase 7)              |
| R8  | **safeStorage 불가 환경** — 일부 Linux, 오래된 OS                                              | 🟠 MEDIUM   | 낮음      | 디스크 저장 거부 + 인메모리 세션 전용 + 사용자 안내 (평문 저장 불허) |
| R9  | **코드 서명 비용** — macOS $99/년 + Windows $200~400/년                                        | 🟠 MEDIUM   | 배포 시   | 개인용: 무서명, 배포용: 인증서 구매                                  |
| R10 | **auto-update requires macOS signing** — 서명 없으면 자동 업데이트 불가                        | 🟠 MEDIUM   | 배포 시   | 수동 업데이트 또는 인증서 구매                                       |
| R11 | **electron-store v11 ESM 전용** — CJS main process에서 import 실패 (v1.2 발견)                 | ⛔ CRITICAL | Phase 1   | `electron-store@^8.2.0` 고정 (마지막 CJS 버전)                       |
| R12 | **앱 시작 시 API Key 모달 플래시** — 비동기 IPC 전 기본값 렌더링 (v1.2 발견)                   | 🔴 HIGH     | Phase 5   | keyHydrated 상태 도입, 하이드레이션 완료까지 로딩 표시               |
| R13 | **API Key 이중 소스** — platform과 Zustand 간 불일치 가능 (v1.2 발견)                          | 🔴 HIGH     | Phase 5   | Zustand를 SSOT로 정의, 비동기 액션으로 동기화                        |
| R14 | **updater 콜백 직렬화 불가** — contextBridge structured clone (v1.2 발견)                      | 🔴 HIGH     | Phase 9   | preload 내부 콜백 레지스트리 패턴 사용                               |
| R15 | **@google/genai SDK 호환성 미검증** — sandbox renderer에서 동작 불확실 (v1.2 발견)             | 🟠 MEDIUM   | Phase 3   | Phase 3에서 검증, 실패 시 main process 이동 또는 fetch 직접 호출     |
| R16 | **`notarize` 플래그 의미 오해** — 활성화가 아닌 비활성화 플래그, 오해 시 공증 누락 (v1.2 발견) | 🟠 MEDIUM   | Phase 9   | YAML에서 제거, 환경변수(APPLE_ID 등)로 공증 활성화, §5.2.1 참고      |

### 8.2 숨겨진 요구사항

Metis 분석에서 식별된, 사용자가 명시하지 않았지만 반드시 필요한 항목:

| 요구사항              | 심각도    | 반영 Phase | 이유                                    |
| --------------------- | --------- | ---------- | --------------------------------------- |
| 앱 아이콘 (icns, ico) | 🔴 HIGH   | Phase 1    | 아이콘 없으면 기본 Electron 아이콘 표시 |
| macOS 메뉴 바         | 🔴 HIGH   | Phase 7    | 메뉴 없으면 Cmd+Q/C/V 동작 안 함        |
| macOS entitlements    | 🔴 HIGH   | Phase 8    | 공증에 필수 (네트워크, 파일 접근 권한)  |
| 단일 인스턴스 잠금    | 🟠 MEDIUM | Phase 2    | 중복 실행 방지                          |
| 윈도우 상태 기억      | 🟡 LOW    | Phase 7    | 데스크탑 앱 사용자 기대치               |

### 8.3 코드 서명 비용 의사결정 가이드

| 시나리오           | 추천           | 비용        | 사용자 경험                                              |
| ------------------ | -------------- | ----------- | -------------------------------------------------------- |
| **본인만 사용**    | 서명 없이 배포 | 무료        | 최초 1회 우클릭→열기 (macOS), SmartScreen 우회 (Windows) |
| **소수 배포 (팀)** | macOS만 서명   | $99/년      | macOS 정상, Windows SmartScreen 안내                     |
| **공개 배포**      | 양쪽 서명      | $315~400/년 | 양쪽 정상 설치                                           |

---

## 9. 기술 결정 사항

### 확정된 결정

| 결정                   | 선택                                 | 근거                                                                              |
| ---------------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| **빌드 도구**          | `electron-vite` v5 (alex8088)        | 단일 통합 config, Vite 6 네이티브 지원, 5.2K GitHub stars, main/preload HMR       |
| **패키징**             | `electron-builder` v26               | electron-vite와 기본 통합, 14.4K stars, DMG/NSIS/auto-update 지원                 |
| **API Key 저장**       | Electron `safeStorage` API           | OS 수준 암호화 (macOS Keychain, Windows DPAPI), VS Code/Insomnia/Joplin 동일 패턴 |
| **인스톨러 (macOS)**   | DMG + ZIP                            | DMG: 사용자 설치, ZIP: electron-updater 자동 업데이트                             |
| **인스톨러 (Windows)** | NSIS                                 | 사용자 정의 설치 경로, per-user 설치 (관리자 불필요)                              |
| **자동 업데이트**      | `electron-updater` + GitHub Releases | electron-builder 내장, 설정 간단                                                  |
| **E2E 테스트**         | Playwright `_electron`               | Spectron 2022년 공식 폐기, Playwright가 Electron 공식 권장                        |
| **Gemini API 위치**    | 렌더러 유지                          | 22MB+ IPC 직렬화 비용 회피, 개인용 도구에 적합한 보안 수준                        |
| **window.emoticon**    | 유지                                 | LLM 자동화 및 기존 Playwright 테스트 호환성                                       |
| **file-saver**         | 제거                                 | 미사용 의존성 (코드베이스에서 import 없음)                                        |

### 신규 의존성

| 패키지                        | 유형   | 용도                                                                                                          |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `electron`                    | devDep | Electron 런타임                                                                                               |
| `electron-vite`               | devDep | Vite 기반 빌드 도구                                                                                           |
| `electron-builder`            | devDep | 크로스플랫폼 패키징                                                                                           |
| `electron-updater`            | dep    | 자동 업데이트                                                                                                 |
| `electron-store@^8.2.0`       | dep    | 설정 파일 저장 (safeStorage와 함께 사용). **v8.x 필수** — v11+는 ESM 전용이라 electron-vite CJS main과 비호환 |
| `@electron-toolkit/utils`     | dep    | Electron 유틸리티 (is.dev 등)                                                                                 |
| `electron-playwright-helpers` | devDep | E2E 네이티브 대화상자 스텁                                                                                    |

### 제거 의존성

| 패키지       | 이유                                               |
| ------------ | -------------------------------------------------- |
| `file-saver` | 미사용 (코드에서 import 없음), Electron에서 불필요 |

---

## 10. 에이전트 팀 구성 및 역할

본 계획서는 다음 **5명의 전문 에이전트 팀**이 협업하여 작성되었습니다:

| #   | Agent                       | 역할                                       | 기여 영역                                                                               |
| --- | --------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| 1   | **Metis** (요구사항 분석가) | 숨겨진 요구사항, 모호성, 위험 요소 식별    | §8 위험 요소, 숨겨진 요구사항 10건, 보안 분석, 코드 서명 비용 분석                      |
| 2   | **Oracle** (아키텍트)       | Electron 프로세스 아키텍처 + IPC 설계      | §3 아키텍처, IPC 타입 계약, 보안 모델, CSP, 플랫폼 어댑터 패턴                          |
| 3   | **Librarian** (리서처)      | Electron+Vite 최신 패턴 + 배포 전략 조사   | §5 배포 상세, electron-vite vs Forge 비교, safeStorage 구현 패턴, Playwright \_electron |
| 4   | **Explore** (코드 분석가)   | 코드베이스 전수 조사 + 마이그레이션 영향도 | §2 영향 분석 (18개 파일 스캔), 변경 필요/불필요 분류, 호환성 검증                       |
| 5   | **Momus** (검토자)          | 최종 계획서 품질 검증 + 실행 가능성 평가   | 전체 계획서 리뷰, 누락 항목 보완, 테스트 전략 검증                                      |

### 에이전트 협업 플로우

```
[병렬 Phase]
  Metis     → 위험/요구사항 분석
  Oracle    → 아키텍처 설계
  Librarian → 기술 리서치
  Explore   → 코드베이스 스캔
       ↓ (4개 결과 수합)
[통합 Phase]
  Sisyphus  → 전체 계획서 초안 작성
       ↓
  Momus     → 최종 리뷰 + 피드백
       ↓
  Sisyphus  → 최종 계획서 확정
```

---

## 부록 A: 의사결정 필요 사항

아래 사항은 구현 착수 전 확정이 필요합니다.

### 결정 1 🔴 — 코드 서명 여부

| 옵션                  | 비용        | macOS UX         | Windows UX          |
| --------------------- | ----------- | ---------------- | ------------------- |
| A. 서명 없음 (개인용) | 무료        | 우클릭→열기 필요 | SmartScreen 경고    |
| B. macOS만 서명       | $99/년      | 정상             | SmartScreen 경고    |
| C. 양쪽 서명          | $315~400/년 | 정상             | 정상 (평판 쌓은 후) |

**추천**: 개인용이면 A, 타인에게 배포하면 B 이상

### 결정 2 🟡 — 자동 업데이트 범위

| 옵션                               | 요구사항             |
| ---------------------------------- | -------------------- |
| A. 자동 업데이트 (macOS + Windows) | macOS 코드 서명 필수 |
| B. Windows만 자동 업데이트         | Windows 서명 불필요  |
| C. 수동 업데이트만                 | 서명 불필요          |

### 결정 3 🟡 — 테스트 전략 깊이

| 수준                   | 추가 소요 | 포함 내용                           |
| ---------------------- | --------- | ----------------------------------- |
| A. 기본 (계획서 포함)  | 0일       | Unit + Integration + E2E Electron   |
| B. + Visual Regression | +1일      | Canvas 이미지 처리 골든 이미지 비교 |
| C. + 성능 벤치마크     | +0.5일    | 메모리/CPU 사용량 측정              |

---

_본 계획서는 v1.2입니다. 5명의 에이전트 팀이 작성, 검토, 실현 가능성 리뷰를 완료했습니다._
_Momus v1.2 리뷰 결과: FAIL 0건, WARN 4건 (전부 반영 완료) — Executive Summary "fetch" 통일, useMigrateApiKey SSOT 적용, Phase 5.7 SSOT 검증 추가, R16 notarize 리스크 분리_

---

### v1.2 변경 이력 (실현 가능성 검토)

4명의 검증 에이전트 (Explore ×2, Librarian, Oracle)가 병렬로 계획서를 검토하여 **17건의 이슈**를 발견하고 수정했습니다.

**⛔ CRITICAL (2건)**:

1. **electron-store v11 ESM 전용**: electron-vite CJS main과 비호환 → `electron-store@^8.2.0` 고정 (§4.2, §9)
2. **`notarize: true` 의미 오류**: 활성화 플래그가 아니라 비활성화 플래그 → YAML에서 제거, 환경변수 문서화 (§5.2.1)

**🔴 HIGH (3건)**: 3. **앱 시작 시 ApiKeyModal 플래시**: 비동기 IPC 완료 전 기본값 렌더링 → `keyHydrated` 상태 도입 (§4.3) 4. **API Key 이중 소스 (split-brain)**: platform adapter↔Zustand 불일치 → Zustand를 SSOT로, 비동기 액션 패턴 (§3.2) 5. **updater 콜백 contextBridge 직렬화 불가**: structured clone은 함수 미지원 → preload 내 콜백 레지스트리 패턴 (§3.3)

**🟡 MEDIUM (8건)**: 6. configSlice.ts 설명 부정확: "localStorage 직접" → "apiKeyManager 간접 호출" (§2.1) 7. Gemini 서비스 설명 부정확: "fetch 기반" → "@google/genai SDK 기반" (§2.1, §2.2) 8. @google/genai SDK Electron renderer 호환성 미검증: Phase 3에 검증 단계 추가 (§6 Phase 3) 9. safeStorage 타이밍: app.whenReady() 이전 호출 시 실패 → 초기화 순서 명시 (§4.2) 10. CSP 확장 필요 가능성: SDK 향후 WebSocket 사용 시 → CSP 모니터링 추가 (§3.4) 11. window.emoticon 타이밍 레이스: useEffect 후 설정 → E2E waitForFunction 필수 (§6 Phase 10) 12. Playwright E2E args 비정규: `['.']` → `['./out/main/index.js']` (§6 Phase 10) 13. IPC 대용량 페이로드: Uint8Array 정상 지원, 50MB 이상 시 주의 → 크기 제한 문서화 (§3.3)

**🟢 LOW (4건)**: 14. hardenedRuntime 기본값 중복 → 명시적 문서화 목적 유지 (§5.2.1) 15. img.crossOrigin (core.ts) → data URL만 사용하므로 안전, 문서화 (§2.1) 16. FileReader/Blob/toDataURL → NO IMPACT 테이블에 추가 (§2.1) 17. file-saver 제거 → 안전, tsc 검증 권장 (기존)

---

### v1.1 변경 이력 (Momus 리뷰)

_Momus 리뷰 결과: FAIL 0건, WARN 5건 (전부 반영 완료)_

- _safeStorage 폴백 정책 통일 (평문 저장 불허, 인메모리 세션 전용)_
- _Playwright E2E 예시 정확도 개선 (main process require → window.desktop API)_
- _E2E 경로 표기 통일 (`tests/e2e-electron/*`)_
- _파일 내보내기 엣지케이스 테스트 추가 (ENOSPC, EACCES)_
- _보안 보강 (will-navigate 차단, shell.openExternal URL allowlist)_
