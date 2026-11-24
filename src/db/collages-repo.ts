import type { SQLiteDatabase } from 'expo-sqlite';
import type { CollageImage, SavedCollage } from '@/features/collage/types';

interface CollageRow {
  id: string;
  patient_name: string;
  email: string;
  phone: string;
  description: string;
  procedure_count: number;
  layout_id: string;
  slot_count: number;
  rendered_uri: string;
  created_at: number;
  updated_at: number;
}

interface ImageRow {
  id: string;
  collage_id: string;
  slot_index: number;
  uri: string;
  asset_id: string | null;
  source: 'gallery' | 'camera';
  width: number;
  height: number;
  scale: number;
  offset_x: number;
  offset_y: number;
  label_text: string;
  label_color: string;
  label_size: 'sm' | 'md' | 'lg';
  label_position: CollageImage['label']['position'];
}

function toImage(row: ImageRow): CollageImage {
  return {
    id: row.id,
    uri: row.uri,
    assetId: row.asset_id,
    source: row.source,
    width: row.width,
    height: row.height,
    scale: row.scale,
    offsetX: row.offset_x,
    offsetY: row.offset_y,
    label: {
      text: row.label_text,
      color: row.label_color,
      size: row.label_size,
      position: row.label_position,
    },
  };
}

function toCollage(row: CollageRow, images: ImageRow[]): SavedCollage {
  const slots: (CollageImage | null)[] = Array.from({ length: row.slot_count }, () => null);
  for (const image of images) slots[image.slot_index] = toImage(image);
  return {
    id: row.id,
    patient: {
      name: row.patient_name,
      email: row.email,
      phone: row.phone,
      description: row.description,
      procedureCount: row.procedure_count,
    },
    layoutId: row.layout_id,
    slots,
    renderedUri: row.rendered_uri,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCollages(db: SQLiteDatabase, search = ''): Promise<SavedCollage[]> {
  const term = `%${search.trim()}%`;
  const rows = await db.getAllAsync<CollageRow>(
    'SELECT * FROM collages WHERE patient_name LIKE ? ORDER BY updated_at DESC',
    term,
  );
  const images = await db.getAllAsync<ImageRow>('SELECT * FROM collage_images');
  return rows.map((row) =>
    toCollage(
      row,
      images.filter((image) => image.collage_id === row.id),
    ),
  );
}

export async function getCollage(db: SQLiteDatabase, id: string): Promise<SavedCollage | null> {
  const row = await db.getFirstAsync<CollageRow>('SELECT * FROM collages WHERE id = ?', id);
  if (!row) return null;
  const images = await db.getAllAsync<ImageRow>(
    'SELECT * FROM collage_images WHERE collage_id = ?',
    id,
  );
  return toCollage(row, images);
}

/** Inserts or fully replaces a collage and its images in one transaction. */
export async function saveCollage(db: SQLiteDatabase, collage: SavedCollage): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO collages
        (id, patient_name, email, phone, description, procedure_count, layout_id, slot_count,
         rendered_uri, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      collage.id,
      collage.patient.name,
      collage.patient.email,
      collage.patient.phone,
      collage.patient.description,
      collage.patient.procedureCount,
      collage.layoutId,
      collage.slots.length,
      collage.renderedUri,
      collage.createdAt,
      collage.updatedAt,
    );
    await db.runAsync('DELETE FROM collage_images WHERE collage_id = ?', collage.id);
    for (const [index, image] of collage.slots.entries()) {
      if (!image) continue;
      await db.runAsync(
        `INSERT INTO collage_images
          (id, collage_id, slot_index, uri, asset_id, source, width, height, scale, offset_x,
           offset_y, label_text, label_color, label_size, label_position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        `${collage.id}:${index}`,
        collage.id,
        index,
        image.uri,
        image.assetId,
        image.source,
        image.width,
        image.height,
        image.scale,
        image.offsetX,
        image.offsetY,
        image.label.text,
        image.label.color,
        image.label.size,
        image.label.position,
      );
    }
  });
}

export async function deleteCollage(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM collages WHERE id = ?', id);
}
