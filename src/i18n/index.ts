import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguageSetting } from '@/db/settings-repo';
import { en } from './en';
import { ru } from './ru';

export type AppLanguage = 'en' | 'ru';

export function resolveLanguage(setting: LanguageSetting): AppLanguage {
  if (setting !== 'system') return setting;
  return getLocales()[0]?.languageCode === 'ru' ? 'ru' : 'en';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ru: { translation: ru } },
  lng: resolveLanguage('system'),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
