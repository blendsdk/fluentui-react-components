import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, render, waitFor, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { computeGeometry } from '../../src/components/TileGrid/geometry';
import { toggleSelection } from '../../src/components/TileGrid/selection';
import { TileGrid } from '../../src/components/TileGrid';
import type {
  TileGridHandle,
  TileGridItemRenderArgs,
} from '../../src/components/TileGrid/TileGrid.types';
import { createTileGridFixture, type TileGridFixtureItem } from '../fixtures/tileGridFixture';

/** Layouts exercised by every performance measurement. */
const LAYOUTS = ['fixed', 'masonry', 'justified', 'mosaic'] as const;

const ITEM_COUNT = 20_000;
const CONTAINER_WIDTH = 1440;
const CONTAINER_HEIGHT = 900;
const TILE_SIZE = 160;
const GAP = 8;

/*
 * The 60fps target is 16.67 ms per frame; the job asserts 50 ms as the
 * pathological-regression guard accepted for this suite, not as a claim that
 * the scroll path always reaches 60fps. Geometry uses ten samples because its
 * p95 is the maximum of a short synchronous run; selection uses 200 toggles and
 * scroll uses 30 intervals to keep the suite bounded while still exercising
 * repeated work.
 */
const GEOMETRY_RUNS = 10;
const GEOMETRY_BUDGET_MS = 200;

const SELECTION_TOGGLES = 200;
const SELECTION_BUDGET_MS = 16;

const SCROLL_FRAMES = 30;
const SCROLL_STEP_PX = 100;
const FRAME_BUDGET_MS = 50;
const TARGET_FRAME_MS = 1000 / 60;

const TEST_TIMEOUT_MS = 60_000;
const WAIT_TIMEOUT_MS = 10_000;

const TILE_ITEM_SELECTOR = '[data-tile-grid-item]';

/**
 * The 20K tile fixture is created once and shared by every measurement so the
 * timing loops only cover the behaviour under test, not fixture construction.
 */
const items: TileGridFixtureItem[] = [...createTileGridFixture(ITEM_COUNT)];

/** Stable item accessors; module scope keeps React memoization effective. */
const getItemId = (item: TileGridFixtureItem): string => item.id;
const getItemLabel = (item: TileGridFixtureItem): string => item.label;
const getItemAspectRatio = (item: TileGridFixtureItem): number => item.aspectRatio;

/** Every seventh tile spans two columns and two rows in the mosaic layout. */
const getItemSpan = (item: TileGridFixtureItem): { columns: 2; rows: 2 } | undefined => {
  const index = Number(item.id.slice('tile-'.length));
  return index % 7 === 0 ? { columns: 2, rows: 2 } : undefined;
};

/** Minimal tile body; the grid owns sizing and interaction. */
const renderItem = (args: { item: TileGridFixtureItem }) => <span>{args.item.label}</span>;

/**
 * Returns the nearest-rank 95th percentile of the given durations.
 *
 * The nearest-rank definition avoids interpolation: the result is always one
 * of the measured values. Non-finite samples are rejected so a broken timer
 * cannot silently satisfy a budget.
 */
function nearestRank95(values: readonly number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot compute a 95th percentile of an empty sample.');
  }

  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new Error(`Measured duration is not finite: ${String(value)}`);
    }
  }

  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[rank];
}

/**
 * Finds the vertically scrollable element the grid creates inside the fixed
 * host. Discovery keeps the measurement independent of implementation markup
 * while still requiring a real scroll range.
 */
function findScrollRootOrNull(host: HTMLElement): HTMLElement | null {
  let best: HTMLElement | null = null;
  const candidates: HTMLElement[] = [host, ...Array.from(host.querySelectorAll<HTMLElement>('*'))];

  for (const candidate of candidates) {
    if (candidate.scrollHeight <= candidate.clientHeight + 1) {
      continue;
    }

    if (best === null || candidate.scrollHeight > best.scrollHeight) {
      best = candidate;
    }
  }

  return best;
}

/**
 * Advances the scroll root by one step on each animation frame and resolves
 * with the intervals between consecutive frame timestamps.
 *
 * The loop stops at the end of the scroll range or after the requested number
 * of measured intervals, so it can never spin forever.
 */
