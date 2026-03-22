import { loadImage, createCanvas } from './core';

export async function resizeImage(
  src: string,
  targetWidth: number,
  targetHeight: number,
): Promise<string> {
  const img = await loadImage(src);
  const { canvas, ctx } = createCanvas(targetWidth, targetHeight);

  ctx.clearRect(0, 0, targetWidth, targetHeight);

  const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (targetWidth - w) / 2;
  const y = (targetHeight - h) / 2;

  ctx.drawImage(img, x, y, w, h);
  return canvas.toDataURL('image/png');
}

export function resizeAndCrop(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  mode: 'fit' | 'crop' = 'fit',
): string {
  const { canvas, ctx } = createCanvas(targetWidth, targetHeight);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  if (mode === 'crop') {
    const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const x = (targetWidth - img.width * scale) / 2;
    const y = (targetHeight - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  } else {
    const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
    const x = (targetWidth - img.width * scale) / 2;
    const y = (targetHeight - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  }

  return canvas.toDataURL('image/png');
}
