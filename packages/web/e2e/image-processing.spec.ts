import type { Page } from '@playwright/test';
import JSZip from 'jszip';
import { test, expect, openStudio } from './support/fixtures';
import type { EmoticonAPI } from '../../shared/src/types/api';
import type { PlatformId, ProcessedImage, ProcessingOptions } from '../../shared/src/types/domain';

declare global {
  interface Window { emoticon?: EmoticonAPI }
}

const unchanged: ProcessingOptions = {
  isBgRemovalEnabled: false, isOutlineEnabled: false, outlineStyle: 'none',
  outlineThickness: 4, outlineOpacity: 100,
};

type Pattern = 'matte' | 'transparent' | 'solid' | 'wide' | 'tall';

// Use exact RGBA fixtures so tests verify the resulting pixels as well as job completion.
async function makeImage(page: Page, pattern: Pattern, width = 32, height = 24) {
  return page.evaluate(({ pattern, width, height }) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const image = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let rgba = [240, 240, 240, 255];
        if (pattern === 'wide') rgba = [20, 160, 200, 255];
        if (pattern === 'tall') rgba = [230, 100, 30, 255];
        if (pattern === 'transparent') {
          rgba = x >= width / 3 && x < 2 * width / 3 && y >= height / 3 && y < 2 * height / 3
            ? [20, 80, 160, 255] : [0, 0, 0, 0];
        }
        if (pattern === 'matte') {
          if (x >= 8 && x < 24 && y >= 6 && y < 18) rgba = [20, 80, 160, 255];
          if (x === 15 && y === 12) rgba = [120, 160, 200, 128]; // Color fringe.
          if (x === 16 && y === 12) rgba = [100, 100, 100, 10]; // Faint background residue.
          if (x === 16 && y === 10) rgba = [240, 240, 240, 255]; // Enclosed detail matching the background.
          if (x === 0 && y === 0) rgba = [0, 0, 0, 0];
          if (x === width - 1 && y === 0) rgba = [230, 230, 230, 255];
        }
        image.data.set(rgba, (y * width + x) * 4);
      }
    }
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  }, { pattern, width, height });
}

async function inspectImage(page: Page, src: string, points: Array<[number, number]>) {
  return page.evaluate(async ({ src, points }) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    let nontransparent = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] !== 0) nontransparent++;
    return {
      width: image.width, height: image.height, nontransparent,
      pixels: points.map(([x, y]) => Array.from(pixels.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 4))),
    };
  }, { src, points });
}

async function processImages(page: Page, images: ProcessedImage[], options: ProcessingOptions) {
  const jobId = await page.evaluate(({ images, options }) =>
    window.emoticon!.runPostProcessOnly(images, options, 'line_sticker'), { images, options });
  await expect.poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, jobId)).toBe('completed');
  const output = await page.evaluate((id) => ({
    images: window.emoticon!.getProcessedImages(id), progress: window.emoticon!.getJob(id).progress,
  }), jobId);
  expect(output.images.map(({ id }) => id)).toEqual(images.map(({ id }) => id));
  expect(output.progress).toMatchObject({ current: images.length, total: images.length });
  return { jobId, images: output.images };
}

function input(data: string, id = 'sample'): ProcessedImage { return { id, name: id, data }; }

test('background removal preserves enclosed details, removes faint residue, and corrects color fringes', async ({ page, api }) => {
  await openStudio(page);
  const source = await makeImage(page, 'matte');
  const { images } = await processImages(page, [input(source)], { ...unchanged, isBgRemovalEnabled: true });
  const result = await inspectImage(page, images[0]!.data, [[2, 2], [12, 12], [16, 10], [16, 12], [15, 12]]);
  expect([result.width, result.height]).toEqual([32, 24]);
  expect(result.pixels[0]![3]).toBe(0);
  expect(result.pixels[1]).toEqual([20, 80, 160, 255]);
  expect(result.pixels[2]).toEqual([240, 240, 240, 255]);
  expect(result.pixels[3]![3]).toBe(0);
  const corrected = result.pixels[4]!;
  expect(corrected[3]).toBe(128);
  expect(corrected[0]).toBeLessThan(8);
  expect(corrected[1]).toBeGreaterThanOrEqual(77);
  expect(corrected[1]).toBeLessThanOrEqual(84);
  expect(corrected[2]).toBeGreaterThanOrEqual(156);
  expect(corrected[2]).toBeLessThanOrEqual(164);
  expect(api.calls.filter(({ kind }) => kind !== 'validate')).toHaveLength(0);
});