function measureScrollFrameIntervals(
  root: HTMLElement,
  frameCount: number,
  stepPx: number
): Promise<number[]> {
  return new Promise(resolve => {
    const intervals: number[] = [];
    let previousTimestamp: number | null = null;

    const advance = (timestamp: number): void => {
      if (previousTimestamp !== null) {
        intervals.push(timestamp - previousTimestamp);
      }
      previousTimestamp = timestamp;

      const maxScrollTop = Math.max(0, root.scrollHeight - root.clientHeight);
      if (intervals.length >= frameCount || root.scrollTop >= maxScrollTop) {
        resolve(intervals);
        return;
      }

      root.scrollTop = Math.min(root.scrollTop + stepPx, maxScrollTop);
      requestAnimationFrame(advance);
    };

    requestAnimationFrame(advance);
  });
}

describe('TileGrid geometry recompute performance', () => {
  it.each(LAYOUTS)(
    'recomputes %s geometry for 20,000 items within budget',
    layout => {
      const input = {
        items,
        getItemId,
        getItemAspectRatio,
        getItemSpan,
        layout,
        tileSize: TILE_SIZE,
        tileAspectRatio: 1,
        fallbackAspectRatio: 1,
        gap: GAP,
        containerWidth: CONTAINER_WIDTH,
      };

      computeGeometry({ ...input });
      computeGeometry({ ...input });

      const durations: number[] = [];
      for (let run = 0; run < GEOMETRY_RUNS; run += 1) {
        const startedAt = performance.now();
        const result = computeGeometry({ ...input });
        durations.push(performance.now() - startedAt);
        expect(result.itemRects).toHaveLength(ITEM_COUNT);
      }

      const p95 = nearestRank95(durations);
      console.info(
        `[tile-grid perf] ${layout} geometry p95: ${p95.toFixed(2)} ms (budget ${GEOMETRY_BUDGET_MS} ms)`
      );
      expect(p95).toBeLessThan(GEOMETRY_BUDGET_MS);
    },
    TEST_TIMEOUT_MS
  );
});

describe('TileGrid mounted window performance', () => {
  it.each(LAYOUTS)(
    'mounts a bounded %s window for 20,000 items',
    async layout => {
      const { container } = render(
        <div style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}>
          <TileGrid
            items={items}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            getItemAspectRatio={getItemAspectRatio}
            getItemSpan={getItemSpan}
            renderItem={renderItem}
            layout={layout}
            tileSize={TILE_SIZE}
            gap={GAP}
            ariaLabel={`tile-grid-perf-${layout}`}
          />
        </div>
      );

      const host = container.firstElementChild;
      if (!(host instanceof HTMLElement)) {
        throw new Error('The performance host element was not rendered.');
      }

      await waitFor(
        () => {
          expect(host.querySelectorAll(TILE_ITEM_SELECTOR).length).toBeGreaterThan(0);
        },
        { timeout: WAIT_TIMEOUT_MS }
      );

      const mountedCount = host.querySelectorAll(TILE_ITEM_SELECTOR).length;
      console.info(`[tile-grid perf] ${layout} mounted tiles: ${mountedCount}`);

      expect(mountedCount).toBeGreaterThan(0);
      expect(mountedCount).toBeLessThan(120);
    },
    TEST_TIMEOUT_MS
  );
});

describe('TileGrid selection transition performance', () => {
  it(
    'toggles 200 ids out of a 20,000-id selection within budget',
    () => {
      const selected = new Set(items.map(getItemId));
      expect(selected.size).toBe(ITEM_COUNT);

      const toggledIds = items.slice(0, SELECTION_TOGGLES).map(getItemId);
      expect(toggledIds).toHaveLength(SELECTION_TOGGLES);

      const durations: number[] = [];
      let current: ReadonlySet<string> = selected;

      for (const id of toggledIds) {
        const startedAt = performance.now();
        current = toggleSelection(current, id);
        durations.push(performance.now() - startedAt);
      }

      expect(current.size).toBe(ITEM_COUNT - SELECTION_TOGGLES);

      const p95 = nearestRank95(durations);
      console.info(
        `[tile-grid perf] selection toggle p95: ${p95.toFixed(2)} ms (budget ${SELECTION_BUDGET_MS} ms)`
      );
      expect(p95).toBeLessThan(SELECTION_BUDGET_MS);
    },
    TEST_TIMEOUT_MS
  );
});

