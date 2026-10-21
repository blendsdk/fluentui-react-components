import type { MarqueeRect } from './types';

/** A rectangle-shaped item from the geometry port. */
export type MarqueeItemRect = Pick<MarqueeRect, 'x' | 'y' | 'width' | 'height'>;

/** Returns a normalized rectangle from two corners. */
export function normalizeRect(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): MarqueeRect {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  };
}

/**
 * Returns true when two axis-aligned rectangles overlap.
 *
 * Touching edges do not count as an intersection; at least one pixel of area
 * must be shared.
 */
export function rectsIntersect(left: MarqueeItemRect, right: MarqueeRect): boolean {
  return (
    left.x < right.x + right.width &&
    left.x + left.width > right.x &&
    left.y < right.y + right.height &&
    left.y + left.height > right.y
  );
}
