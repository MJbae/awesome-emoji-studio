import type { UserInput, Sticker, EmoteIdea, CharacterSpec, LLMStrategy } from '@/types/domain';
import type { JobProgress } from '@/types/api';
import { VISUAL_STYLES } from '@/constants/styles';
import { TOTAL_STICKERS, CHUNK_SIZE, API_DELAY_MS } from '@/constants/platforms';
import {
  analyzeConcept,
  generateBaseCharacter,
  generateVisualVariation,
  extractCharacterSpec,
  generateEmoteIdeas,
  generateSingleEmote,
} from '../gemini/index.js';
import { getAppState } from '../../store/cliStore.js';
import { emitEvent } from '../../bridge/eventBus.js';
import { reportProgress } from '../../io/progress.js';

export interface GenerationResult {
  strategy: LLMStrategy;
  mainImage: string;
  characterSpec: CharacterSpec;
  stickers: Sticker[];
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error('Pipeline cancelled');
    (err as any).code = 'CANCELLED';
    (err as any).retryable = false;
    throw err;
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new Error('Pipeline cancelled'));
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
  targetCount: number = 45,
): Promise<GenerationResult> {
  const state = getAppState();

  // Stage 1: Concept analysis
  checkAborted(signal);
  reportProgress({
    type: 'progress',
    stage: 'concept-analysis',
    status: 'started',
    message: 'Analyzing concept...',
  });
  const strategy = await analyzeConcept(input);
  state.setStrategy(strategy);
  state.updateJob(jobId, { strategy });
  reportProgress({
    type: 'progress',
    stage: 'concept-analysis',
    status: 'complete',
    message: 'Concept analysis complete',
  });

  // Stage 2: Base character generation
  checkAborted(signal);
  reportProgress({
    type: 'progress',
    stage: 'character-generation',
    status: 'started',
    message: 'Generating base character...',
  });
  const baseImage = await generateBaseCharacter(input);
  reportProgress({
    type: 'progress',
    stage: 'character-generation',
    status: 'running',
    current: 1,
    total: 3,
    message: 'Base character generated',
  });

  // Stage 3: Visual style variation
  checkAborted(signal);
  reportProgress({
    type: 'progress',
    stage: 'style-selection',
    status: 'started',
    message: 'Applying visual style...',
  });
  const mainImage = await generateVisualVariation(
    baseImage,
    strategy.selectedVisualStyleIndex,
    input.language,
  );
  state.setMainImage(mainImage);
  state.updateJob(jobId, { stickers: [], processedImages: [] });
  reportProgress({
    type: 'progress',
    stage: 'style-selection',
    status: 'complete',
    message: 'Visual style applied',
  });

  // Stage 4: Extract character spec
  checkAborted(signal);
  reportProgress({
    type: 'progress',
    stage: 'character-generation',
    status: 'running',
    current: 2,
    total: 3,
    message: 'Extracting character spec...',
  });
  const characterSpec = await extractCharacterSpec(mainImage, input.concept);
  state.setCharacterSpec(characterSpec);
  state.updateJob(jobId, { characterSpec });
  reportProgress({
    type: 'progress',
    stage: 'character-generation',
    status: 'complete',
    current: 3,
    total: 3,
    message: 'Character spec extracted',
  });

  // Stage 5: Emote ideation
  checkAborted(signal);
  reportProgress({
    type: 'progress',
    stage: 'emote-ideation',
    status: 'started',
    message: 'Generating emote ideas...',
  });
  const selectedStyle = VISUAL_STYLES[strategy.selectedVisualStyleIndex];
  const emoteIdeas = await generateEmoteIdeas(
    input,
    selectedStyle?.name ?? 'Original',
    characterSpec,
    {
      salesReasoning: strategy.salesReasoning,
      culturalNotes: strategy.culturalNotes,
    },
    targetCount,
  );
  const initialStickers: Sticker[] = emoteIdeas.map((idea) => ({
    id: idea.id,
    idea,
    imageUrl: null,
    status: 'pending' as const,
  }));
  state.setStickers(initialStickers);
  reportProgress({
    type: 'progress',
    stage: 'emote-ideation',
    status: 'complete',
    message: `Generated ${emoteIdeas.length} emote ideas`,
  });

  // Stage 6: Generate sticker images in chunks
  checkAborted(signal);
  const totalStickers = emoteIdeas.length;
  let completedCount = 0;
  const stickers: Sticker[] = [...initialStickers];

  reportProgress({
    type: 'progress',
    stage: 'sticker-generation',
    status: 'started',
    current: 0,
    total: totalStickers,
    message: 'Generating stickers...',
  });

  for (let chunkStart = 0; chunkStart < totalStickers; chunkStart += CHUNK_SIZE) {
    checkAborted(signal);
    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, totalStickers);
    const chunk = emoteIdeas.slice(chunkStart, chunkEnd);

    const chunkPromises = chunk.map(async (idea: EmoteIdea) => {
      const stickerIndex = stickers.findIndex((s) => s.id === idea.id);
      if (stickerIndex === -1) return;

      stickers[stickerIndex] = { ...stickers[stickerIndex]!, status: 'loading' };
      state.updateSticker(idea.id, { status: 'loading' });

      try {
        const imageData = await generateSingleEmote(idea, mainImage, characterSpec);

        stickers[stickerIndex] = {
          ...stickers[stickerIndex]!,
          imageUrl: imageData,
          status: 'done',
        };
        state.updateSticker(idea.id, { imageUrl: imageData, status: 'done' });

        emitEvent('emoticon:sticker-generated', {
          jobId,
          stickerId: idea.id,
          expression: idea.expression,
        });
      } catch {
        stickers[stickerIndex] = { ...stickers[stickerIndex]!, status: 'error' };
        state.updateSticker(idea.id, { status: 'error' });
      }
    });

    await Promise.all(chunkPromises);
    completedCount = chunkEnd;

    reportProgress({
      type: 'progress',
      stage: 'sticker-generation',
      status: completedCount >= totalStickers ? 'complete' : 'running',
      current: completedCount,
      total: totalStickers,
      message: `Generated ${completedCount}/${totalStickers} stickers`,
    });

    if (chunkEnd < totalStickers) {
      await delay(API_DELAY_MS, signal);
    }
  }

  state.updateJob(jobId, { stickers });

  return { strategy, mainImage, characterSpec, stickers };
}
