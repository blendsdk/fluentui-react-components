import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { TileGrid } from '../../src/components/TileGrid';
import type {
  TileGridItemRenderArgs,
  TileGridLayout,
  TileGridReorderArgs,
} from '../../src/components/TileGrid';
import { createTileGridFixture } from '../fixtures/tileGridFixture';
import type { TileGridFixtureItem } from '../fixtures/tileGridFixture';

/**
 * Real-browser pointer reorder contract of the tile grid.
 *
 * Every drag uses the provider's native mouse implementation: a delayed click
 * presses the handle, hover calls move the pointer in steps, and the click's
 * release lands at the last hovered position. Assertions read only public DOM
 * hooks and callback payloads.
 */

const FRAME_WIDTH = 640;
const FRAME_HEIGHT = 400;
const TILE_SIZE = 100;
const GAP = 8;
const HOLD_MS = 3_000;
const SCROLL_HOLD_MS = 4_000;
const TEST_TIMEOUT = 30_000;
const GRID_LABEL = 'Reorder grid';
const ITEMS = createTileGridFixture(60);
const MANY_ITEMS = createTileGridFixture(200);
const IDS = ITEMS.map(item => item.id);
const LAYOUTS: readonly TileGridLayout[] = ['fixed', 'masonry', 'justified', 'mosaic'];

type Point = { x: number; y: number };

const getItemId = (item: TileGridFixtureItem) => item.id;
const getItemLabel = (item: TileGridFixtureItem) => item.label;
const getItemAspectRatio = (item: TileGridFixtureItem) => item.aspectRatio;

/** Initial viewport restored after the suite so later files keep their defaults. */
const initialViewport = { width: innerWidth, height: innerHeight };

beforeAll(async () => {
  await page.viewport(1280, 900);
});

afterAll(async () => {
  await page.viewport(initialViewport.width, initialViewport.height);
});

/**
 * Renders the public reorder surface without the future tile shell.
 *
 * The handle receives the library's node ref, attributes, and pointer
 * listeners. A separate action button and the selected state stay observable
 * so isolation and selection assertions never depend on the shell.
 */
function renderTileItem({
  item,
  selected,
  dragHandleProps,
  isDragging,
  isOverlay,
}: TileGridItemRenderArgs<TileGridFixtureItem>) {
  return (
    <div
      data-testid={`content-${item.id}`}
      data-selected={selected}
      data-dragging={isDragging}
      data-overlay={isOverlay}
      style={{ fontSize: 12 }}
    >
      <span>{item.label}</span>
      {dragHandleProps ? (
        <button
          type="button"
          tabIndex={-1}
          data-testid={`handle-${item.id}`}
          ref={dragHandleProps.setNodeRef}
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          aria-label={dragHandleProps.label}
          // Keep the test handle clear of the grid's top-left selection control,
          // matching the positioned slot the shipped shell provides.
          style={{ position: 'absolute', left: 4, bottom: 4, zIndex: 2 }}
        >
          Handle
        </button>
      ) : null}
      <button type="button" data-testid={`action-${item.id}`}>
        Action
      </button>
      <span data-testid={`selected-${item.id}`}>{String(selected)}</span>
    </div>
  );
}

interface GridOptions {
  layout?: TileGridLayout;
  items?: readonly TileGridFixtureItem[];
  reorderDisabled?: boolean;
  onReorder?: (args: TileGridReorderArgs) => void;
  onSelectionChange?: (selected: ReadonlySet<string>) => void;
  onItemActivate?: (item: TileGridFixtureItem) => void;
}

/** Renders the arranging grid in a bounded frame with room around every edge. */
function Grid({ layout = 'fixed', items = ITEMS, ...handlers }: GridOptions) {
  return (
    <FluentProvider theme={webLightTheme}>
      <div
        data-testid="frame"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          marginTop: 40,
          marginLeft: 120,
        }}
      >
        <TileGrid
          items={items}
          getItemId={getItemId}
          getItemLabel={getItemLabel}
          getItemAspectRatio={getItemAspectRatio}
          renderItem={renderTileItem}
          layout={layout}
          tileSize={TILE_SIZE}
          gap={GAP}
          ariaLabel={GRID_LABEL}
          selectionMode="multiselect"
          defaultSelectedIds={['tile-1', 'tile-3', 'tile-5']}
          enableMarquee
          reorderable
          {...handlers}
        />
      </div>
    </FluentProvider>
  );
}

