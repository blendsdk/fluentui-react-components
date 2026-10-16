import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { StrictMode, useEffect, useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmProvider, useConfirm } from '../src/index';
import type { ConfirmOptions, ConfirmOptionsWithActions } from '../src/index';

/** The overloaded callable the hook returns. */
type ConfirmApi = {
  (options: ConfirmOptions): Promise<boolean>;
  <V extends string>(options: ConfirmOptionsWithActions<V>): Promise<V>;
};

/** A mutable box for the captured API; filled by the harness on every render. */
type ConfirmRef = { current: ConfirmApi | undefined };

/** Renders a provider with a harness that captures the hook API. */
function renderProvider(
  build: (confirmRef: ConfirmRef) => ReactElement,
  props: { strings?: { confirm?: string; decline?: string } } = {}
) {
  const confirmRef: ConfirmRef = { current: undefined };
  function Harness(): ReactElement {
    confirmRef.current = useConfirm();
    return build(confirmRef);
  }
  const view = render(
    <FluentProvider theme={webLightTheme}>
      <ConfirmProvider {...props}>
        <Harness />
      </ConfirmProvider>
    </FluentProvider>
  );
  return { view, confirmRef };
}

/** Returns the captured API or throws — keeps call sites free of assertions. */
function getConfirm(confirmRef: ConfirmRef): ConfirmApi {
  if (confirmRef.current === undefined) {
    throw new Error('The confirm API was not captured.');
  }
  return confirmRef.current;
}

/** Watches settlements on a promise; flush with `act` before reading the count. */
function watchSettlements(promise: Promise<unknown>): { count: number } {
  const state = { count: 0 };
  void promise.then(
    () => {
      state.count += 1;
    },
    () => {
      state.count += 1;
    }
  );
  return state;
}

