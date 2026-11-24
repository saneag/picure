import type { SlotCount } from './types';

/** Position and size as fractions (0..1) of the collage canvas. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A cell index, or a split of the area into two parts. `row` = side by side, `col` = stacked. */
type Node = number | { dir: 'row' | 'col'; a: Node; b: Node };

/** A draggable divider. `rect` is the area it splits and `ratio` is the share of the first part. */
export interface Split {
  dir: 'row' | 'col';
  rect: Rect;
  ratio: number;
}

export interface LayoutDef {
  id: string;
  count: SlotCount;
  tree: Node;
  /** Default share of the first part for each split, in tree order (first split = the root). */
  ratios: number[];
  /** Cells at the default ratios. */
  cells: Rect[];
}

export const MIN_RATIO = 0.2;
export const MAX_RATIO = 0.8;

/** Output is always 4:5 portrait. */
export const CANVAS_ASPECT = 4 / 5;
export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;

const row = (a: Node, b: Node): Node => ({ dir: 'row', a, b });
const col = (a: Node, b: Node): Node => ({ dir: 'col', a, b });

/** Places the cells and dividers of a layout for the given split ratios (fractions of the canvas). */
export function computeLayout(tree: Node, ratios: number[]): { cells: Rect[]; splits: Split[] } {
  const cells: Rect[] = [];
  const splits: Split[] = [];
  let next = 0;
  const walk = (node: Node, rect: Rect) => {
    if (typeof node === 'number') {
      cells[node] = rect;
      return;
    }
    const index = next++;
    const ratio = ratios[index];
    splits[index] = { dir: node.dir, rect, ratio };
    if (node.dir === 'row') {
      const w = rect.width * ratio;
      walk(node.a, { ...rect, width: w });
      walk(node.b, { ...rect, x: rect.x + w, width: rect.width - w });
    } else {
      const h = rect.height * ratio;
      walk(node.a, { ...rect, height: h });
      walk(node.b, { ...rect, y: rect.y + h, height: rect.height - h });
    }
  };
  walk(tree, { x: 0, y: 0, width: 1, height: 1 });
  return { cells, splits };
}

function def(id: string, count: SlotCount, tree: Node, ratios: number[]): LayoutDef {
  return { id, count, tree, ratios, cells: computeLayout(tree, ratios).cells };
}

/** The first layout of each count is the default. Fewer images means bigger cells. */
export const LAYOUTS: LayoutDef[] = [
  def('single', 1, 0, []),

  def('duo-side', 2, row(0, 1), [0.5]),
  def('duo-stack', 2, col(0, 1), [0.5]),

  def('trio-left', 3, row(0, col(1, 2)), [0.5, 0.5]),
  def('trio-top', 3, col(0, row(1, 2)), [0.5, 0.5]),
  def('trio-row', 3, row(0, row(1, 2)), [1 / 3, 1 / 2]),

  def('quad-grid', 4, col(row(0, 1), row(2, 3)), [0.5, 0.5, 0.5]),
  def('quad-top', 4, col(0, row(1, row(2, 3))), [0.5, 1 / 3, 1 / 2]),
  def('quad-left', 4, row(0, col(1, col(2, 3))), [0.5, 1 / 3, 1 / 2]),
  def('quad-column', 4, row(0, row(1, row(2, 3))), [1 / 4, 1 / 3, 1 / 2]),
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

/** Uses the given ratios when they fit the layout, otherwise the layout's defaults. */
export function resolveRatios(layout: LayoutDef, ratios?: number[] | null): number[] {
  return ratios && ratios.length === layout.ratios.length ? ratios : layout.ratios;
}

const EDGE = 1e-6;

/**
 * Converts layout fractions to pixels. Cells are separated by `gap` pixels,
 * but there is no margin around the outside of the collage.
 */
export function computeCells(
  layout: LayoutDef,
  width: number,
  height: number,
  gap: number,
  ratios?: number[] | null,
): Rect[] {
  const half = gap / 2;
  const { cells } = computeLayout(layout.tree, resolveRatios(layout, ratios));
  return cells.map((cell) => {
    const left = cell.x < EDGE ? 0 : half;
    const top = cell.y < EDGE ? 0 : half;
    const right = cell.x + cell.width >= 1 - EDGE ? 0 : half;
    const bottom = cell.y + cell.height >= 1 - EDGE ? 0 : half;
    return {
      x: cell.x * width + left,
      y: cell.y * height + top,
      width: cell.width * width - left - right,
      height: cell.height * height - top - bottom,
    };
  });
}
