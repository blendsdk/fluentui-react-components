import { describe, expect, it } from 'vitest';
import type {
  TileGridHandle,
  TileGridItemRenderArgs,
  TileGridProps,
  TileGridSelectionMode,
} from '../src/index';

interface TestItem {
  id: string;
  label: string;
}

/**
 * Compile-time pin for the selection members added to the package surface.
 *
 * The runtime export list is pinned separately; this file makes the new public
 * types part of the type-check gate without changing the specification suite.
 */
describe('tile grid selection public types', () => {
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
    };
    const handle: TileGridHandle = {
      selectAll: () => {},
      clearSelection: () => {},
      scrollToSelected: () => {},
    };

    expect(args.selected).toBe(true);
    expect(props.selectionMode).toBe('multiselect');
    expect(handle).toBeDefined();
  });
});