describe('ConfirmProvider internals', () => {
  describe('API stability', () => {
    it('returns the same confirm function across consumer and provider re-renders', () => {
      const captured: ConfirmApi[] = [];
      let rerenderProvider: (() => void) | undefined;

      function Harness(): ReactElement {
        captured.push(useConfirm());
        return <span>consumer</span>;
      }

      function Host(): ReactElement {
        const [label, setLabel] = useState('yes');
        rerenderProvider = () => {
          setLabel(label === 'yes' ? 'ja' : 'yes');
        };
        return (
          <FluentProvider theme={webLightTheme}>
            <ConfirmProvider strings={{ confirm: label }}>
              <Harness />
            </ConfirmProvider>
          </FluentProvider>
        );
      }

      render(<Host />);

      act(() => {
        rerenderProvider?.();
      });

      expect(captured.length).toBeGreaterThan(1);
      for (const api of captured) {
        expect(api).toBe(captured[0]);
      }
    });
  });

  describe('replacement', () => {
    it('moves focus into the new dialog after a swap with differing action counts', async () => {
      let requestA: Promise<boolean> | undefined;
      let requestB: Promise<'cancel' | 'discard' | 'save'> | undefined;

      const { confirmRef } = renderProvider(() => <span />);
      const confirm = getConfirm(confirmRef);

      act(() => {
        requestA = confirm({ title: 'First decision?' });
      });
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();

      act(() => {
        requestB = confirm({
          title: 'Second decision?',
          actions: [
            { value: 'cancel', label: 'Cancel' },
            { value: 'discard', label: 'Discard' },
            { value: 'save', label: 'Save' },
          ],
        });
      });

      await expect(requestA).resolves.toBe(false);

      const dialogs = screen.getAllByRole('alertdialog');
      expect(dialogs).toHaveLength(1);
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

      // The keyed remount runs Fluent's focus acquisition again; in jsdom that
      // lands on the new dialog surface.
      const active = document.activeElement;
      expect(active instanceof HTMLElement && dialogs[0].contains(active)).toBe(true);

      fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
      await expect(requestB).resolves.toBe('discard');
    });
  });

  describe('settlement', () => {
    it('resolves exactly once when the confirm action is activated twice before a re-render', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      let request: Promise<boolean> | undefined;

      act(() => {
        request = getConfirm(confirmRef)({ title: 'Delete this record?' });
      });

      const settled = watchSettlements(request ?? Promise.resolve(false));

      act(() => {
        const confirmButton = screen.getByRole('button', { name: 'Confirm' });
        fireEvent.click(confirmButton);
        fireEvent.click(confirmButton);
      });

      await expect(request).resolves.toBe(true);
      await act(async () => {});
      expect(settled.count).toBe(1);
    });
  });

  describe('StrictMode probe', () => {
    it('keeps a request created in a mount effect pending across the double-invoked probe', async () => {
      let request: Promise<boolean> | undefined;

      function Requester(): ReactElement {
        const confirm = useConfirm();
        const requestedRef = useRef(false);
        useEffect(() => {
          if (!requestedRef.current) {
            requestedRef.current = true;
            request = confirm({ title: 'Delete this record?' });
          }
        }, [confirm]);
        return <span>requester</span>;
      }

      render(
        <StrictMode>
          <FluentProvider theme={webLightTheme}>
            <ConfirmProvider>
              <Requester />
            </ConfirmProvider>
          </FluentProvider>
        </StrictMode>
      );

      // Flush the probe's microtask window: a wrongly deferred settlement
      // would resolve the request `false` here.
      await act(async () => {});

      const settled = watchSettlements(request ?? Promise.resolve(false));
      await act(async () => {});
      expect(settled.count).toBe(0);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await expect(request).resolves.toBe(true);
      await act(async () => {});
      expect(settled.count).toBe(1);
    });

    it('keeps an unguarded mount-effect request live across the probe with supersede semantics', async () => {
      const captured: Array<Promise<boolean>> = [];

      function Requester(): ReactElement {
        const confirm = useConfirm();
        useEffect(() => {
          captured.push(confirm({ title: `Request ${captured.length + 1}?` }));
        }, [confirm]);
        return <span>requester</span>;
      }

      render(
        <StrictMode>
          <FluentProvider theme={webLightTheme}>
            <ConfirmProvider>
              <Requester />
            </ConfirmProvider>
          </FluentProvider>
        </StrictMode>
      );

      await act(async () => {});

      // The probe runs the effect twice: the first request is superseded
      // `false`, and the second stays live and visible — a request landing in
      // the probe window must not be faked into "not confirmed".
      expect(captured).toHaveLength(2);
      await expect(captured[0]).resolves.toBe(false);

      const secondState = { settled: false };
      void captured[1].then(() => {
        secondState.settled = true;
      });
      await act(async () => {});
      expect(secondState.settled).toBe(false);
      expect(screen.getByRole('alertdialog', { name: 'Request 2?' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      await expect(captured[1]).resolves.toBe(true);
    });
  });

  describe('children stability', () => {
    it('does not re-render the children subtree for request lifecycle changes', async () => {
      const renderSpy = vi.fn();

      function Child(): ReactElement {
        renderSpy();
        return <span>child</span>;
      }

      const { confirmRef } = renderProvider(() => <Child />);
      const baseline = renderSpy.mock.calls.length;

      let request: Promise<boolean> | undefined;
      act(() => {
        request = getConfirm(confirmRef)({ title: 'Delete this record?' });
      });

      expect(renderSpy.mock.calls.length).toBe(baseline);

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      await expect(request).resolves.toBe(true);

      expect(renderSpy.mock.calls.length).toBe(baseline);
    });
  });

  describe('late and superseded settlement', () => {
    it('settles a stale confirm call false after the provider unmounted', async () => {
      const { view, confirmRef } = renderProvider(() => <span />);
      const staleConfirm = getConfirm(confirmRef);

      view.unmount();

      const late = staleConfirm({ title: 'Late request?' });

      await expect(late).resolves.toBe(false);
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('resolves a superseded actions request false', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      const confirm = getConfirm(confirmRef);
      let actionsRequest: Promise<'cancel' | 'save'> | undefined;
      let followUp: Promise<boolean> | undefined;

      act(() => {
        actionsRequest = confirm({
          title: 'Save your changes?',
          actions: [
            { value: 'cancel', label: 'Cancel' },
            { value: 'save', label: 'Save' },
          ],
        });
      });

      act(() => {
        followUp = confirm({ title: 'Follow-up?' });
      });

      await expect(actionsRequest).resolves.toBe(false);

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      await expect(followUp).resolves.toBe(true);
    });

    it('returns focus to the invoker when the request closes the dialog', async () => {
      const { confirmRef } = renderProvider(() => (
        <button type="button" data-testid="invoker">
          Ask
        </button>
      ));
      const invoker = screen.getByTestId('invoker');
      act(() => {
        invoker.focus();
      });
      expect(document.activeElement).toBe(invoker);

      let request: Promise<boolean> | undefined;
      act(() => {
        request = getConfirm(confirmRef)({ title: 'Delete this record?' });
      });
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await expect(request).resolves.toBe(true);
      expect(document.activeElement).toBe(invoker);
    });
  });
});
