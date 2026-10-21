import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type {
  TileGridHandle,
  TileGridItemRenderArgs,
  TileGridProps,
} from '../src/components/TileGrid/TileGrid.types';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { setElementSize } from './jsdomStubs';

interface Item {
  id: string;
  label: string;
}

const items: readonly Item[] = ['a', 'b', 'c', 'd'].map(id => ({ id, label: `Tile ${id}` }));
const hiddenItem: Item = { id: 'hidden', label: 'Hidden tile' };
const getItemId = (item: Item) => item.id;
const getItemLabel = (item: Item) => item.label;
const isDisabled = (item: Item) => item.id === 'a';
const isSelectable = (item: Item) => item.id !== 'b';

/** Exposes the application's selected render argument as readable content. */
function renderItem({ item, selected }: TileGridItemRenderArgs<Item>) {
  return <span>{`${item.label}: ${selected ? 'selected' : 'unselected'}`}</span>;
}

/** Keeps the real grid and controls inside the application's Fluent provider. */
function grid(props: Partial<TileGridProps<Item>>, ref?: Ref<TileGridHandle>) {
  return (
    <FluentProvider theme={webLightTheme}>
      <TileGrid
        ref={ref}
        items={items}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        renderItem={renderItem}
        ariaLabel="Selection invariants"
        selectionMode="multiselect"
        {...props}
      />
    </FluentProvider>
  );
}

/** Supplies the shared measurement shim so the real virtualizer mounts these small fixtures. */
async function mount(props: Partial<TileGridProps<Item>>, ref?: Ref<TileGridHandle>) {
  const view = render(grid(props, ref));
  await act(async () => {
    setElementSize(screen.getByRole('list', { name: 'Selection invariants' }), 800, 600);
  });
  return {
    update: (next: Partial<TileGridProps<Item>>) => view.rerender(grid(next, ref)),
  };
}

function tile(id: string) {
  return screen.getByRole('listitem', { name: `Tile ${id}` });
}

/** Asserts selected presentation through consumer content, without inspecting grid state. */
function expectSelected(selectedIds: readonly string[], visibleItems: readonly Item[] = items) {
  for (const item of visibleItems) {
    const wrapper = screen.getByRole('listitem', { name: item.label });
    const state = selectedIds.includes(item.id) ? 'selected' : 'unselected';
    expect(within(wrapper).getByText(`${item.label}: ${state}`)).toBeInTheDocument();
  }
}

beforeEach(() => resetDevWarningsForTests());
afterEach(() => vi.restoreAllMocks());

