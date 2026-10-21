import { useEffect, useRef, useState } from 'react';
import type { TileGridStrings } from '../TileGrid.types';

/** Default complete message; applications can replace the formatter for localization. */
function formatSelectionCount(selected: number, total: number): string {
  return `${selected.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} selected`;
}

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
  formatter: TileGridStrings['selectionCount'] = formatSelectionCount
): string {
  const previousCount = useRef(count);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (previousCount.current === count) return;
    previousCount.current = count;
    setMessage(formatter(count, total));
  }, [count, total, formatter]);
  return message;
}
