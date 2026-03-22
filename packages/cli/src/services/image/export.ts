import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import type { PlatformId, ProcessedImage, MetaResult, PlatformSpec } from '@/types/domain';
import { PLATFORM_SPECS } from '@/constants/platforms';
import { resizeImage } from './resize.js';
import { loadImageBuffer } from './core.js';

/**
 * Generate a ZIP file for a specific platform with post-processed images.
 * Returns the path to the saved ZIP file.
 */
export async function generatePlatformZip(
  images: ProcessedImage[],
  platformId: PlatformId,
  outputDir: string,
  metadata?: MetaResult[],
): Promise<string> {
  const platform: PlatformSpec = PLATFORM_SPECS[platformId];
  const zip = new JSZip();

  // Content images (resized to platform spec)
  const maxImages = Math.min(images.length, platform.count);
  for (let i = 0; i < maxImages; i++) {
    const image = images[i]!;
    const resized = await resizeImage(image.data, platform.content.width, platform.content.height);
    const rawBase64 = resized.replace(/^data:image\/\w+;base64,/, '');
    const fileName = platform.fileNameFormat(i);
    zip.file(fileName, rawBase64, { base64: true });
  }

  // Main and Tab extraction
  if (images.length > 0) {
    // Pick candidates for tab: [primary, reserve1, reserve2]
    const tabCandidates = [
      images[0]!,
      images.length > platform.count ? images[platform.count]! : images[0]!,
      images.length > platform.count + 1 ? images[platform.count + 1]! : images[0]!,
    ];

    // Export tabs
    for (let i = 0; i < tabCandidates.length; i++) {
      const candidate = tabCandidates[i]!;
      const tabResized = await resizeImage(candidate.data, platform.tab.width, platform.tab.height);
      const tabRawBase64 = tabResized.replace(/^data:image\/\w+;base64,/, '');
      const filename = i === 0 ? 'tab.png' : `tab_reserve${i}.png`;
      zip.file(filename, tabRawBase64, { base64: true });
    }

    // Export mains
    if (platform.main) {
      // Pick candidates for main: [primary, reserve1, reserve2]
      const mainCandidates = [
        images[0]!,
        images.length > platform.count + 2 ? images[platform.count + 2]! : images[0]!,
        images.length > platform.count + 3 ? images[platform.count + 3]! : images[0]!,
      ];

      for (let i = 0; i < mainCandidates.length; i++) {
        const candidate = mainCandidates[i]!;
        const mainResized = await resizeImage(candidate.data, platform.main.width, platform.main.height);
        const mainRawBase64 = mainResized.replace(/^data:image\/\w+;base64,/, '');
        const filename = i === 0 ? 'main.png' : `main_reserve${i}.png`;
        zip.file(filename, mainRawBase64, { base64: true });
      }
    }
  }

  // Metadata
  if (metadata && metadata.length > 0) {
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  }

  // Generate ZIP as Buffer and save to filesystem
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  const platformDir = path.join(outputDir, platformId);
  if (!fs.existsSync(platformDir)) {
    fs.mkdirSync(platformDir, { recursive: true });
  }

  const zipPath = path.join(platformDir, `${platformId}.zip`);
  fs.writeFileSync(zipPath, zipBuffer);

  // Also save individual images
  for (let i = 0; i < maxImages; i++) {
    const image = images[i]!;
    const resized = await resizeImage(image.data, platform.content.width, platform.content.height);
    const imgBuffer = loadImageBuffer(resized);
    const fileName = platform.fileNameFormat(i);
    fs.writeFileSync(path.join(platformDir, fileName), imgBuffer);
  }

  return zipPath;
}

/**
 * Export to all platforms and return a map of platform → zip path.
 */
export async function exportAllPlatforms(
  images: ProcessedImage[],
  platforms: PlatformId[],
  outputDir: string,
  metadata?: MetaResult[],
): Promise<Record<PlatformId, string>> {
  const results: Partial<Record<PlatformId, string>> = {};

  for (const platformId of platforms) {
    const zipPath = await generatePlatformZip(images, platformId, outputDir, metadata);
    results[platformId] = zipPath;
  }

  return results as Record<PlatformId, string>;
}