describe('TileGrid selection invariants', () => {
  it.each(['controlled', 'uncontrolled'] as const)(
    'preserves %s seeds across empty data, loading, and parent echoes without lifecycle callbacks',
    async ownership => {
      // Missing IDs remain selected; only a changing user action may notify the application.
      const seed = new Set(['b', 'hidden']);
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const selection =
        ownership === 'controlled' ? { selectedIds: seed } : { defaultSelectedIds: seed };
      const props = { ...selection, onSelectionChange };
      const view = await mount({ ...props, items: [] });
      expect(screen.queryByRole('listitem', { name: 'Tile b' })).not.toBeInTheDocument();
      expect(screen.queryByRole('listitem', { name: 'Hidden tile' })).not.toBeInTheDocument();
      expect(onSelectionChange).not.toHaveBeenCalled();

      const loaded = items.slice(0, 3);
      view.update({ ...props, items: loaded });
      expectSelected(['b'], loaded);
      expect(onSelectionChange).not.toHaveBeenCalled();
      const echo = new Set(seed);
      const echoedProps = {
        onSelectionChange,
        ...(ownership === 'controlled' ? { selectedIds: echo } : { defaultSelectedIds: echo }),
      };
      view.update({ ...echoedProps, items: loaded });
      expectSelected(['b'], loaded);
      expect(onSelectionChange).not.toHaveBeenCalled();

      fireEvent.click(tile('b'), { ctrlKey: true });
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['hidden']));
      // The controlled parent rejects the proposal by keeping its authoritative seed.
      view.update({ ...echoedProps, items: loaded });
      expectSelected(ownership === 'controlled' ? ['b'] : [], loaded);
      expect(screen.getByRole('checkbox', { name: 'Tile b' })).toHaveProperty(
        'checked',
        ownership === 'controlled'
      );
      expect(seed).toEqual(new Set(['b', 'hidden']));

      const withHidden = [...loaded, hiddenItem];
      view.update({ ...echoedProps, items: withHidden });
      expectSelected(ownership === 'controlled' ? ['b', 'hidden'] : ['hidden'], withHidden);
      expect(onSelectionChange).toHaveBeenCalledTimes(1);
    }
  );

  it('uses the first seeded selection as the initial range anchor', async () => {
    // A seeded anchor makes the first Shift-click include the full inclusive range.
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount({ defaultSelectedIds: ['b'], onSelectionChange });
    fireEvent.click(tile('d'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b', 'c', 'd']));
    expectSelected(['b', 'c', 'd']);
  });

  it('moves the range anchor to the last toggled item even when the toggle removes it', async () => {
    // Removing a selected item is still a non-range interaction that establishes an anchor.
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount({ defaultSelectedIds: ['a', 'c'], onSelectionChange });
    fireEvent.click(tile('a'), { ctrlKey: true });
    expect(onSelectionChange).toHaveBeenNthCalledWith(1, new Set(['c']));
    fireEvent.click(tile('c'), { ctrlKey: true });
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set());
    fireEvent.click(tile('d'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenNthCalledWith(3, new Set(['c', 'd']));
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
    expectSelected(['c', 'd']);
  });

  it('clears the range anchor so the next Shift-click selects only its target', async () => {
    // Clear removes the user anchor as well as visible and hidden membership.
    const ref = createRef<TileGridHandle>();
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount({ defaultSelectedIds: ['b', 'hidden'], onSelectionChange }, ref);
    fireEvent.click(tile('a'), { ctrlKey: true });
    expect(ref.current).not.toBeNull();
    act(() => ref.current?.clearSelection());
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set());
    fireEvent.click(tile('d'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenNthCalledWith(3, new Set(['d']));
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
    expectSelected(['d']);
  });

  it('keeps the mounted multiselect mode and warns once when the requested mode changes', async () => {
    // Runtime prop changes cannot turn an existing multiselect grid into a radio selection.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    const view = await mount({ onSelectionChange });
    expect(warn).not.toHaveBeenCalled();
    view.update({ selectionMode: 'single', onSelectionChange });
    view.update({ selectionMode: 'single', onSelectionChange });
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(tile('a'), { ctrlKey: true });
    fireEvent.click(tile('b'), { ctrlKey: true });
    expect(onSelectionChange).toHaveBeenNthCalledWith(1, new Set(['a']));
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set(['a', 'b']));
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expectSelected(['a', 'b']);
    expect(screen.getAllByRole('checkbox')).toHaveLength(items.length);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/mode/i));
  });

  it('resolves a single-mode seed in supplied order and never toggles that item off', async () => {
    // Single selection uses radio semantics and validates seeds without notifying the parent.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount({ selectionMode: 'single', selectedIds: new Set(['b', 'a']), onSelectionChange });
    expectSelected(['b']);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/single/i));
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(tile('b'));
    fireEvent.click(tile('b'), { ctrlKey: true });
    expectSelected(['b']);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Tile b' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tile a' })).not.toBeChecked();
  });

  it('retains ineligible selections and hidden IDs until an explicit clear', async () => {
    // Eligibility affects new gestures, not authoritative stored membership or selected content.
    const ref = createRef<TileGridHandle>();
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    const visible = items.slice(0, 3);
    const props = { items: visible, defaultSelectedIds: ['a', 'b', 'hidden'], onSelectionChange };
    const view = await mount(props, ref);
    expectSelected(['a', 'b'], visible);
    view.update({ ...props, isDisabled, isSelectable });
    expectSelected(['a', 'b'], visible);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(tile('a')).toHaveAttribute('aria-disabled', 'true');
    expect(tile('b')).not.toHaveAttribute('aria-disabled', 'true');
    expect(tile('c')).not.toHaveAttribute('aria-disabled', 'true');
    expect(within(tile('a')).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(tile('b')).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Tile c' })).not.toBeChecked();
    expect(ref.current).not.toBeNull();
    act(() => ref.current?.selectAll());
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a', 'b', 'hidden', 'c']));
    expectSelected(['a', 'b', 'c'], visible);
    act(() => ref.current?.clearSelection());
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set());
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expectSelected([], visible);
  });

  it('blocks new selection of ineligible items but still activates an enabled non-selectable item', async () => {
    // Disabled blocks activation; non-selectable alone blocks only selection.
    const ref = createRef<TileGridHandle>();
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    const onItemActivate = vi.fn<(item: Item) => void>();
    const props = { defaultSelectedIds: ['a', 'b', 'hidden'], onSelectionChange, onItemActivate };
    const view = await mount(props, ref);
    view.update({ ...props, isDisabled, isSelectable });
    expect(ref.current).not.toBeNull();
    act(() => ref.current?.clearSelection());
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set());
    for (const id of ['a', 'b']) {
      fireEvent.click(tile(id));
      fireEvent.click(tile(id), { ctrlKey: true });
      fireEvent.click(tile(id), { shiftKey: true });
      fireEvent.doubleClick(tile(id));
    }
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expectSelected([]);
    expect(onItemActivate).toHaveBeenCalledExactlyOnceWith(items[1]);
  });
});
