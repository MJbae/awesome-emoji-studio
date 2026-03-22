import type { PlatformId, PlatformSpec } from '@/types/domain';

export const PLATFORM_SPECS: Record<PlatformId, PlatformSpec> = {
  ogq_sticker: {
    label: 'OGQ Sticker',
    description: 'OGQ Market 이모티콘',
    count: 24,
    content: { width: 740, height: 640 },
    main: { width: 240, height: 240 },
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(2, '0')}.png`,
  },
  line_sticker: {
    label: 'LINE Sticker',
    description: 'Line 이모티콘',
    count: 40,
    content: { width: 370, height: 320 },
    main: { width: 240, height: 240 },
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(2, '0')}.png`,
  },
  line_emoji: {
    label: 'LINE Emoji',
    description: 'Line 미니 이모티콘',
    count: 40,
    content: { width: 180, height: 180 },
    main: null,
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(3, '0')}.png`,
  },
  kakaotalk_emoticon: {
    label: '카카오톡 이모티콘',
    description: '카카오톡 멈춰있는 이모티콘',
    count: 40,
    content: { width: 360, height: 360 },
    main: { width: 240, height: 240 },
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(2, '0')}.png`,
  },
  kakaotalk_mini: {
    label: '카카오톡 미니 이모티콘',
    description: '카카오톡 멈춰있는 미니 이모티콘',
    count: 45,
    content: { width: 180, height: 180 },
    main: null,
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(2, '0')}.png`,
  }
};

export const TOTAL_STICKERS = 45;

export function calculateRequiredStickers(platforms: PlatformId[]): number {
  if (!platforms || platforms.length === 0) return TOTAL_STICKERS;
  let maxCount = 0;
  for (const p of platforms) {
    if (PLATFORM_SPECS[p]) {
      maxCount = Math.max(maxCount, PLATFORM_SPECS[p].count);
    }
  }
  if (maxCount === 0) return TOTAL_STICKERS;
  const basePlus10 = Math.ceil(maxCount * 1.1);
  return basePlus10 + 4; // +2 for main, +2 for tab generated explicitly
}

export const CHUNK_SIZE = 3;
export const API_DELAY_MS = 10000;