/** Applies the reported order, mirroring how an application owns the item list. */
function AppliedGrid({ onReorder }: { onReorder: (args: TileGridReorderArgs) => void }) {
  const [items, setItems] = useState<readonly TileGridFixtureItem[]>(ITEMS);

  return (
    <Grid
      items={items}
      onReorder={args => {
        onReorder(args);
        const current = new Map(items.map(item => [item.id, item]));
        setItems(
          args.orderedIds.flatMap(id => {
            const item = current.get(id);
            return item ? [item] : [];
          })
        );
      }}
    />
  );
}

/** Waits until the virtualized grid has mounted its first measured tiles. */
async function waitForMountedTiles(root: HTMLElement) {
  await waitFor(() => {
    expect(root.querySelectorAll('[data-tile-grid-item]').length).toBeGreaterThan(0);
  });
}

/** Mounts a grid and returns its scroll container. */
async function mount(options: GridOptions = {}) {
  const view = render(<Grid {...options} />);
  const root = await screen.findByRole('list', { name: GRID_LABEL });
  await waitForMountedTiles(root);
  return { root, view };
}

/** Mounts the stateful variant that applies every reported order. */
async function mountApplied(onReorder: (args: TileGridReorderArgs) => void) {
  const view = render(<AppliedGrid onReorder={onReorder} />);
  const root = await screen.findByRole('list', { name: GRID_LABEL });
  await waitForMountedTiles(root);
  return { root, view };
}

/** Returns a mounted tile wrapper by its public item identity. */
function tile(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(`[data-tile-grid-item="${id}"]`);
  if (!element) throw new Error(`The tile ${id} is not mounted`);
  return element;
}

/** Returns the rendered drag handle for an item and fails clearly when absent. */
function dragHandle(id: string): HTMLButtonElement {
  const handle = screen.getByTestId(`handle-${id}`);
  if (!(handle instanceof HTMLButtonElement)) {
    throw new Error(`The reorder handle for ${id} is not a button`);
  }
  return handle;
}

/** Body portal for the active drag copy. */
function overlay(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-tile-grid-overlay]');
}

/** Drop indicator rendered inside the scroll container. */
function indicator(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('[data-tile-grid-drop-indicator]');
}

/** Marquee rectangle rendered inside the scroll container. */
function marquee(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('[data-tile-grid-marquee]');
}

/** Waits for the drop indicator and returns it. */
async function indicatorWhenVisible(root: HTMLElement): Promise<HTMLElement> {
  await waitFor(() => expect(indicator(root)).not.toBeNull());
  const mark = indicator(root);
  if (!mark) throw new Error('The drop indicator did not appear');
  return mark;
}

/** Returns the mounted tile identities in their current DOM order. */
function mountedIds(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-tile-grid-item]')).map(
    node => node.getAttribute('data-tile-grid-item') ?? ''
  );
}

/** Finds a mounted tile that sits fully inside the visible scroll area. */
function visibleTileId(root: HTMLElement): string {
  const rootRect = root.getBoundingClientRect();
  const visible = Array.from(root.querySelectorAll<HTMLElement>('[data-tile-grid-item]')).find(
    node => {
      const rect = node.getBoundingClientRect();
      return rect.top >= rootRect.top + 40 && rect.bottom <= rootRect.bottom - 40;
    }
  );
  const id = visible?.getAttribute('data-tile-grid-item');
  if (!id) throw new Error('No fully visible tile is available to drag');
  return id;
}

/** Converts an element's center into the scroll container's padding-box space. */
function center(root: HTMLElement, element: Element): Point {
  const rootRect = root.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - rootRect.left - root.clientLeft,
    y: rect.top + rect.height / 2 - rootRect.top - root.clientTop,
  };
}

/** Interpolates a path with intermediate pointer moves. */
function line(from: Point, to: Point, steps: number): Point[] {
  return Array.from({ length: steps }, (_, index) => {
    const progress = (index + 1) / steps;
    return {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
    };
  });
}

/** Builds a stepped path from a handle to a viewport-relative target point. */
function pathTo(root: HTMLElement, handle: HTMLElement, end: Point, steps = 6): Point[] {
  return line(center(root, handle), end, steps);
}

