import { test, expect, openStudio, PNG } from './support/fixtures';
import JSZip from 'jszip';
import type { EmoticonAPI, JobProgress } from '../../shared/src/types/api';
import type { UserInput } from '../../shared/src/types/domain';

declare global {
  interface Window {
    emoticon?: EmoticonAPI;
    apiProgress?: JobProgress[];
    stopApiProgress?: () => void;
    apiCompleted?: string[];
    apiErrors?: string[];
    apiEarlyExports?: Promise<string[]>;
  }
}

const concept: UserInput = {
  concept: 'A cheerful bear with blue ears',
  referenceImage: null,
  language: 'Korean',
};
const unchanged = {
  isBgRemovalEnabled: false,
  isOutlineEnabled: false,
  outlineStyle: 'none' as const,
  outlineThickness: 4,
  outlineOpacity: 100,
};

async function decodeZip(base64: string) {
  return JSZip.loadAsync(Buffer.from(base64, 'base64'));
}

test('public pipeline emits progress, completes a job and exports processed images', async ({
  page,
  api,
}) => {
  api.ideaCount = 6;
  await page.clock.install();
  await openStudio(page);
  const jobId = await page.evaluate(async (input) => {
    window.apiProgress = [];
    window.apiCompleted = [];
    window.addEventListener('emoticon:job-complete', (event) =>
      window.apiCompleted!.push((event as CustomEvent).detail.jobId),
    );
    const id = await window.emoticon!.runFullPipeline(input, 'line_sticker');
    const first = window.emoticon!.subscribe(id, (progress) => window.apiProgress!.push(progress));
    const second = window.emoticon!.subscribe(id, () => {});
    second();
    window.stopApiProgress = first;
    return id;
  }, concept);
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).progress?.current, jobId))
    .toBe(3);
  await page.clock.fastForward(10_001);
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, jobId))
    .toBe('completed');
  const result = await page.evaluate(async (id) => {
    const api = window.emoticon!;
    const blob = await api.export(id, 'line_sticker', [
      {
        language: 'en',
        optionType: 'personality',
        title: 'Blue Bear',
        description: 'Friendly expressions',
        tags: ['bear'],
        evaluation: { naturalness: 5, tone: 5, searchability: 5, creativity: 5 },
        reasoning: 'Clear everyday expressions',
      },
    ]);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    window.stopApiProgress!();
    window.stopApiProgress!();
    return {
      stickers: api.getStickers(id).map((item) => item.status),
      images: api.getProcessedImages(id).length,
      metadata: api.getMetadata(id),
      progress: window.apiProgress,
      completed: window.apiCompleted,
      zip: btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')),
    };
  }, jobId);
  expect(result.stickers).toEqual(Array(6).fill('done'));
  expect(result.images).toBe(6);
  expect(result.metadata).toEqual([]);
  expect(result.progress?.some((event) => event.stage === 'post-processing')).toBe(true);
  expect(result.completed).toContain(jobId);
  const zip = await decodeZip(result.zip);
  expect(Object.keys(zip.files)).toContain('main.png');
  expect(Object.keys(zip.files)).toContain('tab.png');
  expect(JSON.parse(await zip.file('metadata.json')!.async('string'))[0].title).toBe('Blue Bear');
  const main = await zip.file('main.png')!.async('nodebuffer');
  expect([main.readUInt32BE(16), main.readUInt32BE(20)]).toEqual([240, 240]);
});

test('public API rejects missing jobs and exposes the existing unimplemented granular endpoint', async ({
  page,
  api,
}) => {
  await openStudio(page);
  expect(api.calls).toHaveLength(1);
  const result = await page.evaluate(async () => {
    const api = window.emoticon!;
    const errors: string[] = [];
    try {
      api.getJob('missing');
    } catch (error) {
      errors.push(String(error));
    }
    try {
      await api.export('missing', 'line_sticker');
    } catch (error) {
      errors.push(String(error));
    }
    try {
      await api.runStage('missing', 'concept-analysis', undefined);
    } catch (error) {
      errors.push(String(error));
    }
    api.cancelJob('missing');
    const unsubscribe = api.subscribe('missing', () => {});
    unsubscribe();
    return {
      errors,
      stickers: api.getStickers('missing'),
      images: api.getProcessedImages('missing'),
      metadata: api.getMetadata('missing'),
    };
  });
  expect(result.errors[0]).toContain('Job not found');
  expect(result.errors[1]).toContain('Job not found');
  expect(result.errors[2]).toContain('not yet implemented');
  expect(result.stickers).toEqual([]);
  expect(result.images).toEqual([]);
  expect(result.metadata).toEqual([]);
});

