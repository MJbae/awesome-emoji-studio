import type { ProcessedImage, ProcessingOptions } from '@/types/domain';
import type { JobProgress } from '@/types/api';
import { processImageWithBgRemoval } from '../image/backgroundRemoval.js';
import { performOutline } from '../image/outlineGeneration.js';
import { getAppState } from '../../store/cliStore.js';
import { emitEvent } from '../../bridge/eventBus.js';
import { reportProgress } from '../../io/progress.js';

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error('Pipeline cancelled');
    (err as any).code = 'CANCELLED';
    (err as any).retryable = false;
    throw err;
  }
}

export async function runPostProcessPipeline(
  jobId: string,
  images: Array<{ id: string; data: string }>,
  options: ProcessingOptions,
  onProgress: (progress: JobProgress) => void,
  signal?: AbortSignal,
): Promise<ProcessedImage[]> {
  const totalImages = images.length;
  const processed: ProcessedImage[] = [];

  reportProgress({
    type: 'progress',
    stage: 'post-processing',
    status: 'started',
    current: 0,
    total: totalImages,
    message: 'Starting post-processing...',
  });

  for (let i = 0; i < totalImages; i++) {
    checkAborted(signal);

    const image = images[i]!;

    reportProgress({
      type: 'progress',
      stage: 'post-processing',
      status: 'running',
      current: i,
      total: totalImages,
      message: `Processing image ${i + 1}/${totalImages}`,
    });

    const { updateJob } = getAppState();
    updateJob(jobId, {
      currentStage: 'post-processing',
      progress: {
        stage: 'post-processing',
        current: i,
        total: totalImages,
        message: `Processing image ${i + 1}/${totalImages}`,
      },
    });

    let resultData = image.data;

    if (options.isBgRemovalEnabled) {
      resultData = await processImageWithBgRemoval(resultData);
    }

    if (options.isOutlineEnabled && options.outlineStyle !== 'none') {
      resultData = await performOutline(
        resultData,
        options.outlineStyle,
        options.outlineThickness,
        options.outlineOpacity / 100,
      );
    }

    processed.push({
      id: image.id,
      name: `processed_${image.id}`,
      data: resultData,
    });
  }

  reportProgress({
    type: 'progress',
    stage: 'post-processing',
    status: 'complete',
    current: totalImages,
    total: totalImages,
    message: `Processed ${totalImages} images`,
  });

  getAppState().updateJob(jobId, {
    progress: {
      stage: 'post-processing',
      current: totalImages,
      total: totalImages,
      message: `Processed ${totalImages} images`,
    },
    processedImages: processed,
  });
  getAppState().setProcessedImages(processed);

  return processed;
}
