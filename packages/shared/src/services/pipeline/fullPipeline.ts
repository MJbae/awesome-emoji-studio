// ===================================================================
// Full Pipeline — Generation + Post-processing + Metadata
// ===================================================================

import type { UserInput, ProcessingOptions } from '@/types/domain';
import type { JobProgress } from '@/types/api';
import { getAppState } from '@/store/appStore';
import { ServiceError } from '@/utils/errors';
import { emitEvent } from '@/bridge/eventBus';
import { runGenerationPipeline } from './generationPipeline';
import { runPostProcessPipeline } from './postProcessPipeline';

const controllers = new Map<string, AbortController>();

export function getAbortController(jobId: string): AbortController | undefined {
  return controllers.get(jobId);
}

export function cancelPipeline(jobId: string): void {
  const controller = controllers.get(jobId);
  if (controller) {
    controller.abort();
    controllers.delete(jobId);
  }
}

export async function runFullPipeline(
  input: UserInput,
  processingOptions: ProcessingOptions,
  onProgress: (progress: JobProgress) => void,
  signal?: AbortSignal,
): Promise<{ jobId: string }> {
  const { createJob, updateJob, setUserInput } = getAppState();

  setUserInput(input);
  const jobId = createJob();
  updateJob(jobId, { status: 'running', currentStage: 'concept-analysis' });

  const controller = new AbortController();
  controllers.set(jobId, controller);

  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  runFullPipelineAsync(jobId, input, processingOptions, onProgress, combinedSignal).catch(
    () => {
      // Error already stored in job by individual pipelines
    },
  );

  return { jobId };
}

async function runFullPipelineAsync(
  jobId: string,
  input: UserInput,
  processingOptions: ProcessingOptions,
  onProgress: (progress: JobProgress) => void,
  signal: AbortSignal,
): Promise<void> {
  try {
    const genResult = await runGenerationPipeline(jobId, input, onProgress, signal);

    const stickerImages = genResult.stickers
      .filter((s) => s.status === 'done' && s.imageUrl)
      .map((s) => ({
        id: String(s.id),
        data: `data:image/png;base64,${s.imageUrl}`,
      }));

    if (stickerImages.length > 0) {
      await runPostProcessPipeline(jobId, stickerImages, processingOptions, onProgress, signal);
    }

    getAppState().updateJob(jobId, {
      status: 'completed',
      currentStage: null,
    });

    emitEvent('emoticon:job-complete', { jobId });
  } catch (error) {
    const isCancelled = error instanceof ServiceError && error.code === 'CANCELLED';
    const status = isCancelled ? 'cancelled' : 'failed';

    getAppState().updateJob(jobId, { status });

    emitEvent('emoticon:job-error', {
      jobId,
      error: error instanceof ServiceError
        ? { code: error.code, message: error.message, stage: error.stage }
        : { code: 'UNKNOWN', message: String(error) },
    });
  } finally {
    controllers.delete(jobId);
  }
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