describe('TileGrid scripted scroll performance', () => {
  it(
    'keeps frame intervals within budget while scrolling the fixed 20K grid',
    async () => {
      const { container } = render(
        <div style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}>
          <TileGrid
            items={items}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            getItemAspectRatio={getItemAspectRatio}
            getItemSpan={getItemSpan}
            renderItem={renderItem}
            layout="fixed"
            tileSize={TILE_SIZE}
            gap={GAP}
            ariaLabel="tile-grid-perf-scroll"
          />
        </div>
      );

      const host = container.firstElementChild;
      if (!(host instanceof HTMLElement)) {
        throw new Error('The performance host element was not rendered.');
      }

      await waitFor(
        () => {
          expect(host.querySelectorAll(TILE_ITEM_SELECTOR).length).toBeGreaterThan(0);
        },
        { timeout: WAIT_TIMEOUT_MS }
      );

      const scrollRoot = await waitFor(
        () => {
          const candidate = findScrollRootOrNull(host);
          if (candidate === null) {
            throw new Error('The grid did not produce a scrollable element yet.');
          }
          return candidate;
        },
        { timeout: WAIT_TIMEOUT_MS }
      );

      const firstMountedIndex = scrollRoot
        .querySelector<HTMLElement>(TILE_ITEM_SELECTOR)
        ?.getAttribute('data-index');

      const intervals = await measureScrollFrameIntervals(
        scrollRoot,
        SCROLL_FRAMES,
        SCROLL_STEP_PX
      );
      expect(intervals.length).toBeGreaterThan(0);
      expect(scrollRoot.scrollTop).toBeGreaterThan(0);

      const lastMountedIndex = scrollRoot
        .querySelector<HTMLElement>(TILE_ITEM_SELECTOR)
        ?.getAttribute('data-index');
      expect(lastMountedIndex).not.toBe(firstMountedIndex);
      expect(scrollRoot.querySelectorAll(TILE_ITEM_SELECTOR).length).toBeLessThan(120);

      const p95 = nearestRank95(intervals);
      console.info(
        `[tile-grid perf] scroll frame p95: ${p95.toFixed(2)} ms ` +
          `(60 fps target ${TARGET_FRAME_MS.toFixed(2)} ms, budget ${FRAME_BUDGET_MS} ms, ` +
          `${intervals.length} intervals measured)`
      );
      expect(p95).toBeLessThan(FRAME_BUDGET_MS);
    },
    TEST_TIMEOUT_MS
  );
});

