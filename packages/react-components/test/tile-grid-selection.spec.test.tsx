import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/index';
import type { TileGridHandle, TileGridItemRenderArgs } from '../src/index';
import { setElementSize } from './jsdomStubs';

/**
 * Public selection contract of the tile grid.
 *
 * These tests treat the grid as a black box: they render it, drive real DOM
 * events, and read the selected state back from the application's own
 * `renderItem` output and from `onSelectionChange`. No internal store module
 * or DOM detail beyond the public item wrapper is observed.
 */

interface SelectionItem {
  id: string;
  label: string;
}

type RenderItem = (args: TileGridItemRenderArgs<SelectionItem>) => ReactNode;

const GRID_LABEL = 'Selection grid';

const ITEMS: readonly SelectionItem[] = ['a', 'b', 'c', 'd', 'e'].map(id => ({
  id,
  label: `Tile ${id.toUpperCase()}`,
}));

const getItemId = (item: SelectionItem) => item.id;
const getItemLabel = (item: SelectionItem) => item.label;
const getItemAspectRatio = () => 1;

/** Renders the tile body with its selection state exposed as DOM facts. */
function renderSelectionTile({
  item,
  selected,
  selectable,
  disabled,
}: TileGridItemRenderArgs<SelectionItem>) {
  return (
    <span
      data-testid={`selection-${item.id}`}
      data-selected={selected ? 'yes' : 'no'}
      data-selectable={String(selectable)}
      data-disabled={String(disabled)}
    >
      {item.label}
    </span>
  );
}

interface SelectionGridOptions {
  items?: readonly SelectionItem[];
  selectionMode?: 'none' | 'single' | 'multiselect';
  selectedIds?: ReadonlySet<string>;
  defaultSelectedIds?: Iterable<string>;
  onSelectionChange?: (next: ReadonlySet<string>) => void;
  renderItem?: RenderItem;
  handle?: Ref<TileGridHandle>;
  ariaLabel?: string;
}

/**
 * Builds the public props for one grid. Selection props are only forwarded
 * when the test sets them, so a defaulted prop is never confused with an
 * explicitly controlled one.
 */
function selectionGrid(options: SelectionGridOptions = {}) {
  const {
    items = ITEMS,
    renderItem = renderSelectionTile,
    handle,
    ariaLabel = GRID_LABEL,
  } = options;

  const selectionProps = {
    ...(options.selectionMode !== undefined ? { selectionMode: options.selectionMode } : {}),
    ...(options.selectedIds !== undefined ? { selectedIds: options.selectedIds } : {}),
    ...(options.defaultSelectedIds !== undefined
      ? { defaultSelectedIds: options.defaultSelectedIds }
      : {}),
    ...(options.onSelectionChange !== undefined
      ? { onSelectionChange: options.onSelectionChange }
      : {}),
  };

  return (
    <TileGrid
      ref={handle}
      items={items}
      getItemId={getItemId}
      getItemLabel={getItemLabel}
      getItemAspectRatio={getItemAspectRatio}
      renderItem={renderItem}
      layout="fixed"
      tileSize={160}
      gap={8}
      ariaLabel={ariaLabel}
      {...selectionProps}
    />
  );
}

interface ControlledGridOptions extends SelectionGridOptions {
  initialSelectedIds?: readonly string[];
}

/**
 * Test harness that owns the controlled selection set, mirroring how an
 * application feeds the requested set back into the grid.
 */
function ControlledSelectionGrid({
  initialSelectedIds = [],
  onSelectionChange,
  ...options
}: ControlledGridOptions) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(initialSelectedIds)
  );

  const handleSelectionChange = (next: ReadonlySet<string>) => {
    onSelectionChange?.(next);
    setSelectedIds(next);
  };

  return selectionGrid({ ...options, selectedIds, onSelectionChange: handleSelectionChange });
}

/**
 * Renders a grid, finds its scroll root, and gives it a measurable viewport so
 * the virtualizer mounts a stable window of items in jsdom.
 */
async function mountGrid(tree: ReactNode, ariaLabel = GRID_LABEL, requireItems = true) {
  const view = render(<>{tree}</>);
  const root = await screen.findByRole('list', { name: ariaLabel });

  await act(async () => {
    setElementSize(root, 800, 600);
  });

  if (requireItems) {
    await waitFor(() => {
      expect(root.querySelectorAll('[data-tile-grid-item]').length).toBeGreaterThan(0);
    });
  }

  return { ...view, root };
}

function renderSelection(options: SelectionGridOptions = {}, requireItems = true) {
  return mountGrid(selectionGrid(options), options.ariaLabel ?? GRID_LABEL, requireItems);
}

function renderControlled(options: ControlledGridOptions) {
  return mountGrid(<ControlledSelectionGrid {...options} />, options.ariaLabel ?? GRID_LABEL);
}

