import * as FileSystem from 'expo-file-system/legacy';

/** Everything below is private app storage: invisible to the gallery and removed on uninstall. */
const COLLAGES_DIR = `${FileSystem.documentDirectory}collages/`;
const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;

async function ensureDir(dir: string) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

async function moveInto(dir: string, fileName: string, fromUri: string): Promise<string> {
  await ensureDir(dir);
  const target = `${dir}${fileName}`;
  await FileSystem.copyAsync({ from: fromUri, to: target });
  return target;
}

/** A fresh file name per save, so the image cache never shows a stale collage after "Override". */
export function storeRenderedCollage(tempUri: string, collageId: string): Promise<string> {
  return moveInto(COLLAGES_DIR, `${collageId}-${Date.now()}.jpg`, tempUri);
}

export function storeCameraPhoto(tempUri: string, imageId: string): Promise<string> {
  return moveInto(PHOTOS_DIR, `${imageId}.jpg`, tempUri);
}

export async function deleteStoredFile(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function readAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export async function writeCacheJson(fileName: string, json: string): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, json);
  return uri;
}