test('public full pipeline can be cancelled during the inter-batch delay', async ({
  page,
  api,
}) => {
  api.ideaCount = 6;
  await openStudio(page);
  const jobId = await page.evaluate(
    (input) => window.emoticon!.runFullPipeline(input, 'line_emoji'),
    concept,
  );
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).progress?.current, jobId))
    .toBe(3);
  await page.evaluate((id) => window.emoticon!.cancelJob(id), jobId);
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, jobId))
    .toBe('cancelled');
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).error?.code, jobId))
    .toBe('CANCELLED');
  await page.evaluate((id) => window.emoticon!.cancelJob(id), jobId);
  expect(api.calls.filter((call) => call.kind === 'sticker')).toHaveLength(3);
});

test('public full pipeline records provider failure and cancellation before image generation', async ({
  page,
  api,
}) => {
  await openStudio(page);
  api.failNext('analysis');
  const failedId = await page.evaluate(
    (input) => window.emoticon!.runFullPipeline(input, 'line_emoji'),
    concept,
  );
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, failedId))
    .toBe('failed');
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).error?.stage, failedId))
    .toBe('concept-analysis');
  api.delayMs = 100;
  const cancelledId = await page.evaluate(async (input) => {
    const id = await window.emoticon!.runFullPipeline(input, 'line_emoji');
    window.emoticon!.cancelJob(id);
    return id;
  }, concept);
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).error?.code, cancelledId))
    .toBe('CANCELLED');
  expect(api.calls.filter((call) => call.kind === 'character')).toHaveLength(0);
});

test('public full pipeline retains individual failures and exports unprocessed empty batches', async ({
  page,
  api,
}) => {
  await openStudio(page);
  api.ideaCount = 2;
  api.failNext('sticker', 4);
  const failedId = await page.evaluate(
    (input) => window.emoticon!.runFullPipeline(input, 'line_sticker'),
    concept,
  );
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, failedId))
    .toBe('completed');
  expect(
    await page.evaluate(
      (id) => window.emoticon!.getStickers(id).map((item) => item.status),
      failedId,
    ),
  ).toEqual(['error', 'error']);
  expect(await page.evaluate((id) => window.emoticon!.getProcessedImages(id), failedId)).toEqual(
    [],
  );
  const size = await page.evaluate(
    async (id) => (await window.emoticon!.export(id, 'line_emoji')).size,
    failedId,
  );
  expect(size).toBeGreaterThan(100);
  api.ideaCount = 0;
  const emptyId = await page.evaluate(
    (input) => window.emoticon!.runFullPipeline(input, 'line_sticker'),
    concept,
  );
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, emptyId))
    .toBe('completed');
  expect(await page.evaluate((id) => window.emoticon!.getStickers(id), emptyId)).toEqual([]);
});

for (const effect of ['none', 'white', 'black', 'enabled-none'] as const) {
  test(`public postprocess-only applies ${effect} effects and produces an export`, async ({
    page,
    api,
  }) => {
    await openStudio(page);
    const options = {
      ...unchanged,
      isBgRemovalEnabled: effect === 'white',
      isOutlineEnabled: effect !== 'none',
      outlineStyle: effect === 'white' || effect === 'black' ? effect : ('none' as const),
    };
    const jobId = await page.evaluate(
      async ({ png, options }) => {
        const id = await window.emoticon!.runPostProcessOnly(
          [
            { id: 'one', name: 'one', data: `data:image/png;base64,${png}` },
            { id: 'two', name: 'two', data: `data:image/png;base64,${png}` },
          ],
          options,
          'telegram_static',
        );
        window.apiProgress = [];
        window.stopApiProgress = window.emoticon!.subscribe(id, (event) =>
          window.apiProgress!.push(event),
        );
        return id;
      },
      { png: PNG, options },
    );
    await expect
      .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, jobId))
      .toBe('completed');
    const result = await page.evaluate(async (id) => {
      const api = window.emoticon!;
      const images = api.getProcessedImages(id);
      const blob = await api.export(id, 'telegram_static');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      api.cancelJob(id); // Completed jobs must remain terminal.
      window.stopApiProgress!();
      return {
        count: images.length,
        first: images[0]?.data,
        status: api.getJob(id).status,
        zip: btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join('')),
      };
    }, jobId);
    expect(result.count).toBe(2);
    expect(result.status).toBe('completed');
    if (effect === 'none' || effect === 'enabled-none')
      expect(result.first).toBe(`data:image/png;base64,${PNG}`);
    const zip = await decodeZip(result.zip);
    const imageName = Object.keys(zip.files).find(
      (name) => name.endsWith('.png') && name !== 'tab.png',
    )!;
    const image = await zip.file(imageName)!.async('nodebuffer');
    expect([image.readUInt32BE(16), image.readUInt32BE(20)]).toEqual([512, 512]);
    expect(api.calls.filter((call) => call.kind !== 'validate')).toHaveLength(0);
  });
}

