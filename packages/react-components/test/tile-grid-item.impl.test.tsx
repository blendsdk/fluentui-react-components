import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { TileGridAction, TileGridDragHandleProps } from '../src/components/TileGrid';
import { useTileGridItem } from '../src/components/TileGridItem/useTileGridItem';

/** Minimal item used by the internal state cases. */
interface Item {
  id: string;
  label: string;
}

const ITEM: Item = { id: 'photo-1', label: 'Lake sunrise' };

/** Provider wrapper used by the Griffel style hook. */
function wrapper({ children }: { children: ReactNode }) {
  return <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;
}

/** Builds one action with a stable callback. */
function action(
  id: string,
  label: string,
  overrides: Partial<TileGridAction<Item>> = {}
): TileGridAction<Item> {
  return { id, label, onSelect: () => {}, ...overrides };
}

/** Builds valid library handle wiring. */
function handleProps(overrides: Partial<TileGridDragHandleProps> = {}): TileGridDragHandleProps {
  return {
    setNodeRef: () => {},
    attributes: {},
    listeners: {},
    isDragging: false,
    disabled: false,
    label: 'Reorder Lake sunrise',
    ...overrides,
  };
}

describe('useTileGridItem', () => {
  it('should fall back to an action id when the label is blank', () => {
    const blank = action('archive', '   ');
    const open = action('open', 'Open');
    const { result } = renderHook(() => useTileGridItem({ item: ITEM, actions: [blank, open] }), {
      wrapper,
    });

    expect(result.current.labelFor(blank)).toBe('archive');
    expect(result.current.labelFor(open)).toBe('Open');
  });

  it('should keep title, className, and style out of the native root props', () => {
    const { result } = renderHook(
      () =>
        useTileGridItem({
          item: ITEM,
          title: 'Title',
          className: 'caller-shell',
          style: { color: 'red' },
        }),
      { wrapper }
    );

    expect(result.current.rootProps).not.toHaveProperty('title');
    expect(result.current.rootProps).not.toHaveProperty('className');
    expect(result.current.rootProps).not.toHaveProperty('style');
    expect(result.current.className).toBe('caller-shell');
    expect(result.current.style).toEqual({ color: 'red' });
  });

  it('should compose the menu as actions, overflow actions, then reorder actions', () => {
    const actions = [action('open', 'Open'), action('download', 'Download')];
    const overflow = [action('share', 'Share')];
    const reorder = [action('move-up', 'Move up'), action('move-down', 'Move down')];
    const { result } = renderHook(
      () =>
        useTileGridItem({
          item: ITEM,
          actions,
          overflowActions: overflow,
          reorderActions: reorder,
        }),
      { wrapper }
    );

    expect(result.current.inlineActions.map(entry => entry.id)).toEqual(['open', 'download']);
    expect(result.current.menuActions.map(entry => entry.id)).toEqual([
      'open',
      'download',
      'share',
      'move-up',
      'move-down',
    ]);
    expect(result.current.showMenu).toBe(true);
  });

  it('should suppress every action and the handle for a disabled shell', () => {
    const { result } = renderHook(
      () =>
        useTileGridItem({
          item: ITEM,
          disabled: true,
          actions: [action('open', 'Open')],
          overflowActions: [action('share', 'Share')],
          reorderActions: [action('move-up', 'Move up')],
          dragHandleProps: handleProps(),
        }),
      { wrapper }
    );

    expect(result.current.inlineActions).toEqual([]);
    expect(result.current.menuActions).toEqual([]);
    expect(result.current.showMenu).toBe(false);
    expect(result.current.showHandle).toBe(false);
    expect(result.current.handleProps).toBeUndefined();
  });

  it('should suppress every action and the handle for the overlay copy', () => {
    const { result } = renderHook(
      () =>
        useTileGridItem({
          item: ITEM,
          isOverlay: true,
          actions: [action('open', 'Open')],
          dragHandleProps: handleProps(),
        }),
      { wrapper }
    );

    expect(result.current.inlineActions).toEqual([]);
    expect(result.current.menuActions).toEqual([]);
    expect(result.current.showMenu).toBe(false);
    expect(result.current.showHandle).toBe(false);
  });

  it('should normalize invalid aspect ratios and default the media fit', () => {
    const { result } = renderHook(() => useTileGridItem({ item: ITEM }), { wrapper });

    expect(result.current.resolved.aspectRatio).toBe(1);
    expect(result.current.resolved.fit).toBe('cover');
  });

  it.each([0, -2, Number.NaN, Number.POSITIVE_INFINITY])(
    'should fall back to a square ratio for %s',
    value => {
      const { result } = renderHook(() => useTileGridItem({ item: ITEM, aspectRatio: value }), {
        wrapper,
      });

      expect(result.current.resolved.aspectRatio).toBe(1);
    }
  );

  it('should preserve a valid ratio and contain fit', () => {
    const { result } = renderHook(
      () => useTileGridItem({ item: ITEM, aspectRatio: 4 / 3, fit: 'contain' }),
      { wrapper }
    );

    expect(result.current.resolved.aspectRatio).toBeCloseTo(4 / 3, 5);
    expect(result.current.resolved.fit).toBe('contain');
  });

  it('should gate the visual selection badge on selected and selectable', () => {
    const selected = renderHook(
      () => useTileGridItem({ item: ITEM, selected: true, selectable: true }),
      { wrapper }
    );
    const hidden = renderHook(
      () => useTileGridItem({ item: ITEM, selected: true, selectable: false }),
      { wrapper }
    );

    expect(selected.result.current.showSelection).toBe(true);
    expect(hidden.result.current.showSelection).toBe(false);
  });

  it('should combine the shell and per-action disabled states', () => {
    const blocked = action('blocked', 'Blocked', { isDisabled: () => true });
    const allowed = action('allowed', 'Allowed');
    const { result } = renderHook(() => useTileGridItem({ item: ITEM }), { wrapper });

    expect(result.current.isActionDisabled(blocked)).toBe(true);
    expect(result.current.isActionDisabled(allowed)).toBe(false);
  });

  it('should expose danger intent and fall back to the default intent', () => {
    const danger = action('delete', 'Delete', { intent: 'danger' });
    const normal = action('open', 'Open');
    const { result } = renderHook(() => useTileGridItem({ item: ITEM }), { wrapper });

    expect(result.current.intentFor(danger)).toBe('danger');
    expect(result.current.intentFor(normal)).toBe('default');
  });

  it('should fall back to the English menu name when the override is blank', () => {
    const { result } = renderHook(
      () => useTileGridItem({ item: ITEM, strings: { moreActions: '   ' } }),
      { wrapper }
    );

    expect(result.current.moreActionsLabel).toBe('More actions');
  });

  it('should expose the handle only while arranging is available', () => {
    const handle = handleProps();
    const enabled = renderHook(() => useTileGridItem({ item: ITEM, dragHandleProps: handle }), {
      wrapper,
    });

    expect(enabled.result.current.showHandle).toBe(true);
    expect(enabled.result.current.handleProps).toBe(handle);
  });

  it('should use the original item for disabled predicates', () => {
    const predicate = vi.fn((value: Item) => value.id === ITEM.id);
    const blocked = action('blocked', 'Blocked', { isDisabled: predicate });
    const { result } = renderHook(() => useTileGridItem({ item: ITEM }), { wrapper });

    expect(result.current.isActionDisabled(blocked)).toBe(true);
    expect(predicate).toHaveBeenCalledWith(ITEM);
  });
});
