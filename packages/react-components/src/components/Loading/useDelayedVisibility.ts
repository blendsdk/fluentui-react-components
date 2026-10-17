import { useEffect, useRef, useState } from 'react';

/**
 * Turns a caller-supplied delay into a safe timer duration.
 *
 * Negative numbers, `NaN` and `Infinity` cannot be scheduled meaningfully;
 * treating them as zero keeps the loader responsive instead of silently
 * never appearing.
 */
function normalizeDelay(delay: number): number {
  return Number.isFinite(delay) && delay > 0 ? delay : 0;
}

/**
 * Reports whether an operation has stayed active for the requested delay.
 *
 * The first render is always `false`, including on the server. An effect then
 * reveals the value immediately for `delay <= 0` or after the timer elapses.
 * This one-effect reveal is deliberate: it lets a live region mount before
 * its text appears, so assistive technology hears a text change instead of a
 * newly inserted region, and it avoids a server/client hydration mismatch.
 *
 * The delay is read when an operation becomes active. Changing the delay
 * while it is already active applies to the next activation: an in-flight
 * timer is not restarted and a visible loader is not hidden, because either
 * would churn the announcement and the overlay's focus handling.
 *
 * @param active - whether the operation is currently pending
 * @param delay - milliseconds to wait before reporting visible
 * @returns whether the delayed state should be shown
 */
export function useDelayedVisibility(active: boolean, delay: number): boolean {
  const [visible, setVisible] = useState(false);
  const delayRef = useRef(delay);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest delay available to the next activation without making it
  // an effect dependency: a dependency would restart an in-flight timer.
  useEffect(() => {
    delayRef.current = delay;
  }, [delay]);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!active) {
      setVisible(false);
      return;
    }

    const duration = normalizeDelay(delayRef.current);
    if (duration === 0) {
      setVisible(true);
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setVisible(true);
    }, duration);
  }, [active]);

  // An unmount mid-delay must not leave a timer that updates a dead component.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Never report a visible state for an inactive operation, even on the render
  // where the clear effect has not run yet.
  return active ? visible : false;
}