describe('TileGrid controls-enabled window and content performance', () => {
  it.each(LAYOUTS)(
    'bounds the %s 20K window and isolates focus, toggle, select-all and clear content work',
    async layout => {
      const handle = createRef<TileGridHandle>();
      const changes = vi.fn<(next: ReadonlySet<string>) => void>();
      // A single stable callback lets the real content memoization decide which cells render.
      const renderContent = vi.fn(
        ({ item, selected }: TileGridItemRenderArgs<TileGridFixtureItem>) => (
          <span data-selected={selected}>{item.label}</span>
        )
      );
      const { getByRole } = render(
        <FluentProvider theme={webLightTheme}>
          <div style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}>
            <TileGrid
              ref={handle}
              items={items}
              getItemId={getItemId}
              getItemLabel={getItemLabel}
              getItemAspectRatio={getItemAspectRatio}
              getItemSpan={getItemSpan}
              renderItem={renderContent}
              layout={layout}
              tileSize={TILE_SIZE}
              gap={GAP}
              selectionMode="multiselect"
              onSelectionChange={changes}
              ariaLabel={`controls-perf-${layout}`}
            />
          </div>
        </FluentProvider>
      );
      const root = getByRole('list', { name: `controls-perf-${layout}` });
      await waitFor(
        () => expect(root.querySelectorAll(TILE_ITEM_SELECTOR).length).toBeGreaterThan(1),
        {
          timeout: WAIT_TIMEOUT_MS,
        }
      );
      await act(async () => {
        await new Promise<void>(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
      });
      const mounted = Array.from(root.querySelectorAll<HTMLElement>(TILE_ITEM_SELECTOR));
      expect(mounted.length).toBeLessThan(120);
      expect(within(root).getAllByRole('checkbox')).toHaveLength(mounted.length);
      renderContent.mockClear();
      await act(async () => mounted[0].focus({ preventScroll: true }));
      expect(mounted[0]).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) throw new Error('Expected a focused tile wrapper');
      expect(active).not.toBe(mounted[0]);
      expect(root).toContainElement(active);
      expect(active).toHaveAttribute('role', 'listitem');
      expect(renderContent).not.toHaveBeenCalled();
      expect(changes).not.toHaveBeenCalled();
      const id = active.getAttribute('data-tile-grid-item');
      expect(id).toBeTruthy();

      // Native Space covers the mounted event/store/React path, without timing it as a pure transition.
      await userEvent.keyboard(' ');
      expect(changes).toHaveBeenCalledExactlyOnceWith(new Set([id]));
      expect(renderContent).toHaveBeenCalledTimes(1);
      expect(renderContent.mock.calls[0][0].item.id).toBe(id);
      expect(renderContent.mock.calls[0][0].selected).toBe(true);
      expect(within(active).getByRole('checkbox')).toBeChecked();
      expect(handle.current).not.toBeNull();

      await act(async () => handle.current?.selectAll());
      expect(changes).toHaveBeenCalledTimes(2);
      expect(changes.mock.calls[1][0].size).toBe(ITEM_COUNT);
      expect(changes.mock.calls[1][0].has(items.at(-1)!.id)).toBe(true);
      for (const input of within(root).getAllByRole('checkbox')) expect(input).toBeChecked();
      expect(root.querySelectorAll('[data-selected="true"]')).toHaveLength(mounted.length);
      await act(async () => handle.current?.selectAll());
      expect(changes).toHaveBeenCalledTimes(2);

      await act(async () => handle.current?.clearSelection());
      expect(changes).toHaveBeenCalledTimes(3);
      expect(changes.mock.calls[2][0]).toEqual(new Set());
      for (const input of within(root).getAllByRole('checkbox')) expect(input).not.toBeChecked();
      expect(root.querySelectorAll('[data-selected="true"]')).toHaveLength(0);
      await act(async () => handle.current?.clearSelection());
      expect(changes).toHaveBeenCalledTimes(3);
      expect(root.querySelectorAll(TILE_ITEM_SELECTOR)).toHaveLength(mounted.length);
      expect(mounted.length).toBeLessThan(120);
      console.info(
        `[tile-grid perf] ${layout} controls mounted: ${mounted.length}; focus content renders: 0; toggle content renders: 1`
      );
    },
    TEST_TIMEOUT_MS
  );

  it(
    'keeps the controls-enabled fixed 20K scroll within the established frame budget',
    async () => {
      const { getByRole } = render(
        <FluentProvider theme={webLightTheme}>
          <div style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}>
            <TileGrid
              items={items}
              getItemId={getItemId}
              getItemLabel={getItemLabel}
              getItemAspectRatio={getItemAspectRatio}
              getItemSpan={getItemSpan}
              renderItem={renderItem}
              layout="fixed"
              tileSize={TILE_SIZE}
              gap={GAP}
              selectionMode="multiselect"
              ariaLabel="controls-perf-scroll"
            />
          </div>
        </FluentProvider>
      );
      const root = getByRole('list', { name: 'controls-perf-scroll' });
      const scrollRoot = await waitFor(
        () => {
          expect(root.querySelectorAll(TILE_ITEM_SELECTOR).length).toBeGreaterThan(0);
          const candidate = findScrollRootOrNull(root);
          if (!candidate)
            throw new Error('The controls-enabled grid must have a real scroll range');
          return candidate;
        },
        { timeout: WAIT_TIMEOUT_MS }
      );
      const firstMountedIndex = scrollRoot
        .querySelector(TILE_ITEM_SELECTOR)
        ?.getAttribute('data-index');
      expect(within(root).getAllByRole('checkbox').length).toBeGreaterThan(0);
      const intervals = await measureScrollFrameIntervals(
        scrollRoot,
        SCROLL_FRAMES,
        SCROLL_STEP_PX
      );
      expect(intervals).toHaveLength(SCROLL_FRAMES);
      expect(scrollRoot.scrollTop).toBeGreaterThan(0);
      expect(scrollRoot.querySelector(TILE_ITEM_SELECTOR)?.getAttribute('data-index')).not.toBe(
        firstMountedIndex
      );
      const mountedCount = scrollRoot.querySelectorAll(TILE_ITEM_SELECTOR).length;
      expect(mountedCount).toBeLessThan(120);
      expect(within(root).getAllByRole('checkbox')).toHaveLength(mountedCount);
      const p95 = nearestRank95(intervals);
      console.info(
        `[tile-grid perf] controls scroll frame p95: ${p95.toFixed(2)} ms ` +
          `(60 fps target ${TARGET_FRAME_MS.toFixed(2)} ms, budget ${FRAME_BUDGET_MS} ms, ` +
          `${intervals.length} intervals measured)`
      );
      expect(p95).toBeLessThan(FRAME_BUDGET_MS);
    },
    TEST_TIMEOUT_MS
  );
});
