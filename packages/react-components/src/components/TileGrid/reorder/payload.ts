import type { TileGridReorderArgs } from '../TileGrid.types';

/** Clamps a value into the inclusive range from zero to `max`. */
function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), max);
}

/**
 * Converts an insertion boundary into the final index after removing the item.
 *
 * A boundary is a slot between items, from 0 through the item count. Removing
 * the source first shifts later slots down by one, so a forward move uses
 * `boundary - 1`. The result always names a real item index.
 */
export function resolveToIndex(boundary: number, fromIndex: number, itemCount: number): number {
  if (itemCount <= 0) return 0;

  const from = clamp(fromIndex, itemCount - 1);
  const slot = clamp(boundary, itemCount);
  const toIndex = from < slot ? slot - 1 : slot;

  return clamp(toIndex, itemCount - 1);
}

/**
 * Returns a new ID order with one item moved from `fromIndex` to `toIndex`.
 *
 * The input array is never mutated. Out-of-range indexes are clamped so a
 * stale callback cannot throw during a drag.
 */
export function moveId(
  ids: readonly string[],
  fromIndex: number,
  toIndex: number
): readonly string[] {
  if (ids.length === 0) return [];

  const from = clamp(fromIndex, ids.length - 1);
  const to = clamp(toIndex, ids.length - 1);
  const next = [...ids];
  const [moved] = next.splice(from, 1);

  if (moved === undefined) return ids;

  next.splice(to, 0, moved);
  return next;
}

/**
 * Builds the public reorder payload for a changed order.
 *
 * Returns `undefined` when the move would not change the order, which keeps
 * no-op drops and boundary actions silent.
 */
export function buildReorderArgs(
  ids: readonly string[],
  fromIndex: number,
  toIndex: number
): TileGridReorderArgs | undefined {
  if (ids.length === 0 || fromIndex === toIndex) return undefined;

  const from = clamp(fromIndex, ids.length - 1);
  const to = clamp(toIndex, ids.length - 1);
  if (from === to) return undefined;

  const itemId = ids[from];
  if (itemId === undefined) return undefined;

  return { itemId, fromIndex: from, toIndex: to, orderedIds: moveId(ids, from, to) };
}
