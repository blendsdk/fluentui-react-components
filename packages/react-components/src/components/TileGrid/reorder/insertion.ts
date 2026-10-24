import type { TileGridItemRect } from '../geometry';
import type { FindInsertionInput, TileGridInsertion } from './types';

/**
 * Returns the squared distance from a point to the nearest point on a rectangle.
 *
 * A pointer inside the rectangle has distance zero, so an item under the
 * pointer always wins over a nearby item in a gap.
 */
function distanceSquared(x: number, y: number, rect: TileGridItemRect): number {
  const dx = x < rect.x ? rect.x - x : x > rect.x + rect.width ? x - (rect.x + rect.width) : 0;
  const dy = y < rect.y ? rect.y - y : y > rect.y + rect.height ? y - (rect.y + rect.height) : 0;
  return dx * dx + dy * dy;
}

/**
 * Resolves the insertion boundary nearest to a pointer.
 *
 * Row-based layouts compare the pointer with the horizontal centre of the
 * nearest item; masonry compares it with the vertical centre because its
 * reading order runs down a lane. The boundary is clamped to the collection,
 * so a pointer outside the content still resolves to a usable position.
 */
export function findInsertion({
  x,
  y,
  rects,
  layout,
  itemCount,
}: FindInsertionInput): TileGridInsertion | undefined {
  if (itemCount <= 0 || rects.length === 0) return undefined;

  let nearest: TileGridItemRect | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const rect of rects) {
    const distance = distanceSquared(x, y, rect);
    if (
      distance < nearestDistance ||
      (distance === nearestDistance && nearest !== undefined && rect.index < nearest.index)
    ) {
      nearest = rect;
      nearestDistance = distance;
    }
  }

  if (nearest === undefined) return undefined;

  const edge =
    layout === 'masonry'
      ? y < nearest.y + nearest.height / 2
        ? 'before'
        : 'after'
      : x < nearest.x + nearest.width / 2
        ? 'before'
        : 'after';

  const boundary = Math.min(Math.max(nearest.index + (edge === 'after' ? 1 : 0), 0), itemCount);

  return { boundary, edge, index: nearest.index, rect: nearest };
}
