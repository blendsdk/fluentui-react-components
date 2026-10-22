import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { UserEventClickOptions } from 'vitest/browser';
import { TileGrid } from '../../src/components/TileGrid';
import type {
  TileGridItemRenderArgs,
  TileGridLayout,
  TileGridProps,
} from '../../src/components/TileGrid/TileGrid.types';
import { createTileGridFixture } from '../fixtures/tileGridFixture';

/** Fixed square records make rectangle membership independent of the layout implementation. */
const SMALL = ['a', 'b', 'c', 'd'].map(id => ({ id, label: id, aspectRatio: 1 }));
type Item = (typeof SMALL)[number];
type GridProps = Partial<TileGridProps<Item>> & { width?: number; height?: number };
type Point = { x: number; y: number };
const getId = (item: Item) => item.id;
const getLabel = (item: Item) => item.label;
const getRatio = (item: Item) => item.aspectRatio;
const isDisabled = (item: Item) => item.id === 'c';
const isSelectable = (item: Item) => item.id !== 'd';
const overlay = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-tile-grid-marquee]');
const tile = (name: string) => screen.getByRole('listitem', { name });
const START = { x: 164, y: 80 };
const END = { x: 650, y: 140 };
const HOLD_MS = 3_000;
const TEST_TIMEOUT = 20_000;

/** Consumer rendering exposes visual selection separately from the library-owned checkbox. */
function content({ item, selected }: TileGridItemRenderArgs<Item>) {
  return (
    <div style={{ paddingTop: 36 }} data-testid={`content-${item.id}`} data-selected={selected}>
      <span>{item.label}</span>
      <button type="button">Open {item.label}</button>
      <a href="#details" draggable={false}>
        Details {item.label}
      </a>
      <input aria-label={`Edit ${item.label}`} style={{ width: 90 }} />
    </div>
  );
}

/** The host fixes geometry while the grid owns its real scroll container and pointer capture. */
function Grid({ width = 664, height = 260, ...props }: GridProps) {
  return (
    <FluentProvider theme={webLightTheme}>
      <input aria-label="Search" />
      <div style={{ width, height }}>
        <TileGrid
          items={SMALL}
          getItemId={getId}
          getItemLabel={getLabel}
          getItemAspectRatio={getRatio}
          renderItem={content}
          ariaLabel="Photos"
          selectionMode="multiselect"
          enableMarquee
          defaultSelectedIds={['hidden', 'a']}
          isDisabled={isDisabled}
          isSelectable={isSelectable}
          tileSize={160}
          gap={8}
          style={{ scrollbarWidth: 'none' }}
          {...props}
        />
      </div>
    </FluentProvider>
  );
}

/** Native event evidence is recorded through consumer handlers, never a capture substitute. */
interface PointerEvidence {
  down?: PointerEvent;
  up?: { event: PointerEvent; scrollTop: number };
  lost: number;
}

/** Reads the pointer populated asynchronously after the fixture's local reset. */
function readPointerDown(evidence: PointerEvidence): PointerEvent | undefined {
  return evidence.down;
}

/** Waits for measured items rather than mistaking the empty placeholder for a tile. */
async function mount(props: GridProps = {}) {
  const events: PointerEvidence = { lost: 0 };
  const handlers: Partial<TileGridProps<Item>> = {
    onPointerDown: event => {
      events.down = event.nativeEvent;
      props.onPointerDown?.(event);
    },
    onPointerUp: event => {
      events.up = { event: event.nativeEvent, scrollTop: event.currentTarget.scrollTop };
      props.onPointerUp?.(event);
    },
    onLostPointerCapture: () => {
      events.lost += 1;
    },
  };
  const view = render(<Grid {...props} {...handlers} />);
  const root = screen.getByRole('list', { name: 'Photos' });
  const first = (props.items ?? SMALL)[0];
  if (first) await screen.findByRole('listitem', { name: first.label });
  return {
    ...view,
    root,
    events,
    update: (next: GridProps) => view.rerender(<Grid {...props} {...next} {...handlers} />),
  };
}

