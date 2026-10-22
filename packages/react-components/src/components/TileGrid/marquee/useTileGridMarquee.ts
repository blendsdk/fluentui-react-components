import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, PointerEvent, RefObject } from 'react';
import type { TileGridGeometryResult, TileGridItemRect } from '../geometry';
import type { GridSelection } from '../selection';
import { areSetsEqual } from '../selection';
import { scrollToOffset } from '../virtualization/scrollHelpers';
import { createMarqueeController } from './createMarqueeController';
import { rectsIntersect } from './intersection';
import type { MarqueeController, MarqueeRect } from './types';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const EMPTY_RECTS: ReadonlyMap<string, TileGridItemRect> = new Map();

/** Root pointer callbacks, composed without replacing the application's native handlers. */
type PointerHandlers = Pick<
  ComponentPropsWithoutRef<'div'>,
  'onPointerDown' | 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onLostPointerCapture'
>;

/** Committed geometry and selection inputs used by the mounted gesture host. */
export interface TileGridMarqueeInput<T> {
  /** Root scroll container and capture owner. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** True only for opted-in, effective multiselect mode. */
  enabled: boolean;
  /** Complete cached layout used for the one release-time intersection pass. */
  geometry: TileGridGeometryResult;
  /** Current mounted rectangles used for bounded visual preview. */
  visibleItemRects: readonly TileGridItemRect[];
  /** Canonical item identity/order; replacing it invalidates an active gesture. */
  items: readonly T[];
  /** The single committed selection authority. */
  selection: GridSelection;
  /** Controlled source, when supplied by the application. */
  selectedIds?: ReadonlySet<string>;
  /** Stable ID-based eligibility reader. */
  canSelect: (id: string) => boolean;
  /** Original item-predicate identity for cancellation. */
  isSelectable?: (item: T) => boolean;
  /** Original disabled-predicate identity for cancellation. */
  isDisabled?: (item: T) => boolean;
  /** Original native callbacks. */
  rootProps: PointerHandlers;
}

/** Gesture-start membership is immutable; input identities detect obsolete geometry or authority. */
interface Gesture<T> {
  /** Pointer whose stream owns the gesture. */
  pointerId: number;
  /** Whether the start modifiers requested union rather than replacement. */
  additive: boolean;
  /** Complete start membership, including hidden IDs. */
  initialSelection: ReadonlySet<string>;
  /** Last equivalent committed source, allowing constant-time checks on preview rerenders. */
  sourceSelection: ReadonlySet<string>;
  /** Whether the start or most recent source is controlled. */
  controlled: boolean;
  /** Item identity captured at start. */
  items: readonly T[];
  /** Geometry identity captured at start. */
  geometry: TileGridGeometryResult;
  /** Selectable predicate identity captured at start. */
  isSelectable: TileGridMarqueeInput<T>['isSelectable'];
  /** Disabled predicate identity captured at start. */
  isDisabled: TileGridMarqueeInput<T>['isDisabled'];
}

/** Visual state and stable host handlers consumed by the grid state/render layers. */
export interface TileGridMarqueeState {
  /** Content-coordinate rectangle, absent during pending/idle gestures. */
  rect: MarqueeRect | null;
  /** Mounted-only visual membership; undefined means render committed selection. */
  previewSelection: ReadonlySet<string> | undefined;
  /** Composed pointer callbacks for the root. */
  handlers: PointerHandlers;
  /** Cancels an owned gesture before ordinary inline Escape handling. */
  handleKeyDown: (
    event: Pick<KeyboardEvent, 'key' | 'defaultPrevented' | 'preventDefault'>
  ) => boolean;
}

/** Unsupported or already-lost capture cannot safely own a mounted pointer stream. */
function hasCapture(root: HTMLElement, pointerId: number): boolean {
  try {
    return typeof root.hasPointerCapture === 'function' && root.hasPointerCapture(pointerId);
  } catch {
    return false;
  }
}

