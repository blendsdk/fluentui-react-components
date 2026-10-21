import { act, render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TileGridItemRenderArgs } from '../src/components/TileGrid';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { TileGridItemView } from '../src/components/TileGrid/TileGridItemView';
import { areSetsEqual, useGridSelection } from '../src/components/TileGrid/selection';
import type { GridSelectionOptions } from '../src/components/TileGrid/selection';

interface TestItem {
  id: string;
  label: string;
}

function renderSelectionHook(options: GridSelectionOptions) {
  return renderHook(() => useGridSelection(options));
}

describe('tile grid selection store internals', () => {
  it('compares selection sets by value', () => {
    const selected = new Set(['a', 'b']);

    expect(areSetsEqual(selected, new Set(['b', 'a']))).toBe(true);
    expect(areSetsEqual(selected, new Set(['a']))).toBe(false);
    expect(areSetsEqual(selected, selected)).toBe(true);
  });

  it('adds, removes, toggles, ranges, selects all, and clears sets', () => {
    const { result } = renderSelectionHook({
      mode: 'multiselect',
      defaultSelectedIds: ['z'],
    });

    act(() => result.current.select('a'));
    act(() => result.current.select('b'));
    expect(result.current.selectedIds).toEqual(new Set(['z', 'a', 'b']));
    expect(result.current.anchorId).toBe('b');

    act(() => result.current.deselect('b'));
    expect(result.current.selectedIds).toEqual(new Set(['z', 'a']));
    expect(result.current.anchorId).toBe('b');

    act(() => result.current.toggle('c'));
    expect(result.current.selectedIds).toEqual(new Set(['z', 'a', 'c']));
    expect(result.current.anchorId).toBe('c');

    act(() => result.current.toggle('c'));
    expect(result.current.selectedIds).toEqual(new Set(['z', 'a']));
    expect(result.current.anchorId).toBe('c');

    act(() => result.current.selectAll(['a', 'b', 'c']));
    expect(result.current.selectedIds).toEqual(new Set(['z', 'a', 'b', 'c']));

    act(() => result.current.clear());
    expect(result.current.selectedIds).toEqual(new Set());
    expect(result.current.anchorId).toBeUndefined();
  });

  it('filters non-selectable items from select-all and ranges', () => {
    const { result } = renderSelectionHook({
      mode: 'multiselect',
      defaultSelectedIds: ['z'],
      isSelectable: id => id !== 'b',
    });

    act(() => result.current.select('a'));
    act(() => result.current.selectRange('d', ['a', 'b', 'c', 'd']));
    expect(result.current.selectedIds).toEqual(new Set(['z', 'a', 'c', 'd']));

    act(() => result.current.selectAll(['a', 'b', 'c', 'd']));
    expect(result.current.selectedIds).toEqual(new Set(['z', 'a', 'c', 'd']));

    act(() => result.current.select('b'));
    expect(result.current.selectedIds).toEqual(new Set(['z', 'a', 'c', 'd']));
  });

  it('does not call the change callback for no-op actions', () => {
    const onSelectionChange = vi.fn();
    const { result } = renderSelectionHook({
      mode: 'multiselect',
      onSelectionChange,
    });

    act(() => result.current.selectAll(['a', 'b']));
    expect(onSelectionChange).toHaveBeenCalledTimes(1);

    act(() => result.current.selectAll(['a', 'b']));
    act(() => result.current.select('a'));
    act(() => result.current.clear());
    act(() => result.current.clear());

    expect(onSelectionChange).toHaveBeenCalledTimes(2);
  });

  it('keeps the anchor through range selection and moves it on an additive toggle', () => {
    const { result } = renderSelectionHook({ mode: 'multiselect' });

    act(() => result.current.select('a'));
    expect(result.current.anchorId).toBe('a');

    act(() => result.current.selectRange('d', ['a', 'b', 'c', 'd', 'e']));
    expect(result.current.selectedIds).toEqual(new Set(['a', 'b', 'c', 'd']));
    expect(result.current.anchorId).toBe('a');

    act(() => result.current.toggle('e'));
    expect(result.current.anchorId).toBe('e');
  });

  it('warns once and keeps the first seed in single mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resetDevWarningsForTests();

    const onSelectionChange = vi.fn();
    const { result } = renderSelectionHook({
      mode: 'single',
      defaultSelectedIds: ['a', 'b'],
      onSelectionChange,
    });

    expect(result.current.selectedIds).toEqual(new Set(['a']));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);

    warn.mockRestore();
  });

  it('does not notify on a controlled prop or item update', () => {
    const onSelectionChange = vi.fn();
    const { rerender } = renderHook(
      ({ selectedIds }: { selectedIds: ReadonlySet<string> }) =>
        useGridSelection({
          mode: 'multiselect',
          selectedIds,
          onSelectionChange,
        }),
      { initialProps: { selectedIds: new Set(['a']) } }
    );

    rerender({ selectedIds: new Set(['b']) });
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('memoizes the item cell when only the parent rerenders', () => {
    const item: TestItem = { id: 'a', label: 'Alpha' };
    const rect = { id: 'a', index: 0, x: 0, y: 0, width: 100, height: 100 };
    const renderItem = vi.fn((_args: TileGridItemRenderArgs<TestItem>) => <span>Alpha</span>);
    const onItemClick = vi.fn();

    const cell = (selected: boolean) => (
      <TileGridItemView
        rect={rect}
        item={item}
        index={0}
        setSize={1}
        tileSize={100}
        selected={selected}
        selectable
        disabled={false}
        label="Alpha"
        renderItem={renderItem}
        onItemClick={onItemClick}
        className="cell"
      />
    );

    const { rerender } = render(cell(false));
    expect(renderItem).toHaveBeenCalledTimes(1);

    rerender(cell(false));
    expect(renderItem).toHaveBeenCalledTimes(1);

    rerender(cell(true));
    expect(renderItem).toHaveBeenCalledTimes(2);
  });
});
