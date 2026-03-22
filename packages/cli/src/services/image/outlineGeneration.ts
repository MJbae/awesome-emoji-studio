import sharp from 'sharp';
import type { OutlineStyle } from '@/types/domain';
import { loadImageBuffer, bufferToBase64 } from './core.js';

const ANGLE_STEP = 15;

const OUTLINE_COLORS: Record<string, { r: number; g: number; b: number }> = {
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

  const inputBuffer = loadImageBuffer(imageSrc);
  const meta = await sharp(inputBuffer).metadata();
  const imgWidth = meta.width ?? 0;
  const imgHeight = meta.height ?? 0;
  const radius = outlineThickness;

  const canvasWidth = imgWidth + 2 * radius;
  const canvasHeight = imgHeight + 2 * radius;

  const color = OUTLINE_COLORS[outlineStyle];
  if (!color) throw new Error(`Unknown outline style: ${outlineStyle}`);

  // Build composite inputs: render the image at circular offsets to create outline
  const overlays: sharp.OverlayOptions[] = [];

  for (let angle = 0; angle < 360; angle += ANGLE_STEP) {
    const radian = (angle * Math.PI) / 180;
    const x = Math.round(radius + radius * Math.cos(radian));
    const y = Math.round(radius + radius * Math.sin(radian));
    overlays.push({
      input: inputBuffer,
      left: x,
      top: y,
    });
  }

  // Create transparent canvas
  const canvas = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).png();

  // Step 1: Composite all offset copies onto canvas
  const outlineBase = await canvas.composite(overlays).png().toBuffer();

  // Step 2: Tint the outline layer with the outline color
  // Extract alpha from the outline base, then create a colored version
  const { data: alphaData, info } = await sharp(outlineBase)
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Create RGBA buffer with the outline color and extracted alpha
  const coloredOutline = Buffer.alloc(info.width * info.height * 4);
  const alpha = Math.round(outlineOpacity * 255);

  for (let i = 0; i < info.width * info.height; i++) {
    const srcAlpha = alphaData[i]!;
    const finalAlpha = Math.round((srcAlpha / 255) * alpha);
    coloredOutline[i * 4] = color.r;
    coloredOutline[i * 4 + 1] = color.g;
    coloredOutline[i * 4 + 2] = color.b;
    coloredOutline[i * 4 + 3] = finalAlpha;
  }

  const coloredOutlineBuffer = await sharp(coloredOutline, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();

  // Step 3: Composite original image on top of the colored outline
  const result = await sharp(coloredOutlineBuffer)
    .composite([
      {
        input: inputBuffer,
        left: radius,
        top: radius,
      },
    ])
    .png()
    .toBuffer();

  return bufferToBase64(result);
}
