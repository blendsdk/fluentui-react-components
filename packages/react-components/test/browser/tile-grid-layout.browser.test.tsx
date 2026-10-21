import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../../src/index';
import type { TileGridItemRenderArgs, TileGridLayout } from '../../src/index';
import { createTileGridFixture } from '../fixtures/tileGridFixture';
import type { TileGridFixtureItem } from '../fixtures/tileGridFixture';

/**
 * Browser behaviour of the tile grid's virtualized scrolling.
 *
 * Every test renders the shared 20,000-item fixture inside a fixed 1440x900
 * host, so the component owns the only scroll container. Assertions read
 * public DOM facts only: the item wrappers' positioning styles, whether they
 * sit inside the visible window plus overscan, and the root's scroll offset.
 */
const ITEM_COUNT = 20_000;
const VIEWPORT_WIDTH = 1440;
const VIEWPORT_HEIGHT = 900;
const TILE_SIZE = 160;
const GAP = 8;
const LARGER_TILE_SIZE = 200;
const MAX_MOUNTED_WRAPPERS = 120;
const WINDOW_MARGIN = 1_000;
const TEST_TIMEOUT = 60_000;
const SETTLE_TIMEOUT = 30_000;
const ITEM_SELECTOR = '[data-tile-grid-item]';
const LAYOUTS: readonly TileGridLayout[] = ['fixed', 'justified', 'masonry', 'mosaic'];

const items = createTileGridFixture(ITEM_COUNT);

/**
 * Marks every seventh item as a two-by-two tile so the mosaic layout really
 * exercises spanning rectangles in the browser.
 */
function mosaicSpan(item: TileGridFixtureItem): { columns?: 1 | 2; rows?: 1 | 2 } | undefined {
  const index = Number.parseInt(item.id.slice('tile-'.length), 10);
  return index % 7 === 0 ? { columns: 2, rows: 2 } : undefined;
}

/** Minimal tile body; the browser tests only need a mounted, labelled node. */
function renderTileItem({ item }: TileGridItemRenderArgs<TileGridFixtureItem>) {
  return <span>{item.label}</span>;
}

interface GridOverrides {
  layout?: TileGridLayout;
  tileSize?: number;
  gap?: number;
  ariaLabel?: string;
  getItemSpan?: (item: TileGridFixtureItem) => { columns?: 1 | 2; rows?: 1 | 2 } | undefined;
  renderItem?: (args: TileGridItemRenderArgs<TileGridFixtureItem>) => ReactNode;
}

/** Builds the common fixture props, letting a test vary layout and rendering. */
function createGridProps(overrides: GridOverrides = {}) {
  const {
    layout = 'fixed',
    tileSize = TILE_SIZE,
    gap = GAP,
    ariaLabel = 'Tile grid',
    renderItem = renderTileItem,
  } = overrides;

  return {
    items,
    getItemId: (item: TileGridFixtureItem) => item.id,
    getItemLabel: (item: TileGridFixtureItem) => item.label,
    getItemAspectRatio: (item: TileGridFixtureItem) => item.aspectRatio,
    renderItem,
    layout,
    tileSize,
    gap,
    ariaLabel,
    ...(overrides.getItemSpan ? { getItemSpan: overrides.getItemSpan } : {}),
  };
}

interface RenderedGrid {
  host: HTMLElement;
  root: HTMLElement;
}

/** Renders the grid in a sized host and waits for the first measured layout. */
async function renderGrid(overrides: GridOverrides = {}): Promise<RenderedGrid> {
  const label = overrides.ariaLabel ?? 'Tile grid';

  render(
    <div data-testid="tile-grid-host" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
      <TileGrid {...createGridProps(overrides)} />
    </div>
  );

  const host = screen.getByTestId('tile-grid-host');
  const root = await screen.findByRole('list', { name: label });
  await waitForMounted(root);

  return { host, root };
}

/** Returns the currently mounted item wrappers in DOM order. */
function mountedWrappers(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
}

/** Reads a pixel value from an inline positioning style. */
function styleNumber(element: HTMLElement, property: 'top' | 'height' | 'width'): number {
  const value = Number.parseFloat(element.style[property]);
  return Number.isFinite(value) ? value : Number.NaN;
}

