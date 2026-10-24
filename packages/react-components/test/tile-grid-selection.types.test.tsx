import { describe, expect, it } from 'vitest';
import type {
  TileGridHandle,
  TileGridItemRenderArgs,
  TileGridProps,
  TileGridReorderArgs,
  TileGridSelectionMode,
  TileGridStrings,
} from '../src/components/TileGrid';

interface TestItem {
  id: string;
  label: string;
}

/** Complete string surface used to pin the public localization contract. */
const STRINGS: TileGridStrings = {
  emptyMessage: 'No items',
  selectionCount: (selected, total) => `${selected} of ${total} selected`,
  dragHandleLabel: label => `Reorder ${label}`,
  moveUp: 'Move up',
  moveDown: 'Move down',
  reorderPosition: (position, total) => `Moved to position ${position} of ${total}`,
  moreActions: 'More actions',
};

/**
 * Compile-time pin for the selection members added to the component surface.
 *
 * The runtime export list is pinned separately; this file makes the selection
 * types part of the type-check gate without changing the specification suite.
 */
describe('tile grid selection component types', () => {
  it('compiles the selection props, render args, and handle', () => {
    const item: TestItem = { id: 'a', label: 'Alpha' };
    const selectionMode: TileGridSelectionMode = 'multiselect';
    const args: TileGridItemRenderArgs<TestItem> = {
      item,
      index: 0,
      tileSize: 160,
      width: 160,
      height: 160,
      selected: true,
      selectable: true,
      disabled: false,
      isDragging: false,
      isOverlay: false,
      strings: STRINGS,
    };
    const reorder: TileGridReorderArgs = {
      itemId: 'a',
      fromIndex: 0,
      toIndex: 1,
      orderedIds: ['b', 'a'],
    };
    const props: TileGridProps<TestItem> = {
      items: [item],
      getItemId: value => value.id,
      getItemLabel: value => value.label,
      renderItem: () => null,
      selectionMode,
      selectedIds: new Set(['a']),
      defaultSelectedIds: ['a'],
      onSelectionChange: () => {},
      reorderable: true,
      reorderDisabled: false,
      onReorder: () => {},
    };
    const handle: TileGridHandle = {
      selectAll: () => {},
      clearSelection: () => {},
      scrollToSelected: () => {},
    };

    expect(args.selected).toBe(true);
    expect(props.selectionMode).toBe('multiselect');
    expect(props.onReorder).toBeTypeOf('function');
    expect(reorder.orderedIds).toEqual(['b', 'a']);
    expect(STRINGS.reorderPosition(2, 4)).toBe('Moved to position 2 of 4');
    expect(handle).toBeDefined();
  });
});
