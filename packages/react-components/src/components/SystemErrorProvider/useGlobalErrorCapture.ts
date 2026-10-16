import { useEffect, useRef } from 'react';

/**
 * Reports uncaught window errors and unhandled promise rejections to a
 * handler while `enabled` is true.
 *
 * The hook is the provider's opt-in global capture: an effect registers a
 * bubble-phase `error` listener (window errors, including the reports React
 * itself emits for uncaught render errors) and an `unhandledrejection`
 * listener, and removes both on cleanup — when the flag turns off or the
 * provider unmounts. It never calls `preventDefault()`, so the browser
 * console and other listeners keep seeing the events, and it touches
 * `window` only inside the effect, which keeps server rendering safe.
 *
 * The handlers read the latest `onError` through a ref (the latest-ref
 * idiom), so they stay registered across re-renders while always calling the
 * current handler.
 *
 * @param enabled - whether the listeners should be registered
 * @param onError - receives the error payload; for `error` events the
 * `event.error ?? event.message`, for rejections the rejection reason
 */
export function useGlobalErrorCapture(enabled: boolean, onError: (error: unknown) => void): void {
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handleError = (event: ErrorEvent) => onErrorRef.current(event.error ?? event.message);
    const handleRejection = (event: PromiseRejectionEvent) => onErrorRef.current(event.reason);

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [enabled]);
}
