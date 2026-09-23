import type { DesktopAPI } from '../../src/shared/ipc';

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