test('already transparent borders preserve artwork while solid backgrounds become transparent', async ({ page, api }) => {
  await openStudio(page);
  const transparent = await makeImage(page, 'transparent', 12, 12);
  const solid = await makeImage(page, 'solid', 8, 8);
  const tiny = await makeImage(page, 'solid', 1, 1);
  const { images } = await processImages(page,
    [input(transparent, 'transparent'), input(solid, 'solid'), input(tiny, 'tiny')],
    { ...unchanged, isBgRemovalEnabled: true });
  const preserved = await inspectImage(page, images[0]!.data, [[0, 0], [6, 6]]);
  expect(preserved.nontransparent).toBe(16);
  expect(preserved.pixels).toEqual([[0, 0, 0, 0], [20, 80, 160, 255]]);
  expect((await inspectImage(page, images[1]!.data, [])).nontransparent).toBe(0);
  const smallest = await inspectImage(page, images[2]!.data, []);
  expect([smallest.width, smallest.height, smallest.nontransparent]).toEqual([1, 1, 0]);
  expect(api.calls.filter(({ kind }) => kind !== 'validate')).toHaveLength(0);
});

test('zero outline thickness retains geometry and zero opacity adds only transparent padding', async ({ page, api }) => {
  await openStudio(page);
  const source = await makeImage(page, 'transparent', 12, 12);
  const noThickness = await processImages(page, [input(source)], {
    ...unchanged, isOutlineEnabled: true, outlineStyle: 'white', outlineThickness: 0,
  });
  const zero = await inspectImage(page, noThickness.images[0]!.data, [[0, 0], [6, 6]]);
  expect([zero.width, zero.height, zero.nontransparent]).toEqual([12, 12, 16]);
  expect(zero.pixels).toEqual([[0, 0, 0, 0], [20, 80, 160, 255]]);
  const noOpacity = await processImages(page, [input(source)], {
    ...unchanged, isOutlineEnabled: true, outlineStyle: 'black', outlineThickness: 3, outlineOpacity: 0,
  });
  const padded = await inspectImage(page, noOpacity.images[0]!.data, [[5, 8], [9, 9]]);
  expect([padded.width, padded.height, padded.nontransparent]).toEqual([18, 18, 16]);
  expect(padded.pixels).toEqual([[0, 0, 0, 0], [20, 80, 160, 255]]);
  expect(api.calls.filter(({ kind }) => kind !== 'validate')).toHaveLength(0);
});

for (const color of ['white', 'black'] as const) {
  test(`a partially opaque ${color} outline preserves the source and renders the chosen ring color`, async ({ page, api }) => {
    await openStudio(page);
    const source = await makeImage(page, 'transparent', 12, 12);
    const { images } = await processImages(page, [input(source)], {
      ...unchanged, isOutlineEnabled: true, outlineStyle: color, outlineThickness: 3, outlineOpacity: 50,
    });
    const result = await inspectImage(page, images[0]!.data, [[0, 0], [5, 8], [9, 9]]);
    expect([result.width, result.height]).toEqual([18, 18]);
    expect(result.pixels[0]).toEqual([0, 0, 0, 0]);
    expect(result.pixels[1]!.slice(0, 3)).toEqual(color === 'white' ? [255, 255, 255] : [0, 0, 0]);
    expect(result.pixels[1]![3]).toBeGreaterThanOrEqual(126);
    expect(result.pixels[1]![3]).toBeLessThanOrEqual(128);
    expect(result.pixels[2]).toEqual([20, 80, 160, 255]);
    expect(result.nontransparent).toBeGreaterThan(16);
    expect(api.calls.filter(({ kind }) => kind !== 'validate')).toHaveLength(0);
  });
}

