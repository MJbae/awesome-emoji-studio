import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
    'zh-CN': { translation: zhCN }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