/**
 * Mounts the existing pointer controller without creating a second selection store.
 *
 * Preview projects only mounted rectangles. A complete cached-geometry pass runs
 * once at release, then the normal selection commit path decides whether to notify.
 * Geometry/predicate/controlled-source changes cancel without restoring stale IDs.
 */
export function useTileGridMarquee<T>(input: TileGridMarqueeInput<T>): TileGridMarqueeState {
  const rectangles = useMemo(
    () =>
      input.enabled ? new Map(input.geometry.itemRects.map(rect => [rect.id, rect])) : EMPTY_RECTS,
    [input.enabled, input.geometry]
  );
  const live = useRef({ ...input, rectangles });
  const controller = useRef<MarqueeController | undefined>(undefined);
  const gesture = useRef<Gesture<T> | undefined>(undefined);
  const removeEscape = useRef<(() => void) | undefined>(undefined);
  const mounted = useRef(false);
  const [rect, setRect] = useState<MarqueeRect | null>(null);

  const finish = useCallback(() => {
    gesture.current = undefined;
    removeEscape.current?.();
    removeEscape.current = undefined;
    if (mounted.current) setRect(null);
  }, []);
  const stop = useCallback(() => {
    finish();
    controller.current?.dispose();
  }, [finish]);

  const handleKeyDown = useCallback<TileGridMarqueeState['handleKeyDown']>(event => {
    if (event.defaultPrevented || event.key !== 'Escape' || !gesture.current) return false;
    controller.current?.handleKeyDown(event);
    return true;
  }, []);

  useIsomorphicLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    // Publish only committed inputs to asynchronous controller/frame callbacks.
    live.current = { ...input, rectangles };
    const active = gesture.current;
    if (!active) return;
    const controlled = input.selectedIds !== undefined;
    const selectionChanged =
      (controlled || active.controlled) &&
      !areSetsEqual(active.sourceSelection, input.selection.selectedIds);
    if (
      !input.enabled ||
      active.items !== input.items ||
      active.geometry !== input.geometry ||
      active.isSelectable !== input.isSelectable ||
      active.isDisabled !== input.isDisabled ||
      selectionChanged
    ) {
      stop();
    } else {
      // An equal-membership parent echo should not incur a full Set comparison
      // again on each subsequent pointer or scroll render.
      active.sourceSelection = input.selection.selectedIds;
      active.controlled = controlled;
    }
  });

  // Ownership must end during unmount, before a replacement view's layout
  // effects can handle input through the same document.
  useIsomorphicLayoutEffect(() => {
    const root = input.rootRef.current;
    if (!input.enabled || !root) return;
    const view = root.ownerDocument.defaultView;
    const instance = createMarqueeController({
      pointerCaptureTarget: root,
      geometry: {
        getItemRect: id => live.current.rectangles.get(id),
        getVisibleItemIds: () => live.current.visibleItemRects.map(item => item.id),
        getScrollContainer: () => root,
        getScrollOffset: () => root.scrollTop,
        scrollBy: delta => scrollToOffset(root, root.scrollTop + delta),
      },
      getSelectedIds: () => live.current.selection.selectedIds,
      isSelectable: id => live.current.canSelect(id),
      onRectChange: next => {
        if (mounted.current) setRect(next);
      },
      resolveFinalSelection: (finalRect, initial, additive) => {
        const next = new Set(additive ? initial : undefined);
        const current = live.current;
        for (const item of current.geometry.itemRects) {
          if (current.canSelect(item.id) && rectsIntersect(item, finalRect)) next.add(item.id);
        }
        return next;
      },
      onCommit: next => {
        finish();
        live.current.selection.replaceSelection(next);
      },
      onCancel: finish,
      requestFrame: view ? callback => view.requestAnimationFrame(callback) : undefined,
      cancelFrame: view ? handle => view.cancelAnimationFrame(handle) : undefined,
    });
    controller.current = instance;
    return () => {
      finish();
      instance.dispose();
      if (controller.current === instance) controller.current = undefined;
    };
  }, [input.enabled, input.rootRef, finish]);

  const onPointerDown = useCallback<NonNullable<PointerHandlers['onPointerDown']>>(
    event => {
      live.current.rootProps.onPointerDown?.(event);
      const current = live.current;
      const root = current.rootRef.current;
      const instance = controller.current;
      // Spacer and overlay are pointer-transparent. Only the root itself is
      // background; every descendant belongs to tile, empty, or application UI.
      if (
        !root ||
        event.currentTarget !== root ||
        event.target !== root ||
        !current.enabled ||
        !instance ||
        gesture.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        !event.isPrimary ||
        (event.pointerType !== 'mouse' && event.pointerType !== 'pen')
      )
        return;
      // Native scrollbars and borders can target the root too, but are not canvas
      // background. Native offsets avoid a second container measurement here.
      const { offsetX, offsetY } = event.nativeEvent;
      if (offsetX < 0 || offsetY < 0 || offsetX >= root.clientWidth || offsetY >= root.clientHeight)
        return;
      const selected = current.selection.selectedIds;
      gesture.current = {
        pointerId: event.pointerId,
        additive: event.shiftKey || event.ctrlKey || event.metaKey,
        initialSelection: new Set(selected),
        sourceSelection: selected,
        controlled: current.selectedIds !== undefined,
        items: current.items,
        geometry: current.geometry,
        isSelectable: current.isSelectable,
        isDisabled: current.isDisabled,
      };
      try {
        instance.handlePointerDown(event);
        if (!hasCapture(root, event.pointerId)) {
          stop();
          return;
        }
      } catch (error) {
        stop();
        throw error;
      }
      const doc = root.ownerDocument;
      doc.addEventListener('keydown', handleKeyDown);
      removeEscape.current = () => doc.removeEventListener('keydown', handleKeyDown);
      event.preventDefault();
    },
    [handleKeyDown, stop]
  );

  const onPointerMove = useCallback<NonNullable<PointerHandlers['onPointerMove']>>(event => {
    live.current.rootProps.onPointerMove?.(event);
    if (!event.defaultPrevented && gesture.current?.pointerId === event.pointerId) {
      controller.current?.handlePointerMove(event);
    }
  }, []);

  /** Terminal cleanup runs even when a consumer vetoes or throws during its owned stream. */
  const endPointer = useCallback(
    (
      event: PointerEvent<HTMLDivElement>,
      kind: 'onPointerUp' | 'onPointerCancel' | 'onLostPointerCapture'
    ) => {
      const original = gesture.current;
      try {
        live.current.rootProps[kind]?.(event);
        if (!original || gesture.current !== original || original.pointerId !== event.pointerId)
          return;
        if (kind === 'onPointerUp') {
          if (!event.defaultPrevented) controller.current?.handlePointerUp(event);
        } else if (kind === 'onPointerCancel') controller.current?.handlePointerCancel(event);
        else controller.current?.handleLostPointerCapture(event);
      } finally {
        if (original && gesture.current === original && original.pointerId === event.pointerId)
          stop();
      }
    },
    [stop]
  );
  const onPointerUp = useCallback<NonNullable<PointerHandlers['onPointerUp']>>(
    event => endPointer(event, 'onPointerUp'),
    [endPointer]
  );
  const onPointerCancel = useCallback<NonNullable<PointerHandlers['onPointerCancel']>>(
    event => endPointer(event, 'onPointerCancel'),
    [endPointer]
  );
  const onLostPointerCapture = useCallback<NonNullable<PointerHandlers['onLostPointerCapture']>>(
    event => endPointer(event, 'onLostPointerCapture'),
    [endPointer]
  );

  const previewSelection = useMemo(() => {
    const active = gesture.current;
    if (!input.enabled || !rect || !active) return undefined;
    const selected = new Set<string>();
    for (const item of input.visibleItemRects) {
      if (
        (active.additive && active.initialSelection.has(item.id)) ||
        (input.canSelect(item.id) && rectsIntersect(item, rect))
      )
        selected.add(item.id);
    }
    return selected;
  }, [input.enabled, input.visibleItemRects, input.canSelect, rect]);

  return {
    rect: input.enabled ? rect : null,
    previewSelection,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture },
    handleKeyDown,
  };
}