test('all public platform exports preserve portrait and landscape proportions, transparent margins, and ordering', async ({ page, api }) => {
  await openStudio(page);
  const wide = await makeImage(page, 'wide', 120, 40);
  const tall = await makeImage(page, 'tall', 40, 120);
  const sourceImages = Array.from({ length: 6 }, (_, index) => input(index % 2 ? tall : wide, `art-${index}`));
  const { jobId, images } = await processImages(page, sourceImages, unchanged);
  expect(images.map(({ data }) => data)).toEqual(sourceImages.map(({ data }) => data));
  const platforms: Array<{ id: PlatformId; content: [number, number]; tab: [number, number]; main: boolean; digits: number }> = [
    { id: 'ogq_sticker', content: [740, 640], tab: [96, 74], main: true, digits: 2 },
    { id: 'line_sticker', content: [370, 320], tab: [96, 74], main: true, digits: 2 },
    { id: 'line_emoji', content: [180, 180], tab: [96, 74], main: false, digits: 3 },
    { id: 'kakaotalk_emoticon', content: [360, 360], tab: [78, 78], main: false, digits: 2 },
    { id: 'kakaotalk_mini', content: [180, 180], tab: [96, 74], main: false, digits: 2 },
    { id: 'telegram_static', content: [512, 512], tab: [100, 100], main: false, digits: 3 },
  ];
  for (const platform of platforms) {
    const base64 = await page.evaluate(async ({ jobId, platform }) => {
      const blob = await window.emoticon!.export(jobId, platform, []);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
    }, { jobId, platform: platform.id });
    const zip = await JSZip.loadAsync(Buffer.from(base64, 'base64'));
    const stickerNames = Array.from({ length: 6 }, (_, index) => `${String(index + 1).padStart(platform.digits, '0')}.png`);
    expect(Object.keys(zip.files).sort()).toEqual([...stickerNames, 'tab.png', ...(platform.main ? ['main.png'] : [])].sort());
    for (const name of [...stickerNames, 'tab.png', ...(platform.main ? ['main.png'] : [])]) {
      const bytes = await zip.file(name)!.async('nodebuffer');
      const dimensions = name === 'tab.png' ? platform.tab : name === 'main.png' ? [240, 240] : platform.content;
      expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual(dimensions);
    }
    for (const [index, color] of [[0, [20, 160, 200, 255]], [1, [230, 100, 30, 255]]] as const) {
      const bytes = await zip.file(stickerNames[index]!)!.async('base64');
      const [width, height] = platform.content;
      const result = await inspectImage(page, `data:image/png;base64,${bytes}`,
        [[0, 0], [Math.floor(width / 2), Math.floor(height / 2)], index === 0 ? [Math.floor(width / 2), 0] : [0, Math.floor(height / 2)]]);
      expect(result.pixels[0]![3]).toBe(0);
      expect(result.pixels[1]).toEqual(color);
      expect(result.pixels[2]![3]).toBe(0);
      const expectedArea = index === 0 ? width * width / 3 : height * height / 3;
      expect(result.nontransparent).toBeGreaterThan(expectedArea * 0.98);
      expect(result.nontransparent).toBeLessThan(expectedArea * 1.03);
    }
  }
  expect(api.calls.filter(({ kind }) => kind !== 'validate')).toHaveLength(0);
});

test('unsupported runtime outline options fail the public job without publishing incomplete images', async ({ page, api }) => {
  await openStudio(page);
  const source = await makeImage(page, 'transparent', 12, 12);
  const jobId = await page.evaluate(({ source, options }) => window.emoticon!.runPostProcessOnly(
    [{ id: 'unsupported', name: 'unsupported', data: source }],
    { ...options, isOutlineEnabled: true, outlineStyle: 'unsupported-runtime-style' as ProcessingOptions['outlineStyle'] },
    'line_sticker',
  ), { source, options: unchanged });
  await expect.poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, jobId)).toBe('failed');
  const result = await page.evaluate((id) => ({ error: window.emoticon!.getJob(id).error, images: window.emoticon!.getProcessedImages(id) }), jobId);
  expect(result.error).toMatchObject({ stage: 'post-processing', message: 'Unknown outline style: unsupported-runtime-style' });
  expect(result.images).toEqual([]);
  expect(api.calls.filter(({ kind }) => kind !== 'validate')).toHaveLength(0);
});
