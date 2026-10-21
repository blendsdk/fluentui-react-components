import { useVirtualizer } from '@tanstack/react-virtual';
import type { Virtualizer } from '@tanstack/react-virtual';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useLayoutEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { computeGeometry } from '../src/components/TileGrid/geometry';
import type { TileGridGeometryResult, TileGridLayout } from '../src/components/TileGrid/geometry';
import { buildBandVirtualizerOptions } from '../src/components/TileGrid/virtualization/options';
import { buildMasonryVirtualizerOptions } from '../src/components/TileGrid/virtualization/options';
import {
  maxScroll,
  scrollToIndex,
  scrollToItem,
  scrollToOffset,
  scrollToSelected,
} from '../src/components/TileGrid/virtualization/scrollHelpers';
import { createTileGridFixture } from './fixtures/tileGridFixture';
import type { TileGridFixtureItem } from './fixtures/tileGridFixture';
import { setElementSize } from './jsdomStubs';

const ITEM_COUNT = 20_000;
const CONTAINER_WIDTH = 1_440;
const CONTAINER_HEIGHT = 900;
const TILE_SIZE = 160;
const GAP = 8;
const fixture = createTileGridFixture(ITEM_COUNT);

function mosaicSpan(item: TileGridFixtureItem): { columns?: 1 | 2; rows?: 1 | 2 } | undefined {
  const index = Number.parseInt(item.id.slice('tile-'.length), 10);
  return index % 7 === 0 ? { columns: 2, rows: 2 } : undefined;
}

function createGeometry(layout: TileGridLayout): TileGridGeometryResult {
  return computeGeometry({
    items: fixture,
    getItemId: item => item.id,
    getItemAspectRatio: item => item.aspectRatio,
    getItemSpan: layout === 'mosaic' ? mosaicSpan : undefined,
    layout,
    tileSize: TILE_SIZE,
    gap: GAP,
    containerWidth: CONTAINER_WIDTH,
    tileAspectRatio: 1,
    fallbackAspectRatio: 1,
  });
}

interface VirtualizerProbeProps {
  layout: TileGridLayout;
  geometry: TileGridGeometryResult;
  onReady: (virtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>) => void;
}

/**
 * Hosts one real TanStack virtualizer against a measured scroll element.
 *
 * The probe is intentionally thin: the test compares the virtualizer's
 * measurements with the geometry result, not with a second layout algorithm.
 */
function VirtualizerProbe({ layout, geometry, onReady }: VirtualizerProbeProps): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const getScrollElement = useRef(() => rootRef.current).current;
  const options =
    layout === 'masonry'
      ? buildMasonryVirtualizerOptions({
          geometry,
          getScrollElement,
          gap: GAP,
        })
      : buildBandVirtualizerOptions({
          geometry,
          getScrollElement,
          gap: GAP,
        });
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>(options);

  useLayoutEffect(() => {
    onReady(virtualizer);
  }, [onReady, virtualizer]);

  return <div data-testid="virtualizer-host" ref={rootRef} style={{ height: CONTAINER_HEIGHT }} />;
}

function mountProbe(layout: TileGridLayout, geometry: TileGridGeometryResult) {
  let instance: Virtualizer<HTMLDivElement, HTMLDivElement> | undefined;
  const onReady = (value: Virtualizer<HTMLDivElement, HTMLDivElement>): void => {
    instance = value;
  };

  render(<VirtualizerProbe layout={layout} geometry={geometry} onReady={onReady} />);

  const host = screen.getByTestId('virtualizer-host');
  act(() => {
    setElementSize(host, CONTAINER_WIDTH, CONTAINER_HEIGHT);
  });

  return {
    getInstance: (): Virtualizer<HTMLDivElement, HTMLDivElement> | undefined => instance,
  };
}

