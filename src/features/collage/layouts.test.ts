import { clampPan, clampScale, coverSize } from './geometry';
import {
  computeCells,
  getDefaultLayoutId,
  getLayout,
  getLayoutsForCount,
  LAYOUTS,
  resolveRatios,
} from './layouts';

describe('layouts', () => {
  it('offers at least one layout for each image count', () => {
    for (const count of [1, 2, 3, 4] as const) {
      expect(getLayoutsForCount(count).length).toBeGreaterThan(0);
    }
  });

  it('keeps every cell inside the canvas and filling it without overlap', () => {
    for (const layout of LAYOUTS) {
      const area = layout.cells.reduce((sum, c) => sum + c.width * c.height, 0);
      expect(area).toBeCloseTo(1, 5);
      for (const cell of layout.cells) {
        expect(cell.x + cell.width).toBeLessThanOrEqual(1 + 1e-9);
        expect(cell.y + cell.height).toBeLessThanOrEqual(1 + 1e-9);
      }
      expect(layout.cells).toHaveLength(layout.count);
    }
  });

  it('falls back to the default layout for an unknown id or mismatched count', () => {
    expect(getLayout('nope', 2).id).toBe(getDefaultLayoutId(2));
    expect(getLayout('quad-grid', 2).id).toBe(getDefaultLayoutId(2));
  });

  it('leaves a gap between cells but not around the canvas', () => {
    const [left, right] = computeCells(getLayout('duo-side', 2), 100, 100, 10);
    expect(left.x).toBe(0);
    expect(left.width).toBe(45);
    expect(right.x).toBe(55);
    expect(right.x + right.width).toBe(100);
  });
});

describe('resizable cells', () => {
  it('gives the first cell more room when its divider moves', () => {
    const layout = getLayout('duo-side', 2);
    const [left, right] = computeCells(layout, 100, 100, 0, [0.7]);
    expect(left.width).toBeCloseTo(70);
    expect(right.x).toBeCloseTo(70);
  });

  it('uses default ratios when saved ones do not fit the layout', () => {
    const layout = getLayout('quad-grid', 4);
    expect(resolveRatios(layout, [])).toEqual(layout.ratios);
    expect(resolveRatios(layout, [0.3, 0.4, 0.5])).toEqual([0.3, 0.4, 0.5]);
  });

  it('offers four tall images side by side', () => {
    const cells = getLayout('quad-column', 4).cells;
    expect(cells.every((c) => c.height === 1 && Math.abs(c.width - 0.25) < 1e-9)).toBe(true);
  });
});

describe('geometry', () => {
  it('covers the cell on both axes', () => {
    const size = coverSize({ width: 400, height: 200 }, { width: 100, height: 100 });
    expect(size).toEqual({ width: 200, height: 100 });
  });

  it('clamps scale to the allowed range', () => {
    expect(clampScale(0.2)).toBe(1);
    expect(clampScale(99)).toBe(5);
  });

  it('never lets the image reveal empty space', () => {
    expect(clampPan(500, 100, 100, 1)).toBe(0);
    expect(clampPan(500, 100, 100, 2)).toBe(50);
    expect(clampPan(-500, 100, 100, 2)).toBe(-50);
  });
});
