import * as MediaLibrary from 'expo-media-library/legacy';

const ALBUM_NAME = 'Picure';
const PAGE_SIZE = 60;

export interface GalleryPhoto {
  id: string;
  uri: string;
  width: number;
  height: number;
}

export async function requestGalleryAccess(): Promise<boolean> {
  const current = await MediaLibrary.getPermissionsAsync(false, ['photo']);
  if (current.granted) return true;
  const next = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
  return next.granted;
}

/** Lists gallery photos newest first. Returns references only; nothing is copied. */
export async function loadGalleryPage(after?: string) {
  const page = await MediaLibrary.getAssetsAsync({
    first: PAGE_SIZE,
    after,
    mediaType: MediaLibrary.MediaType.photo,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });
  return {
    photos: page.assets.map<GalleryPhoto>((asset) => ({
      id: asset.id,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
    })),
    endCursor: page.endCursor,
    hasNextPage: page.hasNextPage,
  };
}

/** Saves a rendered collage into the "Picure" gallery album, creating the album when needed. */
export async function saveToGalleryAlbum(fileUri: string): Promise<void> {
  const granted = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!granted.granted) throw new Error('gallery-permission-denied');

  const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
  if (album) {
    // Creating straight into the album avoids Android's "modify this photo" prompt.
    await MediaLibrary.createAssetAsync(fileUri, album);
    return;
  }
  const asset = await MediaLibrary.createAssetAsync(fileUri);
  await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
}
