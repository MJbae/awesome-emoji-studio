import type { LanguageCode, LanguageEntry, TargetLanguage } from '@/types/domain';

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', nativeName: 'English', market: 'English', required: true },
  { code: 'ko', label: 'Korean', nativeName: '한국어', market: 'Korean', required: false },
  { code: 'ja', label: 'Japanese', nativeName: '日本語', market: 'Japanese', required: false },
  {
    code: 'zh-CN',
    label: 'Simplified Chinese',
    nativeName: '简体中文',
    market: 'Simplified Chinese',
    required: false,
  },
  {
    code: 'zh-TW',
    label: 'Traditional Chinese',
    nativeName: '繁體中文',
    market: 'Traditional Chinese',
    required: false,
  },
] as const satisfies readonly (LanguageEntry & { market: TargetLanguage })[];

export const SUPPORTED_LOCALES: readonly LanguageCode[] = LANGUAGE_OPTIONS.map(
  (language) => language.code,
);
export const METADATA_LANGUAGES: LanguageEntry[] = LANGUAGE_OPTIONS.map(
  ({ code, label, nativeName, required }) => ({ code, label, nativeName, required }),
);

export function isTargetLanguage(value: unknown): value is TargetLanguage {
  return LANGUAGE_OPTIONS.some((language) => language.market === value);
}

export function targetLanguageForLocale(locale: string | undefined): TargetLanguage {
  return (LANGUAGE_OPTIONS.find((language) => language.code === locale) ?? LANGUAGE_OPTIONS[0])
    .market;
}