/** Waits until the first measured layout has mounted its item window. */
async function waitForMounted(root: HTMLElement): Promise<void> {
  await waitFor(
    () => {
      expect(mountedWrappers(root).length).toBeGreaterThan(0);
    },
    { timeout: SETTLE_TIMEOUT }
  );
}

/**
 * Asserts that the mounted window stays bounded and that no mounted wrapper
 * is parked far outside the visible viewport. The generous vertical margin
 * accepts any reasonable overscan without guessing its exact height.
 */
function expectMountedWindow(root: HTMLElement): void {
  const wrappers = mountedWrappers(root);
  expect(wrappers.length).toBeGreaterThan(0);
  expect(wrappers.length).toBeLessThan(MAX_MOUNTED_WRAPPERS);

  const windowStart = root.scrollTop - WINDOW_MARGIN;
  const windowEnd = root.scrollTop + root.clientHeight + WINDOW_MARGIN;

  for (const wrapper of wrappers) {
    const top = styleNumber(wrapper, 'top');
    const height = styleNumber(wrapper, 'height');

    expect(Number.isFinite(top)).toBe(true);
    expect(Number.isFinite(height)).toBe(true);
    expect(top).toBeGreaterThanOrEqual(windowStart);
    expect(top).toBeLessThanOrEqual(windowEnd);
    expect(top + height).toBeGreaterThan(windowStart);
  }
}

/** Scrolls the grid root and waits for the mounted window to follow. */
async function scrollTo(root: HTMLElement, nextScrollTop: number): Promise<void> {
  const maxScroll = Math.max(0, root.scrollHeight - root.clientHeight);
  const target = Math.min(Math.max(nextScrollTop, 0), maxScroll);

  await act(async () => {
    root.scrollTop = target;
  });
  fireEvent.scroll(root);

  await waitFor(
    () => {
      expect(Math.abs(root.scrollTop - target)).toBeLessThan(2);
      expectMountedWindow(root);
    },
    { timeout: SETTLE_TIMEOUT }
  );
}

interface VisibleAnchor {
  id: string;
  index: number;
  top: number;
  height: number;
  offset: number;
}

/**
 * Derives the first visible item from the wrappers' geometry styles and the
 * root's scroll offset, falling back to the smallest index on a shared top.
 */
function firstVisibleItem(root: HTMLElement): VisibleAnchor {
  const scrollTop = root.scrollTop;
  const candidates = mountedWrappers(root)
    .map(wrapper => ({
      id: wrapper.getAttribute('data-tile-grid-item') ?? '',
      index: Number(wrapper.getAttribute('data-index')),
      top: styleNumber(wrapper, 'top'),
      height: styleNumber(wrapper, 'height'),
    }))
    .filter(
      candidate => Number.isFinite(candidate.top) && candidate.top + candidate.height > scrollTop
    )
    .sort((left, right) => left.top - right.top || left.index - right.index);

  expect(candidates.length).toBeGreaterThan(0);

  const [first] = candidates;
  return { ...first, offset: scrollTop - first.top };
}

/**
 * Test harness that changes the tile size through React state, so the anchor
 * restoration is triggered the same way an application would trigger it.
 */
function TileSizeSwitchGrid() {
  const [tileSize, setTileSize] = useState(TILE_SIZE);

  return (
    <>
      <button type="button" onClick={() => setTileSize(LARGER_TILE_SIZE)}>
        Use larger tiles
      </button>
      <span data-testid="tile-size">{tileSize}</span>
      <div style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
        <TileGrid {...createGridProps({ layout: 'fixed', tileSize, ariaLabel: 'Anchor grid' })} />
      </div>
    </>
  );
}

/**
 * Counts layout reads that target item wrappers. The grid must position tiles
 * from its geometry data instead of measuring each rendered item.
 */
function installItemRectSpy(): { itemRectCalls: Element[]; restore: () => void } {
  const itemRectCalls: Element[] = [];
  const original = Element.prototype.getBoundingClientRect;
  const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect');

  spy.mockImplementation(function (this: Element) {
    if (this.matches(ITEM_SELECTOR)) {
      itemRectCalls.push(this);
    }
    return original.call(this);
  });

  return { itemRectCalls, restore: () => spy.mockRestore() };
}

