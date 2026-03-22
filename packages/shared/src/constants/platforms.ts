import type { PlatformId, PlatformSpec, PlatformCategory } from '@/types/domain';

export const PLATFORM_SPECS: Record<PlatformId, PlatformSpec> = {
  ogq_sticker: {
    label: 'OGQ Sticker',
    description: 'OGQ Market 이모티콘',
    count: 24,
    content: { width: 740, height: 640 },
    main: { width: 240, height: 240 },
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(2, '0')}.png`,
    format: 'png',
    available: true,
    category: 'korean',
  },
  line_sticker: {
    label: 'LINE Sticker',
    description: 'Line 이모티콘',
    count: 40,
    content: { width: 370, height: 320 },
    main: { width: 240, height: 240 },
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(2, '0')}.png`,
    format: 'png',
    available: true,
    category: 'japanese',
  },
  line_emoji: {
    label: 'LINE Emoji',
    description: 'Line 미니 이모티콘',
    count: 40,
    content: { width: 180, height: 180 },
    main: null,
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(3, '0')}.png`,
    format: 'png',
    available: true,
    category: 'japanese',
  },
  kakaotalk_emoticon: {
    label: '카카오톡 이모티콘',
    description: '카카오톡 멈춰있는 이모티콘',
    count: 40,
    content: { width: 360, height: 360 },
    main: { width: 240, height: 240 },
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(2, '0')}.png`,
    format: 'png',
    available: true,
    category: 'korean',
  },
  kakaotalk_mini: {
    label: '카카오톡 미니 이모티콘',
    description: '카카오톡 멈춰있는 미니 이모티콘',
    count: 45,
    content: { width: 180, height: 180 },
    main: null,
    tab: { width: 96, height: 74 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(2, '0')}.png`,
    format: 'png',
    available: true,
    category: 'korean',
  },
  telegram_static: {
    label: 'Telegram Static Sticker',
    description: 'Telegram 정적 스티커',
    count: 120,
    content: { width: 512, height: 512 },
    main: null,
    tab: { width: 100, height: 100 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(3, '0')}.png`,
    format: 'png',
    maxFileSize: 512 * 1024,
    available: true,
    category: 'telegram',
  },
  telegram_animated: {
    label: 'Telegram Animated Sticker',
    description: 'Telegram 애니메이션 스티커 (TGS/Lottie)',
    count: 50,
    content: { width: 512, height: 512 },
    main: null,
    tab: { width: 100, height: 100 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(3, '0')}.tgs`,
    format: 'tgs',
    maxFileSize: 64 * 1024,
    available: false,
    category: 'telegram',
  },
  telegram_video: {
    label: 'Telegram Video Sticker',
    description: 'Telegram 비디오 스티커 (WEBM/VP9)',
    count: 50,
    content: { width: 512, height: 512 },
    main: null,
    tab: { width: 100, height: 100 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(3, '0')}.webm`,
    format: 'webm',
    maxFileSize: 256 * 1024,
    available: false,
    category: 'telegram',
  },
  telegram_emoji: {
    label: 'Telegram Custom Emoji',
    description: 'Telegram 커스텀 이모지',
    count: 200,
    content: { width: 100, height: 100 },
    main: null,
    tab: { width: 100, height: 100 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(3, '0')}.png`,
    format: 'png',
    maxFileSize: 512 * 1024,
    available: true,
    category: 'telegram',
  },
  instagram_giphy: {
    label: 'Instagram / GIPHY Sticker',
    description: 'Instagram/GIPHY GIF 스티커',
    count: 30,
    content: { width: 500, height: 500 },
    main: null,
    tab: { width: 100, height: 100 },
    fileNameFormat: (i: number) => `${String(i + 1).padStart(3, '0')}.gif`,
    format: 'gif',
    available: false,
    category: 'social',
  },
};

export const AVAILABLE_PLATFORMS: PlatformId[] = (Object.entries(PLATFORM_SPECS) as [PlatformId, PlatformSpec][])
  .filter(([_, spec]) => spec.available)
  .map(([id]) => id);

export const PLATFORM_CATEGORIES: { id: PlatformCategory; label: string; labelKey: string }[] = [
  { id: 'korean', label: '한국', labelKey: 'export.categoryKorean' },
  { id: 'japanese', label: '일본', labelKey: 'export.categoryJapanese' },
  { id: 'telegram', label: 'Telegram', labelKey: 'export.categoryTelegram' },
  { id: 'social', label: 'Social', labelKey: 'export.categorySocial' },
];

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