/**
 * Target just before a tile along the layout's reading edge.
 *
 * Row-flow layouts decide the insertion edge from the horizontal center, so
 * the point sits just left of the tile. Masonry decides from the vertical
 * center, so the point sits just above the tile.
 */
function beforePoint(root: HTMLElement, target: HTMLElement, layout: TileGridLayout): Point {
  const rootRect = root.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  if (layout === 'masonry') {
    return {
      x: rect.left + rect.width / 2 - rootRect.left - root.clientLeft,
      y: rect.top - 2 - rootRect.top - root.clientTop,
    };
  }
  return {
    x: rect.left - 2 - rootRect.left - root.clientLeft,
    y: rect.top + rect.height / 2 - rootRect.top - root.clientTop,
  };
}

/** Target just inside a row-flow tile's trailing edge. */
function afterPoint(root: HTMLElement, target: HTMLElement): Point {
  const rootRect = root.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  return {
    x: rect.left + rect.width - 4 - rootRect.left - root.clientLeft,
    y: rect.top + rect.height / 2 - rootRect.top - root.clientTop,
  };
}

/** Rebuilds an item order after moving one index to another. */
function movedOrder(ids: readonly string[], from: number, to: number): string[] {
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) throw new Error(`No item exists at index ${from}`);
  next.splice(to, 0, moved);
  return next;
}

