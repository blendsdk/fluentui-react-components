import { useEffect, useRef } from 'react';
import { defaultTileGridStrings } from '../strings';
import type { TileGridStrings } from '../TileGrid.types';

/**
 * Announces effective committed count changes after the initial render.
 *
 * Equal-count replacements and formatter/total-only changes leave the previous
 * message alone. The previous count is advanced before formatting so StrictMode
 * effect replay cannot format or announce the same transition twice.
 */
export function useSelectionAnnouncement(
  count: number,
  total: number,
  formatter: TileGridStrings['selectionCount'] = defaultTileGridStrings.selectionCount,
  announce: (message: string) => void
): void {
  const previousCount = useRef(count);

  useEffect(() => {
    if (previousCount.current === count) return;
    previousCount.current = count;
    announce(formatter(count, total));
  }, [count, total, formatter, announce]);
}