/** Lets native frame callbacks and React's resulting presentation finish without a sleep. */
async function frames() {
  await act(async () => {
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

/** Both application content and the actual checkbox must project the transient membership. */
function selected(id: string, value: boolean) {
  const body = screen.getByTestId(`content-${id}`);
  expect(body).toHaveAttribute('data-selected', String(value));
  const wrapper = body.closest<HTMLElement>('[data-tile-grid-item]');
  if (!wrapper) throw new Error('Selected content must belong to a mounted tile');
  const checkbox = within(wrapper).queryByRole('checkbox');
  if (checkbox) expect(checkbox).toHaveProperty('checked', value);
}

/**
 * A delayed native click holds the mouse while another provider command moves it.
 * The delay models a real held button, not a settling sleep. Always await release,
 * even on a failed assertion, so one red case cannot leave the next case dragging.
 * Positions use the provider's padding-box coordinates, including on bordered roots.
 */
async function held(
  view: Awaited<ReturnType<typeof mount>>,
  during: (pointerId: number) => Promise<void>,
  options: UserEventClickOptions = {},
  target: HTMLElement = view.root
) {
  view.events.down = undefined;
  view.events.up = undefined;
  // Vitest starts provider commands when their lazy promise is consumed.
  const release = userEvent
    .click(target, { position: START, delay: HOLD_MS, ...options })
    .then(() => undefined);
  try {
    await waitFor(() => expect(view.events.down?.isTrusted).toBe(true), { timeout: 5_000 });
    const down = readPointerDown(view.events);
    if (!down) throw new Error('Native pointer-down did not reach the consumer handler');
    expect(down.buttons).toBe(options.button === 'right' ? 2 : 1);
    await during(down.pointerId);
  } finally {
    await release;
  }
}

/** Every successful/cancelled gesture first proves real capture and a visible preview. */
async function preview(root: HTMLElement, pointerId: number, end: Point = END) {
  expect(root.hasPointerCapture(pointerId)).toBe(true);
  await userEvent.hover(root, { position: end });
  await waitFor(() => {
    expect(overlay(root)).toBeVisible();
    selected('b', true);
  });
  expect(root.querySelectorAll('[data-tile-grid-marquee]')).toHaveLength(1);
  expect(overlay(root)).toHaveAttribute('aria-hidden', 'true');
  expect(getComputedStyle(overlay(root)!)).toHaveProperty('pointerEvents', 'none');
}

describe('TileGrid native marquee contract', () => {
  for (const modifier of [undefined, 'Shift', 'Control', 'Meta'] as const) {
    it(
      `commits once after ${modifier ?? 'plain'} native release and retains only eligible hits`,
      async () => {
        const changes = vi.fn();
        const activate = vi.fn();
        const view = await mount({ onSelectionChange: changes, onItemActivate: activate });
        await held(
          view,
          async id => {
            await preview(view.root, id);
            selected('a', modifier !== undefined);
            selected('c', false);
            selected('d', false);
            expect(changes).not.toHaveBeenCalled();
            expect(screen.getByRole('status')).toBeEmptyDOMElement();
          },
          { modifiers: modifier ? [modifier] : [] }
        );
        expect(changes).toHaveBeenCalledExactlyOnceWith(
          new Set(modifier ? ['hidden', 'a', 'b'] : ['b'])
        );
        await waitFor(() => expect(view.events.lost).toBe(1));
        expect(view.events.up?.event.isTrusted).toBe(true);
        expect(overlay(view.root)).toBeNull();
        selected('b', true);
        expect(screen.getByRole('status')).toHaveTextContent(`${modifier ? 3 : 1} of 4 selected`);
        expect(activate).not.toHaveBeenCalled();
        await frames();
        expect(changes).toHaveBeenCalledTimes(1);
      },
      TEST_TIMEOUT
    );
  }

  it(
    'cancels an active captured gesture with Escape while Search retains focus',
    async () => {
      const changes = vi.fn();
      const view = await mount({ onSelectionChange: changes });
      const search = screen.getByRole('textbox', { name: 'Search' });
      await userEvent.click(search);
      await held(view, async id => {
        await preview(view.root, id);
        expect(search).toHaveFocus();
        selected('a', false);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(overlay(view.root)).toBeNull());
        expect(view.root.hasPointerCapture(id)).toBe(false);
        selected('a', true);
        selected('b', false);
        await userEvent.hover(view.root, { position: { x: 600, y: 150 } });
        expect(search).toHaveFocus();
      });
      expect(changes).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    },
    TEST_TIMEOUT
  );

  it(
    'treats real nonterminal capture loss as cancellation and ignores the later native release',
    async () => {
      const changes = vi.fn();
      const view = await mount({ onSelectionChange: changes });
      await held(view, async id => {
        await preview(view.root, id);
        expect(view.events.up).toBeUndefined();
        view.root.releasePointerCapture(id);
        await userEvent.hover(view.root, { position: { x: 620, y: 145 } });
        await waitFor(() => {
          expect(view.events.lost).toBe(1);
          expect(overlay(view.root)).toBeNull();
        });
        expect(view.events.up).toBeUndefined();
        selected('a', true);
        selected('b', false);
      });
      expect(view.events.up?.event.isTrusted).toBe(true);
      expect(changes).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    },
    TEST_TIMEOUT
  );

  it(
    'auto-scrolls across virtual windows and commits the complete cached final rectangle without tile measurements',
    async () => {
      const changes = vi.fn();
      const view = await mount({
        items: createTileGridFixture(2_000),
        width: 328,
        height: 260,
        defaultSelectedIds: [],
        onSelectionChange: changes,
      });
      const first = tile('Tile 0');
      const original = Element.prototype.getBoundingClientRect;
      const itemReads: Element[] = [];
      const spy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: Element
      ) {
        if (this.matches('[data-tile-grid-item]')) itemReads.push(this);
        return original.call(this);
      });
      try {
        await held(
          view,
          async id => {
            expect(view.root.hasPointerCapture(id)).toBe(true);
            await userEvent.hover(view.root, { position: { x: 80, y: 240 } });
            await waitFor(() => {
              expect(overlay(view.root)).toBeVisible();
              selected('tile-0', true);
            });
            await waitFor(
              () => {
                expect(view.root.scrollTop).toBeGreaterThan(3 * view.root.clientHeight);
                expect(first.isConnected).toBe(false);
                expect(view.root.querySelectorAll('[data-tile-grid-item]').length).toBeGreaterThan(
                  0
                );
              },
              { timeout: 5_000 }
            );
            // Leave the edge before release so the final scroll offset is stable and observable.
            await userEvent.hover(view.root, { position: { x: 80, y: 130 } });
            await frames();
            const stationary = view.root.scrollTop;
            await frames();
            expect(view.root.scrollTop).toBe(stationary);
            const visibleLeft = Array.from(
              view.root.querySelectorAll<HTMLElement>('[data-tile-grid-item]')
            ).find(
              node =>
                Number(node.getAttribute('data-index')) % 2 === 0 &&
                Number.parseFloat(node.style.top) + 160 > stationary &&
                Number.parseFloat(node.style.top) < stationary + 130
            );
            expect(visibleLeft).toBeDefined();
            const idInWindow = visibleLeft?.getAttribute('data-tile-grid-item');
            if (!idInWindow) throw new Error('No left-column tile inside the current rectangle');
            selected(idInWindow, true);
            expect(changes).not.toHaveBeenCalled();
            expect(screen.getByRole('status')).toBeEmptyDOMElement();
          },
          { delay: 8_000 }
        );
        const up = view.events.up;
        if (!up) throw new Error('Native release was not observed');
        const bottom =
          up.scrollTop +
          up.event.clientY -
          view.root.getBoundingClientRect().top -
          view.root.clientTop;
        // Two 160px columns with an 8px gap: only even IDs lie left of x=164.
        // Rows start at 0,168,336,...; the first row still intersects the y=80 origin.
        const expected = new Set<string>();
        for (let row = 0; row * 168 < bottom; row += 1) expected.add(`tile-${row * 2}`);
        expect(expected.size).toBeGreaterThan(5);
        expect(changes).toHaveBeenCalledExactlyOnceWith(expected);
        expect(expected.has('tile-0')).toBe(true);
        expect(first.isConnected).toBe(false);
        expect(itemReads).toHaveLength(0);
        expect(overlay(view.root)).toBeNull();
      } finally {
        spy.mockRestore();
      }
    },
    TEST_TIMEOUT
  );

  it(
    'uses the client-area origin for a gap-only rectangle inside a bordered root',
    async () => {
      const changes = vi.fn();
      const view = await mount({
        width: 348,
        height: 380,
        style: {
          border: '10px solid transparent',
          boxSizing: 'border-box',
          scrollbarWidth: 'none',
        },
        onSelectionChange: changes,
      });
      expect(view.root.clientLeft).toBe(10);
      expect(view.root.clientWidth).toBe(328);
      expect(tile('a').getBoundingClientRect().width).toBe(160);
      expect(tile('b').getBoundingClientRect().left - tile('a').getBoundingClientRect().right).toBe(
        8
      );
      await held(
        view,
        async id => {
          expect(view.root.hasPointerCapture(id)).toBe(true);
          await userEvent.hover(view.root, { position: { x: 166, y: 140 } });
          await waitFor(() => expect(overlay(view.root)).toBeVisible());
          selected('a', false);
          selected('b', false);
          const rect = overlay(view.root)!.getBoundingClientRect();
          expect(
            rect.left - view.root.getBoundingClientRect().left - view.root.clientLeft
          ).toBeCloseTo(162, 0);
          expect(rect.width).toBeCloseTo(4, 0);
        },
        { position: { x: 162, y: 80 } }
      );
      expect(changes).toHaveBeenCalledExactlyOnceWith(new Set());
      selected('b', false);
    },
    TEST_TIMEOUT
  );

  it(
    'moves the overlay when the hit set stays empty and activates at four pixels, not three',
    async () => {
      const changes = vi.fn();
      const view = await mount({ defaultSelectedIds: [], onSelectionChange: changes });
      await held(
        view,
        async id => {
          expect(view.root.hasPointerCapture(id)).toBe(true);
          await userEvent.hover(view.root, { position: { x: 103, y: 210 } });
          await frames();
          expect(overlay(view.root)).toBeNull();
          await userEvent.hover(view.root, { position: { x: 104, y: 210 } });
          await waitFor(() => expect(overlay(view.root)).not.toBeNull());
          await userEvent.hover(view.root, { position: { x: 125, y: 215 } });
          await waitFor(() =>
            expect(overlay(view.root)?.getBoundingClientRect().width).toBeCloseTo(25, 0)
          );
          const before = overlay(view.root)!.getBoundingClientRect();
          await userEvent.hover(view.root, { position: { x: 140, y: 220 } });
          await waitFor(() =>
            expect(overlay(view.root)?.getBoundingClientRect().width).toBeCloseTo(40, 0)
          );
          expect(overlay(view.root)!.getBoundingClientRect().height).toBeGreaterThan(before.height);
          expect(changes).not.toHaveBeenCalled();
        },
        { position: { x: 100, y: 210 } }
      );
      expect(changes).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    },
    TEST_TIMEOUT
  );

  for (const origin of ['tile', 'checkbox', 'button', 'link', 'input', 'empty'] as const) {
    it(
      `does not capture or preview a native drag starting on ${origin} content`,
      async () => {
        const changes = vi.fn();
        const view = await mount({
          ...(origin === 'empty'
            ? { items: [], renderEmpty: () => <span>Nothing here</span> }
            : {}),
          onSelectionChange: changes,
        });
        const target =
          origin === 'empty'
            ? screen.getByText('Nothing here')
            : origin === 'tile'
              ? within(tile('a')).getByText('a')
              : origin === 'checkbox'
                ? screen.getByRole('checkbox', { name: 'a' })
                : origin === 'button'
                  ? screen.getByRole('button', { name: 'Open a' })
                  : origin === 'link'
                    ? screen.getByRole('link', { name: 'Details a' })
                    : screen.getByRole('textbox', { name: 'Edit a' });
        await held(
          view,
          async id => {
            expect(view.root.hasPointerCapture(id)).toBe(false);
            await userEvent.hover(view.root, { position: { x: 300, y: 210 } });
            await frames();
            expect(overlay(view.root)).toBeNull();
          },
          { position: { x: 2, y: 2 } },
          target
        );
        expect(changes).not.toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );
  }

  for (const veto of ['secondary button', 'prevented pointer-down'] as const) {
    it(
      `leaves ${veto} gestures outside marquee ownership`,
      async () => {
        const changes = vi.fn();
        const view = await mount({
          onSelectionChange: changes,
          onPointerDown:
            veto === 'prevented pointer-down' ? event => event.preventDefault() : undefined,
        });
        await held(
          view,
          async id => {
            expect(view.root.hasPointerCapture(id)).toBe(false);
            await userEvent.hover(view.root, { position: END });
            await frames();
            expect(overlay(view.root)).toBeNull();
          },
          { button: veto === 'secondary button' ? 'right' : 'left' }
        );
        expect(changes).not.toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );
  }

  for (const change of [
    'items',
    'layout',
    'tile size',
    'predicate',
    'selection',
    'disabled',
  ] as const) {
    it(
      `cancels a captured preview after an external ${change} update`,
      async () => {
        const changes = vi.fn();
        const view = await mount({
          selectedIds: new Set(['hidden', 'a']),
          onSelectionChange: changes,
        });
        await held(view, async id => {
          await preview(view.root, id);
          const next: GridProps =
            change === 'items'
              ? { items: SMALL.slice(0, 3) }
              : change === 'layout'
                ? { layout: 'masonry' }
                : change === 'tile size'
                  ? { tileSize: 180 }
                  : change === 'predicate'
                    ? { isSelectable: item => item.id !== 'd' }
                    : change === 'selection'
                      ? { selectedIds: new Set(['hidden', 'b']) }
                      : { enableMarquee: false };
          view.update(next);
          await waitFor(() => expect(overlay(view.root)).toBeNull());
          expect(view.root.hasPointerCapture(id)).toBe(false);
          selected('a', change !== 'selection');
          selected('b', change === 'selection');
          await userEvent.hover(view.root, { position: { x: 600, y: 145 } });
        });
        expect(changes).not.toHaveBeenCalled();
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
      },
      TEST_TIMEOUT
    );
  }

  it(
    'keeps equal-membership parent updates active, then restores a rejected controlled proposal',
    async () => {
      const changes = vi.fn();
      const view = await mount({
        selectedIds: new Set(['hidden', 'a']),
        onSelectionChange: changes,
      });
      await held(view, async id => {
        await preview(view.root, id);
        view.update({ selectedIds: new Set(['a', 'hidden']) });
        await frames();
        expect(overlay(view.root)).toBeVisible();
        expect(view.root.hasPointerCapture(id)).toBe(true);
        selected('a', false);
        selected('b', true);
      });
      expect(changes).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
      expect(overlay(view.root)).toBeNull();
      selected('a', true);
      selected('b', false);
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    },
    TEST_TIMEOUT
  );

  it(
    'renders a controlled accepted proposal once after native release',
    async () => {
      const changes = vi.fn((next: ReadonlySet<string>) => view.update({ selectedIds: next }));
      const view = await mount({
        selectedIds: new Set(['hidden', 'a']),
        onSelectionChange: changes,
      });
      await held(view, async id => preview(view.root, id));
      expect(changes).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
      selected('a', false);
      selected('b', true);
      expect(overlay(view.root)).toBeNull();
      expect(screen.getByRole('status')).toHaveTextContent('1 of 4 selected');
    },
    TEST_TIMEOUT
  );

  it(
    'releases an active native gesture on unmount without a late proposal or focus theft',
    async () => {
      const changes = vi.fn();
      const view = await mount({ onSelectionChange: changes });
      await held(view, async id => {
        await preview(view.root, id);
        view.unmount();
        expect(view.root.isConnected).toBe(false);
        expect(view.root.hasPointerCapture(id)).toBe(false);
        await frames();
      });
      expect(changes).not.toHaveBeenCalled();
      render(<input aria-label="Replacement search" />);
      const search = screen.getByRole('textbox', { name: 'Replacement search' });
      await userEvent.click(search);
      await userEvent.keyboard('{Escape}');
      expect(search).toHaveFocus();
      expect(changes).not.toHaveBeenCalled();
    },
    TEST_TIMEOUT
  );

  it(
    'keeps the native scroll extent finite while a captured marquee extends beyond both edges',
    async () => {
      const previousViewport = { width: innerWidth, height: innerHeight };
      await page.viewport(1280, 900);
      try {
        const changes = vi.fn();
        const view = await mount({ defaultSelectedIds: [], onSelectionChange: changes });
        const { root } = view;
        const height = root.clientHeight;
        const width = root.clientWidth;
        expect(root.scrollHeight).toBe(height);
        expect(root.scrollWidth).toBe(width);
        await held(
          view,
          async id => {
            expect(root.hasPointerCapture(id)).toBe(true);
            await userEvent.hover(root, { position: { x: 800, y: 310 }, force: true });
            await waitFor(() => expect(overlay(root)).toBeVisible());
            await frames();
            expect(root.hasPointerCapture(id)).toBe(true);
            expect(view.events.up).toBeUndefined();
            // Decoration must not manufacture scrollable space beyond the finite content canvas.
            expect({
              scrollTop: root.scrollTop,
              scrollLeft: root.scrollLeft,
              scrollHeight: root.scrollHeight,
              scrollWidth: root.scrollWidth,
            }).toEqual({ scrollTop: 0, scrollLeft: 0, scrollHeight: height, scrollWidth: width });
          },
          { position: { x: 100, y: 210 } }
        );
        for (const item of SMALL) selected(item.id, false);
        expect(changes).not.toHaveBeenCalled();
        expect(overlay(root)).toBeNull();
      } finally {
        await page.viewport(previousViewport.width, previousViewport.height);
      }
    },
    TEST_TIMEOUT
  );

  const layouts: readonly TileGridLayout[] = ['fixed', 'masonry', 'justified', 'mosaic'];
  for (const layout of layouts) {
    it(
      `preserves named-list, selection, focus, and native marquee semantics in ${layout}`,
      async () => {
        const changes = vi.fn();
        const view = await mount({ layout, width: 328, height: 380, onSelectionChange: changes });
        expect(screen.queryByRole('grid')).toBeNull();
        expect(tile('a')).toHaveAttribute('aria-setsize', '4');
        await userEvent.click(screen.getByRole('checkbox', { name: 'b' }));
        expect(changes).toHaveBeenCalledExactlyOnceWith(new Set(['hidden', 'a', 'b']));
        await userEvent.keyboard('{Escape}');
        expect(tile('b')).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(tile('a')).toHaveFocus();
        changes.mockClear();
        const bounds = view.root.getBoundingClientRect();
        const a = tile('a').getBoundingClientRect();
        const b = tile('b').getBoundingClientRect();
        expect(b.left - a.right).toBeGreaterThan(4);
        const origin = { x: (a.right + b.left) / 2 - bounds.left, y: a.top + 80 - bounds.top };
        const end = { x: b.left + 40 - bounds.left, y: b.top + 130 - bounds.top };
        await held(view, async id => preview(view.root, id, end), { position: origin });
        expect(changes).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
        selected('a', false);
        selected('b', true);
        expect(overlay(view.root)).toBeNull();
      },
      TEST_TIMEOUT
    );
  }
});
