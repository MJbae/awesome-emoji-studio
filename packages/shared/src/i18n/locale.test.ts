import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  browserLanguages,
  initialLocale,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  readSavedLocale,
  resolveLocale,
} from './locale';
import {
  isTargetLanguage,
  LANGUAGE_OPTIONS,
  METADATA_LANGUAGES,
  SUPPORTED_LOCALES,
  targetLanguageForLocale,
} from '@/constants/languages';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('locale negotiation', () => {
  it.each([
    ['en-US', 'en'],
    ['en-GB', 'en'],
    ['EN_au', 'en'],
    ['ko-KR', 'ko'],
    ['ja-JP', 'ja'],
    ['zh', 'zh-CN'],
    ['zh-CN', 'zh-CN'],
    ['zh-SG', 'zh-CN'],
    ['zh-TW', 'zh-TW'],
    ['zh-HK', 'zh-TW'],
    ['zh-MO', 'zh-TW'],
    ['zh-Hant', 'zh-TW'],
    ['zh-Hans', 'zh-CN'],
    ['zh-Hant-CN', 'zh-TW'],
    ['zh-Hans-TW', 'zh-CN'],
    [' ZH_hant_HK ', 'zh-TW'],
    ['ko-KR-u-ca-gregory', 'ko'],
  ])('maps %s to %s', (input, expected) => {
    expect(normalizeLocale(input)).toBe(expected);
  });

  it.each([undefined, null, 123, '', ' ', 'th-TH', 'fr-FR', 'xx-invalid-!', 'zh-InvalidScript!'])(
    'rejects unsupported or malformed locale %s',
    (input) => {
      expect(normalizeLocale(input)).toBeNull();
    },
  );

  it('gives a valid saved choice priority, otherwise uses supported browser preferences in order', () => {
    expect(resolveLocale(['ko-KR'], 'ja-JP')).toBe('ja');
    expect(resolveLocale(['fr-FR', 'zh-HK', 'ko-KR'], 'th')).toBe('zh-TW');
    expect(resolveLocale(['en-US', 'ko-KR'])).toBe('en');
    expect(resolveLocale(['fr-FR', 'de-DE'])).toBe('en');
    expect(resolveLocale([], 'bogus')).toBe('en');
  });

  it('reads browser settings without requiring storage permissions', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ko-KR']);
    expect(browserLanguages()).toEqual(['ko-KR']);
    expect(initialLocale()).toBe('ko');
    localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-Hant');
    expect(readSavedLocale()).toBe('zh-Hant');
    expect(initialLocale()).toBe('zh-TW');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage disabled');
    });
    expect(readSavedLocale()).toBeNull();
    expect(initialLocale()).toBe('ko');
  });

  it('uses navigator.language when the language list is empty', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([]);
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
    expect(browserLanguages()).toEqual(['ja-JP']);
    expect(initialLocale()).toBe('ja');
  });

  it('falls back to English when there is no browser environment', () => {
    vi.stubGlobal('navigator', undefined);
    expect(browserLanguages()).toEqual([]);
    expect(initialLocale()).toBe('en');
  });
});

describe('five-language catalog', () => {
  it('keeps UI, generation and metadata options aligned', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'ko', 'ja', 'zh-CN', 'zh-TW']);
    expect(METADATA_LANGUAGES.map((language) => language.code)).toEqual(SUPPORTED_LOCALES);
    for (const option of LANGUAGE_OPTIONS) {
      expect(isTargetLanguage(option.market)).toBe(true);
      expect(targetLanguageForLocale(option.code)).toBe(option.market);
    }
    expect(isTargetLanguage('Thai')).toBe(false);
    expect(isTargetLanguage(null)).toBe(false);
    expect(targetLanguageForLocale('th')).toBe('English');
    expect(targetLanguageForLocale(undefined)).toBe('English');
  });
});
