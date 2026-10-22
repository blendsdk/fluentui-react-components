import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { KeyboardEvent } from 'react';
import { userEvent } from 'storybook/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type {
  TileGridItemRenderArgs,
  TileGridProps,
} from '../src/components/TileGrid/TileGrid.types';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { setElementSize } from './jsdomStubs';

/** Labelled application data; an optional ratio supplies the irregular-layout example. */
interface Item {
  id: string;
  label: string;
  aspectRatio?: number;
}

const items: readonly Item[] = ['a', 'b', 'c', 'd'].map(id => ({ id, label: `Tile ${id}` }));
const getItemId = (item: Item) => item.id;
const getItemLabel = (item: Item) => item.label;
const getItemAspectRatio = (item: Item) => item.aspectRatio;
const renderItem = ({ item }: TileGridItemRenderArgs<Item>) => <span>{item.label}</span>;

/** Gives each tile real consumer controls with both ordinary and authored tab order. */
function renderActions({ item }: TileGridItemRenderArgs<Item>) {
  return (
    <>
      <button type="button">Open {item.id}</button>
      <button type="button" tabIndex={2}>
        Details {item.id}
      </button>
      <button type="button" tabIndex={-1}>
        Excluded {item.id}
      </button>
      <input aria-label={`Edit ${item.id}`} />
    </>
  );
}

/** Renders the public contract with two fixed columns unless a case supplies another layout. */
function grid(props: Partial<TileGridProps<Item>>) {
  return (
    <FluentProvider theme={webLightTheme}>
      <TileGrid
        items={items}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        getItemAspectRatio={getItemAspectRatio}
        renderItem={renderItem}
        columns={2}
        ariaLabel="Keyboard tiles"
        selectionMode="multiselect"
        {...props}
      />
    </FluentProvider>
  );
}

/** Keeps application focus outside before mounting, then supplies only missing jsdom sizes. */
async function mount(props: Partial<TileGridProps<Item>> = {}, width = 328, height = 600) {
  render(<input aria-label="External search" />);
  const outside = screen.getByRole('textbox', { name: 'External search' });
  act(() => outside.focus());
  const view = render(grid(props));
  const root = screen.getByRole('list', { name: 'Keyboard tiles' });
  await act(async () => setElementSize(root, width, height));
  return {
    root,
    outside,
    unmount: view.unmount,
    update: (next: Partial<TileGridProps<Item>>) => view.rerender(grid({ ...props, ...next })),
  };
}

function tile(id: string) {
  return screen.getByRole('listitem', { name: `Tile ${id}` });
}

/** Uses actual DOM focus events rather than pretending a synthetic focus event moves focus. */
function focus(element: HTMLElement) {
  act(() => element.focus());
}

beforeEach(() => resetDevWarningsForTests());
afterEach(() => vi.restoreAllMocks());

