import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Captures, moves and restores focus around the overlay's inert content.
 *
 * The algorithm has three moments:
 *
 * 1. When `loading` becomes true, capture the focused element and start
 *    tracking every element that receives focus while the overlay waits.
 *    This happens before the overlay is visible, so the content is not inert
 *    yet and the browser has not blurred the element.
 * 2. When the overlay becomes visible, move focus to the overlay root only
 *    when focus was inside the covered content — or when the browser already
 *    blurred that element to `document.body` and the last element focused
 *    inside the content is still connected. Tracking the last focused element
 *    is what preserves a focus move that happened during the delay even when
 *    the browser blurs the content before the effect runs. Focus that was
 *    outside the content is never moved.
 * 3. When the overlay hides, restore focus only if this hook moved it and
 *    focus is still on the root or the body. The element focused at reveal
 *    time wins over the loading-start element, because the user may have
 *    moved inside the content during the delay.
 *
 * On unmount the references are cleared and no restoration is attempted: the
 * content unmounts with the overlay, so there is nowhere safe to return to.
 *
 * `document` is read only inside effects, so server rendering never touches a
 * browser API.
 *
 * @param params - the root and content refs plus the loading and visibility state
 */
export function useLoadingOverlayFocus(params: {
  /** Ref for the focusable overlay root. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Ref for the content wrapper that becomes inert. */
  contentRef: RefObject<HTMLDivElement | null>;
  /** Whether the covered operation is pending. */
  loading: boolean;
  /** Whether the delayed overlay is currently shown. */
  visible: boolean;
}): void {
  const { rootRef, contentRef, loading, visible } = params;

  /** The element focused when loading started; the fallback restore target. */
  const capturedRef = useRef<HTMLElement | null>(null);
  /** The last element that received focus while the overlay waited. */
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  /** The element focused when the overlay became visible; the preferred restore target. */
  const revealTargetRef = useRef<HTMLElement | null>(null);
  /** Whether this hook moved focus and therefore owns the restoration. */
  const movedRef = useRef(false);
  const wasLoadingRef = useRef(false);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (loading && !wasLoadingRef.current) {
      const active = document.activeElement;
      const element = active instanceof HTMLElement ? active : null;
      capturedRef.current = element;
      lastFocusedRef.current = element;
    } else if (!loading && !wasVisibleRef.current) {
      // Loading ended before the overlay appeared: there is nothing to
      // restore, and keeping the capture would leak a stale reference.
      capturedRef.current = null;
      lastFocusedRef.current = null;
    }

    wasLoadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    // Track focus only during the delay. Once the overlay is visible the
    // content is inert and focus belongs to the root; listening further would
    // overwrite the last inside target with the root itself.
    if (!loading || visible) {
      return;
    }

    const content = contentRef.current;
    if (content === null) {
      return;
    }

    const handleFocusIn = (event: FocusEvent): void => {
      if (event.target instanceof HTMLElement) {
        lastFocusedRef.current = event.target;
      }
    };

    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [loading, visible, contentRef]);

  useEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;

    if (visible && !wasVisibleRef.current) {
      const active = document.activeElement;
      let target: HTMLElement | null = null;

      if (root !== null && content !== null) {
        if (active instanceof HTMLElement && content.contains(active)) {
          target = active;
        } else if (active === document.body) {
          // Chromium may blur an element that just became inert to the body
          // before this effect runs; jsdom does not reproduce that blur. The
          // last element focused inside the content covers both the
          // loading-start element and a move the user made during the delay.
          const lastFocused = lastFocusedRef.current;
          if (lastFocused !== null && lastFocused.isConnected && content.contains(lastFocused)) {
            target = lastFocused;
          }
        }

        if (target !== null) {
          revealTargetRef.current = target;
          movedRef.current = true;
          root.focus();
        }
      }
    } else if (!visible && wasVisibleRef.current) {
      const active = document.activeElement;
      const activeIsRoot = root !== null && active === root;

      if (movedRef.current && (activeIsRoot || active === document.body)) {
        const revealTarget = revealTargetRef.current;
        const captured = capturedRef.current;

        if (revealTarget !== null && revealTarget.isConnected) {
          revealTarget.focus();
        } else if (captured !== null && captured.isConnected) {
          captured.focus();
        }
      }

      movedRef.current = false;
      revealTargetRef.current = null;
      capturedRef.current = null;
      lastFocusedRef.current = null;
    }

    wasVisibleRef.current = visible;
  }, [visible, rootRef, contentRef]);

  useEffect(() => {
    return () => {
      capturedRef.current = null;
      lastFocusedRef.current = null;
      revealTargetRef.current = null;
      movedRef.current = false;
    };
  }, []);
}
