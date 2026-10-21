import { useCallback, useRef } from 'react';
import type { ComponentPropsWithoutRef, KeyboardEvent, MouseEvent } from 'react';
import type { TileGridInteractionMode } from '../TileGrid.types';
import type { GridSelection } from './types';
import { applyItemClick, isInteractiveClickTarget } from './clickSelection';

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
      isInteractiveClickTarget(event.target) ||
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
      isInteractiveClickTarget(event.target) ||
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
      !event.target.hasAttribute('data-tile-grid-selection') ||
      event.defaultPrevented ||
      event.nativeEvent.defaultPrevented
    )
      return;
    const id = wrapper.getAttribute('data-tile-grid-item');
    if (id === null) return;
    if (current.selection.mode === 'single') current.selection.select(id);
    else current.selection.toggle(id);
  }, []);

  const onKeyDown = useCallback<NonNullable<RootHandlers['onKeyDown']>>(event => {
    const current = live.current;
    current.rootProps.onKeyDown?.(event);
    const wrapper = findItem(event.currentTarget, event.target);
    const id = wrapper?.getAttribute('data-tile-grid-item');
    if (
      event.defaultPrevented ||
      modified(event) ||
      event.key !== 'Enter' ||
      event.target !== wrapper ||
      id === null ||
      id === undefined ||
      current.isDisabled(id)
    )
      return;
    const item = current.itemById.get(id);
    if (item !== undefined && current.onItemActivate) {
      event.preventDefault();
      current.onItemActivate(item);
    }
  }, []);

  return { onClick, onDoubleClick, onChange, onKeyDown };
}
