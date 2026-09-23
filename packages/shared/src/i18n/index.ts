import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LOCALES } from '@/constants/languages';
import type { LanguageCode } from '@/types/domain';
import {
  browserLanguages,
  initialLocale,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  readSavedLocale,
  resolveLocale,
} from './locale';
import en from './locales/en.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';
import zhTW from './locales/zh-TW.json';
import zhCN from './locales/zh-CN.json';

const resources = {
  en: { translation: en },
  ko: { translation: ko },
  ja: { translation: ja },
  'zh-TW': { translation: zhTW },
  'zh-CN': { translation: zhCN },
};

i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LOCALES,
  load: 'currentOnly',
  initAsync: false,
  interpolation: { escapeValue: false },
});

function updateDocumentLanguage(language: string): void {
  if (typeof document !== 'undefined')
    document.documentElement.lang = normalizeLocale(language) ?? 'en';
}
i18n.on('languageChanged', updateDocumentLanguage);
updateDocumentLanguage(i18n.language);

let sessionLocale: LanguageCode | null = null;

export async function setInterfaceLanguage(language: LanguageCode): Promise<void> {
  const selected = normalizeLocale(language) ?? 'en';
  sessionLocale = selected;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, selected);
  } catch {
    // Browsers that restrict storage can still change language for this session.
  }
  await i18n.changeLanguage(selected);
}

if (typeof window !== 'undefined') {
  window.addEventListener('languagechange', () => {
    if (!sessionLocale && !normalizeLocale(readSavedLocale()))
      void i18n.changeLanguage(resolveLocale(browserLanguages()));
  });
}

export default i18n;
