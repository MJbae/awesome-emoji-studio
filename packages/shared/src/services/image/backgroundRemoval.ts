import type { RGB } from '@/types/domain';
import { BG_REMOVAL_CONFIG } from '@/constants/imageProcessing';
import { loadImage, createCanvas } from './core';

function detectBackgroundColor(imageData: ImageData): RGB | null {
  const { data, width, height } = imageData;
  const colorCount = new Map<string, number>();

  const processPixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    const r = data[idx]!;
    const g = data[idx + 1]!;
    const b = data[idx + 2]!;
    const a = data[idx + 3]!;

    if (a > 128) {
      const key = `${r},${g},${b}`;
      colorCount.set(key, (colorCount.get(key) ?? 0) + 1);
    }
  };

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

function computeEdgeMap(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const edgeMap = new Float32Array(width * height);
  const grayscale = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayscale[i] = 0.299 * data[idx]! + 0.587 * data[idx + 1]! + 0.114 * data[idx + 2]!;
  }

  // Sobel operator for edge detection
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
        -1 * grayscale[tl]! + 1 * grayscale[tr]! +
        -2 * grayscale[ml]! + 2 * grayscale[mr]! +
        -1 * grayscale[bl]! + 1 * grayscale[br]!;

      const gy =
        -1 * grayscale[tl]! + -2 * grayscale[tc]! + -1 * grayscale[tr]! +
        1 * grayscale[bl]! + 2 * grayscale[bc]! + 1 * grayscale[br]!;

      edgeMap[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return edgeMap;
}

function floodFillRemoveBackground(
  imageData: ImageData,
  bgColor: RGB,
  edgeMap: Float32Array,
): void {
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

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

    if (edgeMap[idx]! >= BG_REMOVAL_CONFIG.SOBEL_EDGE_THRESHOLD) {
      continue;
    }

    const pixelIdx = idx * 4;
    const r = data[pixelIdx]!;
    const g = data[pixelIdx + 1]!;
    const b = data[pixelIdx + 2]!;

    const colorDistance = Math.sqrt(
      Math.pow(r - bgColor.r, 2) +
      Math.pow(g - bgColor.g, 2) +
      Math.pow(b - bgColor.b, 2),
    );

    if (colorDistance >= BG_REMOVAL_CONFIG.BG_TOLERANCE) {
      continue;
    }

    data[pixelIdx + 3] = 0;

    const neighbors = [
      idx - 1,
      idx + 1,
      idx - width,
      idx + width,
    ];

    for (const neighbor of neighbors) {
      const nx = neighbor % width;
      const ny = Math.floor(neighbor / width);

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!visited[neighbor]) {
          queue.push(neighbor);
        }
      }
    }
  }
}

function applyDefringing(imageData: ImageData, bgColor: RGB): void {
  const { data, width, height } = imageData;

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const alpha = data[idx + 3]!;

    if (alpha === 255 || alpha === 0) continue;

    if (alpha < BG_REMOVAL_CONFIG.DEFRINGE_ALPHA_BG) {
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

export async function performBackgroundRemoval(
  image: HTMLImageElement,
): Promise<string> {
  const { canvas, ctx } = createCanvas(image.width, image.height);
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const bgColor = detectBackgroundColor(imageData);
  if (!bgColor) {
    return canvas.toDataURL('image/png');
  }

  const edgeMap = computeEdgeMap(imageData);
  floodFillRemoveBackground(imageData, bgColor, edgeMap);
  applyDefringing(imageData, bgColor);

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function processImageWithBgRemoval(src: string): Promise<string> {
  const image = await loadImage(src);
  return performBackgroundRemoval(image);
}
