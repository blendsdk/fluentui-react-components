import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../../src/components/TileGrid';
import type { TileGridHandle, TileGridItemRenderArgs } from '../../src/components/TileGrid';
import { createTileGridFixture } from '../fixtures/tileGridFixture';
import type { TileGridFixtureItem } from '../fixtures/tileGridFixture';

/**
 * Browser behaviour of tile-grid selection at public boundaries.
 *
 * The tests render the deterministic fixture inside a fixed 1440x900 host,
 * interact through real DOM clicks and the imperative handle, and observe the
 * selected state through the application's own `renderItem` output. The 20,000
 * item cases keep the same fixture as the layout suite and never build a
 * second generator.
 */

const VIEWPORT_WIDTH = 1440;
const VIEWPORT_HEIGHT = 900;
const TILE_SIZE = 160;
const GAP = 8;
const ITEM_SELECTOR = '[data-tile-grid-item]';
const SETTLE_TIMEOUT = 30_000;
const TEST_TIMEOUT = 60_000;
const TOGGLE_COUNT = 200;
const P95_BUDGET_MS = 16;

const SMALL_ITEMS = createTileGridFixture(200);
const LARGE_ITEMS = createTileGridFixture(20_000);

const getItemId = (item: TileGridFixtureItem) => item.id;
const getItemLabel = (item: TileGridFixtureItem) => item.label;
const getItemAspectRatio = (item: TileGridFixtureItem) => item.aspectRatio;

/** Renders a tile body whose selected state is readable as a DOM attribute. */
function renderSelectedTile({ item, selected }: TileGridItemRenderArgs<TileGridFixtureItem>) {
  return (
    <span data-testid={`selection-${item.id}`} data-selected={selected ? 'yes' : 'no'}>
      {item.label}
    </span>
  );
}

/** Fixed host that gives the grid a real, measurable viewport. */
function GridHost({ children }: { children: ReactNode }) {
  return (
    <div data-testid="tile-grid-host" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
      {children}
    </div>
  );
}

interface ControlledGridProps {
  items: readonly TileGridFixtureItem[];
  ariaLabel: string;
  initialSelectedIds?: readonly string[];
  handle?: Ref<TileGridHandle>;
  onSelectionChange?: (next: ReadonlySet<string>) => void;
  renderItem?: (args: TileGridItemRenderArgs<TileGridFixtureItem>) => ReactNode;
}

/**
 * Application-style controlled selection: the grid reports the requested set
 * and the harness feeds it back, so the effective state lives in React state.
 */
function ControlledGrid({
  items,
  ariaLabel,
  initialSelectedIds = [],
  handle,
  onSelectionChange,
  renderItem = renderSelectedTile,
}: ControlledGridProps) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(initialSelectedIds)
  );

  const handleSelectionChange = (next: ReadonlySet<string>) => {
    onSelectionChange?.(next);
    setSelectedIds(next);
  };

  return (
    <GridHost>
      <TileGrid
        ref={handle}
        items={items}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        getItemAspectRatio={getItemAspectRatio}
        renderItem={renderItem}
        layout="fixed"
        tileSize={TILE_SIZE}
        gap={GAP}
        ariaLabel={ariaLabel}
        selectionMode="multiselect"
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
      />
    </GridHost>
  );
}

/** Mounts a controlled grid and waits for its first mounted item window. */
async function renderControlledGrid(options: ControlledGridProps) {
  const view = render(<ControlledGrid {...options} />);
  const root = await screen.findByRole('list', { name: options.ariaLabel });

  await waitFor(
    () => {
      expect(root.querySelectorAll(ITEM_SELECTOR).length).toBeGreaterThan(0);
    },
    { timeout: SETTLE_TIMEOUT }
  );

  return { ...view, root };
}

/** Returns the mounted item wrappers in DOM order. */
function mountedWrappers(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
}

/** Reads a pixel value from an inline positioning style. */
function styleNumber(element: HTMLElement, property: 'top' | 'height'): number {
  const value = Number.parseFloat(element.style[property]);
  return Number.isFinite(value) ? value : Number.NaN;
}

/** Returns the requested percentile of a sample set. */
function percentile(values: readonly number[], requested: number): number {
  if (values.length === 0) {
    return Number.NaN;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((requested / 100) * sorted.length) - 1)
  );

  return sorted[index];
}

