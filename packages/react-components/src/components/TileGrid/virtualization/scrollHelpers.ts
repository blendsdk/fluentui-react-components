import type { TileGridGeometryResult } from '../geometry';

/**
 * Returns the largest valid scroll offset for a scroll container.
 *
 * A container with no overflow returns zero. The result is always finite and
 * non-negative.
 */
export function maxScroll(root: HTMLElement): number {
  return Math.max(0, root.scrollHeight - root.clientHeight);
}

/**
 * Scrolls a container to a finite offset, clamped to its scrollable range.
 *
 * Non-finite offsets are ignored so a bad callback cannot reset the scroll
 * position unexpectedly.
 */
export function scrollToOffset(root: HTMLElement, offset: number): void {
  if (!Number.isFinite(offset)) {
    return;
  }

  root.scrollTop = Math.min(Math.max(offset, 0), maxScroll(root));
}

/**
 * Scrolls to an item index using the geometry rectangle.
 *
 * Negative, fractional, or out-of-range indexes are ignored.
 */
export function scrollToIndex(
  root: HTMLElement,
  geometry: TileGridGeometryResult,
  index: number
): void {
  if (!Number.isInteger(index) || index < 0) {
    return;
  }

  const rect = geometry.itemRects[index];

  if (!rect) {
    return;
  }

  scrollToOffset(root, rect.y);
}

/**
 * Scrolls to an item ID using the geometry lookup.
 *
 * Unknown IDs are ignored.
 */
export function scrollToItem(
  root: HTMLElement,
  geometry: TileGridGeometryResult,
  id: string
): void {
  const offset = geometry.offsetForItem(id);

  if (offset === undefined) {
    return;
  }

  scrollToOffset(root, offset);
}

/**
 * Scrolls to the first selected item in the current item order.
 *
 * Hidden selected IDs are ignored. When no current item is selected, the
 * scroll position does not change.
 */
export function scrollToSelected<T>(
  root: HTMLElement,
  geometry: TileGridGeometryResult,
  selectedIds: ReadonlySet<string>,
  items: readonly T[],
  getItemId: (item: T) => string
): void {
  for (const item of items) {
    const id = getItemId(item);

    if (selectedIds.has(id)) {
      scrollToItem(root, geometry, id);
      return;
    }
  }
}
