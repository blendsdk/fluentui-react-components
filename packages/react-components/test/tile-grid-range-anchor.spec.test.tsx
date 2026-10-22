import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { Ref } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type {
  TileGridHandle,
  TileGridItemRenderArgs,
  TileGridProps,
} from '../src/components/TileGrid/TileGrid.types';
import { setElementSize } from './jsdomStubs';

interface Item {
  id: string;
  label: string;
}

const items: readonly Item[] = ['a', 'b', 'c', 'd'].map(id => ({ id, label: `Tile ${id}` }));
const hiddenItem: Item = { id: 'hidden', label: 'Hidden tile' };
const getItemId = (item: Item) => item.id;
const getItemLabel = (item: Item) => item.label;

/** Exposes the public selected render argument as consumer-visible content. */
function renderItem({ item, selected }: TileGridItemRenderArgs<Item>) {
  return <span>{`${item.label}: ${selected ? 'selected' : 'unselected'}`}</span>;
}

/** Mounts the uncontrolled grid in the provider used by a real application. */
function grid(props: Partial<TileGridProps<Item>>, ref?: Ref<TileGridHandle>) {
  return (
    <FluentProvider theme={webLightTheme}>
      <TileGrid
        ref={ref}
        items={items}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        renderItem={renderItem}
        ariaLabel="Range anchor selection"
        selectionMode="multiselect"
        {...props}
      />
    </FluentProvider>
  );
}

/** Gives the real virtualizer enough measured space to mount every fixture item. */
async function mount(props: Partial<TileGridProps<Item>>, ref?: Ref<TileGridHandle>) {
  const view = render(grid(props, ref));
  await act(async () => {
    setElementSize(screen.getByRole('list', { name: 'Range anchor selection' }), 800, 600);
  });
  return {
    update: (next: Partial<TileGridProps<Item>>) => view.rerender(grid(next, ref)),
  };
}

function tile(id: string) {
  return screen.getByRole('listitem', { name: `Tile ${id}` });
}

/** Checks selected content and native checkbox state without inspecting the selection store. */
function expectSelected(selectedIds: readonly string[], visibleItems: readonly Item[] = items) {
  for (const item of visibleItems) {
    const wrapper = screen.getByRole('listitem', { name: item.label });
    const selected = selectedIds.includes(item.id);
    const state = selected ? 'selected' : 'unselected';
    expect(within(wrapper).getByText(`${item.label}: ${state}`)).toBeInTheDocument();
    const checkbox = within(wrapper).getByRole('checkbox', { name: item.label });
    expect(checkbox).toBeInstanceOf(HTMLInputElement);
    expect(checkbox).toHaveProperty('checked', selected);
  }
}

describe('TileGrid range anchor recovery', () => {
  it('keeps the original hidden anchor after a target-only fallback and uses it when it returns', async () => {
    // A missing anchor selects only the target without replacing the original range anchor.
    const seed = new Set(['hidden']);
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    const props = { defaultSelectedIds: seed, onSelectionChange };
    const view = await mount(props);
    expectSelected([]);
    expect(onSelectionChange).not.toHaveBeenCalled();

    fireEvent.click(tile('b'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
    expectSelected(['b']);

    const withHidden = [hiddenItem, ...items];
    view.update({ ...props, items: withHidden });
    expectSelected(['b'], withHidden);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);

    fireEvent.click(tile('d'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set(['hidden', 'a', 'b', 'c', 'd']));
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expectSelected(['hidden', 'a', 'b', 'c', 'd'], withHidden);
  });

  it('keeps the anchor absent after clear so consecutive Shift-clicks each select only their target', async () => {
    // Clearing removes the anchor; a range fallback must not invent one for a later range.
    const ref = createRef<TileGridHandle>();
    const seed = new Set(['b']);
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount({ defaultSelectedIds: seed, onSelectionChange }, ref);
    expectSelected(['b']);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(ref.current).not.toBeNull();

    act(() => ref.current?.clearSelection());
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set());
    expectSelected([]);

    fireEvent.click(tile('b'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set(['b']));
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expectSelected(['b']);

    fireEvent.click(tile('d'), { shiftKey: true });
    expect(onSelectionChange).toHaveBeenNthCalledWith(3, new Set(['d']));
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
    expectSelected(['d']);
  });
});