/** Lets native animation frames and React's resulting presentation finish. */
async function frames() {
  await act(async () => {
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

interface DragRequest {
  root: HTMLElement;
  handle: HTMLElement;
  path: readonly Point[];
  holdMs?: number;
  during?: (pointerId: number) => Promise<void>;
}

/**
 * Performs a native pointer drag.
 *
 * The provider click presses the handle and releases after the hold delay at
 * the last hovered position. The release always runs, even when an assertion
 * fails mid-gesture, so one red case cannot leave a pressed pointer behind.
 */
async function drag({
  root,
  handle,
  path,
  holdMs = HOLD_MS,
  during,
}: DragRequest): Promise<number> {
  let pointerId: number | null = null;
  const record = (event: PointerEvent) => {
    pointerId = event.pointerId;
  };
  handle.addEventListener('pointerdown', record);
  const released = userEvent.click(handle, { delay: holdMs }).then(() => undefined);
  try {
    await waitFor(() => expect(pointerId).not.toBeNull(), { timeout: 5_000 });
    const activePointer = pointerId;
    if (activePointer === null) {
      throw new Error('The native pointer-down did not reach the drag handle');
    }
    for (const point of path) {
      await userEvent.hover(root, { position: point, force: true });
    }
    if (during) await during(activePointer);
    return activePointer;
  } finally {
    handle.removeEventListener('pointerdown', record);
    await released;
  }
}

interface PointerDragRequest {
  root: HTMLElement;
  handle: HTMLElement;
  path: readonly Point[];
  during?: () => Promise<void>;
}

/**
 * Performs a pointer drag without the provider's scroll-into-view click.
 *
 * The provider's click helper scrolls the handle into view, which would move a
 * virtualized grid away from the collection end under test. Native pointer
 * events keep the scroll position exactly where the test placed it.
 */
async function pointerDrag({ root, handle, path, during }: PointerDragRequest): Promise<void> {
  const rootRect = root.getBoundingClientRect();
  const handleRect = handle.getBoundingClientRect();
  const start = {
    x: handleRect.left + handleRect.width / 2,
    y: handleRect.top + handleRect.height / 2,
  };
  const points = path.map(point => ({ x: rootRect.left + point.x, y: rootRect.top + point.y }));
  const last = points[points.length - 1] ?? start;

  fireEvent.pointerDown(handle, {
    pointerId: 77,
    isPrimary: true,
    button: 0,
    clientX: start.x,
    clientY: start.y,
    bubbles: true,
  });
  await frames();

  for (const point of points) {
    fireEvent.pointerMove(document, {
      pointerId: 77,
      isPrimary: true,
      clientX: point.x,
      clientY: point.y,
      bubbles: true,
    });
    await frames();
  }

  if (during) await during();

  fireEvent.pointerUp(document, {
    pointerId: 77,
    isPrimary: true,
    button: 0,
    clientX: last.x,
    clientY: last.y,
    bubbles: true,
  });
  await frames();
}

describe('TileGrid pointer reorder', () => {
  it(
    'should report one moved payload when the sixth tile is dropped before the third',
    async () => {
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const { root } = await mount({ onReorder, onSelectionChange });
      const handle = dragHandle('tile-5');

      await drag({
        root,
        handle,
        path: pathTo(root, handle, beforePoint(root, tile(root, 'tile-2'), 'fixed')),
      });

      expect(onReorder).toHaveBeenCalledTimes(1);
      const [args] = onReorder.mock.calls[0] ?? [];
      if (!args) throw new Error('The reorder callback did not receive a payload');
      expect(args.itemId).toBe('tile-5');
      expect(args.fromIndex).toBe(5);
      expect(args.toIndex).toBe(2);
      expect(args.orderedIds).toEqual(movedOrder(IDS, 5, 2));
      expect(args.orderedIds).toHaveLength(ITEMS.length);
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('selected-tile-1')).toHaveTextContent('true');
      expect(screen.getByTestId('selected-tile-3')).toHaveTextContent('true');
      expect(screen.getByTestId('selected-tile-5')).toHaveTextContent('true');
      expect(screen.getByTestId('selected-tile-2')).toHaveTextContent('false');
      expect(overlay()).toBeNull();
      expect(indicator(root)).toBeNull();
    },
    TEST_TIMEOUT
  );

  it(
    'should keep the order and stay silent when an item is dropped on its own position',
    async () => {
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      const { root } = await mount({ onReorder });
      const handle = dragHandle('tile-5');
      const ownCenter = center(root, tile(root, 'tile-5'));

      await pointerDrag({
        root,
        handle,
        path: pathTo(root, handle, { x: ownCenter.x + 12, y: ownCenter.y }),
        during: async () => {
          await waitFor(() => expect(overlay()).not.toBeNull());
          expect(indicator(root)).not.toBeNull();
        },
      });

      expect(onReorder).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
      expect(overlay()).toBeNull();
      expect(indicator(root)).toBeNull();
    },
    TEST_TIMEOUT
  );

  it(
    'should keep the scroll container and offset when arranging is toggled',
    async () => {
      const view = render(<Grid onReorder={vi.fn()} />);
      const root = await screen.findByRole('list', { name: GRID_LABEL });
      await waitForMountedTiles(root);

      await act(async () => {
        root.scrollTop = 400;
      });
      fireEvent.scroll(root);
      await frames();
      const before = root.scrollTop;
      expect(before).toBeGreaterThan(0);

      view.rerender(<Grid onReorder={vi.fn()} reorderDisabled />);
      await frames();

      expect(screen.getByRole('list', { name: GRID_LABEL })).toBe(root);
      expect(root.scrollTop).toBe(before);
      expect(overlay()).toBeNull();
      expect(screen.queryByRole('button', { name: /^Reorder / })).toBeNull();

      view.rerender(<Grid onReorder={vi.fn()} />);
      await frames();

      expect(screen.getByRole('list', { name: GRID_LABEL })).toBe(root);
      expect(screen.getAllByRole('button', { name: /^Reorder / }).length).toBeGreaterThan(0);
    },
    TEST_TIMEOUT
  );

  it(
    'should not commit a drag disabled and re-enabled before release',
    async () => {
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      const { root, view } = await mount({ onReorder });
      const handle = dragHandle('tile-5');

      await pointerDrag({
        root,
        handle,
        path: pathTo(root, handle, beforePoint(root, tile(root, 'tile-2'), 'fixed')),
        during: async () => {
          await waitFor(() => expect(overlay()).not.toBeNull());
          view.rerender(<Grid onReorder={onReorder} reorderDisabled />);
          await frames();
          expect(overlay()).toBeNull();
          expect(indicator(root)).toBeNull();
          view.rerender(<Grid onReorder={onReorder} />);
          await frames();
        },
      });

      expect(onReorder).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
      expect(overlay()).toBeNull();
      expect(indicator(root)).toBeNull();
    },
    TEST_TIMEOUT
  );

  it(
    'should leave the order untouched and clear the drag surface when Escape cancels',
    async () => {
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      const { root } = await mount({ onReorder });
      const before = mountedIds(root);
      const handle = dragHandle('tile-5');

      await drag({
        root,
        handle,
        path: pathTo(root, handle, beforePoint(root, tile(root, 'tile-2'), 'fixed')),
        during: async () => {
          await waitFor(() => expect(overlay()).not.toBeNull());
          expect(indicator(root)).not.toBeNull();
          await userEvent.keyboard('{Escape}');
          await waitFor(() => expect(overlay()).toBeNull());
          expect(indicator(root)).toBeNull();
        },
      });

      expect(onReorder).not.toHaveBeenCalled();
      expect(mountedIds(root)).toEqual(before);
      expect(overlay()).toBeNull();
      expect(indicator(root)).toBeNull();
    },
    TEST_TIMEOUT
  );

  it(
    'should keep the committed order when pointer capture is lost after a completed drop',
    async () => {
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      const { root } = await mountApplied(onReorder);
      const handle = dragHandle('tile-5');

      const pointerId = await drag({
        root,
        handle,
        path: pathTo(root, handle, beforePoint(root, tile(root, 'tile-2'), 'fixed')),
      });

      expect(onReorder).toHaveBeenCalledTimes(1);
      const [args] = onReorder.mock.calls[0] ?? [];
      if (!args) throw new Error('The reorder callback did not receive a payload');
      expect(args.itemId).toBe('tile-5');
      expect(mountedIds(root).indexOf('tile-5')).toBeLessThan(mountedIds(root).indexOf('tile-2'));

      const committedHandle = dragHandle('tile-5');
      committedHandle.dispatchEvent(
        new PointerEvent('lostpointercapture', { bubbles: true, pointerId, isPrimary: true })
      );
      await frames();

      expect(onReorder).toHaveBeenCalledTimes(1);
      expect(mountedIds(root).indexOf('tile-5')).toBeLessThan(mountedIds(root).indexOf('tile-2'));
      expect(overlay()).toBeNull();
    },
    TEST_TIMEOUT
  );

  it(
    'should show a two-pixel vertical indicator at an inner boundary and at the collection end',
    async () => {
      const { root } = await mount({ onReorder: vi.fn() });
      const handle = dragHandle('tile-5');

      await drag({
        root,
        handle,
        path: pathTo(root, handle, beforePoint(root, tile(root, 'tile-2'), 'fixed')),
        during: async () => {
          const rect = (await indicatorWhenVisible(root)).getBoundingClientRect();
          expect(rect.width).toBeCloseTo(2, 0);
          expect(rect.height).toBeGreaterThan(rect.width * 4);
        },
      });

      await act(async () => {
        root.scrollTop = root.scrollHeight;
      });
      fireEvent.scroll(root);
      await waitFor(() =>
        expect(root.querySelector('[data-tile-grid-item="tile-59"]')).not.toBeNull()
      );
      const last = tile(root, 'tile-59');
      const lastHandle = dragHandle('tile-59');

      await pointerDrag({
        root,
        handle: lastHandle,
        path: pathTo(root, lastHandle, afterPoint(root, last)),
        during: async () => {
          const rect = (await indicatorWhenVisible(root)).getBoundingClientRect();
          const rootRect = root.getBoundingClientRect();
          expect(rect.width).toBeCloseTo(2, 0);
          expect(rect.height).toBeGreaterThan(rect.width * 4);
          // The end line is pinned to the content edge so the canvas clip does
          // not hide it.
          expect(rect.left).toBeGreaterThanOrEqual(rootRect.left);
          expect(rect.right).toBeLessThanOrEqual(rootRect.right + 1);
        },
      });
    },
    TEST_TIMEOUT
  );

  it(
    'should show a horizontal two-pixel indicator across a masonry lane boundary',
    async () => {
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      const { root } = await mount({ layout: 'masonry', onReorder });
      const handle = dragHandle('tile-5');

      await drag({
        root,
        handle,
        path: pathTo(root, handle, beforePoint(root, tile(root, 'tile-2'), 'masonry')),
        during: async () => {
          const rect = (await indicatorWhenVisible(root)).getBoundingClientRect();
          expect(rect.height).toBeCloseTo(2, 0);
          expect(rect.width).toBeGreaterThan(rect.height * 4);
        },
      });

      expect(onReorder).toHaveBeenCalledTimes(1);
    },
    TEST_TIMEOUT
  );

  it(
    'should auto-scroll while the pointer rests near the bottom edge and stop after the drop',
    async () => {
      const { root } = await mount({ items: MANY_ITEMS, onReorder: vi.fn() });
      const handle = dragHandle('tile-0');
      let first = 0;
      let second = 0;

      await drag({
        root,
        handle,
        holdMs: SCROLL_HOLD_MS,
        path: pathTo(root, handle, {
          x: FRAME_WIDTH / 2,
          y: FRAME_HEIGHT - 10,
        }),
        during: async () => {
          await waitFor(() => expect(root.scrollTop).toBeGreaterThan(20), { timeout: 5_000 });
          first = root.scrollTop;
          await frames();
          second = root.scrollTop;
          expect(second).toBeGreaterThan(first);

          // The source may leave the virtual window; the captured copy stays.
          await waitFor(() => expect(overlay()).not.toBeNull());
          const copy = overlay();
          if (!copy) throw new Error('The drag overlay disappeared during auto-scroll');
          expect(within(copy).getByText('Tile 0')).toBeVisible();
        },
      });

      const stopped = root.scrollTop;
      await frames();
      await frames();
      expect(root.scrollTop).toBe(stopped);
    },
    TEST_TIMEOUT
  );

  it(
    'should auto-scroll upward near the top edge after scrolling and stop after cancel',
    async () => {
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      const { root } = await mount({ items: MANY_ITEMS, onReorder });

      await userEvent.wheel(root, { delta: { y: 1_200 } });
      await waitFor(() => expect(root.scrollTop).toBeGreaterThan(900));

      let id = '';
      await waitFor(() => {
        id = visibleTileId(root);
      });
      const start = root.scrollTop;
      const handle = dragHandle(id);

      await drag({
        root,
        handle,
        holdMs: SCROLL_HOLD_MS,
        path: pathTo(root, handle, { x: FRAME_WIDTH / 2, y: 8 }),
        during: async () => {
          await waitFor(() => expect(root.scrollTop).toBeLessThan(start), { timeout: 5_000 });
          const moving = root.scrollTop;
          await frames();
          expect(root.scrollTop).toBeLessThan(moving);
          await userEvent.keyboard('{Escape}');
          await waitFor(() => expect(overlay()).toBeNull());
        },
      });

      expect(onReorder).not.toHaveBeenCalled();
      const stopped = root.scrollTop;
      await frames();
      await frames();
      expect(root.scrollTop).toBe(stopped);
    },
    TEST_TIMEOUT
  );

  for (const layout of LAYOUTS) {
    it(
      `should report the same reorder payload in ${layout} layout`,
      async () => {
        const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
        const { root } = await mount({ layout, onReorder });
        const handle = dragHandle('tile-5');

        await drag({
          root,
          handle,
          path: pathTo(root, handle, beforePoint(root, tile(root, 'tile-2'), layout)),
        });

        expect(onReorder).toHaveBeenCalledTimes(1);
        const [args] = onReorder.mock.calls[0] ?? [];
        if (!args) throw new Error('The reorder callback did not receive a payload');
        expect(args.itemId).toBe('tile-5');
        expect(args.fromIndex).toBe(5);
        expect(args.toIndex).toBe(2);
        expect(args.orderedIds).toHaveLength(ITEMS.length);
        expect(args.orderedIds[2]).toBe('tile-5');
      },
      TEST_TIMEOUT
    );
  }

  it(
    'should not start a drag, marquee, or tile activation from the action button',
    async () => {
      const onItemActivate = vi.fn();
      const { root } = await mount({ onItemActivate, onReorder: vi.fn() });
      dragHandle('tile-5');
      const action = within(tile(root, 'tile-5')).getByTestId('action-tile-5');

      await act(async () => {
        fireEvent.pointerDown(action, {
          button: 0,
          pointerId: 41,
          isPrimary: true,
          bubbles: true,
        });
        fireEvent.pointerMove(root, {
          pointerId: 41,
          isPrimary: true,
          clientX: 300,
          clientY: 250,
          bubbles: true,
        });
        await frames();
      });

      expect(overlay()).toBeNull();
      expect(marquee(root)).toBeNull();

      fireEvent.pointerUp(action, { button: 0, pointerId: 41, isPrimary: true, bubbles: true });
      fireEvent.click(action);

      expect(onItemActivate).not.toHaveBeenCalled();
      expect(overlay()).toBeNull();
      expect(marquee(root)).toBeNull();
    },
    TEST_TIMEOUT
  );

  it(
    'should not start a drag or marquee from the selection control',
    async () => {
      const { root } = await mount({ onReorder: vi.fn() });
      dragHandle('tile-5');
      const selection = tile(root, 'tile-5').querySelector<HTMLInputElement>(
        '[data-tile-grid-selection]'
      );
      if (!(selection instanceof HTMLInputElement)) {
        throw new Error('The tile selection control is missing');
      }

      const rootRect = root.getBoundingClientRect();
      const rect = selection.getBoundingClientRect();
      const start = {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      };

      await act(async () => {
        fireEvent.pointerDown(selection, {
          pointerId: 51,
          isPrimary: true,
          button: 0,
          ...start,
          bubbles: true,
        });
        fireEvent.pointerMove(root, {
          pointerId: 51,
          isPrimary: true,
          clientX: rootRect.left + 300,
          clientY: rootRect.top + 250,
          bubbles: true,
        });
        await frames();
      });

      expect(overlay()).toBeNull();
      expect(marquee(root)).toBeNull();

      fireEvent.pointerUp(selection, {
        pointerId: 51,
        isPrimary: true,
        button: 0,
        ...start,
        bubbles: true,
      });

      expect(screen.getByTestId('selected-tile-5')).toHaveTextContent('true');
    },
    TEST_TIMEOUT
  );

  it(
    'should render a handle-free overlay copy while the source tile is marked dragging',
    async () => {
      const { root } = await mount({ onReorder: vi.fn() });
      const handle = dragHandle('tile-5');
      expect(handle).toHaveAccessibleName('Reorder Tile 5');
      const destination = center(root, tile(root, 'tile-0'));

      await drag({
        root,
        handle,
        path: pathTo(root, handle, destination),
        during: async () => {
          await waitFor(() => expect(overlay()).not.toBeNull());
          const copy = overlay();
          if (!copy) throw new Error('The drag overlay did not appear');
          expect(within(copy).getByText('Tile 5')).toBeVisible();
          expect(copy).toHaveAttribute('inert');
          expect(within(copy).getByTestId('content-tile-5')).toHaveAttribute(
            'data-overlay',
            'true'
          );
          expect(within(copy).getByTestId('content-tile-5')).toHaveAttribute(
            'data-dragging',
            'true'
          );
          expect(within(copy).queryByTestId('handle-tile-5')).toBeNull();
          expect(copy.querySelector('button[aria-label="Reorder Tile 5"]')).toBeNull();
          expect(tile(root, 'tile-5')).toHaveAttribute('data-dragging', 'true');
          expect(copy.closest('[data-testid="frame"]')).toBeNull();
          expect(marquee(root)).toBeNull();
        },
      });

      expect(overlay()).toBeNull();
      expect(tile(root, 'tile-5')).not.toHaveAttribute('data-dragging');
    },
    TEST_TIMEOUT
  );

  it(
    'should clamp a drop released outside the grid to the nearest collection boundary',
    async () => {
      const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
      const { root } = await mount({ onReorder });
      const handle = dragHandle('tile-5');
      const reference = center(root, tile(root, 'tile-5'));

      await drag({
        root,
        handle,
        path: pathTo(root, handle, { x: 4, y: reference.y }),
        during: async () => {
          // The provider clamps a hover position to its target element, so the
          // out-of-grid point must be hovered on the document body.
          await userEvent.hover(document.body, { position: { x: 10, y: 10 } });
        },
      });

      expect(onReorder).toHaveBeenCalledTimes(1);
      const [args] = onReorder.mock.calls[0] ?? [];
      if (!args) throw new Error('The reorder callback did not receive a payload');
      expect(args.itemId).toBe('tile-5');
      expect(args.fromIndex).toBe(5);
      expect(args.toIndex).toBe(0);
      expect(args.orderedIds).toEqual(movedOrder(IDS, 5, 0));
    },
    TEST_TIMEOUT
  );
});
