import fs from 'node:fs';
import path from 'node:path';
import type {
  UserInput,
  ProcessingOptions,
  PlatformId,
  MetaResult,
  ProcessedImage,
} from '@/types/domain';
import type { JobProgress } from '@/types/api';
import { getAppState } from '../../store/cliStore.js';
import { emitEvent } from '../../bridge/eventBus.js';
import { reportProgress } from '../../io/progress.js';
import { requestConfirm } from '../../io/confirm.js';
import { printError } from '../../io/output.js';
import { runGenerationPipeline, type GenerationResult } from './generationPipeline.js';
import { runPostProcessPipeline } from './postProcessPipeline.js';
import { generateMetadata } from '../gemini/index.js';
import { exportAllPlatforms } from '../image/export.js';
import { getSessionDir } from '../../platform/adapter.js';
import { loadImageBuffer, toRawBase64 } from '../image/core.js';
import type { GenerateOptions, ConfirmAction, SessionData } from '../../types/cli.js';
import { calculateRequiredStickers } from '@/constants/platforms';

const controllers = new Map<string, AbortController>();

export function cancelPipeline(jobId: string): void {
  const controller = controllers.get(jobId);
  if (controller) {
    controller.abort();
    controllers.delete(jobId);
  }
}

export async function runCliPipeline(
  options: GenerateOptions,
): Promise<{ sessionId: string; outputDir: string; exports: Record<string, string> }> {
  const state = getAppState();
  const sessionId = crypto.randomUUID();
  const sessionDir = getSessionDir(sessionId);
  const outputDir = path.resolve(options.output);
  const startTime = Date.now();

  const input: UserInput = {
    concept: options.concept,
    language: options.language,
    referenceImage: options.referenceImage ? loadReferenceImage(options.referenceImage) : null,
  };

  const processingOptions: ProcessingOptions = {
    isBgRemovalEnabled: options.bgRemoval,
    isOutlineEnabled: options.outline !== 'none',
    outlineStyle: options.outline,
    outlineThickness: options.outlineThickness,
    outlineOpacity: options.outlineOpacity,
  };

  state.setUserInput(input);
  const jobId = state.createJob();
  state.updateJob(jobId, { status: 'running', currentStage: 'concept-analysis' });

  const controller = new AbortController();
  controllers.set(jobId, controller);
  const signal = controller.signal;

  const confirmMode = options.auto ? ('auto' as const) : ('interactive' as const);

  const onProgress = (progress: JobProgress): void => {
    emitEvent('emoticon:progress', { jobId, ...progress });
  };

  try {
    // =====================================================================
    // Phase 1: Generation (concept → character → stickers)
    // =====================================================================
    const targetCount = calculateRequiredStickers(options.platforms as PlatformId[]);
    const genResult = await runGenerationPipeline(jobId, input, onProgress, signal, targetCount);

    // Save main image to session dir
    const mainImageBuffer = loadImageBuffer(genResult.mainImage);
    fs.writeFileSync(path.join(sessionDir, 'main_character.png'), mainImageBuffer);

    // =====================================================================
    // CONFIRM 1: Key Visual
    // =====================================================================
    const visualConfirm = await requestConfirm(
      {
        checkpoint: 'key_visual',
        message: 'Key visual has been generated. Continue?',
        preview: {
          mainImage: path.join(sessionDir, 'main_character.png'),
          mainImageBase64: toRawBase64(genResult.mainImage),
          characterSpec: genResult.characterSpec,
          strategy: genResult.strategy,
        },
        options: ['approve', 'reject', 'regenerate'],
      },
      confirmMode,
    );

    if (visualConfirm.action === 'reject') {
      state.updateJob(jobId, { status: 'cancelled' });
      return { sessionId, outputDir: sessionDir, exports: {} };
    }

    if (visualConfirm.action === 'regenerate') {
      // Re-run generation (simplified: just reject for now, full regeneration is complex)
      state.updateJob(jobId, { status: 'cancelled' });
      return { sessionId, outputDir: sessionDir, exports: {} };
    }

    // Save individual stickers
    const stickersDir = path.join(sessionDir, 'stickers');
    if (!fs.existsSync(stickersDir)) fs.mkdirSync(stickersDir, { recursive: true });

    const validStickers = genResult.stickers.filter((s) => s.status === 'done' && s.imageUrl);
    for (const sticker of validStickers) {
      const buf = loadImageBuffer(sticker.imageUrl!);
      fs.writeFileSync(path.join(stickersDir, `${String(sticker.id).padStart(2, '0')}.png`), buf);
    }

    // =====================================================================
    // Phase 2: Post-processing
    // =====================================================================
    const stickerImages = validStickers.map((s) => ({
      id: String(s.id),
      data: s.imageUrl!.startsWith('data:') ? s.imageUrl! : `data:image/png;base64,${s.imageUrl}`,
    }));

    let processedImages: ProcessedImage[] = [];

    if (stickerImages.length > 0) {
      processedImages = await runPostProcessPipeline(
        jobId,
        stickerImages,
        processingOptions,
        onProgress,
        signal,
      );
    }

    // Save processed images
    const processedDir = path.join(sessionDir, 'processed');
    if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });

    for (const img of processedImages) {
      const buf = loadImageBuffer(img.data);
      fs.writeFileSync(path.join(processedDir, `${img.id}.png`), buf);
    }

    // =====================================================================
    // CONFIRM 2: Post-processing
    // =====================================================================
    const postConfirm = await requestConfirm(
      {
        checkpoint: 'post_process',
        message: `Post-processing complete. ${processedImages.length} images processed. Continue?`,
        preview: {
          processedImages: processedImages.map((img) => ({
            id: img.id,
            path: path.join(processedDir, `${img.id}.png`),
          })),
          processingOptions,
        },
        options: ['approve', 'reject', 'reprocess'],
      },
      confirmMode,
    );

    if (postConfirm.action === 'reject') {
      state.updateJob(jobId, { status: 'cancelled' });
      return { sessionId, outputDir: sessionDir, exports: {} };
    }

    // =====================================================================
    // Phase 3: Metadata generation
    // =====================================================================
    reportProgress({
      type: 'progress',
      stage: 'metadata-generation',
      status: 'started',
      message: 'Generating metadata...',
    });

    const stickerBase64Images = processedImages.slice(0, 6).map((img) => toRawBase64(img.data));

    const languages = [
      { code: 'ko' as const, label: 'Korean', flag: '🇰🇷', required: true, nativeName: '한국어' },
      { code: 'en' as const, label: 'English', flag: '🇺🇸', required: false, nativeName: 'English' },
      { code: 'ja' as const, label: 'Japanese', flag: '🇯🇵', required: false, nativeName: '日本語' },
    ];

    const languageMap: Record<string, string> = {
      Korean: 'ko',
      Japanese: 'ja',
      'Traditional Chinese': 'zh-TW',
    };
    const targetLang = (languageMap[input.language] ?? 'ko') as
      | 'ko'
      | 'en'
      | 'ja'
      | 'zh-TW'
      | 'zh-CN';

    const metadataOptions = await generateMetadata(
      stickerBase64Images,
      targetLang,
      languages,
      genResult.strategy,
      genResult.characterSpec,
    );

    reportProgress({
      type: 'progress',
      stage: 'metadata-generation',
      status: 'complete',
      message: `Generated ${metadataOptions.length} metadata options`,
    });

    // =====================================================================
    // CONFIRM 3: Metadata
    // =====================================================================
    const metaConfirm = await requestConfirm(
      {
        checkpoint: 'metadata',
        message: 'Metadata options generated. Select one to continue.',
        preview: {
          metadataOptions,
        },
        options: ['approve', 'reject', 'regenerate'],
      },
      confirmMode,
    );

    if (metaConfirm.action === 'reject') {
      state.updateJob(jobId, { status: 'cancelled' });
      return { sessionId, outputDir: sessionDir, exports: {} };
    }

    const selectedMetadata = metadataOptions[metaConfirm.selectedOption ?? 0];
    if (selectedMetadata) {
      state.setMetadata([selectedMetadata]);
    }

    // =====================================================================
    // Phase 4: Export (all platforms)
    // =====================================================================
    reportProgress({
      type: 'progress',
      stage: 'export',
      status: 'started',
      message: 'Exporting to all platforms...',
    });

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const exportResults = await exportAllPlatforms(
      processedImages,
      options.platforms,
      outputDir,
      selectedMetadata ? [selectedMetadata] : undefined,
    );

    reportProgress({
      type: 'progress',
      stage: 'export',
      status: 'complete',
      message: 'Export complete',
    });

    // Save session data
    const sessionData: SessionData = {
      id: sessionId,
      createdAt: startTime,
      updatedAt: Date.now(),
      status: 'completed',
      currentStage: null,
      input,
      strategy: genResult.strategy,
      characterSpec: genResult.characterSpec,
      mainImage: genResult.mainImage.substring(0, 100) + '...', // truncate for storage
      stickers: genResult.stickers.map((s) => ({ ...s, imageUrl: null })), // don't store full images
      processedImages: processedImages.map((p) => ({ ...p, data: '' })),
      metadata: selectedMetadata ? [selectedMetadata] : [],
      processingOptions,
      selectedMetadataIndex: metaConfirm.selectedOption ?? 0,
      outputDir,
    };

    fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(sessionData, null, 2));

    // Save metadata to output
    if (selectedMetadata) {
      fs.writeFileSync(
        path.join(outputDir, 'metadata.json'),
        JSON.stringify(selectedMetadata, null, 2),
      );
    }

    state.updateJob(jobId, { status: 'completed', currentStage: null });
    emitEvent('emoticon:job-complete', { jobId });

    return { sessionId, outputDir, exports: exportResults };
  } catch (error) {
    state.updateJob(jobId, { status: 'failed' });
    emitEvent('emoticon:job-error', { jobId, error: String(error) });
    throw error;
  } finally {
    controllers.delete(jobId);
  }
}

function loadReferenceImage(imagePath: string): string {
  const absPath = path.resolve(imagePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Reference image not found: ${absPath}`);
  }
  const buffer = fs.readFileSync(absPath);
  return buffer.toString('base64');
}