describe('tile grid selection in the browser', () => {
  it(
    'scrolls a selected item into the visible window without requesting a change',
    async () => {
      const handle = createRef<TileGridHandle>();
      const onSelectionChange = vi.fn();

      const { root } = await renderControlledGrid({
        items: SMALL_ITEMS,
        ariaLabel: 'Scroll selection grid',
        initialSelectedIds: ['tile-150'],
        handle,
        onSelectionChange,
      });

      expect(root.scrollTop).toBe(0);

      await act(async () => {
        handle.current?.scrollToSelected();
      });

      await waitFor(
        () => {
          const wrapper = root.querySelector<HTMLElement>('[data-tile-grid-item="tile-150"]');
          expect(wrapper).not.toBeNull();

          const top = styleNumber(wrapper as HTMLElement, 'top');
          const height = styleNumber(wrapper as HTMLElement, 'height');
          expect(Number.isFinite(top)).toBe(true);
          expect(Number.isFinite(height)).toBe(true);
          expect(top).toBeLessThan(root.scrollTop + root.clientHeight);
          expect(top + height).toBeGreaterThan(root.scrollTop);
        },
        { timeout: SETTLE_TIMEOUT }
      );

      expect(root.scrollTop).toBeGreaterThan(0);
      expect(onSelectionChange).not.toHaveBeenCalled();
    },
    TEST_TIMEOUT
  );

  it(
    'keeps controlled selection interactions responsive across 20,000 items',
    async () => {
      const handle = createRef<TileGridHandle>();
      const onSelectionChange = vi.fn();

      const { root } = await renderControlledGrid({
        items: LARGE_ITEMS,
        ariaLabel: 'Public selection grid',
        handle,
        onSelectionChange,
      });

      expect(onSelectionChange).not.toHaveBeenCalled();

      const mountedBefore = root.querySelectorAll(ITEM_SELECTOR).length;
      const firstWrapper = root.querySelector<HTMLElement>(ITEM_SELECTOR);
      expect(firstWrapper).not.toBeNull();

      const targetId = firstWrapper?.getAttribute('data-tile-grid-item');
      expect(targetId).toBeTruthy();
      const targetTestId = `selection-${targetId}`;

      fireEvent.click(screen.getByTestId(targetTestId), { ctrlKey: true });
      await waitFor(() =>
        expect(screen.getByTestId(targetTestId)).toHaveAttribute('data-selected', 'yes')
      );
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set([targetId]));
      expect(screen.getByTestId(targetTestId)).toHaveAttribute('data-selected', 'yes');

      await act(async () => {
        handle.current?.clearSelection();
      });
      await waitFor(() =>
        expect(screen.getByTestId(targetTestId)).toHaveAttribute('data-selected', 'no')
      );

      const durations: number[] = [];

      for (let index = 0; index < TOGGLE_COUNT; index += 1) {
        const target = screen.getByTestId(targetTestId);
        const started = performance.now();
        fireEvent.click(target, { ctrlKey: true });
        durations.push(performance.now() - started);
      }

      await waitFor(() =>
        expect(screen.getByTestId(targetTestId)).toHaveAttribute('data-selected', 'no')
      );

      expect(percentile(durations, 95)).toBeLessThan(P95_BUDGET_MS);
      expect(root.querySelectorAll(ITEM_SELECTOR).length).toBe(mountedBefore);
      expect(onSelectionChange.mock.calls.length).toBeGreaterThanOrEqual(TOGGLE_COUNT + 2);

      for (const [next] of onSelectionChange.mock.calls) {
        expect((next as ReadonlySet<string>).size).toBeLessThanOrEqual(1);
      }
    },
    TEST_TIMEOUT
  );

  it(
    're-renders only the affected mounted cell when one selected tile toggles',
    async () => {
      const renderItem = vi.fn(renderSelectedTile);
      const onSelectionChange = vi.fn();

      const { root } = await renderControlledGrid({
        items: LARGE_ITEMS,
        ariaLabel: 'Affected cell grid',
        initialSelectedIds: ['tile-0'],
        onSelectionChange,
        renderItem,
      });

      expect(screen.getByTestId('selection-tile-0')).toHaveAttribute('data-selected', 'yes');

      const mountedBefore = root.querySelectorAll(ITEM_SELECTOR).length;
      expect(mountedBefore).toBeGreaterThan(0);

      renderItem.mockClear();

      fireEvent.click(screen.getByTestId('selection-tile-0'), { ctrlKey: true });

      await waitFor(() =>
        expect(screen.getByTestId('selection-tile-0')).toHaveAttribute('data-selected', 'no')
      );

      const renderedIds = renderItem.mock.calls.map(([args]) => args.item.id);

      expect(renderedIds.length).toBeGreaterThan(0);
      expect(new Set(renderedIds)).toEqual(new Set(['tile-0']));
      expect(mountedWrappers(root)).toHaveLength(mountedBefore);
    },
    TEST_TIMEOUT
  );
});
