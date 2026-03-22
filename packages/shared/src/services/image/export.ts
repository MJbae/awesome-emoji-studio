import JSZip from 'jszip';
import type { PlatformId, PlatformSpec, Sticker, ProcessedImage, MetaResult } from '@/types/domain';
import { PLATFORM_SPECS } from '@/constants/platforms';
import { base64ToBlob } from '@/utils/base64';
import { loadImage } from './core';
import { resizeAndCrop, resizeImage } from './resize';

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function generateStickerZip(
  stickers: Sticker[],
  platformId: PlatformId,
  mainImageBase64: string,
  metadata?: MetaResult[],
): Promise<Blob> {
  const platform = PLATFORM_SPECS[platformId] ?? PLATFORM_SPECS.line_sticker;
  const zip = new JSZip();

  const validStickers = stickers.filter((s) => s.status === 'done' && s.imageUrl);

  for (let i = 0; i < validStickers.length; i++) {
    const s = validStickers[i]!;
    if (!s.imageUrl) continue;

    const img = await loadImage(s.imageUrl);
    const mode = platformId === 'line_emoji' ? ('crop' as const) : ('fit' as const);
    const processedBase64 = resizeAndCrop(
      img,
      platform.content.width,
      platform.content.height,
      mode,
    );

    const fileName = platform.fileNameFormat(i);
    zip.file(fileName, base64ToBlob(processedBase64));

    if (i % 5 === 4) await yieldToMain();
  }

  const mainImg = await loadImage(mainImageBase64);
  const tabBase64 = resizeAndCrop(mainImg, platform.tab.width, platform.tab.height, 'crop');
  zip.file('tab.png', base64ToBlob(tabBase64));

  if (platform.main) {
    const mainBase64 = resizeAndCrop(mainImg, platform.main.width, platform.main.height, 'fit');
    zip.file('main.png', base64ToBlob(mainBase64));
  }

  if (metadata && metadata.length > 0) {
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function generatePostProcessedZip(
  images: ProcessedImage[],
  platformId: PlatformId,
  metadata?: MetaResult[],
): Promise<Blob> {
  const platform: PlatformSpec = PLATFORM_SPECS[platformId] ?? PLATFORM_SPECS.line_sticker;
  const zip = new JSZip();

  for (let i = 0; i < images.length; i++) {
    const image = images[i]!;
    const resized = await resizeImage(image.data, platform.content.width, platform.content.height);

    const fileName = platform.fileNameFormat(i);
    zip.file(fileName, base64ToBlob(resized));

    if (i % 5 === 4) await yieldToMain();
  }

  if (images.length > 0) {
    const firstImage = images[0]!;
    const tabResized = await resizeImage(firstImage.data, platform.tab.width, platform.tab.height);
    zip.file('tab.png', base64ToBlob(tabResized));

    if (platform.main) {
      const mainResized = await resizeImage(
        firstImage.data,
        platform.main.width,
        platform.main.height,
      );
      zip.file('main.png', base64ToBlob(mainResized));
    }
  }

  if (metadata && metadata.length > 0) {
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  }

  return zip.generateAsync({ type: 'blob' });
}
