import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type {
  CollisionDetection,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import type { TileGridItemRect, TileGridLayout } from '../geometry';
import type { TileGridAction, TileGridReorderArgs, TileGridStrings } from '../TileGrid.types';
import { findInsertion } from './insertion';
import { buildReorderArgs, resolveToIndex } from './payload';
import { TILE_GRID_DROPPABLE_ID, TILE_GRID_REORDER_ACTION_IDS } from './types';
import type { TileGridInsertion, TileGridOverlayOffset, TileGridOverlayRect } from './types';
import { useAutoScroll } from './useAutoScroll';

/** Stable pointer-sensor options; a new object would rebuild dnd-kit's context. */
const POINTER_SENSOR_OPTIONS = { activationConstraint: { distance: 4 } } as const;

/** Inputs for the reorder controller. */
export interface UseTileGridReorderInput<T> {
  /** Scroll container that owns the drag. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Normalized items in current order, used to capture the active copy. */
  items: readonly T[];
  /** Current item IDs in display order. */
  currentIds: readonly string[];
  /** Mounted rectangles in content coordinates. */
  visibleItemRects: readonly TileGridItemRect[];
  /** Layout that defines the reading edge. */
  layout: TileGridLayout;
  /** Fully resolved strings. */
  strings: TileGridStrings;
  /** Whether the application enabled arranging. */
  reorderable: boolean;
  /** Whether the application temporarily disabled arranging. */
  reorderDisabled: boolean;
  /** Application callback for a changed order. */
  onReorder?: (args: TileGridReorderArgs) => void;
  /** Shared polite announcement channel. */
  announce: (message: string) => void;
}

/** Reorder state exposed to the item view and renderer. */
export interface TileGridReorderState<T> {
  /** Whether the handle, overlay, and keyboard actions should render. */
  enabled: boolean;
  /** Active drag source ID. */
  activeId?: string;
  /** Active item captured at drag start. */
  activeItem?: T;
  /** Active item index captured at drag start. */
  activeIndex?: number;
  /** Current insertion, if a pointer position has resolved one. */
  insertion?: TileGridInsertion;
  /** Start rectangle for the portal copy. */
  overlayRect?: TileGridOverlayRect;
  /** Current pointer translation for the portal copy. */
  overlayOffset: TileGridOverlayOffset;
  /** dnd-kit sensors. */
  sensors: ReturnType<typeof useSensors>;
  /** Custom model-based collision detection. */
  collisionDetection: CollisionDetection;
  /** Starts a drag and captures the source rectangle. */
  onDragStart: (event: DragStartEvent) => void;
  /** Tracks the pointer, insertion, and auto-scroll. */
  onDragMove: (event: DragMoveEvent) => void;
  /** Commits a changed order. */
  onDragEnd: (event: DragEndEvent) => void;
  /** Clears the drag without a callback. */
  onDragCancel: () => void;
  /** Returns the two keyboard actions for an item index. */
  getReorderActions: (index: number) => readonly TileGridAction<T>[] | undefined;
}

/** Pointer position in viewport coordinates. */
interface PointerPosition {
  clientX: number;
  clientY: number;
}

/** Reads a pointer position from a native event, optionally offset by a drag delta. */
function readPointer(event: Event, delta?: { x: number; y: number }): PointerPosition | undefined {
  if (!('clientX' in event) || !('clientY' in event)) return undefined;

  return {
    clientX: Number(event.clientX) + (delta?.x ?? 0),
    clientY: Number(event.clientY) + (delta?.y ?? 0),
  };
}

/** Compares two insertions without re-rendering for identical geometry. */
function sameInsertion(
  current: TileGridInsertion | undefined,
  next: TileGridInsertion | undefined
): boolean {
  if (current === next) return true;
  if (!current || !next) return false;

  return (
    current.boundary === next.boundary &&
    current.edge === next.edge &&
    current.index === next.index &&
    current.rect.id === next.rect.id &&
    current.rect.x === next.rect.x &&
    current.rect.y === next.rect.y &&
    current.rect.width === next.rect.width &&
    current.rect.height === next.rect.height
  );
}

/**
 * Owns the drag lifecycle, insertion state, keyboard actions, and shared
 * announcements for TileGrid arranging.
 *
 * The grid remains controlled: this hook reports a proposed order and never
 * mutates the item list or the selection set.
 */
export function useTileGridReorder<T>({
  rootRef,
  items,
  currentIds,
  visibleItemRects,
  layout,
  strings,
  reorderable,
  reorderDisabled,
  onReorder,
  announce,
}: UseTileGridReorderInput<T>): TileGridReorderState<T> {
  const enabled = reorderable && !reorderDisabled && onReorder !== undefined;
  const [activeId, setActiveId] = useState<string | undefined>();
  const [activeItem, setActiveItem] = useState<T | undefined>();
  const [activeIndex, setActiveIndex] = useState<number | undefined>();
  const [insertion, setInsertion] = useState<TileGridInsertion | undefined>();
  const [overlayRect, setOverlayRect] = useState<TileGridOverlayRect | undefined>();
  const [overlayOffset, setOverlayOffset] = useState<TileGridOverlayOffset>({ x: 0, y: 0 });

  const activeIdRef = useRef<string | undefined>(undefined);
  const insertionRef = useRef<TileGridInsertion | undefined>(undefined);
  const pointerRef = useRef<PointerPosition | undefined>(undefined);
  const startPointerRef = useRef<PointerPosition | undefined>(undefined);
  const rootRectRef = useRef<DOMRect | undefined>(undefined);
  const visibleRectsRef = useRef(visibleItemRects);
  const currentIdsRef = useRef(currentIds);
  const onReorderRef = useRef(onReorder);
  const announceRef = useRef(announce);
  const stringsRef = useRef(strings);
  const enabledRef = useRef(enabled);
  const actionCacheRef = useRef<{
    ids: readonly string[];
    moveUp: string;
    moveDown: string;
    actions: Map<number, readonly TileGridAction<T>[]>;
  }>({ ids: [], moveUp: '', moveDown: '', actions: new Map() });

  visibleRectsRef.current = visibleItemRects;
  currentIdsRef.current = currentIds;
  onReorderRef.current = onReorder;
  announceRef.current = announce;
  stringsRef.current = strings;
  enabledRef.current = enabled;

  const actionCache = actionCacheRef.current;
  if (
    actionCache.ids !== currentIds ||
    actionCache.moveUp !== strings.moveUp ||
    actionCache.moveDown !== strings.moveDown
  ) {
    actionCacheRef.current = {
      ids: currentIds,
      moveUp: strings.moveUp,
      moveDown: strings.moveDown,
      actions: new Map(),
    };
  }

  const sensors = useSensors(useSensor(PointerSensor, POINTER_SENSOR_OPTIONS));

  const refreshInsertion = useCallback(() => {
    const root = rootRef.current;
    const pointer = pointerRef.current;
    if (!root || !pointer) return;

    const rootRect = rootRectRef.current ?? root.getBoundingClientRect();
    rootRectRef.current = rootRect;
    const x = pointer.clientX - rootRect.left - root.clientLeft + root.scrollLeft;
    const y = pointer.clientY - rootRect.top - root.clientTop + root.scrollTop;
    const next = findInsertion({
      x,
      y,
      rects: visibleRectsRef.current,
      layout,
      itemCount: currentIdsRef.current.length,
    });

    insertionRef.current = next;
    setInsertion(current => (sameInsertion(current, next) ? current : next));
  }, [layout, rootRef]);

  const autoScroll = useAutoScroll({
    rootRef,
    enabled,
    onScroll: refreshInsertion,
  });

  const syncInsertion = useCallback(() => {
    const next = insertionRef.current;
    setInsertion(current => (sameInsertion(current, next) ? current : next));
  }, []);

  const collisionDetection = useCallback<CollisionDetection>(
    args => {
      const root = rootRef.current;
      const pointer = args.pointerCoordinates;
      if (!enabledRef.current || !root || !pointer) return [];

      const rootRect = root.getBoundingClientRect();
      rootRectRef.current = rootRect;
      pointerRef.current = { clientX: pointer.x, clientY: pointer.y };

      const x = pointer.x - rootRect.left - root.clientLeft + root.scrollLeft;
      const y = pointer.y - rootRect.top - root.clientTop + root.scrollTop;
      const next = findInsertion({
        x,
        y,
        rects: visibleRectsRef.current,
        layout,
        itemCount: currentIdsRef.current.length,
      });

      insertionRef.current = next;
      return next ? [{ id: TILE_GRID_DROPPABLE_ID }] : [];
    },
    [layout, rootRef]
  );

  const clearDrag = useCallback(() => {
    activeIdRef.current = undefined;
    setActiveId(undefined);
    setActiveItem(undefined);
    setActiveIndex(undefined);
    insertionRef.current = undefined;
    setInsertion(undefined);
    setOverlayRect(undefined);
    setOverlayOffset({ x: 0, y: 0 });
    pointerRef.current = undefined;
    startPointerRef.current = undefined;
    rootRectRef.current = undefined;
    autoScroll.stop();
  }, [autoScroll]);

  useEffect(() => {
    if (!enabled) clearDrag();
  }, [clearDrag, enabled]);

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!enabledRef.current) return;

      const id = String(event.active.id);
      const root = rootRef.current;
      const rect = visibleRectsRef.current.find(candidate => candidate.id === id);
      const index = rect?.index ?? currentIdsRef.current.indexOf(id);
      const startPointer = readPointer(event.activatorEvent);

      activeIdRef.current = id;
      setActiveId(id);
      setActiveItem(items[index]);
      setActiveIndex(index >= 0 ? index : undefined);
      setOverlayOffset({ x: 0, y: 0 });
      pointerRef.current = startPointer;
      startPointerRef.current = startPointer;
      insertionRef.current = undefined;
      setInsertion(undefined);

      if (!root || !rect) {
        rootRectRef.current = root?.getBoundingClientRect();
        setOverlayRect(undefined);
        return;
      }

      const rootRect = root.getBoundingClientRect();
      rootRectRef.current = rootRect;
      setOverlayRect({
        left: rootRect.left + root.clientLeft + rect.x - root.scrollLeft,
        top: rootRect.top + root.clientTop + rect.y - root.scrollTop,
        width: rect.width,
        height: rect.height,
      });
    },
    [items, rootRef]
  );

  const onDragMove = useCallback(
    (event: DragMoveEvent) => {
      // A live dnd-kit sensor can outlive a disable transition; without this
      // guard it would repopulate the insertion and commit a ghost reorder.
      if (!activeIdRef.current) return;

      const pointer = pointerRef.current ?? readPointer(event.activatorEvent, event.delta);
      if (pointer) {
        pointerRef.current = pointer;
        autoScroll.updatePointer(pointer.clientY, rootRectRef.current);
      }

      const start = startPointerRef.current;
      if (pointer && start) {
        setOverlayOffset({
          x: pointer.clientX - start.clientX,
          y: pointer.clientY - start.clientY,
        });
      }

      syncInsertion();
    },
    [autoScroll, syncInsertion]
  );

  const commitMove = useCallback((fromIndex: number, toIndex: number) => {
    const ids = currentIdsRef.current;
    const args = buildReorderArgs(ids, fromIndex, toIndex);
    if (!args) return;

    onReorderRef.current?.(args);
    announceRef.current(stringsRef.current.reorderPosition(args.toIndex + 1, ids.length));
  }, []);

  const onDragEnd = useCallback(
    (_event: DragEndEvent) => {
      const id = activeIdRef.current;
      if (!id) {
        clearDrag();
        return;
      }

      const ids = currentIdsRef.current;
      const fromIndex = ids.indexOf(id);
      const pending = insertionRef.current;

      try {
        if (fromIndex < 0 || !pending) return;
        const toIndex = resolveToIndex(pending.boundary, fromIndex, ids.length);
        const args = buildReorderArgs(ids, fromIndex, toIndex);
        if (!args) return;

        onReorderRef.current?.(args);
        announceRef.current(stringsRef.current.reorderPosition(args.toIndex + 1, ids.length));
      } finally {
        clearDrag();
      }
    },
    [clearDrag]
  );

  const onDragCancel = useCallback(() => {
    clearDrag();
  }, [clearDrag]);

  const getReorderActions = useCallback(
    (index: number): readonly TileGridAction<T>[] | undefined => {
      if (!enabled) return undefined;

      const cache = actionCacheRef.current.actions;
      const cached = cache.get(index);
      if (cached !== undefined) return cached;

      const last = currentIds.length - 1;
      const actions = [
        {
          id: TILE_GRID_REORDER_ACTION_IDS.moveUp,
          label: strings.moveUp,
          onSelect: () => commitMove(index, index - 1),
          isDisabled: () => index === 0,
        },
        {
          id: TILE_GRID_REORDER_ACTION_IDS.moveDown,
          label: strings.moveDown,
          onSelect: () => commitMove(index, index + 1),
          isDisabled: () => index === last,
        },
      ] as const;

      cache.set(index, actions);
      return actions;
    },
    [commitMove, currentIds, enabled, strings.moveDown, strings.moveUp]
  );

  return {
    enabled,
    activeId,
    activeItem,
    activeIndex,
    insertion,
    overlayRect,
    overlayOffset,
    sensors,
    collisionDetection,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel,
    getReorderActions,
  };
}
