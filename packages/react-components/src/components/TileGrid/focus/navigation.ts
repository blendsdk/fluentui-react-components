import type { TileGridItemRect } from '../geometry';

/** Wrapper keys that move logical focus through cached item geometry. */
export type TileGridNavigationKey =
  'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Home' | 'End' | 'PageUp' | 'PageDown';

/** Recognizes only grid navigation keys, leaving other browser shortcuts alone. */
export function isNavigationKey(key: string): key is TileGridNavigationKey {
  return (
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'Home' ||
    key === 'End' ||
    key === 'PageUp' ||
    key === 'PageDown'
  );
}

/** Numeric priorities, compared left to right; smaller values win. */
type Score = readonly [number, number, number, number, number];

/** Returns whether the candidate improves the first unequal ranking priority. */
function precedes(candidate: Score, current: Score): boolean {
  for (let index = 0; index < candidate.length; index++) {
    if (candidate[index] !== current[index]) return candidate[index] < current[index];
  }
  return false;
}

/** Length shared by two intervals; touching edges do not count as overlap. */
function overlap(start: number, size: number, otherStart: number, otherSize: number): number {
  return Math.max(0, Math.min(start + size, otherStart + otherSize) - Math.max(start, otherStart));
}

/**
 * Chooses a deterministic spatial neighbor without reading or measuring DOM.
 *
 * Horizontal moves prioritize vertical overlap before edge gap. Vertical moves
 * prefer horizontally overlapping candidates, then gap and overlap; otherwise
 * they use the nearest center. Normalized item indexes resolve exact ties.
 * Page keys move one adjacent visual row. Boundaries retain the current ID;
 * unknown active IDs and empty geometry return undefined for caller recovery.
 */
export function getNavigationTarget(
  rectangles: readonly TileGridItemRect[],
  activeId: string,
  key: TileGridNavigationKey
): string | undefined {
  const active = rectangles.find(rect => rect.id === activeId);
  if (!active) return undefined;
  if (key === 'Home' || key === 'End') {
    return rectangles.reduce(
      (best, rect) =>
        (key === 'Home' ? rect.index < best.index : rect.index > best.index) ? rect : best,
      active
    ).id;
  }

  const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
  const backward = key === 'ArrowLeft' || key === 'ArrowUp' || key === 'PageUp';
  const centerX = active.x + active.width / 2;
  const centerY = active.y + active.height / 2;
  let bestId = activeId;
  let bestScore: Score | undefined;
  for (const rect of rectangles) {
    const dx = rect.x + rect.width / 2 - centerX;
    const dy = rect.y + rect.height / 2 - centerY;
    const direction = horizontal ? dx : dy;
    if (backward ? direction >= 0 : direction <= 0) continue;
    const distance = dx * dx + dy * dy;
    const crossOverlap = horizontal
      ? overlap(active.y, active.height, rect.y, rect.height)
      : overlap(active.x, active.width, rect.x, rect.width);
    const gap = horizontal
      ? Math.max(0, backward ? active.x - rect.x - rect.width : rect.x - active.x - active.width)
      : Math.max(0, backward ? active.y - rect.y - rect.height : rect.y - active.y - active.height);
    // Negating overlap makes larger intersections sort before smaller ones.
    const score: Score = horizontal
      ? [0, -crossOverlap, gap, distance, rect.index]
      : crossOverlap > 0
        ? [0, gap, -crossOverlap, distance, rect.index]
        : [1, 0, 0, distance, rect.index];
    if (!bestScore || precedes(score, bestScore)) {
      bestId = rect.id;
      bestScore = score;
    }
  }
  return bestId;
}
