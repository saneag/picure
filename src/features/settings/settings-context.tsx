import * as LocalAuthentication from 'expo-local-authentication';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DEFAULT_SETTINGS,
  readSettings,
  writeSetting,
  type AppSettings,
  type LanguageSetting,
} from '@/db/settings-repo';
import i18n, { resolveLanguage } from '@/i18n';

interface SettingsContextValue {
  settings: AppSettings;
  loaded: boolean;
  setLanguage: (language: LanguageSetting) => Promise<void>;
  /** Returns false when the phone has no screen lock set up, so the lock cannot be enabled. */
  setAppLock: (enabled: boolean) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readSettings(db).then((stored) => {
      setSettings(stored);
      i18n.changeLanguage(resolveLanguage(stored.language));
      setLoaded(true);
    });
  }, [db]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      loaded,
      setLanguage: async (language) => {
        await writeSetting(db, 'language', language);
        setSettings((current) => ({ ...current, language }));
        await i18n.changeLanguage(resolveLanguage(language));
      },
      setAppLock: async (enabled) => {
        if (enabled) {
          const level = await LocalAuthentication.getEnrolledLevelAsync();
          if (level === LocalAuthentication.SecurityLevel.NONE) return false;
        }
        await writeSetting(db, 'appLock', String(enabled));
        setSettings((current) => ({ ...current, appLock: enabled }));
        return true;
      },
    }),
    [db, settings, loaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
