import type { SQLiteDatabase } from 'expo-sqlite';

export type LanguageSetting = 'system' | 'en' | 'ru';

export interface AppSettings {
  language: LanguageSetting;
  appLock: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = { language: 'system', appLock: false };

export async function readSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    language: (map.language as LanguageSetting) ?? DEFAULT_SETTINGS.language,
    appLock: map.appLock === 'true',
  };
}

export async function writeSetting(db: SQLiteDatabase, key: keyof AppSettings, value: string) {
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, value);
}
