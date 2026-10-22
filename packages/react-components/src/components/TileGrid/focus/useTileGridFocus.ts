import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FocusEventHandler, RefCallback, RefObject } from 'react';
import type { TileGridGeometryResult, TileGridItemRect } from '../geometry';
import { scrollToItem } from '../virtualization/scrollHelpers';
import { getNavigationTarget } from './navigation';
import type { TileGridNavigationKey } from './navigation';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Geometry and ownership facts required by the mounted focus controller. */
export interface TileGridFocusInput {
  /** Root scroll container, also the temporary focus fallback. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Cached layout, including offscreen navigation targets. */
  geometry: TileGridGeometryResult;
  /** Mounted window supplied by the existing virtualizer. */
  visibleItemRects: readonly TileGridItemRect[];
  /** Distinguishes layout/zoom changes from page append. */
  geometryKey: string;
  /** Canonical item-list identity. */
  itemList: readonly unknown[];
  /** Explicit filter-reset key, compared using Object.is. */
  scrollResetKey: unknown;
  /** Authoritative membership used only for initial visible entry. */
  selectedIds: ReadonlySet<string>;
  /** Eligibility preference for recovery, not a navigation exclusion. */
  isSelectable: (id: string) => boolean;
  /** Original native focus handlers forwarded once. */
  onFocus?: FocusEventHandler<HTMLDivElement>;
  /** Original native blur handler forwarded once. */
  onBlur?: FocusEventHandler<HTMLDivElement>;
}

/** Focus state and stable callbacks consumed by root, wrappers, and tab-order management. */
export interface TileGridFocusState {
  /** Active logical tile; undefined means the named-root entry. */
  activeId: string | undefined;
  /** Whether inline content currently owns physical focus. */
  entered: boolean;
  /** Root enters tab order only while no active wrapper is mounted. */
  rootTabIndex: 0 | -1;
  /** Returns a stable callback ref for each currently mounted item. */
  getItemRef: (id: string) => RefCallback<HTMLDivElement>;
  /** Returns the current entry wrapper, falling back to the root. */
  getEntry: () => HTMLElement | null;
  /** Moves to a spatial target and returns its ID without changing selection. */
  navigate: (id: string, key: TileGridNavigationKey) => string | undefined;
  /** Recovers lost physical focus after an independently removed consumer node. */
  recoverFocus: () => void;
  /** Tracks real inline focus without redirecting native control focus. */
  onFocus: FocusEventHandler<HTMLDivElement>;
  /** Cancels pending focus when the user intentionally leaves the grid. */
  onBlur: FocusEventHandler<HTMLDivElement>;
}

/** Tests actual viewport intersection, excluding overscan-only mounts. */
function visible(rect: TileGridItemRect, root: HTMLElement): boolean {
  return rect.y < root.scrollTop + root.clientHeight && rect.y + rect.height > root.scrollTop;
}

/**
 * Owns logical focus separately from selected membership and native input focus.
 *
 * Only mounted wrappers are registered. Offscreen keyboard requests use cached
 * geometry; connected overscan targets focus immediately after scrolling, while
 * absent targets complete after registration and post-anchor layout validation.
 */
