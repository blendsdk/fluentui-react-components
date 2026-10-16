import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorDialog } from '../src/index';

/**
 * English copy the component renders when a caller passes no overrides.
 *
 * Asserting against these values keeps a wording change a visible, deliberate
 * part of the contract rather than an accidental edit.
 */
const DEFAULT_SUB_TEXT =
  'An unknown error has occurred in this application. Please notify the system administrators for further assistance.';
const NO_DETAILS_TEXT = 'No error details are available.';

/** A callback that does nothing; used where a test only cares that nothing throws. */
const noop = (): void => {};

/**
 * Wraps a dialog in the theme provider the way an application mounts it.
 *
 * Every render goes through here because Fluent resolves its design tokens from
 * the provider's theme.
 */
function wrapDialog(
  dialog: ReactElement,
  theme: typeof webLightTheme = webLightTheme
): ReactElement {
  return <FluentProvider theme={theme}>{dialog}</FluentProvider>;
}

/** Renders a dialog inside the theme provider and returns the render result. */
function renderDialog(dialog: ReactElement, theme: typeof webLightTheme = webLightTheme) {
  return render(wrapDialog(dialog, theme));
}

/**
 * Reads the text currently shown in the details area.
 *
 * The query goes through the accessible name ("Error details"), so a successful
 * read also proves the visible label is associated with the control. The
 * runtime type check keeps the helper type-safe without a cast.
 */
function readDetails(): string {
  const field = screen.getByRole('textbox', { name: 'Error details' });
  if (!(field instanceof HTMLTextAreaElement)) {
    throw new Error('The details control is not a textarea element.');
  }
  return field.value;
}

/**
 * Returns the dialog's backdrop element.
 *
 * Fluent renders the surface into a portal on the document body, which is a
 * sibling of the container the test renders into, so the lookup goes through
 * the document rather than the render container.
 */
function getBackdrop(): HTMLElement {
  const backdrop = document.querySelector('.fui-DialogSurface__backdrop');
  if (!(backdrop instanceof HTMLElement)) {
    throw new Error('The dialog backdrop is not rendered.');
  }
  return backdrop;
}

/**
 * Installs a stub clipboard on the navigator for the current test.
 *
 * jsdom provides no clipboard API, so tests that exercise the copy control must
 * install one before rendering. The file's afterEach hook removes the stub
 * again so tests stay independent of their execution order.
 */
