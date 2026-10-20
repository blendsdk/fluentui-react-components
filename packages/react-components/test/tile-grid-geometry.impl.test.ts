import { describe, expect, it } from 'vitest';
import {
  computeColumnCount,
  computeGeometry,
  normalizeAspectRatio,
  normalizeColumns,
  normalizeContainerWidth,
  normalizeGap,
  normalizeItems,
  normalizeSpan,
  normalizeTileSize,
} from '../src/components/TileGrid/geometry';
import type {
  TileGridGeometryInput,
  TileGridItemRect,
  TileGridLayout,
} from '../src/components/TileGrid/geometry';

interface ImplItem {
  id: string;
  aspectRatio?: number;
}

const RATIOS = [0.8, 1, 1.25, 1.5, 2] as const;
const EPSILON = 0.001;

function fixture(count: number): ImplItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`,
    aspectRatio: RATIOS[index % RATIOS.length],
  }));
}

function input(
  layout: TileGridLayout,
  overrides: Partial<TileGridGeometryInput<ImplItem>> = {}
): TileGridGeometryInput<ImplItem> {
  return {
    items: fixture(120),
    getItemId: item => item.id,
    getItemAspectRatio: item => item.aspectRatio,
    layout,
    tileSize: 160,
    tileAspectRatio: 1,
    fallbackAspectRatio: 1,
    gap: 8,
    containerWidth: 900,
    ...overrides,
  };
}

function overlaps(left: TileGridItemRect, right: TileGridItemRect): boolean {
  return (
    left.x < right.x + right.width - EPSILON &&
    left.x + left.width > right.x + EPSILON &&
    left.y < right.y + right.height - EPSILON &&
    left.y + left.height > right.y + EPSILON
  );
}

function expectLayoutInvariants(layout: TileGridLayout): void {
  const result = computeGeometry(input(layout));

  expect(result.itemRects).toHaveLength(120);
  expect(result.itemRects.map(rect => rect.index)).toEqual(
    Array.from({ length: 120 }, (_, index) => index)
  );

  for (let left = 0; left < result.itemRects.length; left += 1) {
    const leftRect = result.itemRects[left];
    expect(leftRect.x).toBeGreaterThanOrEqual(-EPSILON);
    expect(leftRect.y).toBeGreaterThanOrEqual(-EPSILON);
    expect(leftRect.x + leftRect.width).toBeLessThanOrEqual(900 + EPSILON);

    for (let right = left + 1; right < result.itemRects.length; right += 1) {
      expect(overlaps(leftRect, result.itemRects[right])).toBe(false);
    }
  }

  const maxBottom = Math.max(...result.itemRects.map(rect => rect.y + rect.height));
  expect(result.totalHeight).toBeCloseTo(maxBottom);
}

describe('TileGrid geometry implementation details', () => {
  it('keeps non-overlapping, in-bounds, source-ordered rects for every layout', () => {
    for (const layout of ['fixed', 'masonry', 'justified', 'mosaic'] as const) {
      expectLayoutInvariants(layout);
    }
  });

  it('keeps band starts ordered for fixed, justified, and mosaic layouts', () => {
    for (const layout of ['fixed', 'justified', 'mosaic'] as const) {
      const result = computeGeometry(input(layout));

      expect(result.bands.length).toBeGreaterThan(0);
      for (let index = 1; index < result.bands.length; index += 1) {
        expect(result.bands[index].start).toBeGreaterThanOrEqual(result.bands[index - 1].start);
      }
    }

    expect(computeGeometry(input('masonry')).bands).toHaveLength(0);
  });

  it('includes a tall mosaic span in every covered band', () => {
    const result = computeGeometry(
      input('mosaic', {
        items: fixture(6),
        containerWidth: 430,
        tileSize: 100,
        gap: 10,
        columns: 4,
        getItemSpan: item => (item.id === 'item-0' ? { columns: 2, rows: 2 } : undefined),
      })
    );

    expect(result.bands.map(band => [band.firstIndex, band.lastIndex])).toEqual([
      [0, 2],
      [0, 4],
      [5, 5],
    ]);
  });

  it('fills every completed justified row to the container width', () => {
    const result = computeGeometry(input('justified'));

    for (let index = 0; index < result.bands.length - 1; index += 1) {
      const band = result.bands[index];
      const row = result.itemRects.filter(
        rect => rect.index >= band.firstIndex && rect.index <= band.lastIndex
      );
      const filled = row.reduce((total, rect) => total + rect.width, 0) + 8 * (row.length - 1);

      expect(filled).toBeCloseTo(900);
    }

    const lastBand = result.bands[result.bands.length - 1];
    expect(lastBand.height).toBeCloseTo(160);
  });

  it('normalizes numeric bounds, ratios, gaps, widths, columns, and spans', () => {
    expect(normalizeTileSize(Number.POSITIVE_INFINITY, 120, 320)).toBe(160);
    expect(normalizeTileSize(500, Number.NaN, 300)).toBe(300);
    expect(normalizeTileSize(0, 120, 320)).toBe(120);
    expect(normalizeAspectRatio(Number.NaN, 1.5)).toBe(1.5);
    expect(normalizeAspectRatio(Number.POSITIVE_INFINITY, Number.NaN)).toBe(1);
    expect(normalizeGap(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeGap(-4)).toBe(0);
    expect(normalizeContainerWidth(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeContainerWidth(-1)).toBe(0);
    expect(normalizeColumns(-2, 900, 160, 8)).toBe(1);
    expect(normalizeColumns(Number.NaN, 900, 160, 8)).toBe(5);
    expect(normalizeColumns(100, 440, 100, 10)).toBe(45);
    expect(computeColumnCount(0, 160, 8)).toBe(1);
    expect(normalizeSpan(undefined, 0)).toEqual({ columns: 1, rows: 1 });
    expect(normalizeSpan({ columns: 2, rows: 2 }, 1)).toEqual({ columns: 1, rows: 2 });
    expect(normalizeSpan({ columns: 0, rows: 3 }, 4)).toEqual({ columns: 1, rows: 2 });
  });

  it('handles duplicate and empty item lists deterministically', () => {
    const normalized = normalizeItems(
      [{ id: 'a' }, { id: 'b' }, { id: 'a' }, { id: 'a' }],
      item => item.id
    );
    expect(normalized.items.map(item => item.id)).toEqual(['a', 'b']);
    expect(normalized.duplicateIds).toEqual(['a', 'a']);

    const empty = computeGeometry(input('fixed', { items: [] }));
    expect(empty.itemRects).toHaveLength(0);
    expect(empty.bands).toHaveLength(0);
    expect(empty.totalHeight).toBe(0);
    expect(empty.firstVisibleItem(0)).toBeUndefined();
    expect(empty.itemsInRange(0, 100)).toEqual([]);
  });

  it('returns an empty result for a non-finite container width', () => {
    const result = computeGeometry(input('masonry', { containerWidth: Number.POSITIVE_INFINITY }));

    expect(result.itemRects).toHaveLength(0);
    expect(result.totalHeight).toBe(0);
    expect(result.columnCount).toBe(1);
  });

  it('answers boundary queries with half-open rectangles and sorted ranges', () => {
    const result = computeGeometry(
      input('fixed', {
        items: fixture(5),
        tileSize: 100,
        gap: 10,
        containerWidth: 440,
      })
    );

    expect(result.indexAtPoint(-1, 0)).toBeUndefined();
    expect(result.indexAtPoint(0, 0)).toBe(0);
    expect(result.indexAtPoint(102.5, 0)).toBeUndefined();
    expect(result.indexAtPoint(112.5, 0)).toBe(1);
    expect(result.indexAtPoint(440, 0)).toBeUndefined();
    expect(result.firstVisibleItem(105)?.id).toBe('item-4');
    expect(result.firstVisibleItem(10_000)).toBeUndefined();
    expect(result.offsetForItem('item-4')).toBeCloseTo(112.5);
    expect(result.offsetForItem('missing')).toBeUndefined();
    expect(result.itemsInRange(200, 100)).toEqual([]);
    expect(result.itemsInRange(0, 1_000)).toEqual([0, 1, 2, 3, 4]);
  });

  it('returns the lowest-index masonry lane on a tie', () => {
    const result = computeGeometry(
      input('masonry', {
        items: fixture(4).map(item => ({ ...item, aspectRatio: 1 })),
        tileSize: 100,
        gap: 10,
        containerWidth: 350,
      })
    );

    expect(result.itemRects[1].x).toBeCloseTo(120);
    expect(result.itemRects[2].x).toBeCloseTo(240);
    expect(result.itemRects[3].x).toBeCloseTo(0);
  });

  it('keeps mosaic band indexes valid and uniquely keyable for tall spans', () => {
    const result = computeGeometry(
      input('mosaic', {
        items: [{ id: 'a' }, { id: 'b' }],
        columns: 2,
        containerWidth: 300,
        tileSize: 100,
        gap: 10,
        getItemSpan: () => ({ columns: 1, rows: 2 }),
      })
    );

    expect(result.bands.length).toBeGreaterThan(0);
    for (const band of result.bands) {
      expect(band.firstIndex).toBeGreaterThanOrEqual(0);
      expect(band.lastIndex).toBeGreaterThanOrEqual(band.firstIndex);
    }

    const keys = result.bands.map((band, index) => `${index}:${band.firstIndex}:${band.lastIndex}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('lays out 20K span-heavy mosaic items within the geometry budget', () => {
    const large = fixture(20_000);
    const startedAt = performance.now();
    const result = computeGeometry(
      input('mosaic', {
        items: large,
        containerWidth: 1_200,
        tileSize: 160,
        gap: 8,
        getItemSpan: item =>
          Number(item.id.slice('item-'.length)) % 4 === 0 ? { columns: 2, rows: 2 } : undefined,
      })
    );
    const elapsed = performance.now() - startedAt;

    expect(result.itemRects).toHaveLength(20_000);
    expect(elapsed).toBeLessThan(200);
  });

  it('keeps excessive columns and huge justified ratios finite', () => {
    const excessive = computeGeometry(
      input('fixed', {
        columns: 100,
        containerWidth: 440,
        tileSize: 100,
        gap: 10,
      })
    );
    expect(excessive.columnCount).toBe(45);
    expect(excessive.itemRects.every(rect => rect.width >= 0 && rect.height >= 0)).toBe(true);
    expect(excessive.totalHeight).toBeGreaterThanOrEqual(0);

    const hugeRatio = computeGeometry(
      input('justified', {
        items: [{ id: 'wide', aspectRatio: 1e308 }],
        containerWidth: 900,
        tileSize: 160,
        gap: 8,
      })
    );
    expect(Number.isFinite(hugeRatio.itemRects[0].width)).toBe(true);
    expect(hugeRatio.itemRects[0].width).toBeLessThanOrEqual(900 + EPSILON);
  });

  it('surfaces an application callback error at the compute call site', () => {
    expect(() =>
      computeGeometry(
        input('masonry', {
          getItemAspectRatio: () => {
            throw new Error('ratio failure');
          },
        })
      )
    ).toThrow('ratio failure');
  });
});
