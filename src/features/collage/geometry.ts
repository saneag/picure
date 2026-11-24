export const MIN_SCALE = 1;
export const MAX_SCALE = 5;

interface Size {
  width: number;
  height: number;
}

/** Size of the image after the "cover" fit: the smallest size that fills the cell. */
export function coverSize(image: Size, cell: Size): Size {
  'worklet';
  const factor = Math.max(cell.width / image.width, cell.height / image.height);
  return { width: image.width * factor, height: image.height * factor };
}

export function clampScale(scale: number): number {
  'worklet';
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * Limits a pan (in pixels) so the image never leaves an empty gap inside the cell.
 */
export function clampPan(pan: number, imageSize: number, cellSize: number, scale: number): number {
  'worklet';
  const limit = Math.max(0, (imageSize * scale - cellSize) / 2);
  return Math.min(limit, Math.max(-limit, pan));
}
