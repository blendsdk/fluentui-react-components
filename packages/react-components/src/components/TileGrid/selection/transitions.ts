/** Pure set transitions used by the selection store and its performance test. */

/** Returns true when both sets contain exactly the same IDs. */
export function areSetsEqual(left: ReadonlySet<string>, right: ReadonlySet<string>): boolean {
  if (left === right) {
    return true;
  }

  if (left.size !== right.size) {
    return false;
  }

  for (const id of left) {
    if (!right.has(id)) {
      return false;
    }
  }

  return true;
}

/** Adds one ID, returning the same set when it is already present. */
export function addSelection(current: ReadonlySet<string>, id: string): ReadonlySet<string> {
  if (current.has(id)) {
    return current;
  }

  const next = new Set(current);
  next.add(id);
  return next;
}

/** Replaces the set with one ID, returning the same set when already equal. */
export function selectOnlySelection(id: string): ReadonlySet<string> {
  return new Set([id]);
}

/** Removes one ID, returning the same set when it is absent. */
export function deselectSelection(current: ReadonlySet<string>, id: string): ReadonlySet<string> {
  if (!current.has(id)) {
    return current;
  }

  const next = new Set(current);
  next.delete(id);
  return next;
}

/** Removes an ID when present, adds it when absent. */
export function toggleSelection(current: ReadonlySet<string>, id: string): ReadonlySet<string> {
  return current.has(id) ? deselectSelection(current, id) : addSelection(current, id);
}

/**
 * Adds the inclusive anchor-to-target range in current item order.
 *
 * Selections outside the range, including hidden IDs, are preserved. When the
 * anchor or target is not in the current item list the set is unchanged.
 */
export function rangeSelection(
  current: ReadonlySet<string>,
  anchorId: string,
  targetId: string,
  currentIds: readonly string[],
  isSelectable: (id: string) => boolean = () => true
): ReadonlySet<string> {
  const anchorIndex = currentIds.indexOf(anchorId);
  const targetIndex = currentIds.indexOf(targetId);

  if (anchorIndex < 0 || targetIndex < 0) {
    return current;
  }

  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  const next = new Set(current);

  for (let index = start; index <= end; index += 1) {
    const id = currentIds[index];

    if (isSelectable(id)) {
      next.add(id);
    }
  }

  return next.size === current.size ? current : next;
}

/** Adds every selectable current item ID, preserving hidden IDs. */
export function selectAllSelection(
  current: ReadonlySet<string>,
  currentIds: readonly string[],
  isSelectable: (id: string) => boolean = () => true
): ReadonlySet<string> {
  const next = new Set(current);

  for (const id of currentIds) {
    if (isSelectable(id)) {
      next.add(id);
    }
  }

  return next.size === current.size ? current : next;
}

/** Clears every ID, returning the same empty set when already empty. */
export function clearSelection(current: ReadonlySet<string>): ReadonlySet<string> {
  return current.size === 0 ? current : new Set<string>();
}
