import sharp from 'sharp';

/**
 * Load a base64 image string into a sharp instance.
 * Accepts both raw base64 and data URL formats.
 */
export function loadImageBuffer(src: string): Buffer {
  const base64Data = src.startsWith('data:')
    ? src.replace(/^data:image\/\w+;base64,/, '')
    : src;
  return Buffer.from(base64Data, 'base64');
}

/**
 * Convert a Buffer to a base64 data URL string.
 */
export function bufferToBase64(buffer: Buffer, mimeType = 'image/png'): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Convert a base64 string (data URL or raw) to a raw base64 string without prefix.
 */
export function toRawBase64(src: string): string {
  return src.startsWith('data:')
    ? src.replace(/^data:image\/\w+;base64,/, '')
    : src;
}

/**
 * Get image metadata (width, height, channels) from a base64 source.
 */
export async function getImageInfo(
  src: string,
): Promise<{ width: number; height: number; channels: number }> {
  const buffer = loadImageBuffer(src);
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    channels: meta.channels ?? 4,
  };
}
