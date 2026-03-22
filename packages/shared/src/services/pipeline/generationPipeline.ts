// ===================================================================
// Generation Pipeline — Strategy -> Character -> Stickers
// ===================================================================

import type { UserInput, LLMStrategy, CharacterSpec, Sticker, EmoteIdea } from '@/types/domain';
import type { JobProgress } from '@/types/api';
import {
  analyzeConcept,
  generateBaseCharacter,
  generateVisualVariation,
  extractCharacterSpec,
  generateEmoteIdeas,
  generateSingleEmote,
} from '@/services/gemini/orchestrator';
import { VISUAL_STYLES } from '@/constants/styles';
import { CHUNK_SIZE, API_DELAY_MS } from '@/constants/platforms';
import { getAppState } from '@/store/appStore';
import { normalizeError, ServiceError } from '@/utils/errors';
import { emitEvent } from '@/bridge/eventBus';

interface GenerationResult {
  strategy: LLMStrategy;
  mainImage: string;
  characterSpec: CharacterSpec;
  stickers: Sticker[];
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new ServiceError({
      code: 'CANCELLED',
      message: 'Pipeline cancelled',
      retryable: false,
    });
  }
}

function emitProgress(
  jobId: string,
  progress: JobProgress,
  onProgress: (progress: JobProgress) => void,
): void {
  const { updateJob } = getAppState();
  updateJob(jobId, { currentStage: progress.stage, progress });
  onProgress(progress);
  emitEvent('emoticon:progress', { jobId, ...progress });
  emitEvent('emoticon:stage-change', { jobId, stage: progress.stage });
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(
          new ServiceError({
            code: 'CANCELLED',
            message: 'Pipeline cancelled',
            retryable: false,
          }),
        );
      },
      { once: true },
    );
  });
}

export async function runGenerationPipeline(
  jobId: string,
  input: UserInput,
  onProgress: (progress: JobProgress) => void,
  signal?: AbortSignal,
): Promise<GenerationResult> {
  const state = getAppState();

  try {
    // Stage 1: Concept analysis
    checkAborted(signal);
    emitProgress(
      jobId,
      {
        stage: 'concept-analysis',
        current: 0,
        total: 1,
        message: 'Analyzing concept...',
      },
      onProgress,
    );

    const strategy = await analyzeConcept(input);
    state.setStrategy(strategy);
    getAppState().updateJob(jobId, { strategy });

    emitProgress(
      jobId,
      {
        stage: 'concept-analysis',
        current: 1,
        total: 1,
        message: 'Concept analysis complete',
      },
      onProgress,
    );

    // Stage 2: Base character generation
    checkAborted(signal);
    emitProgress(
      jobId,
      {
        stage: 'character-generation',
        current: 0,
        total: 2,
        message: 'Generating base character...',
      },
      onProgress,
    );

    const baseImage = await generateBaseCharacter(input);

    // Stage 3: Visual style variation
    checkAborted(signal);
    emitProgress(
      jobId,
      {
        stage: 'style-selection',
        current: 0,
        total: 1,
        message: 'Applying visual style...',
      },
      onProgress,
    );

    const mainImage = await generateVisualVariation(
      baseImage,
      strategy.selectedVisualStyleIndex,
      input.language,
    );
    state.setMainImage(mainImage);
    getAppState().updateJob(jobId, {
      stickers: [],
      processedImages: [],
    });

    emitProgress(
      jobId,
      {
        stage: 'style-selection',
        current: 1,
        total: 1,
        message: 'Visual style applied',
      },
      onProgress,
    );

    // Stage 4: Extract character spec
    checkAborted(signal);
    emitProgress(
      jobId,
      {
        stage: 'character-generation',
        current: 1,
        total: 2,
        message: 'Extracting character specification...',
      },
      onProgress,
    );

    const characterSpec = await extractCharacterSpec(mainImage, input.concept);
    state.setCharacterSpec(characterSpec);
    getAppState().updateJob(jobId, { characterSpec });

    emitProgress(
      jobId,
      {
        stage: 'character-generation',
        current: 2,
        total: 2,
        message: 'Character specification extracted',
      },
      onProgress,
    );

    // Stage 5: Emote ideation
    checkAborted(signal);
    emitProgress(
      jobId,
      {
        stage: 'emote-ideation',
        current: 0,
        total: 1,
        message: 'Generating emote ideas...',
      },
      onProgress,
    );

    const selectedStyle = VISUAL_STYLES[strategy.selectedVisualStyleIndex];
    const emoteIdeas = await generateEmoteIdeas(
      input,
      selectedStyle?.name ?? 'Original',
      characterSpec,
      {
        salesReasoning: strategy.salesReasoning,
        culturalNotes: strategy.culturalNotes,
      },
    );

    const initialStickers: Sticker[] = emoteIdeas.map((idea) => ({
      id: idea.id,
      idea,
      imageUrl: null,
      status: 'pending' as const,
    }));
    state.setStickers(initialStickers);

    emitProgress(
      jobId,
      {
        stage: 'emote-ideation',
        current: 1,
        total: 1,
        message: `Generated ${emoteIdeas.length} emote ideas`,
      },
      onProgress,
    );

    // Stage 6: Generate sticker images in chunks
    checkAborted(signal);
    const totalStickers = emoteIdeas.length;
    let completedCount = 0;
    const stickers: Sticker[] = [...initialStickers];

    for (let chunkStart = 0; chunkStart < totalStickers; chunkStart += CHUNK_SIZE) {
      checkAborted(signal);

      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, totalStickers);
      const chunk = emoteIdeas.slice(chunkStart, chunkEnd);

      const chunkPromises = chunk.map(async (idea: EmoteIdea) => {
        const stickerIndex = stickers.findIndex((s) => s.id === idea.id);
        if (stickerIndex === -1) return;

        stickers[stickerIndex] = { ...stickers[stickerIndex]!, status: 'loading' };
        getAppState().updateSticker(idea.id, { status: 'loading' });

        try {
          const imageData = await generateSingleEmote(idea, mainImage, characterSpec);

          stickers[stickerIndex] = {
            ...stickers[stickerIndex]!,
            imageUrl: imageData,
            status: 'done',
          };
          getAppState().updateSticker(idea.id, { imageUrl: imageData, status: 'done' });

          emitEvent('emoticon:sticker-generated', {
            jobId,
            stickerId: idea.id,
            expression: idea.expression,
          });
        } catch {
          stickers[stickerIndex] = { ...stickers[stickerIndex]!, status: 'error' };
          getAppState().updateSticker(idea.id, { status: 'error' });
        }
      });

      await Promise.all(chunkPromises);
      completedCount = chunkEnd;

      emitProgress(
        jobId,
        {
          stage: 'sticker-generation',
          current: completedCount,
          total: totalStickers,
          message: `Generated ${completedCount}/${totalStickers} stickers`,
        },
        onProgress,
      );

      // Delay between chunks to avoid rate limiting (skip after last chunk)
      if (chunkEnd < totalStickers) {
        await delay(API_DELAY_MS, signal);
      }
    }

    getAppState().updateJob(jobId, { stickers });

    return { strategy, mainImage, characterSpec, stickers };
  } catch (error) {
    const normalized = normalizeError(
      error,
      getAppState().getJob(jobId)?.currentStage ?? undefined,
    );
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
