import { useCallback, useRef, useState } from 'react';

/**
 * Invisible suffix added only when the same announcement repeats.
 *
 * The extra character creates a DOM mutation so a screen reader announces the
 * repeated sentence again, without changing the visible or spoken text.
 */
const REPEAT_SUFFIX = '\u200B';

/**
 * Owns the single polite announcement message for a grid.
 *
 * Selection and reorder events write to the same channel, so the latest event
 * replaces the previous message instead of opening a second live region.
 * Different messages replace each other synchronously. Repeating the same
 * sentence alternates an invisible suffix, which keeps the text intact while
 * still mutating the live region.
 */
export function useLiveAnnouncement(): readonly [string, (message: string) => void] {
  const [message, setMessage] = useState('');
  const lastRef = useRef('');
  const repeatRef = useRef(false);

  const announce = useCallback((next: string) => {
    if (next !== lastRef.current) {
      lastRef.current = next;
      repeatRef.current = false;
      setMessage(next);
      return;
    }

    repeatRef.current = !repeatRef.current;
    setMessage(repeatRef.current ? `${next}${REPEAT_SUFFIX}` : next);
  }, []);

  return [message, announce] as const;
}
