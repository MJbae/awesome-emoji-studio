import sharp from 'sharp';
import { loadImageBuffer, bufferToBase64 } from './core.js';

const BG_TOLERANCE = 35;
const SOBEL_EDGE_THRESHOLD = 40;
const DEFRINGE_ALPHA_BG = 20;

interface RGB {
  r: number;
  g: number;
  b: number;
}

function detectBackgroundColor(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): RGB | null {
  const colorCount = new Map<string, number>();

  const processPixel = (x: number, y: number) => {
    const idx = (y * width + x) * channels;
    const r = data[idx]!;
    const g = data[idx + 1]!;
    const b = data[idx + 2]!;
    const a = channels >= 4 ? data[idx + 3]! : 255;

    if (a > 128) {
      const key = `${r},${g},${b}`;
      colorCount.set(key, (colorCount.get(key) ?? 0) + 1);
    }
  };

  // Sample edges
  for (let x = 0; x < width; x++) {
    processPixel(x, 0);
    processPixel(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    processPixel(0, y);
    processPixel(width - 1, y);
  }

  let maxCount = 0;
  let dominantColor: RGB | null = null;

  for (const [key, count] of colorCount) {
    if (count > maxCount) {
      maxCount = count;
      const [r, g, b] = key.split(',').map(Number);
      dominantColor = { r: r!, g: g!, b: b! };
    }
  }

  return dominantColor;
}

function computeEdgeMap(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): Float32Array {
  const edgeMap = new Float32Array(width * height);
  const grayscale = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    grayscale[i] = 0.299 * data[idx]! + 0.587 * data[idx + 1]! + 0.114 * data[idx + 2]!;
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const tl = (y - 1) * width + (x - 1);
      const tc = (y - 1) * width + x;
      const tr = (y - 1) * width + (x + 1);
      const ml = y * width + (x - 1);
      const mr = y * width + (x + 1);
      const bl = (y + 1) * width + (x - 1);
      const bc = (y + 1) * width + x;
      const br = (y + 1) * width + (x + 1);

      const gx =
        -1 * grayscale[tl]! +
        1 * grayscale[tr]! +
        -2 * grayscale[ml]! +
        2 * grayscale[mr]! +
        -1 * grayscale[bl]! +
        1 * grayscale[br]!;

      const gy =
        -1 * grayscale[tl]! +
        -2 * grayscale[tc]! +
        -1 * grayscale[tr]! +
        1 * grayscale[bl]! +
        2 * grayscale[bc]! +
        1 * grayscale[br]!;

      edgeMap[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return edgeMap;
}

function floodFillRemoveBackground(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  bgColor: RGB,
  edgeMap: Float32Array,
): void {
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  // Start from edges
  for (let x = 0; x < width; x++) {
    queue.push(x);
    queue.push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width);
    queue.push(y * width + (width - 1));
  }

  while (queue.length > 0) {
    const idx = queue.shift()!;
    if (visited[idx]) continue;
    visited[idx] = 1;

    if (edgeMap[idx]! >= SOBEL_EDGE_THRESHOLD) continue;

    const pixelIdx = idx * channels;
    const r = data[pixelIdx]!;
    const g = data[pixelIdx + 1]!;
    const b = data[pixelIdx + 2]!;

    const colorDistance = Math.sqrt(
      (r - bgColor.r) ** 2 + (g - bgColor.g) ** 2 + (b - bgColor.b) ** 2,
    );

    if (colorDistance >= BG_TOLERANCE) continue;

    // Set alpha to 0
    if (channels >= 4) {
      data[pixelIdx + 3] = 0;
    }

    const neighbors = [idx - 1, idx + 1, idx - width, idx + width];
    for (const neighbor of neighbors) {
      const nx = neighbor % width;
      const ny = Math.floor(neighbor / width);
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[neighbor]) {
        queue.push(neighbor);
      }
    }
  }
}

function applyDefringing(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  bgColor: RGB,
): void {
  if (channels < 4) return;

  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const alpha = data[idx + 3]!;

    if (alpha === 255 || alpha === 0) continue;

    if (alpha < DEFRINGE_ALPHA_BG) {
      data[idx + 3] = 0;
      continue;
    }

    const alphaRatio = alpha / 255;
    const oneMinusAlpha = 1 - alphaRatio;

    const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));

    data[idx] = clamp((data[idx]! - oneMinusAlpha * bgColor.r) / alphaRatio);
    data[idx + 1] = clamp((data[idx + 1]! - oneMinusAlpha * bgColor.g) / alphaRatio);
    data[idx + 2] = clamp((data[idx + 2]! - oneMinusAlpha * bgColor.b) / alphaRatio);
  }
}

export async function processImageWithBgRemoval(src: string): Promise<string> {
  const inputBuffer = loadImageBuffer(src);

  // Ensure RGBA
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const mutableData = Buffer.from(data);

  const bgColor = detectBackgroundColor(mutableData, width, height, channels);
  if (!bgColor) {
    // No clear background — return as-is
    const pngBuffer = await sharp(inputBuffer).ensureAlpha().png().toBuffer();
    return bufferToBase64(pngBuffer);
  }

  const edgeMap = computeEdgeMap(mutableData, width, height, channels);
  floodFillRemoveBackground(mutableData, width, height, channels, bgColor, edgeMap);
  applyDefringing(mutableData, width, height, channels, bgColor);

  const resultBuffer = await sharp(mutableData, {
    raw: { width, height, channels },
  })
    .png()
    .toBuffer();

  return bufferToBase64(resultBuffer);
}
