export const GEMINI_MODELS = {
  TEXT_PRIMARY: 'gemini-3.1-pro-preview',
  TEXT_FALLBACK: 'gemini-2.5-flash',
  IMAGE_PRIMARY: 'gemini-2.5-flash-image',
  IMAGE_FALLBACK: 'gemini-2.5-flash-image',
  FLASH_PRIMARY: 'gemini-2.5-flash',
  FLASH_FALLBACK: 'gemini-2.5-flash',
} as const;

export const GEMINI_CONFIG = {
  BASE_TEMPERATURE: 0.7,
  TEMPERATURE_INCREMENT: 0.1,
  MAX_RETRY_ATTEMPTS: 3,
  QUALITY_THRESHOLD: 4.0,
  TITLE_MAX_LENGTH: 30,
  DESCRIPTION_MAX_LENGTH: 130,
  TAGS_COUNT: 20,
} as const;
