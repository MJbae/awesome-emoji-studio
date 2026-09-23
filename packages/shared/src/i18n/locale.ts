import type { LanguageCode } from '@/types/domain';

export const LOCALE_STORAGE_KEY = 'i18nextLng';

/** Use an explicit Chinese script before a regional hint (e.g. zh-Hant-CN). */
export function normalizeLocale(value: unknown): LanguageCode | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const locale = new Intl.Locale(value.trim().replace(/_/g, '-'));
    switch (locale.language) {
      case 'en':
        return 'en';
      case 'ko':
        return 'ko';
      case 'ja':
        return 'ja';
      case 'zh':
        if (locale.script === 'Hant') return 'zh-TW';
        if (locale.script === 'Hans') return 'zh-CN';
        return ['TW', 'HK', 'MO'].includes(locale.region ?? '') ? 'zh-TW' : 'zh-CN';
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function resolveLocale(preferences: readonly string[], saved?: string | null): LanguageCode {
  const preferred = normalizeLocale(saved);
  if (preferred) return preferred;
  for (const candidate of preferences) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return 'en';
}

export function readSavedLocale(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function browserLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages.length ? navigator.languages : [navigator.language];
}

export function initialLocale(): LanguageCode {
  return resolveLocale(browserLanguages(), readSavedLocale());
}
