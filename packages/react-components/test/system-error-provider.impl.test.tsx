import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SystemErrorProvider, useSystemError } from '../src/index';
import type { SystemErrorContextValue } from '../src/components/SystemErrorProvider/SystemErrorContext';

/** The provider context the probe child observed most recently. */
let capturedContext: SystemErrorContextValue | undefined;

/** Probe child that captures the provider's context value on every render. */
function ContextProbe(): null {
  capturedContext = useSystemError();
  return null;
}

/** Minimal shape of a spy's recorded calls. */
type SpyCalls = { mock: { calls: unknown[][] } };

/**
 * Counts window listeners of one event name whose registration has not been
 * removed again — the net state after any number of setup/cleanup cycles.
 */
function activeListenerCount(addSpy: SpyCalls, removeSpy: SpyCalls, eventName: string): number {
  const added = addSpy.mock.calls.filter(call => call[0] === eventName).map(call => call[1]);
  const removed = removeSpy.mock.calls.filter(call => call[0] === eventName).map(call => call[1]);

  return added.filter(handler => !removed.includes(handler)).length;
}

/** Wraps provider content the way an application mounts it. */
function wrapProvider(
  content: ReactElement,
  props: { captureGlobalErrors?: boolean; strings?: { title: string } } = {}
): ReactElement {
  return (
    <FluentProvider theme={webLightTheme}>
      <SystemErrorProvider {...props}>{content}</SystemErrorProvider>
    </FluentProvider>
  );
}

/** Renders provider content inside the theme provider and returns the render result. */
function mountProvider(
  content: ReactElement,
  props: { captureGlobalErrors?: boolean; strings?: { title: string } } = {}
) {
  return render(wrapProvider(content, props));
}

afterEach(() => {
  vi.restoreAllMocks();
  capturedContext = undefined;
});

describe('SystemErrorProvider internals', () => {
  describe('capture listener lifecycle', () => {
    it('registers one listener pair and removes it on unmount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const view = mountProvider(<span />, { captureGlobalErrors: true });

      expect(activeListenerCount(addSpy, removeSpy, 'error')).toBe(1);
      expect(activeListenerCount(addSpy, removeSpy, 'unhandledrejection')).toBe(1);

      view.unmount();

      expect(activeListenerCount(addSpy, removeSpy, 'error')).toBe(0);
      expect(activeListenerCount(addSpy, removeSpy, 'unhandledrejection')).toBe(0);
    });

    it('detaches when the flag turns off and re-attaches when it turns on again', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const view = mountProvider(<span />, { captureGlobalErrors: true });
      expect(activeListenerCount(addSpy, removeSpy, 'error')).toBe(1);

      view.rerender(wrapProvider(<span />, { captureGlobalErrors: false }));
      expect(activeListenerCount(addSpy, removeSpy, 'error')).toBe(0);

      view.rerender(wrapProvider(<span />, { captureGlobalErrors: true }));
      expect(activeListenerCount(addSpy, removeSpy, 'error')).toBe(1);
    });

    it('keeps the listeners registered when only the handler changes', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const view = mountProvider(<span />, { captureGlobalErrors: true });

      view.rerender(
        wrapProvider(<span />, { captureGlobalErrors: true, strings: { title: 'Changed' } })
      );

      // The effect depends only on the flag, so a rerender does not touch the
      // registrations: still one pair, added exactly once.
      expect(addSpy.mock.calls.filter(call => call[0] === 'error')).toHaveLength(1);
      expect(activeListenerCount(addSpy, removeSpy, 'error')).toBe(1);
      expect(activeListenerCount(addSpy, removeSpy, 'unhandledrejection')).toBe(1);
    });

    it('keeps exactly one active listener pair under StrictMode', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      render(<StrictMode>{wrapProvider(<span />, { captureGlobalErrors: true })}</StrictMode>);

      // StrictMode runs setup, cleanup and setup again; the net state must be
      // a single active pair, never a duplicate.
      expect(activeListenerCount(addSpy, removeSpy, 'error')).toBe(1);
      expect(activeListenerCount(addSpy, removeSpy, 'unhandledrejection')).toBe(1);
    });
  });

  describe('context stability', () => {
    it('keeps the context value and both callbacks identical across rerenders', () => {
      const view = mountProvider(<ContextProbe />);
      const first = capturedContext;

      expect(first).toBeDefined();

      view.rerender(wrapProvider(<ContextProbe />, { strings: { title: 'Changed' } }));

      // A recreated context value would reach the probe as a new object; the
      // memoized value keeps consumer effects and callbacks stable.
      expect(capturedContext).toBe(first);
      expect(capturedContext?.catchError).toBe(first?.catchError);
      expect(capturedContext?.clearError).toBe(first?.clearError);
    });
  });
});