export function useTileGridFocus(input: TileGridFocusInput): TileGridFocusState {
  const live = useRef(input);
  live.current = input;
  const [activeId, setActiveId] = useState<string>();
  const [entered, setEntered] = useState(false);
  const active = useRef<string | undefined>(undefined);
  const held = useRef(false);
  const mounted = useRef(false);
  const initialized = useRef(false);
  const pending = useRef<string | undefined>(undefined);
  const lastFocused = useRef<Element | null>(null);
  const lastRect = useRef<TileGridItemRect | undefined>(undefined);
  const focusEpoch = useRef(0);
  const nullBlur = useRef(false);
  const wrappers = useRef(new Map<string, HTMLDivElement>());
  const callbacks = useRef(new Map<string, RefCallback<HTMLDivElement>>());
  const previous = useRef({
    geometry: input.geometry,
    geometryKey: input.geometryKey,
    itemList: input.itemList,
    resetKey: input.scrollResetKey,
  });

  const activate = useCallback((id: string | undefined) => {
    active.current = id;
    setActiveId(id);
  }, []);
  const getEntry = useCallback(
    () =>
      (active.current === undefined ? undefined : wrappers.current.get(active.current)) ??
      live.current.rootRef.current,
    []
  );
  const leave = useCallback(() => {
    held.current = false;
    pending.current = undefined;
    nullBlur.current = false;
    focusEpoch.current++;
    setEntered(false);
  }, []);
  const recoverFocus = useCallback(() => {
    const root = live.current.rootRef.current;
    if (!root || !mounted.current || !held.current || nullBlur.current) return;
    const actual = root.ownerDocument.activeElement;
    if (actual && actual !== root.ownerDocument.body && !root.contains(actual)) {
      leave();
      return;
    }
    if (lastFocused.current && !lastFocused.current.isConnected) {
      getEntry()?.focus({ preventScroll: true });
    }
  }, [getEntry, leave]);

  const getItemRef = useCallback((id: string): RefCallback<HTMLDivElement> => {
    const existing = callbacks.current.get(id);
    if (existing) return existing;
    const callback: RefCallback<HTMLDivElement> = node => {
      if (node) {
        // Abandoned renders never attach. Cache only committed refs so retained
        // callbacks stay proportional to mounted wrappers, not attempted IDs.
        callbacks.current.set(id, callback);
        wrappers.current.set(id, node);
      } else {
        const oldNode = wrappers.current.get(id);
        const root = live.current.rootRef.current;
        const actual = root?.ownerDocument.activeElement;
        // Ref removal is early enough to bridge owned wrapper focus through the
        // root. Never use a later body focus alone as evidence of ownership.
        if (
          mounted.current &&
          held.current &&
          root &&
          oldNode &&
          ((actual && oldNode.contains(actual)) ||
            (actual === root.ownerDocument.body &&
              lastFocused.current &&
              oldNode.contains(lastFocused.current)))
        ) {
          root.focus({ preventScroll: true });
        }
        wrappers.current.delete(id);
        if (callbacks.current.get(id) === callback) callbacks.current.delete(id);
      }
    };
    return callback;
  }, []);

  const onFocus = useCallback<FocusEventHandler<HTMLDivElement>>(
    event => {
      live.current.onFocus?.(event);
      const root = event.currentTarget;
      if (!root.contains(event.target) || root.ownerDocument.activeElement !== event.target) return;
      held.current = true;
      nullBlur.current = false;
      focusEpoch.current++;
      lastFocused.current = event.target;
      setEntered(true);
      const wrapper = event.target.closest('[data-tile-grid-item]');
      const id = wrapper?.getAttribute('data-tile-grid-item');
      if (id != null && wrapper?.closest('[data-tile-grid-root]') === root) {
        if (pending.current !== id) pending.current = undefined;
        initialized.current = true;
        activate(id);
        lastRect.current = live.current.visibleItemRects.find(rect => rect.id === id);
      }
    },
    [activate]
  );

  const onBlur = useCallback<FocusEventHandler<HTMLDivElement>>(
    event => {
      live.current.onBlur?.(event);
      const root = event.currentTarget;
      const NodeType = root.ownerDocument.defaultView?.Node;
      if (NodeType && event.relatedTarget instanceof NodeType) {
        if (!root.contains(event.relatedTarget)) leave();
        return;
      }
      // A missing destination can mean removal or deliberate blur. Wait until
      // native removal completes, and discard the check if another focus arrived.
      const blurred = lastFocused.current;
      const epoch = ++focusEpoch.current;
      nullBlur.current = true;
      queueMicrotask(() => {
        if (!mounted.current || epoch !== focusEpoch.current) return;
        nullBlur.current = false;
        if (blurred && !blurred.isConnected) recoverFocus();
        else leave();
      });
    },
    [leave, recoverFocus]
  );

  const navigate = useCallback(
    (id: string, key: TileGridNavigationKey): string | undefined => {
      const current = live.current;
      const root = current.rootRef.current;
      const target = getNavigationTarget(current.geometry.itemRects, id, key);
      if (!root || target === undefined || target === id) return target;
      const rect = current.geometry.itemRects.find(item => item.id === target);
      if (!rect) return undefined;
      activate(target);
      lastRect.current = rect;
      const node = wrappers.current.get(target);
      pending.current = node ? undefined : target;
      if (!visible(rect, root)) scrollToItem(root, current.geometry, target);
      if (node?.isConnected && held.current) node.focus({ preventScroll: true });
      return target;
    },
    [activate]
  );

  useIsomorphicLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      held.current = false;
      pending.current = undefined;
      focusEpoch.current++;
      wrappers.current.clear();
      callbacks.current.clear();
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = input.rootRef.current;
    if (!root) return;
    const old = previous.current;
    const reset = !Object.is(old.resetKey, input.scrollResetKey);
    const layoutChanged =
      old.geometryKey !== input.geometryKey ||
      (old.geometry !== input.geometry && old.itemList === input.itemList);
    previous.current = {
      geometry: input.geometry,
      geometryKey: input.geometryKey,
      itemList: input.itemList,
      resetKey: input.scrollResetKey,
    };
    const recoveryChanged = reset || layoutChanged || old.itemList !== input.itemList;
    // Anchor restoration has already updated scrollTop, but the virtualizer can
    // still expose its previous window. Query cached geometry for recovery only;
    // ordinary scroll renders continue to examine just the mounted window.
    const viewport = recoveryChanged
      ? input.geometry
          .itemsInRange(root.scrollTop, root.scrollTop + root.clientHeight)
          .flatMap(index => {
            const rect = input.geometry.itemRects[index];
            return rect ? [rect] : [];
          })
      : input.visibleItemRects
          .filter(rect => visible(rect, root))
          .sort((a, b) => a.index - b.index);
    const oldId = active.current;
    const remembered =
      old.geometry === input.geometry &&
      lastRect.current &&
      lastRect.current.id === oldId &&
      visible(lastRect.current, root)
        ? lastRect.current
        : undefined;
    const currentRect =
      (recoveryChanged ? input.geometry.itemRects : input.visibleItemRects).find(
        rect => rect.id === oldId
      ) ?? remembered;
    const actual = root.ownerDocument.activeElement;
    if (held.current && actual && actual !== root.ownerDocument.body && !root.contains(actual))
      leave();
    if (reset) pending.current = undefined;
    if (pending.current !== undefined) {
      const id = pending.current;
      const rect =
        old.geometry === input.geometry && lastRect.current?.id === id
          ? lastRect.current
          : input.geometry.itemRects.find(item => item.id === id);
      if (
        id === active.current &&
        rect &&
        input.geometry.offsetForItem(id) !== undefined &&
        visible(rect, root)
      ) {
        lastRect.current = rect;
        const node = wrappers.current.get(id);
        if (node?.isConnected) {
          pending.current = undefined;
          if (held.current) node.focus({ preventScroll: true });
        } else if (held.current && actual !== root) {
          root.focus({ preventScroll: true });
        }
        return;
      }
      pending.current = undefined;
    }

    const currentVisible = currentRect && visible(currentRect, root);
    let target = currentRect;
    if (!initialized.current && viewport.length) {
      target = viewport.find(rect => input.selectedIds.has(rect.id)) ?? viewport[0];
      initialized.current = true;
    } else if (reset && !currentVisible) {
      target = viewport.find(rect => input.isSelectable(rect.id)) ?? viewport[0];
    } else if (layoutChanged && !currentVisible) {
      const origin = input.geometry.itemRects.find(rect => rect.id === oldId) ?? lastRect.current;
      // Compare centers in the resulting layout; normalized indexes resolve ties.
      target = origin
        ? viewport.reduce<TileGridItemRect | undefined>((best, rect) => {
            if (!best) return rect;
            const distance = (candidate: TileGridItemRect) =>
              (candidate.x + candidate.width / 2 - origin.x - origin.width / 2) ** 2 +
              (candidate.y + candidate.height / 2 - origin.y - origin.height / 2) ** 2;
            return distance(rect) < distance(best) ? rect : best;
          }, undefined)
        : (viewport.find(rect => input.isSelectable(rect.id)) ?? viewport[0]);
    } else if (!currentRect || (!wrappers.current.has(currentRect.id) && !currentVisible)) {
      target = viewport.find(rect => input.isSelectable(rect.id)) ?? viewport[0];
    }

    const nextId = target?.id;
    if (nextId !== oldId) activate(nextId);
    if (target) lastRect.current = target;
    const targetNode = nextId === undefined ? root : wrappers.current.get(nextId);
    if (target && !targetNode?.isConnected && visible(target, root)) pending.current = target.id;
    if (held.current && (nextId !== oldId || actual === root)) {
      (targetNode ?? root).focus({ preventScroll: true });
    } else {
      recoverFocus();
    }
  });

  return {
    activeId,
    entered,
    rootTabIndex: input.visibleItemRects.some(rect => rect.id === activeId) ? -1 : 0,
    getItemRef,
    getEntry,
    navigate,
    recoverFocus,
    onFocus,
    onBlur,
  };
}
