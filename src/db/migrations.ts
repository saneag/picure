import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Each entry upgrades the database by one version. Append new entries; never edit old ones.
 * `PRAGMA user_version` records how many have been applied.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE collages (
    id TEXT PRIMARY KEY NOT NULL,
    patient_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    procedure_count INTEGER NOT NULL DEFAULT 1,
    layout_id TEXT NOT NULL,
    slot_count INTEGER NOT NULL,
    rendered_uri TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE collage_images (
    id TEXT PRIMARY KEY NOT NULL,
    collage_id TEXT NOT NULL REFERENCES collages(id) ON DELETE CASCADE,
    slot_index INTEGER NOT NULL,
    uri TEXT NOT NULL,
    asset_id TEXT,
    source TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    scale REAL NOT NULL,
    offset_x REAL NOT NULL,
    offset_y REAL NOT NULL,
    label_text TEXT NOT NULL DEFAULT '',
    label_color TEXT NOT NULL,
    label_size TEXT NOT NULL,
    label_position TEXT NOT NULL
  );
  CREATE INDEX idx_collage_images_collage ON collage_images(collage_id);
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
  `ALTER TABLE collages ADD COLUMN is_draft INTEGER NOT NULL DEFAULT 0;`,
];

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
