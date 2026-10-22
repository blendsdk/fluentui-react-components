import {
  Button,
  FluentProvider,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  webLightTheme,
} from '@fluentui/react-components';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { TileGrid } from '../../src/components/TileGrid';
import type {
  TileGridItemRenderArgs,
  TileGridProps,
} from '../../src/components/TileGrid/TileGrid.types';
import { createTileGridFixture } from '../fixtures/tileGridFixture';

/** Small named items also carry the unequal ratios and span used for spatial navigation. */
const SMALL = [
  { id: 'a', label: 'a', aspectRatio: 0.5 },
  { id: 'b', label: 'b', aspectRatio: 1 },
  { id: 'c', label: 'c', aspectRatio: 2 },
  { id: 'd', label: 'd', aspectRatio: 1 },
  { id: 'e', label: 'e', aspectRatio: 1 },
  { id: 'f', label: 'f', aspectRatio: 1 },
];
type Item = (typeof SMALL)[number];
type GridProps = Partial<TileGridProps<Item>> & { width?: number; height?: number };
const MANY = createTileGridFixture(80);
const getId = (item: Item) => item.id;
const getLabel = (item: Item) => item.label;
const getRatio = (item: Item) => item.aspectRatio;
const tile = (name: string) => screen.getByRole('listitem', { name });
const button = (name: string) => screen.getByRole('button', { name });

/** Actions sit below the overlaid selection input so pointer tests hit the intended control. */
function actions({ item, selected }: TileGridItemRenderArgs<Item>) {
  return (
    <div style={{ paddingTop: 32 }} data-selected={selected} data-testid={`content-${item.id}`}>
      <button type="button">Open {item.label}</button>
      <button type="button">More {item.label}</button>
    </div>
  );
}

/** Real fixed-size host with outside focus owners; the search field is reached explicitly. */
function Grid({ width = 328, height = 360, ...props }: GridProps) {
  return (
    <FluentProvider theme={webLightTheme}>
      <button type="button" autoFocus>
        Before
      </button>
      <input aria-label="Search" tabIndex={-1} />
      <div style={{ width, height }}>
        <TileGrid
          items={SMALL}
          getItemId={getId}
          getItemLabel={getLabel}
          getItemAspectRatio={getRatio}
          renderItem={actions}
          ariaLabel="Photos"
          selectionMode="multiselect"
          tileSize={160}
          gap={8}
          style={{ scrollbarWidth: 'none' }}
          {...props}
        />
      </div>
      <button type="button">After</button>
    </FluentProvider>
  );
}

/** Waits for actual measured items, never an empty-state listitem used as a substitute. */
async function mount(props: GridProps = {}) {
  const view = render(<Grid {...props} />);
  const root = screen.getByRole('list', { name: 'Photos' });
  const first = (props.items ?? SMALL)[0];
  if (first && props.width !== 0) await screen.findByRole('listitem', { name: first.label });
  return {
    ...view,
    root,
    update: (next: GridProps) => view.rerender(<Grid {...props} {...next} />),
  };
}

/** Programmatic focus models app/native focus entry without changing tabindex or selection. */
async function focus(element: HTMLElement) {
  await act(async () => element.focus({ preventScroll: true }));
  expect(element).toHaveFocus();
}

/** Checks native sequential navigation, including the actual browser's radio-group behavior. */
async function tabTo(element: HTMLElement, shift = false) {
  await userEvent.tab({ shift });
  await waitFor(() => expect(element).toHaveFocus());
}

