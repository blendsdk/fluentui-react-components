import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SystemErrorProvider, useSystemError } from '../src/index';
import type { CatchErrorOptions, SystemErrorProviderProps } from '../src/index';

/**
 * English copy the dialog shows when the caller passes no overrides.
 *
 * Asserting against these values keeps a wording change a visible, deliberate
 * part of the contract rather than an accidental edit.
 */
const NO_DETAILS_TEXT = 'No error details are available.';
const DEFAULT_SUB_TEXT =
  'An unknown error has occurred in this application. Please notify the system administrators for further assistance.';

/**
 * Partial Dutch overrides used to prove that provider-level strings reach the
 * dialog and that unset keys keep their English defaults.
 */
const DUTCH_STRINGS: Partial<{
  title: string;
  close: string;
  detailsLabel: string;
}> = {
  title: 'Applicatiefout',
  close: 'Sluiten',
  detailsLabel: 'Foutdetails',
};

/**
 * A promise that never settles, used as the payload of a rejection event.
 *
 * Passing it avoids the event constructor itself creating a rejected promise,
 * which would surface as a real unhandled rejection in the test runner.
 */
const NEVER_SETTLING = new Promise<never>(() => {});

/** Provider props without the children the render helpers supply. */
type ProviderProps = Omit<SystemErrorProviderProps, 'children'>;

/** The imperative API the hook returns. */
type SystemErrorApi = ReturnType<typeof useSystemError>;

/** Hook API captured by the probe child of the most recent render. */
let hookApi: SystemErrorApi | undefined;

/** Window error listeners installed by the current test, removed afterwards. */
const errorSinks: EventListener[] = [];

/**
 * Returns the provider API captured by the probe child.
 *
 * Reading it before a probe has rendered is a test bug, so it fails loudly
 * instead of returning an unusable value.
 */
function requireApi(): SystemErrorApi {
  if (hookApi === undefined) {
    throw new Error('No provider API has been captured; render the probe child first.');
  }
  return hookApi;
}

interface HookUserProps {
  /** Error value the report button passes to `catchError`. */
  error?: unknown;
  /** Options the report button passes to `catchError`. */
  options?: CatchErrorOptions;
}

/**
 * Child placed inside the provider.
 *
 * It renders buttons that report and clear errors the way application code
 * would, and it stores the hook API so a test can drive flows the buttons
 * cannot express (sequential values, calls made from a host handler).
 */
function HookUser({ error = 'reported failure', options }: HookUserProps): ReactElement {
  const api = useSystemError();
  hookApi = api;

  return (
    <>
      <button type="button" onClick={() => api.catchError(error, options)}>
        Report error
      </button>
      <button type="button" onClick={() => api.clearError()}>
        Clear error
      </button>
    </>
  );
}

/** Wraps provider content in the theme provider the way an application mounts it. */
function wrapProvider(content: ReactElement, props: ProviderProps = {}): ReactElement {
  return (
    <FluentProvider theme={webLightTheme}>
      <SystemErrorProvider {...props}>{content}</SystemErrorProvider>
    </FluentProvider>
  );
}

/** Renders provider content inside the theme provider and returns the render result. */
function mountProvider(content: ReactElement, props: ProviderProps = {}) {
  return render(wrapProvider(content, props));
}

/**
 * Reads the details text currently shown in the open dialog.
 *
 * The query goes through the accessible name so a successful read also proves
 * the visible label is associated with the control. The runtime type check
 * keeps the helper type-safe without a cast.
 */
function readDetails(label = 'Error details'): string {
  const field = screen.getByRole('textbox', { name: label });
  if (!(field instanceof HTMLTextAreaElement)) {
    throw new Error('The details control is not a textarea element.');
  }
  return field.value;
}

/** Builds a cancelable window error event carrying an error payload. */
function makeErrorEvent(error: unknown, message = 'window failure'): ErrorEvent {
  return new ErrorEvent('error', { error, message, cancelable: true });
}