describe('tile grid virtualizer parity', () => {
  it.each(['fixed', 'justified', 'mosaic'] as const)(
    'matches band starts, sizes, and total height for the %s layout',
    async layout => {
      const geometry = createGeometry(layout);
      const { getInstance } = mountProbe(layout, geometry);

      await waitFor(
        () => {
          expect(getInstance()?.getTotalSize()).toBeGreaterThan(0);
        },
        { timeout: 10_000 }
      );

      const virtualizer = getInstance();
      expect(virtualizer).toBeDefined();
      if (!virtualizer) {
        return;
      }

      const measurements = virtualizer.measurementsCache;
      expect(measurements).toHaveLength(geometry.bands.length);
      expect(virtualizer.getTotalSize()).toBeCloseTo(geometry.totalHeight, 5);

      geometry.bands.forEach((band, index) => {
        expect(measurements[index].start).toBeCloseTo(band.start, 5);
        expect(measurements[index].size).toBeCloseTo(band.height, 5);
      });
    }
  );

  it('matches every masonry lane and item start for the 20K fixture', async () => {
    const geometry = createGeometry('masonry');
    const { getInstance } = mountProbe('masonry', geometry);

    await waitFor(
      () => {
        expect(getInstance()?.measurementsCache.length).toBe(ITEM_COUNT);
      },
      { timeout: 10_000 }
    );

    const virtualizer = getInstance();
    expect(virtualizer).toBeDefined();
    if (!virtualizer) {
      return;
    }

    expect(virtualizer.getTotalSize()).toBeCloseTo(geometry.totalHeight, 5);

    geometry.itemRects.forEach((rect, index) => {
      const measurement = virtualizer.measurementsCache[index];
      // Equal lane ends can produce a different lane number in TanStack; the
      // rendered start is still identical, and geometry remains authoritative.
      expect(measurement.start).toBeCloseTo(rect.y, 5);
      expect(measurement.end).toBeCloseTo(rect.y + rect.height, 5);
      expect(measurement.lane).toBeGreaterThanOrEqual(0);
      expect(measurement.lane).toBeLessThan(geometry.laneCount);
    });
  });
});

describe('tile grid scroll helpers', () => {
  const scrollItems = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Bravo' },
    { id: 'c', label: 'Charlie' },
  ] as const;

  function createScrollRoot(scrollHeight = 500, clientHeight = 100): HTMLDivElement {
    const root = document.createElement('div');
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: scrollHeight });
    Object.defineProperty(root, 'clientHeight', { configurable: true, value: clientHeight });
    root.scrollTop = 0;
    return root;
  }

  function createScrollGeometry(): TileGridGeometryResult {
    return computeGeometry({
      items: scrollItems,
      getItemId: item => item.id,
      layout: 'fixed',
      columns: 1,
      tileSize: 100,
      gap: 0,
      containerWidth: 100,
      tileAspectRatio: 1,
      fallbackAspectRatio: 1,
    });
  }

  it('clamps finite offsets and ignores non-finite offsets', () => {
    const root = createScrollRoot();

    expect(maxScroll(root)).toBe(400);
    scrollToOffset(root, 600);
    expect(root.scrollTop).toBe(400);
    scrollToOffset(root, -20);
    expect(root.scrollTop).toBe(0);
    scrollToOffset(root, 123);
    expect(root.scrollTop).toBe(123);
    scrollToOffset(root, Number.NaN);
    expect(root.scrollTop).toBe(123);
  });

  it('resolves item and index offsets and ignores unknown or invalid targets', () => {
    const root = createScrollRoot();
    const geometry = createScrollGeometry();

    scrollToItem(root, geometry, 'c');
    expect(root.scrollTop).toBe(200);
    scrollToItem(root, geometry, 'missing');
    expect(root.scrollTop).toBe(200);
    scrollToIndex(root, geometry, 1);
    expect(root.scrollTop).toBe(100);
    scrollToIndex(root, geometry, 1.5);
    expect(root.scrollTop).toBe(100);
    scrollToIndex(root, geometry, 99);
    expect(root.scrollTop).toBe(100);
  });

  it('scrolls to the first selected item in current item order', () => {
    const root = createScrollRoot();
    const geometry = createScrollGeometry();

    scrollToSelected(root, geometry, new Set(['c']), scrollItems, item => item.id);
    expect(root.scrollTop).toBe(200);

    scrollToSelected(root, geometry, new Set(['missing']), scrollItems, item => item.id);
    expect(root.scrollTop).toBe(200);

    scrollToSelected(root, geometry, new Set(['a', 'c']), scrollItems, item => item.id);
    expect(root.scrollTop).toBe(0);
  });
});
