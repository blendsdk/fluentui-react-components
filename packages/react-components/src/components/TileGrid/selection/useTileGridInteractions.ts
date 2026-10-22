import { useCallback, useRef } from 'react';
import type { ComponentPropsWithoutRef, KeyboardEvent, MouseEvent } from 'react';
import type { TileGridInteractionMode } from '../TileGrid.types';
import type { GridSelection } from './types';
import { applyItemClick, isInteractiveClickTarget } from './clickSelection';
import { isNavigationKey } from '../focus/navigation';
import type { TileGridNavigationKey } from '../focus/navigation';
import { normalizeTileSize } from '../geometry';

/** Native handlers composed after consumer handlers on the same root event. */
type RootHandlers = Pick<
  ComponentPropsWithoutRef<'div'>,
  'onClick' | 'onDoubleClick' | 'onChange' | 'onKeyDown'
>;

/** Live inputs for stable delegated item and owned-input event handlers. */
export interface TileGridInteractionsInput<T> {
  /** Current state authority, whose mode is fixed until unmount. */
  selection: GridSelection;
  /** Plain-click interpretation. */
  interactionMode: TileGridInteractionMode;
  /** Current canonical items indexed by their opaque IDs. */
  itemById: ReadonlyMap<string, T>;
  /** Normalized display order used for range selection. */
  currentIds: readonly string[];
  /** Reports whether an item is unavailable for activation. */
  isDisabled: (id: string) => boolean;
  /** Application activation callback. */
  onItemActivate?: (item: T) => void;
  /** Original native callbacks; each runs once before grid processing. */
  rootProps: RootHandlers;
  /** Spatial movement supplied by the mounted focus controller. */
  navigate?: (id: string, key: TileGridNavigationKey) => string | undefined;
  /** Tab/Escape boundary handling for inline content and the root fallback. */
  handleInlineKey?: (event: KeyboardEvent<HTMLDivElement>) => boolean;
  /** Gives an active pointer gesture first refusal on Escape after consumer cancellation. */
  handleMarqueeKey?: (event: KeyboardEvent<HTMLDivElement>) => boolean;
  /** Enables controlled wrapper zoom; a size callback is also required. */
  zoomable?: boolean;
  /** Resolved current size used as the base for a request. */
  tileSize?: number;
  /** Lower bound for requested sizes. */
  minTileSize?: number;
  /** Upper bound for requested sizes. */
  maxTileSize?: number;
  /** Application callback; the grid never resizes itself. */
  onTileSizeChange?: (size: number) => void;
}

/** Finds an inline tile owned by this grid, excluding nested grids and React-bubbled portals. */
function findItem(root: HTMLDivElement, target: EventTarget | null): Element | null {
  const ElementType = root.ownerDocument.defaultView?.Element;
  if (!ElementType || !(target instanceof ElementType) || !root.contains(target)) return null;
  if (target.closest('[data-tile-grid-root]') !== root) return null;
  return target.closest('[data-tile-grid-item]');
}

/** Whether a click belongs to a modified selection gesture instead of activation. */
function modified(event: MouseEvent | KeyboardEvent): boolean {
  return event.shiftKey || event.ctrlKey || event.metaKey || event.altKey;
}

/**
 * Composes native callbacks before grid actions using root delegation.
 *
 * Delegation allows the application's bubbling preventDefault to veto an action
 * before selection changes. Stable callbacks read current items and predicates
 * through a ref, avoiding handler churn in the mounted virtual window.
 */
