// ===================================================================
// Post-Process Pipeline — Background removal + outline generation
// ===================================================================

import type { ProcessedImage, ProcessingOptions } from '@/types/domain';
import type { JobProgress } from '@/types/api';
import { processImageWithBgRemoval } from '@/services/image/backgroundRemoval';
import { performOutline } from '@/services/image/outlineGeneration';
import { getAppState } from '@/store/appStore';
import { normalizeError, ServiceError } from '@/utils/errors';
import { emitEvent } from '@/bridge/eventBus';

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new ServiceError({
      code: 'CANCELLED',
      message: 'Pipeline cancelled',
      retryable: false,
    });
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

  try {
    for (let i = 0; i < totalImages; i++) {
      checkAborted(signal);

      const image = images[i]!;
      const progress: JobProgress = {
        stage: 'post-processing',
        current: i,
        total: totalImages,
        message: `Processing image ${i + 1}/${totalImages}`,
      };

      const { updateJob } = getAppState();
      updateJob(jobId, { currentStage: 'post-processing', progress });
      onProgress(progress);
      emitEvent('emoticon:progress', { jobId, ...progress });

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

    const finalProgress: JobProgress = {
      stage: 'post-processing',
      current: totalImages,
      total: totalImages,
      message: `Processed ${totalImages} images`,
    };
    onProgress(finalProgress);
    getAppState().updateJob(jobId, { progress: finalProgress, processedImages: processed });
    getAppState().setProcessedImages(processed);

    return processed;
  } catch (error) {
    const normalized = normalizeError(error, 'post-processing');
    getAppState().updateJob(jobId, {
      error: {
        code: normalized.code,
        message: normalized.message,
        stage: normalized.stage,
        retryable: normalized.retryable,
        details: normalized.details,
      },
    });
    throw normalized;
  }
}
