import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  MouseEvent,
  ReactNode,
  RefObject,
} from 'react';
import { computeGeometry, normalizeGap, normalizeItems, normalizeTileSize } from './geometry';
import type { TileGridGeometryResult, TileGridItemRect } from './geometry';
import type { TileGridItemRenderArgs, TileGridProps } from './TileGrid.types';
import { devWarn } from './devWarnings';
import { applyItemClick, useGridSelection } from './selection';
import { useTileGridStyles } from './useTileGridStyles.styles';
import { useTileGridVirtualizer } from './virtualization/useTileGridVirtualizer';
import { useAnchorPreservation } from './virtualization/useAnchorPreservation';
import {
  scrollToIndex as scrollRootToIndex,
  scrollToItem as scrollRootToItem,
  scrollToOffset as scrollRootToOffset,
  scrollToSelected as scrollRootToSelected,
} from './virtualization/scrollHelpers';
import { useContainerSize } from './virtualization/useContainerSize';

/** Resolved render state shared by the component shell and the pure renderer. */
export interface TileGridState<T> {
  /** Ref attached to the scroll container. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Native `div` props that pass through to the scroll container. */
  rootProps: Omit<
    ComponentPropsWithoutRef<'div'>,
    'children' | 'role' | 'aria-label' | 'dangerouslySetInnerHTML'
  >;
  /** Caller class name, merged by the renderer. */
  className?: string;
  /** Caller style, merged by the renderer. */
  style?: CSSProperties;
  /** Griffel classes resolved once by the state hook. */
  classes: ReturnType<typeof useTileGridStyles>;
  /** Accessible list name from the `ariaLabel` prop. */
  ariaLabel?: string;
  /** Items after duplicate-ID normalization. */
  uniqueItems: readonly T[];
  /** Computed layout and query helpers. */
  geometry: TileGridGeometryResult;
  /** Item rectangles in the currently mounted virtual window. */
  visibleItemRects: readonly TileGridItemRect[];
  /** Normalized tile size passed to the renderer. */
  tileSize: number;
  /** Whether there is at least one normalized item. */
  hasItems: boolean;
  /** Final empty-state message. */
  emptyMessage: string;
  /** Caller empty-state renderer. */
  renderEmpty?: () => ReactNode;
  /** Caller tile-content renderer. */
  renderItem: (args: TileGridItemRenderArgs<T>) => ReactNode;
  /** Accessible item label. */
  getItemLabel: (item: T) => string;
  /** Scrolls to an item ID; unknown IDs are ignored. */
  scrollToItem: (id: string) => void;
  /** Scrolls to an item index; invalid indexes are ignored. */
  scrollToIndex: (index: number) => void;
  /** Scrolls to a clamped offset; non-finite offsets are ignored. */
  scrollToOffset: (offset: number) => void;
  /** Returns true when the effective selection contains the ID. */
  isSelected: (id: string) => boolean;
  /** Maps an item wrapper click to the current selection mode. */
  onItemClick: (event: MouseEvent<HTMLElement>, id: string) => void;
  /** Selects every current item in multiselect mode. */
  selectAll: () => void;
  /** Clears every selected ID, including hidden IDs. */
  clearSelection: () => void;
  /** Scrolls to the first selected item in current item order. */
  scrollToSelected: () => void;
}

/**
 * Resolves TileGrid props into geometry, the mounted virtual window, and
 * render state.
 *
 * This hook owns normalization, defaults, measurement, geometry, anchor
 * preservation, and development warnings. The virtualizer only selects the
 * indexes to mount; the geometry rectangles remain the rendered positions.
 */