/** Lets real paint/ref/observer work finish before checking that focus or scroll stayed put. */
async function frames() {
  await act(async () => {
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

describe('TileGrid browser focus contract', () => {
  it('enters the wrapper from either side and traverses checkbox/actions without a trap', async () => {
    const onSelectionChange = vi.fn();
    await mount({ defaultSelectedIds: ['a'], onSelectionChange });
    const checkbox = screen.getByRole('checkbox', { name: 'a' });
    for (const control of [checkbox, button('Open a'), button('More a'), button('Open b')]) {
      expect(control).toHaveAttribute('tabindex', '-1');
    }
    await userEvent.click(button('Before'));
    await tabTo(tile('a'));
    for (const target of [checkbox, button('Open a'), button('More a'), button('After')]) {
      await tabTo(target);
    }
    await tabTo(tile('a'), true);
    for (const target of [checkbox, button('Open a'), button('More a')]) await tabTo(target);
    for (const target of [button('Open a'), checkbox, tile('a'), button('Before')]) {
      await tabTo(target, true);
    }
    await tabTo(tile('a'));
    await tabTo(checkbox);
    await userEvent.keyboard('{Escape}');
    expect(tile('a')).toHaveFocus();
    await focus(button('More a'));
    await userEvent.keyboard('{Escape}');
    expect(tile('a')).toHaveFocus();
    expect(button('Open b')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('checkbox', { name: 'b' })).toHaveAttribute('tabindex', '-1');
    expect(checkbox).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('includes an unchecked active radio in both directions without changing the checked peer', async () => {
    const onSelectionChange = vi.fn();
    await mount({ selectionMode: 'single', defaultSelectedIds: ['a'], onSelectionChange });
    const radio = screen.getByRole('radio', { name: 'b' });
    await focus(tile('b'));
    expect(screen.getByRole('radio', { name: 'a' })).toBeChecked();
    expect(radio).not.toBeChecked();
    await tabTo(radio);
    await tabTo(button('Open b'));
    await tabTo(radio, true);
    await tabTo(tile('b'), true);
    expect(screen.getByRole('radio', { name: 'a' })).toBeChecked();
    expect(radio).not.toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('lets native radio arrows update selection and active wrapper exactly once', async () => {
    const onSelectionChange = vi.fn();
    const onItemActivate = vi.fn();
    await mount({
      selectionMode: 'single',
      defaultSelectedIds: ['a'],
      onSelectionChange,
      onItemActivate,
    });
    await focus(screen.getByRole('radio', { name: 'a' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'b' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'b' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'a' })).not.toBeChecked();
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
    expect(tile('b')).toHaveAttribute('tabindex', '0');
    expect(tile('a')).toHaveAttribute('tabindex', '-1');
    await userEvent.keyboard('{Escape}');
    expect(tile('b')).toHaveFocus();
    expect(onItemActivate).not.toHaveBeenCalled();
  });

  it('respects prevented native Tab at wrapper, owned-radio, and first-action boundaries', async () => {
    const onSelectionChange = vi.fn();
    await mount({
      selectionMode: 'single',
      defaultSelectedIds: ['a'],
      onSelectionChange,
      onKeyDownCapture: event => {
        if (event.key === 'Tab') event.preventDefault();
      },
    });
    for (const [target, shift] of [
      [tile('b'), false],
      [screen.getByRole('radio', { name: 'b' }), true],
      [button('Open b'), true],
    ] as const) {
      await focus(target);
      await userEvent.tab({ shift });
      expect(target).toHaveFocus();
    }
    expect(screen.getByRole('radio', { name: 'a' })).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('tracks dynamic author tabindex and native eligibility, restoring current attributes on release', async () => {
    /** React supplies current author intent even while the inactive tile is being suppressed. */
    const content =
      (authorIndex: number, enabled: boolean, added: boolean) =>
      ({ item }: TileGridItemRenderArgs<Item>) => (
        <div style={{ paddingTop: 32 }}>
          <button type="button">First {item.label}</button>
          <button type="button" tabIndex={authorIndex}>
            Priority {item.label}
          </button>
          <button type="button" disabled={!enabled}>
            Enabled {item.label}
          </button>
          {added && <button type="button">Added {item.label}</button>}
          <button type="button" tabIndex={3}>
            Last {item.label}
          </button>
        </div>
      );
    const { update, unmount } = await mount({ renderItem: content(2, false, false) });
    const priority = button('Priority b');
    const first = button('First b');
    const last = button('Last b');
    await waitFor(() => expect(priority).toHaveAttribute('tabindex', '-1'));
    expect(button('Enabled b')).toBeDisabled();
    await focus(tile('b'));
    expect(priority).toHaveAttribute('tabindex', '0');
    await tabTo(screen.getByRole('checkbox', { name: 'b' }));
    await tabTo(first);
    await tabTo(priority);
    await tabTo(last);
    await focus(tile('a'));
    await focus(button('Before'));
    update({ renderItem: content(-1, true, true) });
    const added = button('Added b');
    for (const control of [first, priority, button('Enabled b'), added, last]) {
      await waitFor(() => expect(control).toHaveAttribute('tabindex', '-1'));
    }
    await focus(tile('b'));
    await tabTo(screen.getByRole('checkbox', { name: 'b' }));
    await tabTo(first);
    await tabTo(button('Enabled b'));
    await tabTo(added);
    expect(priority).toHaveAttribute('tabindex', '-1');
    await focus(tile('a'));
    await focus(button('Before'));
    update({ renderItem: content(0, true, false) });
    await waitFor(() => expect(priority).toHaveAttribute('tabindex', '-1'));
    expect(added).not.toBeInTheDocument();
    expect(added).not.toHaveAttribute('tabindex');
    await focus(tile('b'));
    await tabTo(screen.getByRole('checkbox', { name: 'b' }));
    await tabTo(first);
    await tabTo(priority);
    await frames();
    expect(priority).toHaveAttribute('tabindex', '0');
    unmount();
    expect(priority).toHaveAttribute('tabindex', '0');
    expect(last).toHaveAttribute('tabindex', '3');
    expect(first).not.toHaveAttribute('tabindex');
    added.setAttribute('tabindex', '4');
    await frames();
    expect(added).toHaveAttribute('tabindex', '4');
  });

  it('leaves portalled menu keys local, consumes Escape in layers, and preserves editor keys', async () => {
    const onSelectionChange = vi.fn();
    const onTileSizeChange = vi.fn();
    const onItemActivate = vi.fn();
    const { root } = await mount({
      items: SMALL.slice(0, 1),
      defaultSelectedIds: ['a'],
      zoomable: true,
      onSelectionChange,
      onTileSizeChange,
      onItemActivate,
      renderItem: () => (
        <div style={{ paddingTop: 32 }}>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button>Actions</Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem>Rename</MenuItem>
                <MenuItem>Archive</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
          <input aria-label="Editor" style={{ width: 100 }} />
        </div>
      ),
    });
    await userEvent.click(button('Actions'));
    const rename = await screen.findByRole('menuitem', { name: 'Rename' });
    expect(root).not.toContainElement(rename);
    await waitFor(() => expect(rename).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(button('Actions')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(tile('a')).toHaveFocus();
    const editor = screen.getByRole('textbox', { name: 'Editor' });
    await userEvent.click(editor);
    await userEvent.keyboard(' +');
    expect(editor).toHaveFocus();
    expect(editor).toHaveValue(' +');
    expect(screen.getByRole('checkbox', { name: 'a' })).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onTileSizeChange).not.toHaveBeenCalled();
    expect(onItemActivate).not.toHaveBeenCalled();
  });

  it.each(['grid', 'external'] as const)(
    'resets before recovering focus owned by %s, even when the old tile stays mounted',
    async owner => {
      const onSelectionChange = vi.fn();
      const { root, update } = await mount({
        items: MANY,
        height: 160,
        defaultSelectedIds: ['tile-4', 'hidden'],
        onSelectionChange,
        isSelectable: item => item.id !== 'tile-0',
        scrollResetKey: 'all',
      });
      await userEvent.wheel(root, { delta: { y: 336 } });
      await waitFor(() => expect(root.scrollTop).toBe(336));
      await focus(tile('Tile 4'));
      const old = tile('Tile 4');
      const search = screen.getByRole('textbox', { name: 'Search' });
      if (owner === 'external') await userEvent.click(search);
      expect(owner === 'grid' ? old : search).toHaveFocus();
      update({ items: MANY.filter(item => item.id !== 'tile-1'), scrollResetKey: 'filtered' });
      await waitFor(() => expect(root.scrollTop).toBe(0));
      // Tile 4 is now index 3 at y=168: mounted in overscan, outside the 160px viewport.
      expect(tile('Tile 4')).toBe(old);
      expect(old.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        root.getBoundingClientRect().bottom
      );
      expect(tile('Tile 2')).toHaveAttribute('tabindex', '0');
      expect(owner === 'grid' ? tile('Tile 2') : search).toHaveFocus();
      expect(screen.getByRole('checkbox', { name: 'Tile 4' })).toBeChecked();
      await frames();
      expect(root.scrollTop).toBe(0);
      expect(onSelectionChange).not.toHaveBeenCalled();
      if (owner === 'external') await tabTo(tile('Tile 2'));
    }
  );

  it('does not autofocus or scroll to a seed and preserves a visible active item through layout, size, and append', async () => {
    const onSelectionChange = vi.fn();
    const { root, update } = await mount({
      items: MANY,
      height: 160,
      defaultSelectedIds: ['tile-79'],
      onSelectionChange,
      scrollResetKey: 'stable',
    });
    expect(button('Before')).toHaveFocus();
    expect(root.scrollTop).toBe(0);
    expect(screen.queryByRole('listitem', { name: 'Tile 79' })).not.toBeInTheDocument();
    await tabTo(tile('Tile 0'));
    update({ layout: 'masonry' });
    await waitFor(() => expect(tile('Tile 0').style.height).toBe('200px'));
    expect(tile('Tile 0')).toHaveFocus();
    update({ layout: 'masonry', tileSize: 200 });
    await waitFor(() => expect(tile('Tile 0').style.width).toBe('328px'));
    expect(tile('Tile 0')).toHaveFocus();
    // Restore a two-column layout and establish a nonzero anchor before appending.
    update({ layout: 'fixed', tileSize: 160 });
    await userEvent.wheel(root, { delta: { y: 336 } });
    await waitFor(() => expect(root.scrollTop).toBe(336));
    await focus(tile('Tile 4'));
    update({ items: [...MANY, { id: 'later', label: 'Later', aspectRatio: 1 }] });
    await frames();
    expect(root.scrollTop).toBe(336);
    expect(tile('Tile 4')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(tile('Later')).toHaveFocus());
    expect(screen.getByRole('checkbox', { name: 'Tile 79' })).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('recovers to the nearest visible item when zoom moves the active item outside the viewport', async () => {
    const { root, update } = await mount({ height: 160, defaultSelectedIds: ['b'] });
    await tabTo(tile('b'));
    update({ tileSize: 200 });
    await waitFor(() => expect(tile('a').style.width).toBe('328px'));
    expect(root.scrollTop).toBe(0);
    expect(tile('a')).toHaveFocus();
    expect(screen.getByRole('checkbox', { name: 'b' })).toBeChecked();
  });

  it.each(['wrapper', 'consumer', 'all ineligible'] as const)(
    'recovers visibly after wheel scrolling unmounts the focused %s without scrolling back',
    async origin => {
      const onSelectionChange = vi.fn();
      const onItemActivate = vi.fn();
      const { root } = await mount({
        items: MANY,
        height: 160,
        defaultSelectedIds: ['tile-0'],
        onSelectionChange,
        onItemActivate,
        isSelectable: item => origin !== 'all ineligible' && item.id !== 'tile-20',
        isDisabled: () => origin === 'all ineligible',
      });
      const old = origin === 'consumer' ? button('Open Tile 0') : tile('Tile 0');
      await focus(old);
      const handoffs: { target: HTMLElement; scrollTop: number; height: number }[] = [];
      const scrollPositions = [root.scrollTop];
      /** Samples the real scroll position without driving or cancelling native scrolling. */
      function recordScroll() {
        scrollPositions.push(root.scrollTop);
      }
      /** Captures each handoff's viewport and checks scrolling again after focus finishes. */
      function recordFocus(event: FocusEvent) {
        recordScroll();
        if (event.target instanceof HTMLElement) {
          handoffs.push({
            target: event.target,
            scrollTop: root.scrollTop,
            height: root.clientHeight,
          });
        }
        queueMicrotask(recordScroll);
      }
      root.addEventListener('focus', recordFocus, { capture: true, passive: true });
      root.addEventListener('scroll', recordScroll, { passive: true });
      try {
        await userEvent.wheel(root, { delta: { y: 1680 } });
        await waitFor(() => expect(old).not.toBeInTheDocument());
        await waitFor(() => expect(root.scrollTop).toBe(1680));
        await waitFor(() => {
          expect(handoffs.at(-1)?.target).not.toBe(root);
          expect(handoffs.at(-1)?.target).toHaveFocus();
        });
        await frames();
        expect(root.scrollTop).toBe(1680);
        recordScroll();
      } finally {
        root.removeEventListener('focus', recordFocus, true);
        root.removeEventListener('scroll', recordScroll);
      }

      // Native wheel animation may complete several recoveries before reaching its final offset.
      // The root may bridge focus; each tile destination must suit its own actual viewport.
      const recoveries = handoffs.filter(({ target }) => target !== root);
      let lastIndex = -1;
      for (const { target, scrollTop, height } of recoveries) {
        // Two 160px columns with an 8px gap put row n at n * 168, independently of the renderer.
        const visible = MANY.map((item, index) => ({
          item,
          index,
          top: Math.floor(index / 2) * 168,
        })).filter(({ top }) => top < scrollTop + height && top + 160 > scrollTop);
        const expected =
          visible.find(({ item }) => origin !== 'all ineligible' && item.id !== 'tile-20') ??
          visible[0];
        if (!expected) throw new Error('The measured viewport must intersect a fixture tile.');
        expect(target).toHaveAttribute('role', 'listitem');
        expect(target).toHaveAccessibleName(expected.item.label);
        lastIndex = expected.index;
      }
      const latest = recoveries.at(-1);
      if (!latest)
        throw new Error('Unmounting the focused tile must produce a tile focus handoff.');
      expect(latest.target).toBeInTheDocument();
      expect(latest.target).toHaveFocus();
      // A positive wheel gesture must not be reversed by either the root bridge or tile focus.
      for (let index = 1; index < scrollPositions.length; index++) {
        expect(scrollPositions[index]).toBeGreaterThanOrEqual(scrollPositions[index - 1]);
      }
      if (origin === 'all ineligible') {
        expect(latest.target).toHaveAttribute('aria-disabled', 'true');
        const rightIndex =
          lastIndex % 2 === 0 && lastIndex + 1 < MANY.length ? lastIndex + 1 : lastIndex;
        await userEvent.keyboard('{ArrowRight} {Enter}');
        expect(tile(MANY[rightIndex].label)).toHaveFocus();
        expect(within(root).queryByRole('checkbox')).not.toBeInTheDocument();
      }
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(onItemActivate).not.toHaveBeenCalled();
    }
  );

  it.each(['control', 'tile'] as const)(
    'recovers real focus when the consumer removes the focused %s',
    async removal => {
      const onSelectionChange = vi.fn();
      const { update } = await mount({ onSelectionChange });
      const old = button('Open a');
      await userEvent.click(old);
      expect(old).toHaveFocus();
      if (removal === 'tile') update({ items: SMALL.slice(1) });
      else update({ renderItem: ({ item }) => <span>{item.label}</span> });
      expect(old).not.toBeInTheDocument();
      await waitFor(() => expect(tile(removal === 'tile' ? 'b' : 'a')).toHaveFocus());
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  it.each(['unmounted', 'overscan'] as const)(
    'scrolls to and focuses an %s End target',
    async kind => {
      const onSelectionChange = vi.fn();
      const { root } = await mount({
        items: kind === 'unmounted' ? MANY : SMALL,
        height: 160,
        onSelectionChange,
      });
      const name = kind === 'unmounted' ? 'Tile 79' : 'f';
      const old = screen.queryByRole('listitem', { name });
      if (kind === 'unmounted') expect(old).toBeNull();
      else {
        expect(old).toBeInTheDocument();
        expect(old?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
          root.getBoundingClientRect().bottom
        );
      }
      await tabTo(tile(kind === 'unmounted' ? 'Tile 0' : 'a'));
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(tile(name)).toHaveFocus());
      expect(root.scrollTop).toBe(kind === 'unmounted' ? 6552 : 336);
      expect(tile(name).getBoundingClientRect().top).toBeCloseTo(
        root.getBoundingClientRect().top,
        0
      );
      if (kind === 'overscan') expect(tile(name)).toBe(old);
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  it.each(['external focus', 'target removal'] as const)(
    'invalidates pending End completion after %s before attachment',
    async interruption => {
      const beforeCompletion: { scrolled: boolean; attached: boolean }[] = [];
      /** Parent bubbling runs after the grid handles the key, before React commits batched children. */
      function PendingUpdate() {
        const [items, setItems] = useState<readonly Item[]>(MANY);
        return (
          <div
            onKeyDown={event => {
              if (event.key !== 'End') return;
              beforeCompletion.push({
                scrolled: screen.getByRole('list', { name: 'Photos' }).scrollTop > 0,
                attached: screen.queryByRole('listitem', { name: 'Tile 79' }) !== null,
              });
              if (interruption === 'external focus')
                screen.getByRole('textbox', { name: 'Search' }).focus();
              else setItems(MANY.slice(0, -1));
            }}
          >
            <Grid items={items} height={160} />
          </div>
        );
      }
      render(<PendingUpdate />);
      await screen.findByRole('listitem', { name: 'Tile 0' });
      expect(screen.queryByRole('listitem', { name: 'Tile 79' })).toBeNull();
      await tabTo(tile('Tile 0'));
      await userEvent.keyboard('{End}');
      expect(beforeCompletion).toEqual([{ scrolled: true, attached: false }]);
      if (interruption === 'external focus') {
        await screen.findByRole('listitem', { name: 'Tile 79' });
        await frames();
        expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();
      } else {
        await waitFor(() => expect(tile('Tile 78')).toHaveFocus());
        expect(screen.queryByRole('listitem', { name: 'Tile 79' })).toBeNull();
      }
    }
  );

  it('uses the empty named root for both outside entries, then Retry, reverse exit, and Escape', async () => {
    const { root } = await mount({
      items: [],
      renderEmpty: () => <button type="button">Retry</button>,
    });
    const retry = button('Retry');
    expect(within(root).getByRole('listitem')).toContainElement(retry);
    expect(root.querySelectorAll('[data-tile-grid-item]')).toHaveLength(0);
    expect(retry).toHaveAttribute('tabindex', '-1');
    await tabTo(root);
    await tabTo(retry);
    await tabTo(button('After'));
    await tabTo(root, true);
    await tabTo(retry);
    await userEvent.keyboard('{Escape}');
    expect(root).toHaveFocus();
    await tabTo(retry);
    await tabTo(root, true);
    await tabTo(button('Before'), true);
  });

  it('uses the named root at zero width and transfers owned focus when real items become measurable', async () => {
    const { root, update } = await mount({ width: 0 });
    expect(root.clientWidth).toBe(0);
    expect(root.querySelectorAll('[data-tile-grid-item]')).toHaveLength(0);
    await tabTo(root);
    update({ width: 328 });
    await frames();
    expect(root.clientWidth).toBe(328);
    await waitFor(() => expect(tile('a')).toHaveFocus());
    expect(root).toHaveAttribute('tabindex', '-1');
  });

  // A 328px viewport makes two 160px columns. Unequal image ratios and a 2x2
  // mosaic span change the actual next rectangle; expected IDs are calculated by hand.
  it.each([
    { layout: 'fixed', target: 'd', x: 168, y: 168, width: 160, height: 160 },
    { layout: 'masonry', target: 'c', x: 168, y: 168, width: 160, height: 80 },
    { layout: 'justified', target: 'c', x: 0, y: 664 / 3, width: 328, height: 164 },
    { layout: 'mosaic', target: 'd', x: 0, y: 504, width: 160, height: 160 },
  ] as const)(
    'uses the $layout spatial target while retaining named-list semantics and selection',
    async expected => {
      const onSelectionChange = vi.fn();
      const { root } = await mount({
        layout: expected.layout,
        defaultSelectedIds: ['b'],
        onSelectionChange,
        getItemSpan: item => (item.id === 'a' ? { columns: 2, rows: 2 } : undefined),
        isSelectable: item => item.id !== 'd',
        isDisabled: item => item.id === 'c',
        renderItem: ({ item }) => <span>{item.label}</span>,
      });
      expect(root.clientWidth).toBe(328);
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      const target = tile(expected.target);
      for (const [property, value] of [
        ['left', expected.x],
        ['top', expected.y],
        ['width', expected.width],
        ['height', expected.height],
      ] as const)
        expect(Number.parseFloat(target.style[property])).toBeCloseTo(value, 2);
      await tabTo(tile('b'));
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(tile(expected.target)).toHaveFocus());
      expect(screen.getByRole('checkbox', { name: 'b' })).toBeChecked();
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );
});