export function useTileGridInteractions<T>(input: TileGridInteractionsInput<T>): RootHandlers {
  const live = useRef(input);
  live.current = input;

  const onClick = useCallback<NonNullable<RootHandlers['onClick']>>(event => {
    const current = live.current;
    current.rootProps.onClick?.(event);
    const wrapper = findItem(event.currentTarget, event.target);
    const id = wrapper?.getAttribute('data-tile-grid-item');
    if (
      id === undefined ||
      id === null ||
      event.defaultPrevented ||
      isInteractiveClickTarget(event.target, event.currentTarget.ownerDocument) ||
      current.isDisabled(id)
    )
      return;
    const item = current.itemById.get(id);
    if (item === undefined) return;
    const { selection } = current;
    if (selection.mode === 'none' || (current.interactionMode === 'browse' && !modified(event))) {
      current.onItemActivate?.(item);
    } else {
      applyItemClick({
        event,
        id,
        mode: selection.mode,
        currentIds: current.currentIds,
        selection,
        ownerDocument: event.currentTarget.ownerDocument,
      });
    }
  }, []);

  const onDoubleClick = useCallback<NonNullable<RootHandlers['onDoubleClick']>>(event => {
    const current = live.current;
    current.rootProps.onDoubleClick?.(event);
    const wrapper = findItem(event.currentTarget, event.target);
    const id = wrapper?.getAttribute('data-tile-grid-item');
    if (
      id === undefined ||
      id === null ||
      event.defaultPrevented ||
      modified(event) ||
      current.selection.mode === 'none' ||
      current.interactionMode !== 'select' ||
      isInteractiveClickTarget(event.target, event.currentTarget.ownerDocument) ||
      current.isDisabled(id)
    )
      return;
    const item = current.itemById.get(id);
    if (item !== undefined) current.onItemActivate?.(item);
  }, []);

  const onChange = useCallback<NonNullable<RootHandlers['onChange']>>(event => {
    const current = live.current;
    current.rootProps.onChange?.(event);
    const wrapper = findItem(event.currentTarget, event.target);
    const InputType = event.currentTarget.ownerDocument.defaultView?.HTMLInputElement;
    if (
      !wrapper ||
      !InputType ||
      !(event.target instanceof InputType) ||
      !event.target.hasAttribute('data-tile-grid-selection')
    )
      return;
    if (event.defaultPrevented || event.nativeEvent.defaultPrevented) {
      const input = event.target;
      // Native click cancellation can roll checkedness back after React has
      // already restored its controlled value. Reconcile after that rollback,
      // using the latest rendered projection mirrored by the owned input ref.
      queueMicrotask(() => {
        if (input.isConnected) input.checked = input.defaultChecked;
      });
      return;
    }
    const id = wrapper.getAttribute('data-tile-grid-item');
    if (id === null) return;
    if (current.selection.mode === 'single') current.selection.select(id);
    else current.selection.toggle(id);
  }, []);

  const onKeyDown = useCallback<NonNullable<RootHandlers['onKeyDown']>>(event => {
    const current = live.current;
    current.rootProps.onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      current.handleMarqueeKey?.(event) ||
      current.handleInlineKey?.(event)
    )
      return;
    const wrapper = findItem(event.currentTarget, event.target);
    const id = wrapper?.getAttribute('data-tile-grid-item');
    if (event.target !== wrapper || id == null || event.altKey) return;
    const command = event.ctrlKey || event.metaKey;
    if (command && !event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      current.selection.selectAll(current.currentIds);
      return;
    }
    if (
      isNavigationKey(event.key) &&
      (!command || (!event.shiftKey && (event.key === 'Home' || event.key === 'End'))) &&
      (!event.shiftKey || event.key.startsWith('Arrow'))
    ) {
      const target = current.navigate?.(id, event.key);
      if (target !== undefined) {
        event.preventDefault();
        if (event.shiftKey && target !== id)
          current.selection.selectRange(target, current.currentIds);
      }
      return;
    }
    if (command) return;
    if (
      (event.key === '+' || event.key === '=' || event.key === '-') &&
      current.zoomable &&
      current.onTileSizeChange &&
      current.tileSize !== undefined
    ) {
      event.preventDefault();
      current.onTileSizeChange(
        normalizeTileSize(
          current.tileSize + (event.key === '-' ? -20 : 20),
          current.minTileSize ?? 120,
          current.maxTileSize ?? 320
        )
      );
      return;
    }
    if (event.shiftKey || current.isDisabled(id)) return;
    if (event.key === ' ' && current.selection.mode !== 'none') {
      event.preventDefault();
      current.selection.toggle(id);
      return;
    }
    if (event.key !== 'Enter') return;
    const item = current.itemById.get(id);
    if (item !== undefined && current.onItemActivate) {
      event.preventDefault();
      current.onItemActivate(item);
    }
  }, []);

  return { onClick, onDoubleClick, onChange, onKeyDown };
}