/** Builds a cancelable window error event that carries only a message. */
function makeMessageOnlyErrorEvent(message: string): ErrorEvent {
  return new ErrorEvent('error', { message, cancelable: true });
}

/** Builds a cancelable rejection event around a never-settling promise. */
function makeRejectionEvent(reason: unknown): PromiseRejectionEvent {
  return new PromiseRejectionEvent('unhandledrejection', {
    promise: NEVER_SETTLING,
    reason,
    cancelable: true,
  });
}

/**
 * Registers a test-owned window error listener.
 *
 * The test environment turns an error event that carries an error and that no
 * listener observes into a run-level failure. The sink keeps such a dispatch
 * observable without failing the run; the afterEach hook removes every sink.
 */
function addErrorSink(listener: EventListener): void {
  window.addEventListener('error', listener);
  errorSinks.push(listener);
}

/** Runs a render that is expected to throw and returns the thrown value. */
function captureRenderError(renderAttempt: () => void): unknown {
  try {
    renderAttempt();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the render to throw.');
}

/** Narrows a thrown value to an Error, failing loudly when it is anything else. */
function asError(value: unknown): Error {
  if (!(value instanceof Error)) {
    throw new Error('Expected the thrown value to be an Error instance.');
  }
  return value;
}

/** Narrows a reported value to an error event, failing loudly when it is anything else. */
function asErrorEvent(value: unknown): ErrorEvent {
  if (!(value instanceof ErrorEvent)) {
    throw new Error('Expected the reported value to be an ErrorEvent.');
  }
  return value;
}

beforeEach(() => {
  hookApi = undefined;
});

afterEach(() => {
  errorSinks.splice(0).forEach(listener => window.removeEventListener('error', listener));
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SystemErrorProvider', () => {
  describe('structure and reporting', () => {
    it('renders children directly and shows no dialog before an error is reported', () => {
      const { container } = mountProvider(<span data-testid="child">child content</span>);

      const child = screen.getByTestId('child');
      const providerRoot = container.firstElementChild;

      // The provider adds no element of its own: the child sits directly under
      // the theme provider's root, which is the only wrapper in the tree.
      expect(child.parentElement).toBe(providerRoot);
      expect(providerRoot?.children).toHaveLength(1);
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('opens one dialog with the serialized error when a child reports it', () => {
      mountProvider(<HookUser error={new Error('boom')} />);

      fireEvent.click(screen.getByRole('button', { name: 'Report error' }));

      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      const details = readDetails();
      expect(details).toContain('"name": "Error"');
      expect(details).toContain('"message": "boom"');
      // The nested keys are indented with exactly two spaces (pretty-printed JSON).
      expect(details).toMatch(/\n {2}"message": "boom"/);
    });

    it('keeps only the last reported error when two reports arrive before any interaction', () => {
      mountProvider(<HookUser />);

      act(() => {
        requireApi().catchError('first failure');
        requireApi().catchError('second failure');
      });

      const details = readDetails();
      expect(details).toBe('second failure');
      expect(details).not.toContain('first failure');
    });
  });

  describe('recovery actions', () => {
    it('closes on Close and reopens with the next reported value', () => {
      mountProvider(<HookUser />);

      act(() => requireApi().catchError('first failure'));
      expect(readDetails()).toBe('first failure');

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('alertdialog')).toBeNull();

      act(() => requireApi().catchError('second failure'));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(readDetails()).toBe('second failure');
    });

    it('clears a shown error and ignores a clear when nothing is shown', () => {
      mountProvider(<HookUser />);

      expect(() => act(() => requireApi().clearError())).not.toThrow();
      expect(screen.queryByRole('alertdialog')).toBeNull();

      act(() => requireApi().catchError('boom'));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      act(() => requireApi().clearError());
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });

  describe('kind routing and sign-out', () => {
    it('shows the sign-out variant and closes when Sign out is activated', () => {
      const onSignOut = vi.fn();
      mountProvider(<HookUser />, { onSignOut });

      act(() => requireApi().catchError('session expired', { kind: 'unauthorized' }));

      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Reload page' })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

      expect(onSignOut).toHaveBeenCalledTimes(1);
      expect(onSignOut).toHaveBeenCalledWith();
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('closes without a host handler and throws nothing when Sign out is activated', () => {
      mountProvider(<HookUser />);

      act(() => requireApi().catchError('session expired', { kind: 'unauthorized' }));

      const signOut = screen.getByRole('button', { name: 'Sign out' });

      expect(() => fireEvent.click(signOut)).not.toThrow();
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('keeps the dialog closed and reports a throwing handler through the window error channel', async () => {
      const sink = vi.fn();
      addErrorSink(sink);
      const failure = new Error('sign out failed');

      mountProvider(<HookUser />, {
        onSignOut: () => {
          throw failure;
        },
      });

      act(() => requireApi().catchError('session expired', { kind: 'unauthorized' }));

      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
      await act(async () => {});

      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(sink).toHaveBeenCalled();
      expect(asErrorEvent(sink.mock.calls[0][0]).error).toBe(failure);
    });

    it('shows the re-entrant error when the host handler reports one synchronously', () => {
      const reentrant = 're-entrant failure';
      const onSignOut = vi.fn(() => {
        requireApi().catchError(reentrant);
      });

      mountProvider(<HookUser />, { onSignOut });

      act(() => requireApi().catchError('session expired', { kind: 'unauthorized' }));
      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

      expect(onSignOut).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
      expect(readDetails()).toBe(reentrant);
    });

    it('calls the host reload handler and leaves the dialog open when Reload page is used', () => {
      const onReload = vi.fn();
      mountProvider(<HookUser />, { onReload });

      act(() => requireApi().catchError('boom'));
      fireEvent.click(screen.getByRole('button', { name: 'Reload page' }));

      expect(onReload).toHaveBeenCalledTimes(1);
      expect(onReload).toHaveBeenCalledWith();
      // The provider does not clear the dialog itself; the host decides what happens next.
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('renders no reload action when the provider has no reload handler', () => {
      mountProvider(<HookUser />);

      act(() => requireApi().catchError('boom'));

      expect(screen.queryByRole('button', { name: 'Reload page' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });
  });

  describe('details and string overrides', () => {
    it('applies a details override to one report and drops it on the next', () => {
      mountProvider(<HookUser />);

      act(() => requireApi().catchError(new Error('boom'), { detailsText: 'Support case 4711' }));
      expect(readDetails()).toBe('Support case 4711');

      act(() => requireApi().catchError(new Error('boom')));

      const details = readDetails();
      expect(details).not.toBe('Support case 4711');
      expect(details).toContain('"message": "boom"');
    });

    it('applies provider strings and keeps unset keys at their English defaults', () => {
      mountProvider(<HookUser />, { strings: DUTCH_STRINGS });

      act(() => requireApi().catchError('boom'));

      expect(screen.getByRole('alertdialog', { name: 'Applicatiefout' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sluiten' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Foutdetails' })).toHaveValue('boom');
      expect(screen.getByText(DEFAULT_SUB_TEXT)).toBeInTheDocument();
    });
  });

  describe('hook misuse', () => {
    it('throws an error naming the hook and the provider when used outside the provider', () => {
      // React logs the failed render; silence it so the run output stays readable.
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const thrown = captureRenderError(() => {
        render(<HookUser />);
      });

      expect(thrown).toBeInstanceOf(Error);
      expect(asError(thrown).message).toMatch(/useSystemError/);
      expect(asError(thrown).message).toMatch(/SystemErrorProvider/);
    });
  });

  describe('global capture', () => {
    it('does not capture window errors or rejections while the capture flag is off', () => {
      mountProvider(<HookUser />);

      act(() => {
        window.dispatchEvent(makeMessageOnlyErrorEvent('ignored failure'));
      });
      act(() => {
        window.dispatchEvent(makeRejectionEvent(new Error('ignored rejection')));
      });

      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('captures window errors and falls back to the message when no error payload is present', () => {
      mountProvider(<HookUser />, { captureGlobalErrors: true });

      act(() => {
        window.dispatchEvent(makeErrorEvent(new Error('captured failure')));
      });

      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      const details = readDetails();
      expect(details).toContain('"name": "Error"');
      expect(details).toContain('"message": "captured failure"');
      expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

      act(() => {
        window.dispatchEvent(makeMessageOnlyErrorEvent('message only failure'));
      });

      expect(readDetails()).toBe('message only failure');
      expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    });

    it('captures rejection reasons and shows the no-details text for an undefined reason', () => {
      mountProvider(<HookUser />, { captureGlobalErrors: true });

      act(() => {
        window.dispatchEvent(makeRejectionEvent(new Error('rejected')));
      });

      expect(readDetails()).toContain('"message": "rejected"');

      act(() => {
        window.dispatchEvent(makeRejectionEvent(undefined));
      });

      expect(readDetails()).toBe(NO_DETAILS_TEXT);
    });

    it('never suppresses the captured events', () => {
      mountProvider(<HookUser />, { captureGlobalErrors: true });

      const errorEvent = makeErrorEvent(new Error('boom'));
      const rejectionEvent = makeRejectionEvent(new Error('boom'));

      act(() => {
        window.dispatchEvent(errorEvent);
      });
      act(() => {
        window.dispatchEvent(rejectionEvent);
      });

      expect(errorEvent.defaultPrevented).toBe(false);
      expect(rejectionEvent.defaultPrevented).toBe(false);
    });

    it('stops capture when the flag turns off and restarts it when it turns on again', () => {
      const view = mountProvider(<HookUser />, { captureGlobalErrors: true });

      view.rerender(wrapProvider(<HookUser />, { captureGlobalErrors: false }));
      act(() => {
        window.dispatchEvent(makeMessageOnlyErrorEvent('ignored failure'));
      });
      expect(screen.queryByRole('alertdialog')).toBeNull();

      view.rerender(wrapProvider(<HookUser />, { captureGlobalErrors: true }));
      act(() => {
        window.dispatchEvent(makeMessageOnlyErrorEvent('captured again'));
      });
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(readDetails()).toBe('captured again');
    });

    it('renders hostile rejection reasons without throwing', () => {
      mountProvider(<HookUser />, { captureGlobalErrors: true });

      const { proxy, revoke } = Proxy.revocable({}, {});
      revoke();

      act(() => {
        window.dispatchEvent(makeRejectionEvent(proxy));
      });
      expect(readDetails()).toBe(NO_DETAILS_TEXT);

      const throwingAccessor = {
        get boom(): string {
          throw new Error('cannot serialize');
        },
      };

      act(() => {
        window.dispatchEvent(makeRejectionEvent(throwingAccessor));
      });
      expect(readDetails()).toBe('[object Object]');
    });
  });

  describe('no side effects', () => {
    it('never reloads the page or issues a request during a full flow', () => {
      const reload = vi.fn();
      const fetchStub = vi.fn();
      vi.stubGlobal('location', { reload });
      vi.stubGlobal('fetch', fetchStub);

      const onReload = vi.fn();
      mountProvider(<HookUser error={new Error('boom')} />, { onReload });

      fireEvent.click(screen.getByRole('button', { name: 'Report error' }));
      fireEvent.click(screen.getByRole('button', { name: 'Reload page' }));
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      act(() => requireApi().catchError('session expired', { kind: 'unauthorized' }));
      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

      act(() => requireApi().catchError(new Error('boom again')));
      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });

      expect(reload).not.toHaveBeenCalled();
      expect(fetchStub).not.toHaveBeenCalled();
    });
  });
});
