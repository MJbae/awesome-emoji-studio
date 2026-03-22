import sharp from 'sharp';
import { loadImageBuffer, bufferToBase64 } from './core.js';

/**
 * Resize an image to fit within target dimensions (contain mode, centered).
 * Returns a base64 data URL.
 */
export async function resizeImage(
  src: string,
  targetWidth: number,
  targetHeight: number,
): Promise<string> {
  const buffer = loadImageBuffer(src);

  const resized = await sharp(buffer)
    .resize(targetWidth, targetHeight, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return bufferToBase64(resized);
}

/**
 * Resize and optionally crop an image.
 */
export async function resizeAndCrop(
  src: string,
  targetWidth: number,
  targetHeight: number,
  mode: 'fit' | 'crop' = 'fit',
): Promise<string> {
  const buffer = loadImageBuffer(src);

  const fit = mode === 'crop' ? 'cover' : 'contain';

  const resized = await sharp(buffer)
    .resize(targetWidth, targetHeight, {
      fit,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  return bufferToBase64(resized);
}