export function useTileGrid<T>(props: TileGridProps<T>): TileGridState<T> {
  const {
    items,
    getItemId,
    getItemLabel,
    getItemAspectRatio,
    getItemSpan,
    renderItem,
    renderEmpty,
    layout = 'fixed',
    tileSize = 160,
    minTileSize = 120,
    maxTileSize = 320,
    tileAspectRatio = 1,
    fallbackAspectRatio = 1,
    columns,
    gap = 8,
    ariaLabel,
    strings,
    selectionMode = 'none',
    selectedIds,
    defaultSelectedIds,
    onSelectionChange,
    className,
    style,
    ...rootProps
  } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const classes = useTileGridStyles();
  const size = useContainerSize(rootRef);
  const normalized = useMemo(() => normalizeItems(items, getItemId), [items, getItemId]);
  const resolvedTileSize = normalizeTileSize(tileSize, minTileSize, maxTileSize);
  const resolvedGap = normalizeGap(gap);
  const emptyMessage = strings?.emptyMessage?.trim() ? strings.emptyMessage.trim() : 'No items';
  const ariaLabelledBy = rootProps['aria-labelledby'];

  const geometry = useMemo(
    () =>
      computeGeometry({
        items: normalized.items,
        getItemId,
        getItemAspectRatio,
        getItemSpan,
        layout,
        columns,
        tileSize: resolvedTileSize,
        tileAspectRatio,
        fallbackAspectRatio,
        gap: resolvedGap,
        containerWidth: size.width,
      }),
    [
      normalized.items,
      getItemId,
      getItemAspectRatio,
      getItemSpan,
      layout,
      columns,
      resolvedTileSize,
      tileAspectRatio,
      fallbackAspectRatio,
      resolvedGap,
      size.width,
    ]
  );

  // Anchor restoration reacts only to layout inputs that change item
  // positions. Container width and item values are intentionally excluded:
  // a resize recomputes geometry but must not restore the anchor, while an
  // item-list change is detected by the normalized array reference.
  const geometryKey = useMemo(
    () =>
      JSON.stringify([
        layout,
        resolvedTileSize,
        columns ?? null,
        resolvedGap,
        tileAspectRatio,
        fallbackAspectRatio,
      ]),
    [layout, resolvedTileSize, columns, resolvedGap, tileAspectRatio, fallbackAspectRatio]
  );

  const virtualWindow = useTileGridVirtualizer({
    layout,
    geometry,
    rootRef,
    gap: resolvedGap,
  });

  useAnchorPreservation({ rootRef, geometry, geometryKey, itemList: normalized.items });

  const visibleItemRects = virtualWindow.itemIndexes.flatMap(index => {
    const rect = geometry.itemRects[index];
    return rect ? [rect] : [];
  });

  const currentIds = useMemo(() => normalized.items.map(getItemId), [normalized.items, getItemId]);
  const selection = useGridSelection({
    mode: selectionMode,
    selectedIds,
    defaultSelectedIds,
    onSelectionChange,
  });
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const onItemClick = useCallback(
    (event: MouseEvent<HTMLElement>, id: string) => {
      applyItemClick({
        event,
        id,
        mode: selectionMode,
        currentIds,
        selection: selectionRef.current,
      });
    },
    [currentIds, selectionMode]
  );

  const selectAll = useCallback(() => {
    selectionRef.current.selectAll(currentIds);
  }, [currentIds]);

  const clearSelection = useCallback(() => {
    selectionRef.current.clear();
  }, []);

  const scrollToSelected = useCallback(() => {
    const root = rootRef.current;

    if (root) {
      scrollRootToSelected(
        root,
        geometry,
        selectionRef.current.selectedIds,
        normalized.items,
        getItemId
      );
    }
  }, [geometry, normalized.items, getItemId]);

  const scrollToItem = useCallback(
    (id: string) => {
      const root = rootRef.current;
      if (root) {
        scrollRootToItem(root, geometry, id);
      }
    },
    [geometry]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const root = rootRef.current;
      if (root) {
        scrollRootToIndex(root, geometry, index);
      }
    },
    [geometry]
  );

  const scrollToOffset = useCallback((offset: number) => {
    const root = rootRef.current;
    if (root) {
      scrollRootToOffset(root, offset);
    }
  }, []);

  useEffect(() => {
    if (normalized.duplicateIds.length > 0) {
      devWarn('tile-grid-duplicate-ids', 'TileGrid ignored duplicate item IDs.');
    }

    if (minTileSize > maxTileSize) {
      devWarn(
        'tile-grid-size-bounds',
        'TileGrid received minTileSize greater than maxTileSize; using maxTileSize.'
      );
    }

    if (layout === 'justified' && columns !== undefined) {
      devWarn('tile-grid-justified-columns', 'TileGrid ignores columns for the justified layout.');
    }

    if (!ariaLabel && !ariaLabelledBy) {
      devWarn(
        'tile-grid-accessible-name',
        'TileGrid needs ariaLabel or aria-labelledby for an accessible list name.'
      );
    }
  }, [
    normalized.duplicateIds.length,
    minTileSize,
    maxTileSize,
    layout,
    columns,
    ariaLabel,
    ariaLabelledBy,
  ]);

  return {
    rootRef,
    rootProps,
    className,
    style,
    classes,
    ariaLabel,
    uniqueItems: normalized.items,
    geometry,
    visibleItemRects,
    tileSize: resolvedTileSize,
    hasItems: normalized.items.length > 0,
    emptyMessage,
    renderEmpty,
    renderItem,
    getItemLabel,
    scrollToItem,
    scrollToIndex,
    scrollToOffset,
    isSelected: selection.isSelected,
    onItemClick,
    selectAll,
    clearSelection,
    scrollToSelected,
  };
}
