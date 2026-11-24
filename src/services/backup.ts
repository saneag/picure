import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { listCollages } from '@/db/collages-repo';
import { readAsBase64, writeCacheJson } from './file-storage';

/**
 * Exports every collage (patient data, layout, labels, rendered image as base64)
 * to one JSON file and opens the system share sheet so it can be saved anywhere.
 */
export async function exportBackup(db: SQLiteDatabase): Promise<void> {
  const collages = (await listCollages(db)).filter((collage) => !collage.isDraft);
  const withImages = [];
  for (const collage of collages) {
    withImages.push({ ...collage, renderedImageBase64: await readAsBase64(collage.renderedUri) });
  }
  const json = JSON.stringify({
    app: 'picure',
    version: 1,
    exportedAt: Date.now(),
    collages: withImages,
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const uri = await writeCacheJson(`picure-backup-${stamp}.json`, json);
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Picure backup' });
}