describe('tile grid browser virtualization', () => {
  describe('mounted window bound', () => {
    for (const layout of LAYOUTS) {
      it(
        `${layout} layout mounts fewer than 120 item wrappers for 20,000 items`,
        async () => {
          const { root } = await renderGrid({
            layout,
            getItemSpan: layout === 'mosaic' ? mosaicSpan : undefined,
          });

          const wrappers = mountedWrappers(root);
          expect(wrappers.length).toBeGreaterThan(0);
          expect(wrappers.length).toBeLessThan(MAX_MOUNTED_WRAPPERS);
        },
        TEST_TIMEOUT
      );
    }
  });

  describe('masonry scrolling', () => {
    it(
      'keeps the mounted window bounded while scrolling from top to middle to bottom',
      async () => {
        const { root } = await renderGrid({ layout: 'masonry' });
        expectMountedWindow(root);

        const maxScroll = root.scrollHeight - root.clientHeight;
        expect(maxScroll).toBeGreaterThan(0);

        await scrollTo(root, Math.round(maxScroll / 2));
        expectMountedWindow(root);
        const middleLowestIndex = Math.min(
          ...mountedWrappers(root).map(wrapper => Number(wrapper.getAttribute('data-index')))
        );
        expect(middleLowestIndex).toBeGreaterThan(0);

        await scrollTo(root, maxScroll);
        expectMountedWindow(root);

        const bottomLowestIndex = Math.min(
          ...mountedWrappers(root).map(wrapper => Number(wrapper.getAttribute('data-index')))
        );
        expect(bottomLowestIndex).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });

  describe('anchor preservation across tile size changes', () => {
    it(
      'keeps the first visible item and its pixel offset when the tile size grows',
      async () => {
        render(<TileSizeSwitchGrid />);

        const root = await screen.findByRole('list', { name: 'Anchor grid' });
        await waitForMounted(root);

        const maxScroll = Math.max(0, root.scrollHeight - root.clientHeight);
        // Item 504 starts a row in both the eight-column and six-column
        // layouts, so the first-visible assertion remains meaningful after
        // the automatic column change.
        const approximateAnchorTop = Math.round((504 / ITEM_COUNT) * maxScroll);
        await scrollTo(root, approximateAnchorTop);

        await waitFor(
          () => {
            expect(root.querySelector('[data-tile-grid-item="tile-504"]')).not.toBeNull();
          },
          { timeout: SETTLE_TIMEOUT }
        );

        const anchorItem = root.querySelector<HTMLElement>('[data-tile-grid-item="tile-504"]');
        expect(anchorItem).not.toBeNull();
        await scrollTo(root, styleNumber(anchorItem as HTMLElement, 'top') + 37);

        const before = firstVisibleItem(root);
        expect(before.offset).toBeGreaterThanOrEqual(0);
        expect(before.offset).toBeLessThan(before.height);
        expect(root.scrollTop).toBeGreaterThan(1_000);

        const scrollHeightBeforeChange = root.scrollHeight;

        fireEvent.click(screen.getByRole('button', { name: 'Use larger tiles' }));

        await waitFor(() => expect(screen.getByTestId('tile-size')).toHaveTextContent('200'), {
          timeout: SETTLE_TIMEOUT,
        });

        await waitFor(() => expect(root.scrollHeight).not.toBe(scrollHeightBeforeChange), {
          timeout: SETTLE_TIMEOUT,
        });

        await waitFor(
          () => {
            const after = firstVisibleItem(root);
            const expectedOffset = Math.min(Math.max(before.offset, 0), after.height);
            expect(after.id).toBe(before.id);
            expect(Math.abs(after.offset - expectedOffset)).toBeLessThanOrEqual(1);
          },
          { timeout: SETTLE_TIMEOUT }
        );

        const after = firstVisibleItem(root);
        const expectedOffset = Math.min(Math.max(before.offset, 0), after.height);
        expect(after.id).toBe(before.id);
        expect(after.offset).toBeGreaterThanOrEqual(0);
        expect(after.offset).toBeLessThanOrEqual(after.height);
        expect(Math.abs(after.offset - expectedOffset)).toBeLessThanOrEqual(1);
        expect(root.scrollTop).toBeGreaterThan(1_000);
      },
      TEST_TIMEOUT
    );
  });

  describe('image rendering bound', () => {
    it(
      'renders image elements only for the mounted window and never fetches or logs a thumbnail',
      async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const warnSpy = vi.spyOn(console, 'warn');
        const errorSpy = vi.spyOn(console, 'error');
        const logSpy = vi.spyOn(console, 'log');

        try {
          const { root } = await renderGrid({
            layout: 'fixed',
            renderItem: ({ item }) => <img src={item.thumbnailUrl} alt="" />,
          });

          const wrappers = mountedWrappers(root);
          const images = Array.from(root.querySelectorAll('img'));

          expect(wrappers.length).toBeGreaterThan(0);
          expect(images.length).toBeGreaterThan(0);
          expect(images.length).toBeLessThan(MAX_MOUNTED_WRAPPERS);
          expect(images.length).toBeLessThanOrEqual(wrappers.length);

          expect(fetchSpy).not.toHaveBeenCalled();

          const loggedText = [...warnSpy.mock.calls, ...errorSpy.mock.calls, ...logSpy.mock.calls]
            .map(call => call.map(value => String(value)).join(' '))
            .join('\n');
          expect(loggedText).not.toContain('tile-');
          expect(loggedText).not.toContain('data:image');
        } finally {
          fetchSpy.mockRestore();
          warnSpy.mockRestore();
          errorSpy.mockRestore();
          logSpy.mockRestore();
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('container measurement on resize', () => {
    it(
      'recomputes geometry on a host width change without remounting the grid',
      async () => {
        const { host, root } = await renderGrid({ layout: 'masonry' });

        const initialClientWidth = root.clientWidth;
        const topItem = root.querySelector<HTMLElement>('[data-tile-grid-item="tile-0"]');
        expect(topItem).not.toBeNull();
        const initialItemWidth = styleNumber(topItem as HTMLElement, 'width');
        expect(initialItemWidth).toBeGreaterThan(0);

        await act(async () => {
          host.style.width = '1024px';
        });

        await waitFor(
          () => {
            expect(root.clientWidth).toBeLessThan(initialClientWidth);
            expect(root.clientWidth).toBeGreaterThanOrEqual(1_000);
          },
          { timeout: SETTLE_TIMEOUT }
        );

        await waitFor(
          () => {
            const current = root.querySelector<HTMLElement>('[data-tile-grid-item="tile-0"]');
            expect(current).not.toBeNull();
            expect(current).toBe(topItem);
            expect(styleNumber(current as HTMLElement, 'width')).not.toBe(initialItemWidth);
          },
          { timeout: SETTLE_TIMEOUT }
        );

        expect(screen.getByRole('list')).toBe(root);
        expect(root.isConnected).toBe(true);

        const finalWrappers = mountedWrappers(root);
        expect(finalWrappers.length).toBeGreaterThan(0);
        expect(finalWrappers.length).toBeLessThan(MAX_MOUNTED_WRAPPERS);
        expectMountedWindow(root);
      },
      TEST_TIMEOUT
    );
  });

  describe('layout reads during scrolling', () => {
    for (const layout of LAYOUTS) {
      it(
        `${layout} layout never measures item wrappers and keeps them inside the window`,
        async () => {
          const rectSpy = installItemRectSpy();

          try {
            const { root } = await renderGrid({
              layout,
              getItemSpan: layout === 'mosaic' ? mosaicSpan : undefined,
            });

            expectMountedWindow(root);
            expect(rectSpy.itemRectCalls).toHaveLength(0);

            const maxScroll = root.scrollHeight - root.clientHeight;
            expect(maxScroll).toBeGreaterThan(0);

            await scrollTo(root, Math.round(maxScroll / 2));
            expectMountedWindow(root);
            expect(rectSpy.itemRectCalls).toHaveLength(0);

            await scrollTo(root, maxScroll);
            expectMountedWindow(root);
            expect(rectSpy.itemRectCalls).toHaveLength(0);
          } finally {
            rectSpy.restore();
          }
        },
        TEST_TIMEOUT
      );
    }
  });
});
