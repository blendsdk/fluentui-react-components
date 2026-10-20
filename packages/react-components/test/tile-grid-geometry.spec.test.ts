import { describe, expect, it } from 'vitest';
import {
  computeGeometry,
  normalizeItems,
  normalizeTileSize,
} from '../src/components/TileGrid/geometry';
import type { TileGridGeometryInput, TileGridItemRect } from '../src/components/TileGrid/geometry';

interface TestItem {
  id: string;
  aspectRatio?: number;
}

function items(count: number, aspectRatio = 1): TestItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`,
    aspectRatio,
  }));
}

function baseInput(
  inputItems: readonly TestItem[],
  overrides: Partial<TileGridGeometryInput<TestItem>> = {}
): TileGridGeometryInput<TestItem> {
  return {
    items: inputItems,
    getItemId: item => item.id,
    getItemAspectRatio: item => item.aspectRatio,
    layout: 'fixed',
    tileSize: 160,
    tileAspectRatio: 1,
    fallbackAspectRatio: 1,
    gap: 0,
    containerWidth: 800,
    ...overrides,
  };
}

function expectRect(
  rect: TileGridItemRect,
  expected: { x: number; y: number; width: number; height: number }
): void {
  expect(rect.x).toBeCloseTo(expected.x);
  expect(rect.y).toBeCloseTo(expected.y);
  expect(rect.width).toBeCloseTo(expected.width);
  expect(rect.height).toBeCloseTo(expected.height);
}

describe('TileGrid geometry', () => {
  it('lays out five fixed items in four automatic columns', () => {
    const result = computeGeometry(
      baseInput(items(5), {
        containerWidth: 440,
        tileSize: 100,
        gap: 10,
        tileAspectRatio: 1,
      })
    );

    expect(result.columnCount).toBe(4);
    expect(result.itemRects).toHaveLength(5);
    expectRect(result.itemRects[0], { x: 0, y: 0, width: 102.5, height: 102.5 });
    expectRect(result.itemRects[1], { x: 112.5, y: 0, width: 102.5, height: 102.5 });
    expectRect(result.itemRects[2], { x: 225, y: 0, width: 102.5, height: 102.5 });
    expectRect(result.itemRects[3], { x: 337.5, y: 0, width: 102.5, height: 102.5 });
    expectRect(result.itemRects[4], { x: 0, y: 112.5, width: 102.5, height: 102.5 });
    expect(result.totalHeight).toBeCloseTo(215);
    expect(result.bands).toHaveLength(2);
    expect(result.bands[0]).toMatchObject({ firstIndex: 0, lastIndex: 3 });
    expect(result.bands[1]).toMatchObject({ firstIndex: 4, lastIndex: 4 });
  });

  it('honors explicit fixed columns and a tile aspect ratio', () => {
    const result = computeGeometry(
      baseInput(items(4), {
        containerWidth: 640,
        tileSize: 160,
        gap: 8,
        tileAspectRatio: 2,
        columns: 4,
      })
    );

    expect(result.columnCount).toBe(4);
    expect(result.itemRects.map(rect => rect.x)).toEqual([0, 162, 324, 486]);
    expectRect(result.itemRects[0], { x: 0, y: 0, width: 154, height: 77 });
    expect(result.totalHeight).toBeCloseTo(77);
  });

  it('assigns masonry items to the shortest lane with leftmost tie-breaking', () => {
    const result = computeGeometry(
      baseInput(items(4), {
        layout: 'masonry',
        containerWidth: 350,
        tileSize: 100,
        gap: 10,
      })
    );

    expect(result.columnCount).toBe(3);
    expect(result.laneCount).toBe(3);
    expect(result.bands).toHaveLength(0);
    expect(result.itemRects.map(rect => rect.x)).toEqual([0, 120, 240, 0]);
    expect(result.itemRects.map(rect => rect.y)).toEqual([0, 0, 0, 120]);
    expect(result.totalHeight).toBeCloseTo(230);
  });

  it('chooses the shortest masonry lane rather than the next source index', () => {
    const source: TestItem[] = [
      { id: 'item-0', aspectRatio: 2 },
      { id: 'item-1', aspectRatio: 1 },
      { id: 'item-2', aspectRatio: 1 },
      { id: 'item-3', aspectRatio: 1 },
    ];
    const result = computeGeometry(
      baseInput(source, {
        layout: 'masonry',
        containerWidth: 350,
        tileSize: 100,
        gap: 10,
      })
    );

    expect(result.itemRects[0].height).toBeCloseTo(55);
    expect(result.itemRects[3].x).toBeCloseTo(0);
    expect(result.itemRects[3].y).toBeCloseTo(65);
    expect(result.totalHeight).toBeCloseTo(175);
  });

  it('fills justified rows and leaves the last row at the target height', () => {
    const result = computeGeometry(
      baseInput(items(4), {
        layout: 'justified',
        containerWidth: 360,
        tileSize: 100,
        gap: 0,
      })
    );

    expect(result.bands).toHaveLength(2);
    expectRect(result.itemRects[0], { x: 0, y: 0, width: 120, height: 120 });
    expectRect(result.itemRects[1], { x: 120, y: 0, width: 120, height: 120 });
    expectRect(result.itemRects[2], { x: 240, y: 0, width: 120, height: 120 });
    expectRect(result.itemRects[3], { x: 0, y: 120, width: 100, height: 100 });
    expect(result.totalHeight).toBeCloseTo(220);
  });

  it('packs a mosaic 2x2 span and fills the remaining cells row-major', () => {
    const source: TestItem[] = [
      { id: 'item-0' },
      { id: 'item-1' },
      { id: 'item-2' },
      { id: 'item-3' },
      { id: 'item-4' },
      { id: 'item-5' },
    ];
    const result = computeGeometry(
      baseInput(source, {
        layout: 'mosaic',
        containerWidth: 430,
        tileSize: 100,
        gap: 10,
        columns: 4,
        getItemSpan: item => (item.id === 'item-0' ? { columns: 2, rows: 2 } : undefined),
      })
    );

    expectRect(result.itemRects[0], { x: 0, y: 0, width: 210, height: 210 });
    expectRect(result.itemRects[1], { x: 220, y: 0, width: 100, height: 100 });
    expectRect(result.itemRects[2], { x: 330, y: 0, width: 100, height: 100 });
    expectRect(result.itemRects[3], { x: 220, y: 110, width: 100, height: 100 });
    expectRect(result.itemRects[4], { x: 330, y: 110, width: 100, height: 100 });
    expectRect(result.itemRects[5], { x: 0, y: 220, width: 100, height: 100 });
    expect(result.totalHeight).toBeCloseTo(320);
  });

  it('falls back for missing, non-finite, zero, and negative aspect ratios', () => {
    const source: TestItem[] = [
      { id: 'item-0', aspectRatio: undefined },
      { id: 'item-1', aspectRatio: Number.POSITIVE_INFINITY },
      { id: 'item-2', aspectRatio: Number.NaN },
      { id: 'item-3', aspectRatio: 0 },
      { id: 'item-4', aspectRatio: -1 },
    ];
    const result = computeGeometry(
      baseInput(source, {
        layout: 'masonry',
        containerWidth: 350,
        tileSize: 100,
        gap: 10,
        fallbackAspectRatio: 1,
      })
    );

    expect(result.itemRects.map(rect => rect.height)).toEqual([110, 110, 110, 110, 110]);

    const invalidRatios = computeGeometry(
      baseInput(items(2), {
        containerWidth: 440,
        tileSize: 100,
        gap: 10,
        tileAspectRatio: Number.POSITIVE_INFINITY,
        fallbackAspectRatio: 0,
      })
    );
    expect(invalidRatios.itemRects[0].height).toBeCloseTo(102.5);
  });

  it('normalizes columns, gaps, and tile-size bounds', () => {
    const oneColumn = computeGeometry(
      baseInput(items(2), {
        containerWidth: 800,
        tileSize: 100,
        gap: 10,
        columns: 0,
      })
    );
    expect(oneColumn.columnCount).toBe(1);

    const truncated = computeGeometry(
      baseInput(items(2), {
        containerWidth: 800,
        tileSize: 100,
        gap: 10,
        columns: 3.9,
      })
    );
    expect(truncated.columnCount).toBe(3);

    const automatic = computeGeometry(
      baseInput(items(2), {
        containerWidth: 800,
        tileSize: 100,
        gap: 10,
        columns: Number.POSITIVE_INFINITY,
      })
    );
    expect(automatic.columnCount).toBe(7);

    const zeroGap = computeGeometry(
      baseInput(items(2), {
        containerWidth: 300,
        tileSize: 100,
        gap: -5,
        columns: 2,
      })
    );
    expect(zeroGap.itemRects[0].width).toBeCloseTo(150);
    expect(zeroGap.itemRects[1].x).toBeCloseTo(150);

    expect(normalizeTileSize(350, 400, 300)).toBe(300);
    expect(normalizeTileSize(50, 120, 320)).toBe(120);
    expect(normalizeTileSize(500, 120, 320)).toBe(320);
    expect(normalizeTileSize(Number.NaN, 120, 320)).toBe(160);
  });

  it('keeps the first occurrence of duplicate item IDs', () => {
    const source: TestItem[] = [{ id: 'item-0' }, { id: 'item-1' }, { id: 'item-0' }];
    const normalized = normalizeItems(source, item => item.id);

    expect(normalized.items.map(item => item.id)).toEqual(['item-0', 'item-1']);
    expect(normalized.duplicateIds).toEqual(['item-0']);

    const result = computeGeometry(
      baseInput(source, {
        containerWidth: 440,
        tileSize: 100,
        gap: 10,
      })
    );
    expect(result.itemRects).toHaveLength(2);
    expect(result.itemRects.map(rect => rect.id)).toEqual(['item-0', 'item-1']);
  });

  it('clamps an invalid mosaic span to the available grid', () => {
    const result = computeGeometry(
      baseInput(items(1), {
        layout: 'mosaic',
        containerWidth: 430,
        tileSize: 100,
        gap: 10,
        columns: 4,
        // @ts-expect-error Runtime-invalid spans must be normalized defensively.
        getItemSpan: () => ({ columns: 3, rows: 0 }),
      })
    );

    expectRect(result.itemRects[0], { x: 0, y: 0, width: 210, height: 100 });
    expect(result.totalHeight).toBeCloseTo(100);
  });

  it('answers visible-item, offset, point, and range queries', () => {
    const result = computeGeometry(
      baseInput(items(5), {
        containerWidth: 440,
        tileSize: 100,
        gap: 10,
        tileAspectRatio: 1,
      })
    );

    expect(result.firstVisibleItem(0)?.id).toBe('item-0');
    expect(result.firstVisibleItem(113)?.id).toBe('item-4');
    expect(result.offsetForItem('item-4')).toBeCloseTo(112.5);
    expect(result.offsetForItem('missing')).toBeUndefined();
    expect(result.indexAtPoint(120, 0)).toBe(1);
    expect(result.itemsInRange(104, 113)).toEqual([4]);

    const masonry = computeGeometry(
      baseInput(items(4), {
        layout: 'masonry',
        containerWidth: 350,
        tileSize: 100,
        gap: 10,
      })
    );
    expect(masonry.firstVisibleItem(120)?.id).toBe('item-3');

    const mosaic = computeGeometry(
      baseInput(items(6), {
        layout: 'mosaic',
        containerWidth: 430,
        tileSize: 100,
        gap: 10,
        columns: 4,
        getItemSpan: item => (item.id === 'item-0' ? { columns: 2, rows: 2 } : undefined),
      })
    );
    expect(mosaic.itemsInRange(100, 120)).toEqual([0, 3, 4]);
  });

  it('returns an empty result before the container has a measured width', () => {
    const result = computeGeometry(
      baseInput(items(2), {
        containerWidth: 0,
      })
    );

    expect(result.itemRects).toHaveLength(0);
    expect(result.bands).toHaveLength(0);
    expect(result.totalHeight).toBe(0);
    expect(result.columnCount).toBe(1);
  });
});
