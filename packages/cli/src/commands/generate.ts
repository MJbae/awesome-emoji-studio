import type { PlatformId } from '@/types/domain';
import { platform } from '../platform/adapter.js';
import { setApiKey, validateApiKey } from '../services/gemini/index.js';
import { runCliPipeline } from '../services/pipeline/fullPipeline.js';
import { printBanner, printResult, printError, isJsonMode, emitJson } from '../io/output.js';
import { stopSpinner } from '../io/progress.js';
import type { GenerateOptions, ResultEvent } from '../types/cli.js';
import { calculateRequiredStickers } from '@/constants/platforms';

const ALL_PLATFORMS: PlatformId[] = ['ogq_sticker', 'line_sticker', 'line_emoji', 'kakaotalk_emoticon', 'kakaotalk_mini'];

export async function generate(opts: {
  concept: string;
  language: string;
  referenceImage?: string;
  apiKey?: string;
  platforms: string;
  bgRemoval: boolean;
  outline: string;
  outlineThickness: string;
  outlineOpacity: string;
  auto: boolean;
  json: boolean;
  output: string;
  verbose: boolean;
}): Promise<void> {
  printBanner();

  // Resolve API key
  const apiKey = opts.apiKey ?? (await platform.getApiKey());
  if (!apiKey) {
    const err = {
      type: 'error' as const,
      code: 'VALIDATION',
      message: 'No API key configured. Use --api-key or run: emoji-cli config set-key <key>',
      retryable: false,
    };
    printError(err);
    process.exit(1);
  }

  if (!validateApiKey(apiKey)) {
    const err = {
      type: 'error' as const,
      code: 'VALIDATION',
      message: 'Invalid API key format.',
      retryable: false,
    };
    printError(err);
    process.exit(1);
  }

  // Set API key in memory for Gemini client
  setApiKey(apiKey);

  // Parse platforms
  const platforms: PlatformId[] =
    opts.platforms === 'all'
      ? ALL_PLATFORMS
      : (opts.platforms
        .split(',')
        .filter((p) => ALL_PLATFORMS.includes(p as PlatformId)) as PlatformId[]);

  if (platforms.length === 0) {
    printError({
      type: 'error',
      code: 'VALIDATION',
      message: `Invalid platforms. Available: ${ALL_PLATFORMS.join(', ')}`,
      retryable: false,
    });
    process.exit(1);
  }

  // Parse language
  const languageMap: Record<string, 'Korean' | 'Japanese' | 'Traditional Chinese'> = {
    ko: 'Korean',
    ja: 'Japanese',
    'zh-TW': 'Traditional Chinese',
    korean: 'Korean',
    japanese: 'Japanese',
  };
  const language = languageMap[opts.language] ?? 'Korean';

  const generateOptions: GenerateOptions = {
    concept: opts.concept,
    language,
    referenceImage: opts.referenceImage ?? null,
    apiKey,
    platforms,
    bgRemoval: opts.bgRemoval,
    outline: opts.outline as 'none' | 'white' | 'black',
    outlineThickness: parseInt(opts.outlineThickness, 10) || 3,
    outlineOpacity: parseInt(opts.outlineOpacity, 10) || 100,
    auto: opts.auto,
    json: opts.json,
    output: opts.output,
    verbose: opts.verbose,
  };

  const startTime = Date.now();

  try {
    const result = await runCliPipeline(generateOptions);

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const elapsedStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    const resultEvent: ResultEvent = {
      type: 'result',
      success: true,
      session_id: result.sessionId,
      output_dir: result.outputDir,
      exports: result.exports as Record<PlatformId, string>,
      sticker_count:
        Object.keys(result.exports).length > 0
          ? calculateRequiredStickers(platforms)
          : 0,
      elapsed_time: elapsedStr,
    };

    printResult(resultEvent);
  } catch (error) {
    stopSpinner();
    const message = error instanceof Error ? error.message : String(error);
    printError({
      type: 'error',
      code: 'UNKNOWN',
      message,
      retryable: false,
    });
    process.exit(1);
  }
}