test('public postprocess reports corrupt images and empty jobs without network generation', async ({
  page,
  api,
}) => {
  await openStudio(page);
  const failedId = await page.evaluate(
    (options) =>
      window.emoticon!.runPostProcessOnly(
        [{ id: 'broken', name: 'broken', data: 'data:image/png;base64,broken' }],
        { ...options, isBgRemovalEnabled: true },
        'line_emoji',
      ),
    unchanged,
  );
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, failedId))
    .toBe('failed');
  expect(await page.evaluate((id) => window.emoticon!.getJob(id).error?.stage, failedId)).toBe(
    'post-processing',
  );
  const emptyId = await page.evaluate(
    (options) => window.emoticon!.runPostProcessOnly([], options, 'line_emoji'),
    unchanged,
  );
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, emptyId))
    .toBe('completed');
  const error = await page.evaluate(async (id) => {
    try {
      await window.emoticon!.export(id, 'line_emoji');
      return '';
    } catch (error) {
      return String(error);
    }
  }, emptyId);
  expect(error).toContain('No main image');
  expect(api.calls.filter((call) => call.kind !== 'validate')).toHaveLength(0);
});

test('public API replaces credentials and describes a reference concept', async ({ page, api }) => {
  await openStudio(page);
  await page.evaluate(() => window.emoticon!.setApiKey('AIza-replacement-test-key'));
  expect(await page.evaluate(() => localStorage.getItem('emoticon_studio_api_key'))).toBe(
    'AIza-replacement-test-key',
  );
  const strategy = await page.evaluate((input) => window.emoticon!.describe(input), {
    ...concept,
    referenceImage: PNG,
    language: 'Japanese' as const,
  });
  expect(strategy.personaInsights).toHaveLength(3);
  expect(strategy.selectedVisualStyleIndex).toBe(0);
  expect(api.calls.filter((call) => call.kind === 'analysis')).toHaveLength(3);
});

test('public job history evicts the oldest job at its ten-job limit', async ({ page, api }) => {
  await openStudio(page);
  const result = await page.evaluate(async (options) => {
    const api = window.emoticon!;
    const jobs: string[] = [];
    for (let index = 0; index < 11; index++) {
      jobs.push(await api.runPostProcessOnly([], options, 'line_emoji'));
    }
    let oldestError = '';
    try {
      api.getJob(jobs[0]!);
    } catch (error) {
      oldestError = String(error);
    }
    return { oldestError, retained: jobs.slice(1).map((id) => api.getJob(id).status) };
  }, unchanged);
  expect(result.oldestError).toContain('Job not found');
  expect(result.retained).toEqual(Array(10).fill('completed'));
  expect(api.calls.filter((call) => call.kind !== 'validate')).toHaveLength(0);
});