/** Returns the rendered tile body for one item. */
function tile(id: string): HTMLElement {
  return screen.getByTestId(`selection-${id}`);
}

/** Clicks the tile body, which bubbles to the tile wrapper. */
function clickTile(id: string, init?: MouseEventInit): void {
  fireEvent.click(tile(id), init);
}

/** Reads the effective selected ids from the rendered tile bodies. */
function renderedSelection(): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-testid^="selection-"]'))
    .filter(element => element.getAttribute('data-selected') === 'yes')
    .map(element => (element.getAttribute('data-testid') ?? '').replace('selection-', ''))
    .sort();
}

/** Collects warning messages that talk about selection. */
function selectionWarnings(spy: { mock: { calls: unknown[][] } }): string[] {
  return spy.mock.calls
    .map(call => call.map(value => String(value)).join(' '))
    .filter(message => /select/i.test(message));
}

describe('tile grid selection contract', () => {
  it('keeps a controlled selection when items load after mount', async () => {
    const onSelectionChange = vi.fn();
    const selectedIds = new Set(['a', 'b']);

    const { rerender, root } = await renderSelection(
      {
        items: [],
        selectionMode: 'multiselect',
        selectedIds,
        onSelectionChange,
      },
      false
    );

    expect(root.querySelectorAll('[data-tile-grid-item]')).toHaveLength(0);
    expect(onSelectionChange).not.toHaveBeenCalled();

    rerender(
      selectionGrid({
        items: ITEMS.slice(0, 3),
        selectionMode: 'multiselect',
        selectedIds,
        onSelectionChange,
      })
    );

    await waitFor(() => expect(screen.getByTestId('selection-a')).toBeInTheDocument());
    expect(tile('a')).toHaveAttribute('data-selected', 'yes');
    expect(tile('b')).toHaveAttribute('data-selected', 'yes');
    expect(tile('c')).toHaveAttribute('data-selected', 'no');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('preserves hidden selected ids on a toggle and drops them on a replace', async () => {
    const onSelectionChange = vi.fn();

    await renderControlled({
      items: ITEMS.slice(0, 3),
      selectionMode: 'multiselect',
      initialSelectedIds: ['z'],
      onSelectionChange,
    });

    clickTile('a', { ctrlKey: true });
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['z', 'a'])));
    expect(tile('a')).toHaveAttribute('data-selected', 'yes');

    clickTile('b');
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b'])));
    expect(tile('a')).toHaveAttribute('data-selected', 'no');
    expect(tile('b')).toHaveAttribute('data-selected', 'yes');
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
  });

  it('applies replace, range, and toggle semantics in multiselect mode', async () => {
    const onSelectionChange = vi.fn();

    await renderSelection({
      selectionMode: 'multiselect',
      defaultSelectedIds: [],
      onSelectionChange,
    });

    clickTile('b');
    await waitFor(() => expect(renderedSelection()).toEqual(['b']));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b']));

    clickTile('d', { shiftKey: true });
    await waitFor(() => expect(renderedSelection()).toEqual(['b', 'c', 'd']));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b', 'c', 'd']));

    clickTile('d', { ctrlKey: true });
    await waitFor(() => expect(renderedSelection()).toEqual(['b', 'c']));

    clickTile('d', { metaKey: true });
    await waitFor(() => expect(renderedSelection()).toEqual(['b', 'c', 'd']));
    expect(onSelectionChange).toHaveBeenCalledTimes(4);
  });

  it('replaces the selection in single mode and never deselects on a second click', async () => {
    const onSelectionChange = vi.fn();

    await renderSelection({
      items: ITEMS.slice(0, 3),
      selectionMode: 'single',
      defaultSelectedIds: ['a'],
      onSelectionChange,
    });

    expect(tile('a')).toHaveAttribute('data-selected', 'yes');

    clickTile('b');
    await waitFor(() => expect(tile('b')).toHaveAttribute('data-selected', 'yes'));
    expect(tile('a')).toHaveAttribute('data-selected', 'no');
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b']));

    clickTile('b');
    expect(tile('b')).toHaveAttribute('data-selected', 'yes');
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('ignores clicks and renders unselected tiles when selection is disabled', async () => {
    const onSelectionChange = vi.fn();

    await renderSelection({
      selectionMode: 'none',
      onSelectionChange,
    });

    clickTile('a');
    clickTile('c', { ctrlKey: true });

    expect(onSelectionChange).not.toHaveBeenCalled();
    for (const element of document.querySelectorAll<HTMLElement>('[data-testid^="selection-"]')) {
      expect(element).toHaveAttribute('data-selected', 'no');
    }
  });

  it('never requests a selection change from a controlled prop or item update', async () => {
    const onSelectionChange = vi.fn();
    const firstItems = ITEMS.slice(0, 3);

    const { rerender } = await renderSelection({
      items: firstItems,
      selectionMode: 'multiselect',
      selectedIds: new Set(['a']),
      onSelectionChange,
    });

    expect(tile('a')).toHaveAttribute('data-selected', 'yes');

    rerender(
      selectionGrid({
        items: firstItems,
        selectionMode: 'multiselect',
        selectedIds: new Set(['b']),
        onSelectionChange,
      })
    );

    await waitFor(() => expect(tile('b')).toHaveAttribute('data-selected', 'yes'));
    expect(tile('a')).toHaveAttribute('data-selected', 'no');

    rerender(
      selectionGrid({
        items: [ITEMS[0], ITEMS[2]],
        selectionMode: 'multiselect',
        selectedIds: new Set(['b']),
        onSelectionChange,
      })
    );

    await waitFor(() => expect(screen.queryByTestId('selection-b')).toBeNull());
    expect(tile('a')).toHaveAttribute('data-selected', 'no');
    expect(tile('c')).toHaveAttribute('data-selected', 'no');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('warns and keeps only the first seeded id in single mode', async () => {
    const warnSpy = vi.spyOn(console, 'warn');

    try {
      const onSelectionChange = vi.fn();

      await renderSelection({
        items: ITEMS.slice(0, 3),
        selectionMode: 'single',
        defaultSelectedIds: ['a', 'b'],
        onSelectionChange,
      });

      expect(tile('a')).toHaveAttribute('data-selected', 'yes');
      expect(tile('b')).toHaveAttribute('data-selected', 'no');
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(selectionWarnings(warnSpy)).toHaveLength(1);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('adds every current item on select all and clears hidden ids as well', async () => {
    const handle = createRef<TileGridHandle>();
    const onSelectionChange = vi.fn();

    await renderSelection({
      items: ITEMS.slice(0, 3),
      selectionMode: 'multiselect',
      defaultSelectedIds: ['z'],
      onSelectionChange,
      handle,
    });

    await act(async () => {
      handle.current?.selectAll();
    });

    await waitFor(() => expect(onSelectionChange).toHaveBeenCalledTimes(1));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['z', 'a', 'b', 'c']));
    expect(renderedSelection()).toEqual(['a', 'b', 'c']);

    await act(async () => {
      handle.current?.clearSelection();
    });

    await waitFor(() => expect(onSelectionChange).toHaveBeenCalledTimes(2));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set());
    expect(renderedSelection()).toEqual([]);
  });

  it('warns and does not request a change when select all runs outside multiselect', async () => {
    for (const selectionMode of ['single', 'none'] as const) {
      const warnSpy = vi.spyOn(console, 'warn');

      try {
        const handle = createRef<TileGridHandle>();
        const onSelectionChange = vi.fn();

        const { unmount } = await renderSelection({
          items: ITEMS.slice(0, 3),
          selectionMode,
          onSelectionChange,
          handle,
          ariaLabel: `Selection grid ${selectionMode}`,
        });

        await act(async () => {
          handle.current?.selectAll();
        });

        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(selectionWarnings(warnSpy).length).toBeGreaterThanOrEqual(1);

        unmount();
      } finally {
        warnSpy.mockRestore();
      }
    }
  });

  it('does not select when the click lands on an interactive control', async () => {
    const onSelectionChange = vi.fn();

    const renderItem: RenderItem = ({ item, selected }) => (
      <span data-testid={`selection-${item.id}`} data-selected={selected ? 'yes' : 'no'}>
        {item.label}
        <button type="button" data-testid={`tile-action-${item.id}`}>
          Open
        </button>
      </span>
    );

    await renderSelection({
      items: ITEMS.slice(0, 3),
      selectionMode: 'multiselect',
      renderItem,
      onSelectionChange,
    });

    fireEvent.click(screen.getByTestId('tile-action-a'));

    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(tile('a')).toHaveAttribute('data-selected', 'no');

    clickTile('a');
    await waitFor(() => expect(tile('a')).toHaveAttribute('data-selected', 'yes'));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('keeps every interactive control inside a tile outside selection', async () => {
    const onSelectionChange = vi.fn();

    const renderItem: RenderItem = ({ item, selected }) => (
      <span data-testid={`selection-${item.id}`} data-selected={selected ? 'yes' : 'no'}>
        {item.label}
        {item.id === 'a' ? (
          <>
            <button type="button" data-testid="guard-button">
              Button
            </button>
            <a href="#selection-target" data-testid="guard-link">
              Link
            </a>
            <input data-testid="guard-input" />
            <select data-testid="guard-select">
              <option value="one">One</option>
            </select>
            <textarea data-testid="guard-textarea" />
            <span role="button" tabIndex={0} data-testid="guard-role-button">
              Role button
            </span>
            <span role="menuitem" data-testid="guard-menuitem">
              Menu item
            </span>
            <span role="checkbox" aria-checked="false" data-testid="guard-checkbox" />
            <span role="radio" aria-checked="false" data-testid="guard-radio" />
            <span role="switch" aria-checked="false" data-testid="guard-switch" />
            <span
              contentEditable="true"
              suppressContentEditableWarning
              data-testid="guard-contenteditable"
            />
            <span data-tile-grid-interactive data-testid="guard-explicit">
              Explicit
            </span>
          </>
        ) : null}
      </span>
    );

    await renderSelection({
      items: ITEMS.slice(0, 3),
      selectionMode: 'multiselect',
      renderItem,
      onSelectionChange,
    });

    const interactiveTestIds = [
      'guard-button',
      'guard-link',
      'guard-input',
      'guard-select',
      'guard-textarea',
      'guard-role-button',
      'guard-menuitem',
      'guard-checkbox',
      'guard-radio',
      'guard-switch',
      'guard-contenteditable',
      'guard-explicit',
    ];

    for (const testId of interactiveTestIds) {
      fireEvent.click(screen.getByTestId(testId));
    }

    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(tile('a')).toHaveAttribute('data-selected', 'no');

    clickTile('a');
    await waitFor(() => expect(tile('a')).toHaveAttribute('data-selected', 'yes'));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('exposes the effective selection and capability flags to renderItem', async () => {
    await renderSelection({
      items: ITEMS.slice(0, 3),
      selectionMode: 'multiselect',
      onSelectionChange: vi.fn(),
    });

    clickTile('b');
    await waitFor(() => expect(tile('b')).toHaveAttribute('data-selected', 'yes'));

    expect(tile('b')).toHaveAttribute('data-selectable', 'true');
    expect(tile('b')).toHaveAttribute('data-disabled', 'false');
    expect(tile('c')).toHaveAttribute('data-selected', 'no');
    expect(tile('c')).toHaveAttribute('data-selectable', 'true');
    expect(tile('c')).toHaveAttribute('data-disabled', 'false');
  });

  it('ignores a click whose default action is already prevented', async () => {
    const onSelectionChange = vi.fn();

    await renderSelection({
      items: ITEMS.slice(0, 3),
      selectionMode: 'single',
      onSelectionChange,
    });

    const preventedClick = createEvent.click(tile('a'));
    preventedClick.preventDefault();
    fireEvent(tile('a'), preventedClick);

    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(tile('a')).toHaveAttribute('data-selected', 'no');

    clickTile('a');
    await waitFor(() => expect(tile('a')).toHaveAttribute('data-selected', 'yes'));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('does not prevent or stop the click that selects a tile', async () => {
    const bubble = vi.fn();
    const onSelectionChange = vi.fn();

    const view = render(
      <div data-testid="selection-host" onClick={event => bubble(event.defaultPrevented)}>
        {selectionGrid({
          items: ITEMS.slice(0, 3),
          selectionMode: 'single',
          onSelectionChange,
        })}
      </div>
    );

    const root = await screen.findByRole('list', { name: GRID_LABEL });
    await act(async () => {
      setElementSize(root, 800, 600);
    });
    await waitFor(() => {
      expect(root.querySelectorAll('[data-tile-grid-item]').length).toBeGreaterThan(0);
    });

    const accepted = fireEvent.click(tile('a'));

    expect(accepted).toBe(true);
    expect(bubble).toHaveBeenCalledWith(false);
    await waitFor(() => expect(onSelectionChange).toHaveBeenCalledTimes(1));
    expect(tile('a')).toHaveAttribute('data-selected', 'yes');

    view.unmount();
  });

  it('ignores select-all on an unchanged selection set', async () => {
    const handle = createRef<TileGridHandle>();
    const onSelectionChange = vi.fn();

    await renderSelection({
      items: ITEMS.slice(0, 3),
      selectionMode: 'multiselect',
      onSelectionChange,
      handle,
    });

    await act(async () => {
      handle.current?.selectAll();
    });
    await waitFor(() => expect(onSelectionChange).toHaveBeenCalledTimes(1));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a', 'b', 'c']));

    await act(async () => {
      handle.current?.selectAll();
    });

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('does not scroll or request a change when no current item is selected', async () => {
    const handle = createRef<TileGridHandle>();
    const onSelectionChange = vi.fn();

    const { root } = await renderSelection({
      items: ITEMS.slice(0, 3),
      selectionMode: 'multiselect',
      selectedIds: new Set(['z']),
      onSelectionChange,
      handle,
    });

    await act(async () => {
      handle.current?.scrollToSelected();
    });

    expect(root.scrollTop).toBe(0);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
