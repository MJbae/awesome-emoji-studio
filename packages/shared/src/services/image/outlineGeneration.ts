import type { OutlineStyle, RGB } from '@/types/domain';
import { OUTLINE_CONFIG } from '@/constants/imageProcessing';
import { loadImage, createCanvas } from './core';

const OUTLINE_COLORS: Record<string, RGB> = {
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
};

export async function performOutline(
  imageSrc: string,
  outlineStyle: OutlineStyle,
  outlineThickness: number,
  outlineOpacity: number,
): Promise<string> {
  if (outlineStyle === 'none') {
    return imageSrc;
  }

  const image = await loadImage(imageSrc);
  const radius = outlineThickness;

  const { canvas, ctx } = createCanvas(
    image.width + 2 * radius,
    image.height + 2 * radius,
  );

  // Circular offset rendering for smooth outlines
  for (let angle = 0; angle < 360; angle += OUTLINE_CONFIG.ANGLE_STEP) {
    const radian = (angle * Math.PI) / 180;
    const x = radius + radius * Math.cos(radian);
    const y = radius + radius * Math.sin(radian);
    ctx.drawImage(image, x, y);
  }

  // Source-in compositing to apply outline color
  ctx.globalCompositeOperation = 'source-in';
  const color = OUTLINE_COLORS[outlineStyle];
  if (!color) throw new Error(`Unknown outline style: ${outlineStyle}`);
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${outlineOpacity})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Overlay original image on top
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(image, radius, radius);

  return canvas.toDataURL('image/png');
}