test('a progress subscriber can export original stickers while postprocessing is running', async ({
  page,
  api,
}) => {
  api.ideaCount = 6;
  await page.clock.install();
  await openStudio(page);
  const jobId = await page.evaluate(async (input) => {
    const api = window.emoticon!;
    const id = await api.runFullPipeline(input, 'line_sticker');
    window.apiEarlyExports = undefined;
    window.stopApiProgress = api.subscribe(id, (progress) => {
      if (progress.stage !== 'post-processing' || window.apiEarlyExports) return;
      window.apiEarlyExports = Promise.all([
        api.export(id, 'line_emoji'),
        api.export(id, 'line_sticker', [
          {
            language: 'en',
            optionType: 'personality',
            title: 'Early Bear',
            description: 'Ready originals',
            tags: ['bear'],
            evaluation: { naturalness: 5, tone: 5, searchability: 5, creativity: 5 },
            reasoning: 'A clear name.',
          },
        ]),
      ]).then(async (blobs) =>
        Promise.all(
          blobs.map(async (blob) => {
            const bytes = new Uint8Array(await blob.arrayBuffer());
            return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
          }),
        ),
      );
    });
    return id;
  }, concept);
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).progress?.current, jobId))
    .toBe(3);
  await page.clock.fastForward(10_001);
  await expect.poll(() => page.evaluate(() => !!window.apiEarlyExports)).toBe(true);
  const originals = await page.evaluate(async () => {
    const result = await window.apiEarlyExports!;
    window.stopApiProgress!();
    return result;
  });
  const emojiZip = await decodeZip(originals[0]!);
  const stickerZip = await decodeZip(originals[1]!);
  expect(Object.keys(emojiZip.files).filter((name) => name.endsWith('.png'))).toHaveLength(7);
  expect(Object.keys(stickerZip.files).filter((name) => name.endsWith('.png'))).toHaveLength(8);
  expect(emojiZip.file('main.png')).toBeNull();
  expect(stickerZip.file('main.png')).not.toBeNull();
  const emojiName = Object.keys(emojiZip.files).find((name) => name !== 'tab.png')!;
  const stickerName = Object.keys(stickerZip.files).find(
    (name) => name !== 'tab.png' && name !== 'main.png' && name.endsWith('.png'),
  )!;
  const emoji = await emojiZip.file(emojiName)!.async('nodebuffer');
  const sticker = await stickerZip.file(stickerName)!.async('nodebuffer');
  expect([emoji.readUInt32BE(16), emoji.readUInt32BE(20)]).toEqual([180, 180]);
  expect([sticker.readUInt32BE(16), sticker.readUInt32BE(20)]).toEqual([370, 320]);
  expect(JSON.parse(await stickerZip.file('metadata.json')!.async('string'))[0].title).toBe(
    'Early Bear',
  );
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, jobId))
    .toBe('completed');
});

for (const missing of [
  { kind: 'analysis', call: 2, message: 'Art Director' },
  { kind: 'analysis', call: 3, message: 'Cultural Expert' },
  { kind: 'character', call: 1, message: 'base image' },
  { kind: 'character', call: 2, message: 'generate style' },
  { kind: 'ideas', call: 1, message: 'generate ideas' },
] as const) {
  test(`public pipeline records missing ${missing.kind} response ${missing.call}`, async ({
    page,
    api,
  }) => {
    await openStudio(page);
    api.emptyResponseShape = 'candidates';
    api.emptyAtCall(missing.kind, missing.call);
    const jobId = await page.evaluate(
      (input) => window.emoticon!.runFullPipeline(input, 'line_emoji'),
      concept,
    );
    await expect
      .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, jobId))
      .toBe('failed');
    expect(
      await page.evaluate((id) => window.emoticon!.getJob(id).error?.message, jobId),
    ).toContain(missing.message);
    expect(await page.evaluate((id) => window.emoticon!.getProcessedImages(id), jobId)).toEqual([]);
  });
}

test('a missing sticker candidate is recorded without losing successful stickers', async ({
  page,
  api,
}) => {
  await openStudio(page);
  api.ideaCount = 2;
  api.emptyResponseShape = 'candidates';
  api.emptyAtCall('sticker', 1);
  const jobId = await page.evaluate(
    (input) => window.emoticon!.runFullPipeline(input, 'line_emoji'),
    concept,
  );
  await expect
    .poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, jobId))
    .toBe('completed');
  expect(
    await page.evaluate(
      (id) => window.emoticon!.getStickers(id).map((sticker) => sticker.status),
      jobId,
    ),
  ).toEqual(['error', 'done']);
  expect(await page.evaluate((id) => window.emoticon!.getProcessedImages(id).length, jobId)).toBe(
    1,
  );
});
