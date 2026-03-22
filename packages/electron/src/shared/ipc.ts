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
    // contextBridge는 콜백 함수를 직렬화할 수 없음.
    // preload에서 ipcRenderer.on()으로 내부 리스너를 등록하고, 콜백 레지스트리 관리.
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
  }
}
