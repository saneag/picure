import type { SQLiteDatabase } from 'expo-sqlite';
import { deleteCollage, getCollage, saveCollage } from '@/db/collages-repo';
import type { CollageDraft, SavedCollage } from '@/features/collage/types';
import { newId } from '@/lib/id';
import { deleteStoredFile, storeRenderedCollage } from './file-storage';

export type SaveMode = 'new' | 'override' | 'copy';

/**
 * Writes the rendered collage and its data to private storage.
 * - new / copy: creates a new collage, leaving any previous one untouched.
 * - override: replaces the existing collage in place (same id, new image).
 */
export async function saveDraft(
  db: SQLiteDatabase,
  draft: CollageDraft,
  renderedTempUri: string,
  mode: SaveMode,
): Promise<SavedCollage> {
  const now = Date.now();
  const previous = mode === 'override' && draft.id ? await getCollage(db, draft.id) : null;
  const id = previous ? previous.id : newId();
  const renderedUri = await storeRenderedCollage(renderedTempUri, id);

  const saved: SavedCollage = {
    id,
    patient: draft.patient,
    layoutId: draft.layoutId,
    slots: draft.slots,
    renderedUri,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
  await saveCollage(db, saved);

  if (previous) {
    await deleteStoredFile(previous.renderedUri);
    await deleteUnusedCameraPhotos(db, previous, saved);
  }
  return saved;
}

export async function removeCollage(db: SQLiteDatabase, id: string): Promise<void> {
  const collage = await getCollage(db, id);
  if (!collage) return;
  await deleteCollage(db, id);
  await deleteStoredFile(collage.renderedUri);
  await deleteUnusedCameraPhotos(db, collage, null);
}

/** Camera photos can be shared by several collages ("Save as copy"), so only delete orphans. */
async function deleteUnusedCameraPhotos(
  db: SQLiteDatabase,
  old: SavedCollage,
  replacement: SavedCollage | null,
): Promise<void> {
  const keep = new Set(
    (replacement?.slots ?? []).flatMap((image) => (image?.source === 'camera' ? [image.uri] : [])),
  );
  for (const image of old.slots) {
    if (!image || image.source !== 'camera' || keep.has(image.uri)) continue;
    const used = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM collage_images WHERE uri = ?',
      image.uri,
    );
    if (!used || used.n === 0) await deleteStoredFile(image.uri);
  }
}
