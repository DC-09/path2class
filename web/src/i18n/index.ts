import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import it from './locales/it.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

export const SUPPORTED_LANGUAGES = ['it', 'en', 'pt'] as const;

/**
 * Initialise once, synchronously, before the React tree renders. The
 * starting language is whatever the session store decides (stored → navigator
 * → 'it' fallback); here we default to 'it' and let the app call
 * `i18n.changeLanguage` once the store hydrates.
 */
void i18n.use(initReactI18next).init({
  resources: {
    it: { translation: it },
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: 'it',
  fallbackLng: 'it',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
