import type { SlotCount } from './types';

/** Position and size as fractions (0..1) of the collage canvas. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutDef {
  id: string;
  count: SlotCount;
  cells: Rect[];
}

/** Output is always 4:5 portrait. */
export const CANVAS_ASPECT = 4 / 5;
export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;

const r = (x: number, y: number, width: number, height: number): Rect => ({ x, y, width, height });

/** The first layout of each count is the default. Fewer images means bigger cells. */
export const LAYOUTS: LayoutDef[] = [
  { id: 'single', count: 1, cells: [r(0, 0, 1, 1)] },

  { id: 'duo-side', count: 2, cells: [r(0, 0, 0.5, 1), r(0.5, 0, 0.5, 1)] },
  { id: 'duo-stack', count: 2, cells: [r(0, 0, 1, 0.5), r(0, 0.5, 1, 0.5)] },

  {
    id: 'trio-left',
    count: 3,
    cells: [r(0, 0, 0.5, 1), r(0.5, 0, 0.5, 0.5), r(0.5, 0.5, 0.5, 0.5)],
  },
  {
    id: 'trio-top',
    count: 3,
    cells: [r(0, 0, 1, 0.5), r(0, 0.5, 0.5, 0.5), r(0.5, 0.5, 0.5, 0.5)],
  },
  {
    id: 'trio-row',
    count: 3,
    cells: [r(0, 0, 1 / 3, 1), r(1 / 3, 0, 1 / 3, 1), r(2 / 3, 0, 1 / 3, 1)],
  },

  {
    id: 'quad-grid',
    count: 4,
    cells: [r(0, 0, 0.5, 0.5), r(0.5, 0, 0.5, 0.5), r(0, 0.5, 0.5, 0.5), r(0.5, 0.5, 0.5, 0.5)],
  },
  {
    id: 'quad-top',
    count: 4,
    cells: [
      r(0, 0, 1, 0.5),
      r(0, 0.5, 1 / 3, 0.5),
      r(1 / 3, 0.5, 1 / 3, 0.5),
      r(2 / 3, 0.5, 1 / 3, 0.5),
    ],
  },
  {
    id: 'quad-left',
    count: 4,
    cells: [
      r(0, 0, 0.5, 1),
      r(0.5, 0, 0.5, 1 / 3),
      r(0.5, 1 / 3, 0.5, 1 / 3),
      r(0.5, 2 / 3, 0.5, 1 / 3),
    ],
  },
];

export function getLayoutsForCount(count: SlotCount): LayoutDef[] {
  return LAYOUTS.filter((layout) => layout.count === count);
}

export function getDefaultLayoutId(count: SlotCount): string {
  return getLayoutsForCount(count)[0].id;
}

/** Falls back to the default layout when the id is unknown (e.g. layouts removed in a later version). */
export function getLayout(layoutId: string, count: SlotCount): LayoutDef {
  return (
    LAYOUTS.find((layout) => layout.id === layoutId && layout.count === count) ??
    getLayoutsForCount(count)[0]
  );
}

/**
 * Converts layout fractions to pixels. Cells are separated by `gap` pixels,
 * but there is no margin around the outside of the collage.
 */
export function computeCells(
  layout: LayoutDef,
  width: number,
  height: number,
  gap: number,
): Rect[] {
  const half = gap / 2;
  return layout.cells.map((cell) => {
    const left = cell.x === 0 ? 0 : half;
    const top = cell.y === 0 ? 0 : half;
    const right = cell.x + cell.width >= 1 ? 0 : half;
    const bottom = cell.y + cell.height >= 1 ? 0 : half;
    return {
      x: cell.x * width + left,
      y: cell.y * height + top,
      width: cell.width * width - left - right,
      height: cell.height * height - top - bottom,
    };
  });
}
