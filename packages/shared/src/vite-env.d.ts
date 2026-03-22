/// <reference types="vite/client" />

export {};

type DesktopAPI = {
  secure: {
    getApiKey(): Promise<string | null>;
    setApiKey(req: { key: string }): Promise<void>;
    deleteApiKey(): Promise<void>;
  };
  file: {
    showSaveDialog(req: {
      defaultPath?: string;
      filters?: Array<{ name: string; extensions: string[] }>;
    }): Promise<{ canceled: boolean; path: string | null }>;
    saveBinary(req: {
      data: Uint8Array;
      defaultName: string;
      defaultDirectory?: string;
      mimeType?: string;
    }): Promise<{ canceled: boolean; path: string | null }>;
    showOpenDialog(): Promise<{ canceled: boolean; paths: string[] }>;
    readBinary(path: string): Promise<Uint8Array>;
  };
  app: {
    getVersion(): Promise<string>;
    getPaths(): Promise<{ documents: string; userData: string }>;
  };
  updater: {
    check(): Promise<{
      available: boolean;
      version?: string;
      notes?: string;
    }>;
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
