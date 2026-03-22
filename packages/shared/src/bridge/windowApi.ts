// ===================================================================
// Window API — window.emoticon implementation for LLM agents
// ===================================================================

import type { EmoticonAPI } from '@/types/api';
import type { JobProgress } from '@/types/api';
import type { JobSnapshot } from '@/types/jobs';
import type {
  UserInput,
  ProcessedImage,
  ProcessingOptions,
  PlatformId,
  MetaResult,
  Sticker,
} from '@/types/domain';
import { getAppState } from '@/store/appStore';
import { analyzeConcept } from '@/services/gemini/orchestrator';
import { runFullPipeline, cancelPipeline } from '@/services/pipeline/fullPipeline';
import { runPostProcessPipeline } from '@/services/pipeline/postProcessPipeline';
import { generateStickerZip, generatePostProcessedZip } from '@/services/image/export';
import { onEvent } from './eventBus';

declare global {
  interface Window {
    emoticon?: EmoticonAPI;
  }
}

const jobSubscribers = new Map<string, Set<(progress: JobProgress) => void>>();

export function createEmoticonAPI(): EmoticonAPI {
  const api: EmoticonAPI = {
    async setApiKey(key: string): Promise<void> {
      await getAppState().setApiKeyAsync(key);
    },

    async describe(input: UserInput) {
      return analyzeConcept(input);
    },

    async runFullPipeline(input: UserInput, platform: PlatformId): Promise<string> {
      getAppState().setDefaultPlatform(platform);

      const defaultProcessingOptions: ProcessingOptions = {
        isBgRemovalEnabled: true,
        isOutlineEnabled: false,
        outlineStyle: 'none',
        outlineThickness: 4,
        outlineOpacity: 100,
      };

      const progressHandler = (progress: JobProgress) => {
        const listeners = [...jobSubscribers.values()].flatMap((set) => [...set]);
        for (const listener of listeners) {
          listener(progress);
        }
      };

      const { jobId } = await runFullPipeline(input, defaultProcessingOptions, progressHandler);

      return jobId;
    },

    async runPostProcessOnly(
      images: ProcessedImage[],
      options: ProcessingOptions,
      _platform: PlatformId, // eslint-disable-line @typescript-eslint/no-unused-vars
    ): Promise<string> {
      const { createJob, updateJob, setMode } = getAppState();
      setMode('postprocess-only');

      const jobId = createJob();
      updateJob(jobId, { status: 'running', currentStage: 'post-processing' });

      const imageInputs = images.map((img) => ({
        id: img.id,
        data: img.data,
      }));

      const progressHandler = (progress: JobProgress) => {
        const listeners = jobSubscribers.get(jobId);
        if (listeners) {
          for (const listener of listeners) {
            listener(progress);
          }
        }
      };

      runPostProcessPipeline(jobId, imageInputs, options, progressHandler).then(
        () => {
          getAppState().updateJob(jobId, { status: 'completed', currentStage: null });
        },
        () => {
          getAppState().updateJob(jobId, { status: 'failed' });
        },
      );

      return jobId;
    },

    async runStage(): Promise<void> {
      throw new Error('runStage: granular stage execution not yet implemented');
    },

    getJob(jobId: string): JobSnapshot {
      const job = getAppState().getJob(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }
      return { ...job };
    },

    subscribe(jobId: string, listener: (progress: JobProgress) => void): () => void {
      if (!jobSubscribers.has(jobId)) {
        jobSubscribers.set(jobId, new Set());
      }
      jobSubscribers.get(jobId)!.add(listener);

      const unsubEventBus = onEvent('emoticon:progress', (e: CustomEvent) => {
        const detail = e.detail as { jobId: string } & JobProgress;
        if (detail.jobId === jobId) {
          listener({
            stage: detail.stage,
            current: detail.current,
            total: detail.total,
            message: detail.message,
          });
        }
      });

      return () => {
        jobSubscribers.get(jobId)?.delete(listener);
        if (jobSubscribers.get(jobId)?.size === 0) {
          jobSubscribers.delete(jobId);
        }
        unsubEventBus();
      };
    },

    cancelJob(jobId: string): void {
      cancelPipeline(jobId);
      getAppState().cancelJob(jobId);
    },

    getStickers(jobId: string): Sticker[] {
      const job = getAppState().getJob(jobId);
      return job?.stickers ?? [];
    },

    getProcessedImages(jobId: string): ProcessedImage[] {
      const job = getAppState().getJob(jobId);
      return job?.processedImages ?? [];
    },

    getMetadata(jobId: string): MetaResult[] {
      const job = getAppState().getJob(jobId);
      return job?.metadata ?? [];
    },

    async export(jobId: string, platform: PlatformId, metadata?: MetaResult[]): Promise<Blob> {
      const job = getAppState().getJob(jobId);
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      if (job.processedImages.length > 0) {
        return generatePostProcessedZip(job.processedImages, platform, metadata);
      }

      const mainImage = getAppState().mainImage;
      if (!mainImage) {
        throw new Error('No main image available for export');
      }

      return generateStickerZip(job.stickers, platform, mainImage, metadata);
    },
  };

  return api;
}

export function mountWindowApi(): void {
  window.emoticon = createEmoticonAPI();
}

export function unmountWindowApi(): void {
  delete window.emoticon;
}