describe('TileGrid wrapper keyboard contract', () => {
  it.each([
    { seed: ['d', 'b'], entry: 'b' },
    { seed: ['d'], entry: 'a' },
    { seed: [], entry: 'a' },
  ])(
    'chooses visible entry $entry from seed $seed without autofocus or scrolling',
    async ({ seed, entry }) => {
      // Selection order and overscan mounts cannot override the first selected actual-visible item.
      const onSelectionChange = vi.fn();
      const { root, outside } = await mount(
        { defaultSelectedIds: seed, onSelectionChange },
        328,
        160
      );
      expect(tile(entry)).toHaveAttribute('tabindex', '0');
      for (const id of ['a', 'b', 'c', 'd'].filter(id => id !== entry)) {
        expect(tile(id)).toHaveAttribute('tabindex', '-1');
      }
      expect(root).toHaveAttribute('tabindex', '-1');
      expect(outside).toHaveFocus();
      expect(root.scrollTop).toBe(0);
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  it('uses Home, End, Ctrl endpoints, and adjacent-row page movement without changing selection', async () => {
    // Disabled and non-selectable endpoints are still keyboard destinations.
    const onSelectionChange = vi.fn();
    await mount({
      defaultSelectedIds: ['b'],
      onSelectionChange,
      isDisabled: item => item.id === 'a',
      isSelectable: item => item.id !== 'd',
    });
    let active = tile('b');
    focus(active);
    for (const [key, ctrlKey, target] of [
      ['Home', false, 'a'],
      ['End', false, 'd'],
      ['Home', true, 'a'],
      ['End', true, 'd'],
      ['PageUp', false, 'b'],
      ['PageDown', false, 'd'],
    ] as const) {
      expect(fireEvent.keyDown(active, { key, ctrlKey })).toBe(false);
      expect(tile(target)).toHaveFocus();
      expect(tile(target)).toHaveAttribute('tabindex', '0');
      active = tile(target);
    }
    expect(screen.getByRole('checkbox', { name: 'Tile b' })).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('uses actual unequal-height masonry geometry for arrows and page movement', async () => {
    // The tall c tile overlaps d by 100px and e by only 50px.
    const irregular = [...items, { id: 'e', label: 'Tile e' }].map(item => ({
      ...item,
      aspectRatio: item.id === 'c' ? 0.625 : 1,
    }));
    const onSelectionChange = vi.fn();
    await mount(
      {
        items: irregular,
        layout: 'masonry',
        tileSize: 100,
        minTileSize: 100,
        gap: 10,
        onSelectionChange,
      },
      210,
      400
    );
    for (const [start, key, target] of [
      ['c', 'ArrowRight', 'd'],
      ['c', 'ArrowUp', 'a'],
      ['b', 'ArrowDown', 'd'],
      ['d', 'PageDown', 'e'],
      ['e', 'PageUp', 'd'],
    ] as const) {
      focus(tile(start));
      fireEvent.keyDown(tile(start), { key });
      expect(tile(target)).toHaveFocus();
    }
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it.each(['multiselect', 'single'] as const)(
    'applies %s Space semantics without activation',
    async selectionMode => {
      // Repeated Space toggles a checkbox selection but cannot unselect a selected radio.
      const onSelectionChange = vi.fn();
      const onItemActivate = vi.fn();
      await mount({ selectionMode, onSelectionChange, onItemActivate });
      focus(tile('a'));
      fireEvent.keyDown(tile('a'), { key: ' ' });
      expect(onSelectionChange).toHaveBeenNthCalledWith(1, new Set(['a']));
      fireEvent.keyDown(tile('a'), { key: ' ' });
      expect(onSelectionChange).toHaveBeenCalledTimes(selectionMode === 'single' ? 1 : 2);
      if (selectionMode === 'multiselect')
        expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set());
      expect(
        within(tile('a')).getByRole(selectionMode === 'single' ? 'radio' : 'checkbox')
      ).toHaveProperty('checked', selectionMode === 'single');
      expect(onItemActivate).not.toHaveBeenCalled();
    }
  );

  it('extends a seeded range through display order rather than only the geometric column', async () => {
    // Moving b to d includes c even though c is in the other column; hidden membership survives.
    const onSelectionChange = vi.fn();
    await mount({ defaultSelectedIds: ['b', 'hidden'], onSelectionChange });
    focus(tile('b'));
    fireEvent.keyDown(tile('b'), { key: 'ArrowDown', shiftKey: true });
    expect(tile('d')).toHaveFocus();
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['hidden', 'b', 'c', 'd']));
    fireEvent.keyDown(tile('d'), { key: 'ArrowDown', shiftKey: true });
    expect(tile('d')).toHaveFocus();
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it.each(['multiselect', 'single', 'none'] as const)(
    'uses eligible %s range semantics after Shift+Arrow movement',
    async selectionMode => {
      // Ineligible intermediate items are skipped; none mode still moves focus without selection.
      const onSelectionChange = vi.fn();
      await mount({
        selectionMode,
        defaultSelectedIds: selectionMode === 'none' ? [] : ['b'],
        isDisabled: item => item.id === 'c',
        onSelectionChange,
      });
      focus(tile('b'));
      fireEvent.keyDown(tile('b'), { key: 'ArrowDown', shiftKey: true });
      expect(tile('d')).toHaveFocus();
      if (selectionMode === 'none') expect(onSelectionChange).not.toHaveBeenCalled();
      else
        expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(
          new Set(selectionMode === 'single' ? ['d'] : ['b', 'd'])
        );
    }
  );

  it.each(['ctrlKey', 'metaKey'] as const)(
    'selects all eligible items once with %s+A',
    async modifier => {
      // Both platform shortcuts use select-all, retain hidden IDs, and ignore repeated equal sets.
      const onSelectionChange = vi.fn();
      await mount({
        defaultSelectedIds: ['hidden'],
        isDisabled: item => item.id === 'b',
        isSelectable: item => item.id !== 'c',
        onSelectionChange,
      });
      focus(tile('a'));
      fireEvent.keyDown(tile('a'), { key: 'a', [modifier]: true });
      fireEvent.keyDown(tile('a'), { key: 'a', [modifier]: true });
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['hidden', 'a', 'd']));
    }
  );

  it.each([
    { selectionMode: 'single', modifier: 'ctrlKey' },
    { selectionMode: 'single', modifier: 'metaKey' },
    { selectionMode: 'none', modifier: 'ctrlKey' },
    { selectionMode: 'none', modifier: 'metaKey' },
  ] as const)(
    'warns without selection for $modifier+A in $selectionMode mode',
    async ({ selectionMode, modifier }) => {
      // Unsupported select-all still follows the shared mode-specific warning path.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const onSelectionChange = vi.fn();
      await mount({ selectionMode, onSelectionChange });
      focus(tile('a'));
      expect(warn).not.toHaveBeenCalled();
      fireEvent.keyDown(tile('a'), { key: 'a', [modifier]: true });
      expect(warn).toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  it('activates enabled wrappers with Enter, including non-selectable items, but never disabled ones', async () => {
    // Keyboard activation is independent of selection eligibility and fires exactly once per key.
    const onItemActivate = vi.fn();
    const onSelectionChange = vi.fn();
    await mount({
      isDisabled: item => item.id === 'a',
      isSelectable: item => item.id !== 'b',
      onItemActivate,
      onSelectionChange,
    });
    for (const id of ['a', 'b', 'c']) {
      focus(tile(id));
      fireEvent.keyDown(tile(id), { key: 'Enter' });
    }
    expect(onItemActivate.mock.calls).toEqual([[items[1]], [items[2]]]);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('honors consumer prevention for wrapper keyboard defaults', async () => {
    // Native handler cancellation vetoes navigation, selection, and activation together.
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLDivElement>) => event.preventDefault());
    const onSelectionChange = vi.fn();
    const onItemActivate = vi.fn();
    await mount({ onKeyDown, onSelectionChange, onItemActivate });
    focus(tile('a'));
    for (const key of ['ArrowRight', 'End', ' ', 'Enter', 'a']) {
      fireEvent.keyDown(tile('a'), { key, ctrlKey: key === 'a' });
    }
    expect(onKeyDown).toHaveBeenCalledTimes(5);
    expect(tile('a')).toHaveFocus();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onItemActivate).not.toHaveBeenCalled();
  });

  it('leaves unrelated modifier shortcuts unprevented and unchanged', async () => {
    // Only documented grid shortcuts consume browser defaults.
    const onSelectionChange = vi.fn();
    const onItemActivate = vi.fn();
    await mount({ onSelectionChange, onItemActivate });
    focus(tile('a'));
    for (const key of [
      { key: 'ArrowRight', ctrlKey: true },
      { key: 'ArrowDown', metaKey: true },
      { key: 'Home', altKey: true },
      { key: 'Enter', ctrlKey: true },
      { key: ' ', metaKey: true },
    ])
      expect(fireEvent.keyDown(tile('a'), key)).toBe(true);
    expect(tile('a')).toHaveFocus();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onItemActivate).not.toHaveBeenCalled();
  });

  it('navigates and selects exact opaque IDs without interpreting them as selectors or properties', async () => {
    // Labels provide accessible queries while selection retains the original hostile-looking ID.
    const opaque = [
      { id: '__proto__', label: 'Tile proto' },
      { id: 'a["雪"]', label: 'Tile opaque' },
    ];
    const onSelectionChange = vi.fn();
    await mount({ items: opaque, onSelectionChange });
    focus(tile('proto'));
    fireEvent.keyDown(tile('proto'), { key: 'ArrowRight' });
    expect(tile('opaque')).toHaveFocus();
    fireEvent.keyDown(tile('opaque'), { key: ' ' });
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a["雪"]']));
  });
});

describe('TileGrid mounted focus and content contract', () => {
  it('enables only entered content and suppresses it again when focus leaves', async () => {
    // One wrapper owns outside entry; positive author tabindex becomes zero inside, not a priority.
    const { outside } = await mount({ renderItem: renderActions });
    const checkbox = screen.getByRole('checkbox', { name: 'Tile a' });
    const open = screen.getByRole('button', { name: 'Open a' });
    const details = screen.getByRole('button', { name: 'Details a' });
    const excluded = screen.getByRole('button', { name: 'Excluded a' });
    for (const control of [checkbox, open, details, excluded])
      expect(control).toHaveAttribute('tabindex', '-1');
    focus(tile('a'));
    for (const control of [checkbox, open, details]) expect(control).toHaveProperty('tabIndex', 0);
    expect(excluded).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: 'Open b' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('checkbox', { name: 'Tile b' })).toHaveAttribute('tabindex', '-1');
    focus(outside);
    expect(tile('a')).toHaveAttribute('tabindex', '0');
    for (const control of [checkbox, open, details, excluded])
      expect(control).toHaveAttribute('tabindex', '-1');
  });

  it.each(['button', 'checkbox', 'radio'] as const)(
    'keeps actual focus in an inactive tile %s until Escape returns to its wrapper',
    async role => {
      // Native descendant focus activates its tile without replacing the focused control.
      const onSelectionChange = vi.fn();
      await mount({
        renderItem: renderActions,
        onSelectionChange,
        defaultSelectedIds: ['a'],
        selectionMode: role === 'radio' ? 'single' : 'multiselect',
      });
      const control = screen.getByRole(role, { name: role === 'button' ? 'Open b' : 'Tile b' });
      focus(control);
      expect(control).toHaveFocus();
      expect(tile('b')).toHaveAttribute('tabindex', '0');
      expect(tile('a')).toHaveAttribute('tabindex', '-1');
      expect(control).toHaveProperty('tabIndex', 0);
      if (role === 'radio') {
        expect(control).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'Tile a' })).toBeChecked();
      }
      fireEvent.keyDown(control, { key: 'Escape' });
      expect(tile('b')).toHaveFocus();
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  it('keeps editing and prevented Escape local to consumer controls', async () => {
    // Native text keys and an application-consumed Escape are not wrapper commands.
    const onSelectionChange = vi.fn();
    const onItemActivate = vi.fn();
    await mount({
      renderItem: ({ item }) => (
        <input
          aria-label={`Edit ${item.id}`}
          onKeyDown={event => {
            if (event.key === 'Escape') event.preventDefault();
          }}
        />
      ),
      onSelectionChange,
      onItemActivate,
    });
    const input = screen.getByRole('textbox', { name: 'Edit b' });
    await act(async () => userEvent.setup().type(input, 'a b'));
    expect(input).toHaveValue('a b');
    for (const key of ['ArrowLeft', 'ArrowDown', 'Home', 'End', 'PageDown', 'Enter', 'Escape']) {
      fireEvent.keyDown(input, { key });
    }
    fireEvent.keyDown(input, { key: 'a', ctrlKey: true });
    expect(input).toHaveFocus();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onItemActivate).not.toHaveBeenCalled();
  });

  it('tracks current author tabindex through inactive updates and restores it on release', async () => {
    // A temporary managed -1 must not overwrite later application intent or authored absence.
    const view = await mount({ renderItem: renderActions });
    const open = screen.getByRole('button', { name: 'Open b' });
    const details = screen.getByRole('button', { name: 'Details b' });
    for (const value of ['-1', '0']) {
      await act(async () => details.setAttribute('tabindex', value));
      expect(details).toHaveAttribute('tabindex', '-1');
      focus(tile('b'));
      expect(details).toHaveAttribute('tabindex', value);
      focus(view.outside);
    }
    view.unmount();
    expect(open).not.toHaveAttribute('tabindex');
    expect(details).toHaveAttribute('tabindex', '0');
  });

  it('reconciles inserted, enabled, and removed consumer controls while a tile is inactive', async () => {
    // React content updates remain subject to the same bounded entry lifecycle.
    const view = await mount({ renderItem: renderActions });
    const removed = screen.getByRole('button', { name: 'Details b' });
    const renderAdded =
      (disabled: boolean) =>
      ({ item }: TileGridItemRenderArgs<Item>) => (
        <button type="button" disabled={disabled}>
          Added {item.id}
        </button>
      );
    await act(async () => view.update({ renderItem: renderAdded(true) }));
    expect(removed).not.toBeInTheDocument();
    expect(removed).toHaveAttribute('tabindex', '2');
    expect(screen.getByRole('button', { name: 'Added b' })).toBeDisabled();
    await act(async () => view.update({ renderItem: renderAdded(false) }));
    const added = screen.getByRole('button', { name: 'Added b' });
    expect(added).toHaveAttribute('tabindex', '-1');
    focus(tile('b'));
    expect(added).toHaveProperty('tabIndex', 0);
  });

  it('changes the next visible entry after removal without stealing external focus', async () => {
    // Recovery changes only the future entry target when an application field holds focus.
    const onSelectionChange = vi.fn();
    const view = await mount({ defaultSelectedIds: ['b'], onSelectionChange });
    focus(tile('b'));
    focus(view.outside);
    view.update({ items: [items[2], items[3]] });
    expect(view.outside).toHaveFocus();
    expect(tile('c')).toHaveAttribute('tabindex', '0');
    expect(tile('d')).toHaveAttribute('tabindex', '-1');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('preserves a mounted active item through a stable-key append and layout change', async () => {
    // Visible logical focus and selection survive data/layout updates without lifecycle callbacks.
    const onSelectionChange = vi.fn();
    const view = await mount({
      defaultSelectedIds: ['b'],
      scrollResetKey: 'same',
      onSelectionChange,
    });
    focus(tile('b'));
    view.update({ items: [...items, { id: 'e', label: 'Tile e' }] });
    expect(tile('b')).toHaveFocus();
    view.update({ layout: 'masonry' });
    expect(tile('b')).toHaveFocus();
    expect(screen.getByRole('checkbox', { name: 'Tile b' })).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('keeps a named-root entry until a zero-width grid is measured', async () => {
    // Unmeasured geometry has no item target; measurement may update entry but cannot autofocus it.
    const { root, outside } = await mount({}, 0, 600);
    expect(root).toHaveAttribute('tabindex', '0');
    expect(screen.queryByRole('listitem', { name: 'Tile a' })).not.toBeInTheDocument();
    await act(async () => setElementSize(root, 328, 600));
    expect(tile('a')).toHaveAttribute('tabindex', '0');
    expect(root).toHaveAttribute('tabindex', '-1');
    expect(outside).toHaveFocus();
  });

  it('lets the named empty root own Retry entry, content focus, and Escape return', async () => {
    // The semantic empty placeholder is not a data tile or an additional outside entry stop.
    const { root, outside } = await mount({
      items: [],
      renderEmpty: () => <button type="button">Retry</button>,
    });
    const retry = within(root).getByRole('button', { name: 'Retry' });
    const placeholder = within(root).getByRole('listitem');
    expect(placeholder).not.toHaveAttribute('data-tile-grid-item');
    expect(root).toHaveAttribute('tabindex', '0');
    expect(retry).toHaveAttribute('tabindex', '-1');
    expect(outside).toHaveFocus();
    focus(root);
    expect(retry).toHaveProperty('tabIndex', 0);
    focus(retry);
    fireEvent.keyDown(retry, { key: 'Escape' });
    expect(root).toHaveFocus();
    focus(outside);
    expect(retry).toHaveAttribute('tabindex', '-1');
  });

  it('keeps all-ineligible visible items reachable without controls, selection, or activation', async () => {
    // Eligibility cannot remove readable disabled items from wrapper navigation.
    const onSelectionChange = vi.fn();
    const onItemActivate = vi.fn();
    await mount({ isDisabled: () => true, onSelectionChange, onItemActivate });
    expect(tile('a')).toHaveAttribute('tabindex', '0');
    focus(tile('a'));
    fireEvent.keyDown(tile('a'), { key: 'ArrowRight' });
    expect(tile('b')).toHaveFocus();
    fireEvent.keyDown(tile('b'), { key: ' ' });
    fireEvent.keyDown(tile('b'), { key: 'Enter' });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onItemActivate).not.toHaveBeenCalled();
  });
});