function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('ErrorDialog', () => {
  describe('visibility and alert semantics', () => {
    it('renders no alert dialog and calls no action while closed', () => {
      const onDismiss = vi.fn();
      const onReload = vi.fn();

      renderDialog(
        <ErrorDialog open={false} error="boom" onDismiss={onDismiss} onReload={onReload} />
      );

      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(onDismiss).not.toHaveBeenCalled();
      expect(onReload).not.toHaveBeenCalled();
    });

    it('shows the default title, sub-text and details label when open', () => {
      renderDialog(<ErrorDialog open onDismiss={noop} />);

      expect(screen.getByRole('alertdialog', { name: 'Application error' })).toBeInTheDocument();
      expect(screen.getByText(DEFAULT_SUB_TEXT)).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue(NO_DETAILS_TEXT);
    });

    it('keeps the error dialog open and calls nothing when Escape and the backdrop are used', () => {
      const onDismiss = vi.fn();
      const onReload = vi.fn();

      renderDialog(<ErrorDialog open error="boom" onDismiss={onDismiss} onReload={onReload} />);

      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
      fireEvent.click(getBackdrop());

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(onDismiss).not.toHaveBeenCalled();
      expect(onReload).not.toHaveBeenCalled();
    });

    it('keeps the unauthorized dialog open and does not sign out when Escape and the backdrop are used', () => {
      const onSignOut = vi.fn();

      renderDialog(<ErrorDialog open kind="unauthorized" error="expired" onSignOut={onSignOut} />);

      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
      fireEvent.click(getBackdrop());

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(onSignOut).not.toHaveBeenCalled();
    });

    it('moves focus inside the dialog when it opens', () => {
      renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />);

      const dialog = screen.getByRole('alertdialog');

      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });

  describe('recovery actions', () => {
    it('calls onDismiss once without arguments when Close is activated', () => {
      const onDismiss = vi.fn();
      const onReload = vi.fn();

      renderDialog(<ErrorDialog open error="boom" onDismiss={onDismiss} onReload={onReload} />);

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onDismiss).toHaveBeenCalledWith();
      expect(onReload).not.toHaveBeenCalled();
    });

    it('calls onReload once without arguments when Reload page is activated', () => {
      const onDismiss = vi.fn();
      const onReload = vi.fn();

      renderDialog(<ErrorDialog open error="boom" onDismiss={onDismiss} onReload={onReload} />);

      fireEvent.click(screen.getByRole('button', { name: 'Reload page' }));

      expect(onReload).toHaveBeenCalledTimes(1);
      expect(onReload).toHaveBeenCalledWith();
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('renders no reload action when onReload is omitted', () => {
      renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />);

      expect(screen.queryByRole('button', { name: 'Reload page' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('renders only a sign-out action and calls onSignOut once when activated', () => {
      const onSignOut = vi.fn();

      renderDialog(<ErrorDialog open kind="unauthorized" error="expired" onSignOut={onSignOut} />);

      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Reload page' })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

      expect(onSignOut).toHaveBeenCalledTimes(1);
      expect(onSignOut).toHaveBeenCalledWith();
    });
  });

  describe('details content', () => {
    it('shows the default no-details text when the error is undefined', () => {
      renderDialog(<ErrorDialog open onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue(NO_DETAILS_TEXT);
    });

    it('follows the no-details override when no error is present', () => {
      renderDialog(
        <ErrorDialog open strings={{ noDetails: 'Geen foutdetails.' }} onDismiss={noop} />
      );

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue(
        'Geen foutdetails.'
      );
    });

    it('shows a string error verbatim', () => {
      renderDialog(<ErrorDialog open error="backend offline" onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue('backend offline');
    });

    it('serializes an error with name, message, stack and custom fields as two-space JSON', () => {
      interface ErrorWithCode extends Error {
        code: number;
      }
      const error: ErrorWithCode = Object.assign(new Error('boom'), { code: 401 });

      renderDialog(<ErrorDialog open error={error} onDismiss={noop} />);

      const details = readDetails();

      expect(details).toContain('"name": "Error"');
      expect(details).toContain('"message": "boom"');
      expect(details).toContain('"stack"');
      expect(details).toContain('"code": 401');
      // The nested keys are indented with exactly two spaces (pretty-printed JSON).
      expect(details).toMatch(/\n {2}"message": "boom"/);
    });

    it('renders a circular reference marker and never throws', () => {
      const error = Object.assign(new Error('loop'), { self: {} }) as Error & { self: unknown };
      error.self = { back: error };

      renderDialog(<ErrorDialog open error={error} onDismiss={noop} />);

      expect(readDetails()).toContain('"[Circular]"');
    });

    it('falls back to the plain string form when an error-like accessor throws', () => {
      const errorLike = {
        name: 'X',
        get message(): string {
          throw new Error('boom');
        },
      };

      renderDialog(<ErrorDialog open error={errorLike} onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue('[object Object]');
    });

    it('serializes a plain object as two-space JSON', () => {
      renderDialog(<ErrorDialog open error={{ status: 500, detail: 'boom' }} onDismiss={noop} />);

      const details = readDetails();

      expect(details).toContain('"status": 500');
      expect(details).toContain('"detail": "boom"');
      expect(details).toMatch(/\n {2}"status": 500/);
    });

    it('serializes a function as its JSON placeholder', () => {
      renderDialog(<ErrorDialog open error={() => undefined} onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue('"[Function]"');
    });

    it('serializes a bigint as its decimal JSON text', () => {
      renderDialog(<ErrorDialog open error={1n} onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue('"1"');
    });

    it('falls back to the plain string form when JSON serialization throws', () => {
      const error = {
        get boom(): string {
          throw new Error('cannot serialize');
        },
      };

      renderDialog(<ErrorDialog open error={error} onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue('[object Object]');
    });

    it('shows the default no-details text when serialization and string conversion both throw', () => {
      const error = {
        get boom(): string {
          throw new Error('cannot serialize');
        },
        toString(): string {
          throw new Error('cannot stringify');
        },
      };

      renderDialog(<ErrorDialog open error={error} onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue(NO_DETAILS_TEXT);
    });

    it('shows the default no-details text for a revoked proxy without throwing', () => {
      const { proxy, revoke } = Proxy.revocable({}, {});
      revoke();

      renderDialog(<ErrorDialog open error={proxy} onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue(NO_DETAILS_TEXT);
    });

    it('shows the details-text override verbatim and ignores the error', () => {
      renderDialog(
        <ErrorDialog
          open
          error={new Error('boom')}
          detailsText="Support case 4711"
          onDismiss={noop}
        />
      );

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue(
        'Support case 4711'
      );
    });

    it('renders a blank details value when details-text is empty', () => {
      renderDialog(<ErrorDialog open error={new Error('boom')} detailsText="" onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue('');
    });

    it('renders a string error as literal text without interpreting markup', () => {
      renderDialog(<ErrorDialog open error="<img src=x onerror=alert(1)>" onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue(
        '<img src=x onerror=alert(1)>'
      );
      expect(document.querySelector('img')).toBeNull();
    });

    it('renders a details-text override as literal text without interpreting markup', () => {
      renderDialog(
        <ErrorDialog
          open
          error={new Error('boom')}
          detailsText="<img src=x onerror=alert(1)>"
          onDismiss={noop}
        />
      );

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue(
        '<img src=x onerror=alert(1)>'
      );
      expect(document.querySelector('img')).toBeNull();
    });

    it('replaces the displayed details when the error prop changes', () => {
      const view = renderDialog(<ErrorDialog open error="first failure" onDismiss={noop} />);

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue('first failure');

      view.rerender(wrapDialog(<ErrorDialog open error="second failure" onDismiss={noop} />));

      expect(screen.getByRole('textbox', { name: 'Error details' })).toHaveValue('second failure');
    });
  });

  describe('copy control', () => {
    it('writes the displayed details and reverts the copied label after two seconds', async () => {
      vi.useFakeTimers();
      const writeText = vi.fn().mockResolvedValue(undefined);
      stubClipboard(writeText);

      renderDialog(<ErrorDialog open error="backend offline" onDismiss={noop} />);

      fireEvent.click(screen.getByRole('button', { name: 'Copy details' }));
      await act(async () => {});

      expect(writeText).toHaveBeenCalledWith('backend offline');
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument();
    });

    it('restarts the copied label timer on a repeated activation', async () => {
      vi.useFakeTimers();
      stubClipboard(vi.fn().mockResolvedValue(undefined));

      renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />);

      fireEvent.click(screen.getByRole('button', { name: 'Copy details' }));
      await act(async () => {});

      act(() => {
        vi.advanceTimersByTime(1500);
      });
      fireEvent.click(screen.getByRole('button', { name: 'Copied' }));
      await act(async () => {});

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument();
    });

    it('leaves the label unchanged and contains the rejection when the write fails', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denied'));
      stubClipboard(writeText);

      renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />);

      fireEvent.click(screen.getByRole('button', { name: 'Copy details' }));
      await act(async () => {});

      expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull();
    });

    it('renders no copy control when the clipboard is unavailable', () => {
      Reflect.deleteProperty(navigator, 'clipboard');

      renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />);

      expect(screen.queryByRole('button', { name: 'Copy details' })).toBeNull();
    });

    it('resets the copied label when the details change', async () => {
      vi.useFakeTimers();
      stubClipboard(vi.fn().mockResolvedValue(undefined));

      const view = renderDialog(<ErrorDialog open error="first" onDismiss={noop} />);
      fireEvent.click(screen.getByRole('button', { name: 'Copy details' }));
      await act(async () => {});
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

      view.rerender(wrapDialog(<ErrorDialog open error="second" onDismiss={noop} />));

      expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument();
    });

    it('resets the copied label when the dialog closes and reopens', async () => {
      vi.useFakeTimers();
      stubClipboard(vi.fn().mockResolvedValue(undefined));

      const view = renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />);
      fireEvent.click(screen.getByRole('button', { name: 'Copy details' }));
      await act(async () => {});
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

      view.rerender(wrapDialog(<ErrorDialog open={false} error="boom" onDismiss={noop} />));
      expect(screen.queryByRole('alertdialog')).toBeNull();

      view.rerender(wrapDialog(<ErrorDialog open error="boom" onDismiss={noop} />));
      expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument();
    });

    it('keeps the copy label when a write settles after the details changed', async () => {
      let settleWrite!: () => void;
      const writeText = vi.fn(
        () =>
          new Promise<void>(resolve => {
            settleWrite = resolve;
          })
      );
      stubClipboard(writeText);

      const view = renderDialog(<ErrorDialog open error="first" onDismiss={noop} />);
      fireEvent.click(screen.getByRole('button', { name: 'Copy details' }));

      view.rerender(wrapDialog(<ErrorDialog open error="second" onDismiss={noop} />));
      await act(async () => {
        settleWrite();
      });

      expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Copied' })).toBeNull();
    });
  });

  describe('string overrides', () => {
    it('merges partial overrides over the English defaults', () => {
      renderDialog(
        <ErrorDialog
          open
          error="boom"
          onDismiss={noop}
          onReload={noop}
          strings={{ title: 'Applicatiefout', close: 'Sluiten', detailsLabel: 'Foutdetails' }}
        />
      );

      expect(screen.getByRole('alertdialog', { name: 'Applicatiefout' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sluiten' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Foutdetails' })).toBeInTheDocument();
    });

    it('suppresses a text when its override is an empty string', () => {
      renderDialog(<ErrorDialog open error="boom" strings={{ subText: '' }} onDismiss={noop} />);

      expect(screen.queryByText(DEFAULT_SUB_TEXT)).toBeNull();
    });
  });

  describe('native props and theme', () => {
    it('merges native props onto the dialog surface and forwards the ref to it', () => {
      const ref = createRef<HTMLDivElement>();

      renderDialog(
        <ErrorDialog
          ref={ref}
          open
          error="boom"
          onDismiss={noop}
          className="caller-class"
          style={{ marginTop: '11px' }}
          data-testid="error-surface"
        />
      );

      const surface = screen.getByRole('alertdialog');

      expect(surface).toHaveClass('caller-class');
      expect(surface).toHaveStyle({ marginTop: '11px' });
      expect(screen.getByTestId('error-surface')).toBe(surface);
      expect(ref.current).toBe(surface);
    });

    it('renders an accessible alert dialog under the light theme', () => {
      renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />, webLightTheme);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('renders an accessible alert dialog under the dark theme', () => {
      renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />, webDarkTheme);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  describe('no side effects', () => {
    it('never reloads the page or issues a request during a full interaction cycle', async () => {
      const reload = vi.fn();
      const fetchStub = vi.fn();
      vi.stubGlobal('location', { reload });
      vi.stubGlobal('fetch', fetchStub);
      stubClipboard(vi.fn().mockResolvedValue(undefined));

      const onDismiss = vi.fn();
      const onReload = vi.fn();

      renderDialog(
        <ErrorDialog open error={new Error('boom')} onDismiss={onDismiss} onReload={onReload} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Copy details' }));
      await act(async () => {});
      fireEvent.click(screen.getByRole('button', { name: 'Reload page' }));
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
      fireEvent.click(getBackdrop());

      expect(reload).not.toHaveBeenCalled();
      expect(fetchStub).not.toHaveBeenCalled();
    });
  });

  describe('compile-time and untyped-consumer contract', () => {
    it('rejects the unauthorized variant without a sign-out handler at compile time', () => {
      // @ts-expect-error onSignOut is required for the unauthorized variant.
      render(wrapDialog(<ErrorDialog open kind="unauthorized" />));
    });

    it('rejects the error variant without a dismiss handler at compile time', () => {
      // @ts-expect-error onDismiss is required for the error variant.
      render(wrapDialog(<ErrorDialog open />));
    });

    it('renders an inert sign-out action for an untyped consumer that omits the handler', () => {
      // @ts-expect-error onSignOut is required for the unauthorized variant.
      render(wrapDialog(<ErrorDialog open kind="unauthorized" error="expired" />));

      const signOut = screen.getByRole('button', { name: 'Sign out' });

      expect(() => fireEvent.click(signOut)).not.toThrow();
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });
});
