import { useCallback, useRef, useState } from 'react';
import { devWarn } from '../devWarnings';
import type { GridSelection, GridSelectionMode, GridSelectionOptions } from './types';
import {
  addSelection,
  areSetsEqual,
  clearSelection,
  deselectSelection,
  rangeSelection,
  selectAllSelection,
  selectOnlySelection,
} from './transitions';

const EMPTY_SELECTION: ReadonlySet<string> = new Set<string>();
const defaultSelectable = (): boolean => true;

/** Resolves the controlled or uncontrolled source set for a selection mode. */
function effectiveSelection(
  selectedIds: ReadonlySet<string>,
  mode: GridSelectionMode
): ReadonlySet<string> {
  if (mode !== 'single' || selectedIds.size <= 1) {
    return selectedIds;
  }

  const [first] = selectedIds;
  return first === undefined ? EMPTY_SELECTION : new Set([first]);
}

/** Removes duplicates while preserving insertion order. */
function uniqueIds(ids: Iterable<string> | undefined): string[] {
  return ids ? [...new Set(ids)] : [];
}

/**
 * Stores controlled-first selection state and exposes the operations used by
 * the public selection props, click mapping, and imperative handle.
 *
 * The callback and selectable predicate are read through refs so inline
 * application callbacks do not change the store methods. All methods are
 * stable for the life of the component.
 */
export function useGridSelection({
  mode,
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  isSelectable,
}: GridSelectionOptions): GridSelection {
  const [internalSelected, setInternalSelected] = useState<ReadonlySet<string>>(() => {
    const seed = uniqueIds(defaultSelectedIds);

    if (mode === 'single' && seed.length > 1) {
      devWarn(
        'tile-grid-single-seed',
        'TileGrid single selection uses only the first defaultSelectedId.'
      );
    }

    return effectiveSelection(new Set(seed), mode);
  });
  const [anchorId, setAnchorId] = useState<string | undefined>(undefined);
  const controlled = selectedIds !== undefined;
  const currentSelection = controlled
    ? effectiveSelection(selectedIds, mode)
    : effectiveSelection(internalSelected, mode);
  const currentRef = useRef<ReadonlySet<string>>(currentSelection);
  const anchorRef = useRef<string | undefined>(undefined);
  const controlledRef = useRef(controlled);
  const modeRef = useRef(mode);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const isSelectableRef = useRef(isSelectable ?? defaultSelectable);

  currentRef.current = currentSelection;
  controlledRef.current = controlled;
  modeRef.current = mode;
  onSelectionChangeRef.current = onSelectionChange;
  isSelectableRef.current = isSelectable ?? defaultSelectable;

  const updateAnchor = useCallback((nextAnchor: string | undefined): void => {
    anchorRef.current = nextAnchor;
    setAnchorId(nextAnchor);
  }, []);

  const commit = useCallback((next: ReadonlySet<string>): void => {
    if (areSetsEqual(currentRef.current, next)) {
      return;
    }

    currentRef.current = next;

    if (!controlledRef.current) {
      setInternalSelected(next);
    }

    onSelectionChangeRef.current?.(next);
  }, []);

  const selectOnly = useCallback(
    (id: string): void => {
      if (modeRef.current === 'none' || !isSelectableRef.current(id)) {
        return;
      }

      updateAnchor(id);
      commit(selectOnlySelection(id));
    },
    [commit, updateAnchor]
  );

  const select = useCallback(
    (id: string): void => {
      if (modeRef.current === 'none' || !isSelectableRef.current(id)) {
        return;
      }

      updateAnchor(id);

      if (modeRef.current === 'single') {
        commit(selectOnlySelection(id));
        return;
      }

      commit(addSelection(currentRef.current, id));
    },
    [commit, updateAnchor]
  );

  const deselect = useCallback(
    (id: string): void => {
      if (modeRef.current === 'none') {
        return;
      }

      commit(deselectSelection(currentRef.current, id));

      if (modeRef.current === 'single') {
        updateAnchor(undefined);
      }
    },
    [commit, updateAnchor]
  );

  const toggle = useCallback(
    (id: string): void => {
      if (modeRef.current === 'none' || !isSelectableRef.current(id)) {
        return;
      }

      if (modeRef.current === 'single') {
        if (!currentRef.current.has(id)) {
          select(id);
        }
        return;
      }

      if (currentRef.current.has(id)) {
        commit(deselectSelection(currentRef.current, id));
        return;
      }

      updateAnchor(id);
      commit(addSelection(currentRef.current, id));
    },
    [commit, select, updateAnchor]
  );

  const selectRange = useCallback(
    (targetId: string, currentIds: readonly string[]): void => {
      if (modeRef.current === 'none') {
        return;
      }

      if (modeRef.current === 'single') {
        select(targetId);
        return;
      }

      if (!isSelectableRef.current(targetId)) {
        return;
      }

      const currentAnchor = anchorRef.current;

      if (currentAnchor === undefined || !currentIds.includes(currentAnchor)) {
        selectOnly(targetId);
        return;
      }

      commit(
        rangeSelection(
          currentRef.current,
          currentAnchor,
          targetId,
          currentIds,
          isSelectableRef.current
        )
      );
    },
    [commit, select, selectOnly]
  );

  const selectAll = useCallback(
    (currentIds: readonly string[]): void => {
      if (modeRef.current !== 'multiselect') {
        devWarn(
          `tile-grid-select-all-${modeRef.current}`,
          'TileGrid selectAll is available only in multiselect mode.'
        );
        return;
      }

      commit(selectAllSelection(currentRef.current, currentIds, isSelectableRef.current));
    },
    [commit]
  );

  const clear = useCallback((): void => {
    commit(clearSelection(currentRef.current));
    updateAnchor(undefined);
  }, [commit, updateAnchor]);

  const isSelected = useCallback((id: string): boolean => currentRef.current.has(id), []);

  return {
    selectedIds: currentSelection,
    anchorId,
    isSelected,
    select,
    selectOnly,
    deselect,
    toggle,
    selectRange,
    selectAll,
    clear,
  };
}
