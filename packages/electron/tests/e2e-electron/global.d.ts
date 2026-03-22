export {};

interface DesktopSecure {
  getApiKey(): Promise<string | null>;
  setApiKey(req: { key: string }): Promise<void>;
  deleteApiKey(): Promise<void>;
}

interface DesktopApp {
  getVersion(): Promise<string>;
  getPaths(): Promise<{ documents: string; userData: string }>;
}

interface DesktopAPI {
  secure: DesktopSecure;
  file: Record<string, (...args: unknown[]) => Promise<unknown>>;
  app: DesktopApp;
  updater: Record<string, (...args: unknown[]) => unknown>;
  shell: Record<string, (...args: unknown[]) => Promise<unknown>>;
}

interface EmoticonAPI {
  setApiKey(key: string): Promise<void>;
  getJob(jobId: string): unknown;
  subscribe(jobId: string, listener: (progress: unknown) => void): () => void;
  runFullPipeline(input: unknown, platform: string): Promise<string>;
  export(jobId: string, platform: string, metadata?: unknown[]): Promise<Blob>;
  describe(input: unknown): Promise<unknown>;
  runPostProcessOnly(images: unknown[], options: unknown, platform: string): Promise<string>;
  runStage(jobId: string, stage: string, payload: unknown): Promise<void>;
  cancelJob(jobId: string): void;
  getStickers(jobId: string): unknown[];
  getProcessedImages(jobId: string): unknown[];
  getMetadata(jobId: string): unknown[];
}

declare global {
  interface Window {
    desktop?: DesktopAPI;
    emoticon?: EmoticonAPI;
  }
}
