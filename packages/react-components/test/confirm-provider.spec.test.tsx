import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConfirmOptions, ConfirmOptionsWithActions, ConfirmProviderProps } from '../src/index';
import { ConfirmProvider, useConfirm } from '../src/index';

/**
 * The imperative API the hook returns.
 *
 * Mirrors the overloads the provider contract promises: a pair request
 * resolves a boolean, an explicit action set resolves the chosen literal
 * value.
 */
type ConfirmApi = {
  (options: ConfirmOptions): Promise<boolean>;
  <V extends string>(options: ConfirmOptionsWithActions<V>): Promise<V>;
};

/** Mutable slot holding the hook API captured by the harness child. */
type ConfirmRef = { current: ConfirmApi | undefined };

/**
 * The explicit action set the action-mode tests share.
 *
 * Declared as a literal tuple so the promise is pinned to the exact union of
 * the action values at the call site.
 */
const ACTIONS = [
  { value: 'cancel', label: 'Cancel' },
  { value: 'discard', label: 'Discard', intent: 'danger' },
  { value: 'save', label: 'Save', appearance: 'primary' },
] as const;

/**
 * Mounts the provider around a harness child that captures the hook API and
 * renders caller-provided content.
 *
 * Every render goes through the theme provider the way an application mounts
 * it, so the dialog resolves its design tokens from the theme.
 */
function renderProvider(
  build: (confirmRef: ConfirmRef) => ReactElement,
  props: Omit<ConfirmProviderProps, 'children'> = {}
): { view: ReturnType<typeof render>; confirmRef: ConfirmRef } {
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

/**
 * Returns the hook API captured by the harness child.
 *
 * Reading it before a harness render is a test bug, so it fails loudly
 * instead of returning an unusable value.
 */
function getConfirm(confirmRef: ConfirmRef): ConfirmApi {
  if (confirmRef.current === undefined) {
    throw new Error('The confirm API was not captured.');
  }
  return confirmRef.current;
}

/** Calls the hook without any provider above it, to exercise the misuse contract. */
function OutsideConsumer(): ReactElement {
  useConfirm();
  return <span>unreachable</span>;
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

/**
 * Installs a fetch spy, stubbing a bare mock when the environment has no fetch.
 *
 * The suite-wide teardown removes spies and stubs after each test, so the
 * environment is restored automatically.
 */
function installFetchSpy() {
  if (typeof globalThis.fetch === 'function') {
    return vi.spyOn(globalThis, 'fetch');
  }
  const stub = vi.fn();
  vi.stubGlobal('fetch', stub);
  return stub;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ConfirmProvider', () => {
  describe('mounting and idle state', () => {
    it('renders the child markup where it was placed without adding a wrapper element', () => {
      const { container } = renderProvider(() => <span data-testid="child">child content</span>);

      const child = screen.getByTestId('child');
      const providerRoot = container.firstElementChild;

      // The provider adds no element of its own: the child sits directly
      // under the theme provider's root, which is the only wrapper in the
      // tree.
      expect(child.parentElement).toBe(providerRoot);
      expect(providerRoot?.children).toHaveLength(1);
    });

    it('shows no alert dialog while no request is pending', () => {
      renderProvider(() => <span />);

      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });

  describe('pair requests', () => {
    it('resolves true and removes the dialog when the confirm action is activated', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      let request!: Promise<boolean>;

      act(() => {
        request = getConfirm(confirmRef)({ title: 'Delete?' });
      });

      expect(screen.getByRole('alertdialog', { name: 'Delete?' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await expect(request).resolves.toBe(true);
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('resolves false and removes the dialog when the decline action is activated', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      let request!: Promise<boolean>;

      act(() => {
        request = getConfirm(confirmRef)({ title: 'Delete?' });
      });

      expect(screen.getByRole('alertdialog', { name: 'Delete?' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await expect(request).resolves.toBe(false);
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });

  describe('action requests', () => {
    it('renders the action set in order and resolves the activated literal value', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      let request!: Promise<'cancel' | 'discard' | 'save'>;

      act(() => {
        request = getConfirm(confirmRef)({ title: 'Save your changes?', actions: ACTIONS });
      });

      const buttons = screen.getAllByRole('button');

      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveAccessibleName('Cancel');
      expect(buttons[1]).toHaveAccessibleName('Discard');
      expect(buttons[2]).toHaveAccessibleName('Save');

      fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

      await expect(request).resolves.toBe('discard');
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('falls back to the confirm/decline pair when an untyped caller passes an empty action list', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      let request!: Promise<boolean>;

      act(() => {
        request = getConfirm(confirmRef)({
          title: 'Delete?',
          // @ts-expect-error an empty array deliberately bypasses the non-empty action tuple
          actions: [],
        });
      });

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await expect(request).resolves.toBe(true);
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });

  describe('replacement', () => {
    it('resolves the superseded request false and keeps only the newer dialog', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      const confirm = getConfirm(confirmRef);
      let first!: Promise<boolean>;
      let second!: Promise<boolean>;

      act(() => {
        first = confirm({ title: 'First?' });
      });
      expect(screen.getByRole('alertdialog', { name: 'First?' })).toBeInTheDocument();

      act(() => {
        second = confirm({ title: 'Second?' });
      });

      // The superseded request reports "not confirmed" without any user action.
      await expect(first).resolves.toBe(false);

      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      expect(screen.getByRole('alertdialog', { name: 'Second?' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await expect(second).resolves.toBe(true);
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });

  describe('unmount settlement', () => {
    it('resolves a pending request false when the provider unmounts', async () => {
      const { view, confirmRef } = renderProvider(() => <span />);
      let request!: Promise<boolean>;

      act(() => {
        request = getConfirm(confirmRef)({ title: 'Delete?' });
      });
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      view.unmount();

      await expect(request).resolves.toBe(false);
    });
  });

  describe('hook misuse', () => {
    it('throws an error naming the hook and the provider when used outside any provider', () => {
      // React logs the failed render; silence it so the run output stays readable.
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const thrown = captureRenderError(() => {
        render(<OutsideConsumer />);
      });

      expect(thrown).toBeInstanceOf(Error);
      expect(asError(thrown).message).toMatch(/useConfirm/);
      expect(asError(thrown).message).toMatch(/ConfirmProvider/);
    });
  });

  describe('string resolution', () => {
    it('applies the provider labels to every dialog the provider shows', async () => {
      const { confirmRef } = renderProvider(() => <span />, {
        strings: { confirm: 'Yes', decline: 'No' },
      });
      const confirm = getConfirm(confirmRef);
      let first!: Promise<boolean>;
      let second!: Promise<boolean>;

      act(() => {
        first = confirm({ title: 'Delete?' });
      });

      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await expect(first).resolves.toBe(true);

      act(() => {
        second = confirm({ title: 'Delete?' });
      });

      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      await expect(second).resolves.toBe(false);
    });

    it('lets a non-blank per-call override win key by key over the provider labels', async () => {
      const { confirmRef } = renderProvider(() => <span />, {
        strings: { confirm: 'Yes', decline: 'No' },
      });
      let request!: Promise<boolean>;

      act(() => {
        request = getConfirm(confirmRef)({
          title: 'Delete?',
          strings: { confirm: 'Delete' },
        });
      });

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Yes' })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await expect(request).resolves.toBe(true);
    });

    it('falls back to the provider label for a blank per-call override', async () => {
      const { confirmRef } = renderProvider(() => <span />, {
        strings: { confirm: 'Yes', decline: 'No' },
      });
      const confirm = getConfirm(confirmRef);
      let empty!: Promise<boolean>;
      let blank!: Promise<boolean>;

      act(() => {
        empty = confirm({ title: 'Delete?', strings: { confirm: '' } });
      });

      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      await expect(empty).resolves.toBe(false);

      act(() => {
        blank = confirm({ title: 'Delete?', strings: { confirm: '  ' } });
      });

      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      await expect(blank).resolves.toBe(false);
    });

    it('applies the English defaults when neither the provider nor the per-call strings set a label', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      const confirm = getConfirm(confirmRef);
      let override!: Promise<boolean>;
      let blank!: Promise<boolean>;

      act(() => {
        override = confirm({ title: 'Delete?', strings: { confirm: 'Delete' } });
      });

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await expect(override).resolves.toBe(false);

      act(() => {
        blank = confirm({ title: 'Delete?', strings: { confirm: '  ' } });
      });

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      await expect(blank).resolves.toBe(true);
    });
  });

  describe('alert semantics', () => {
    it('keeps the dialog and the pending request when Escape is pressed', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      let request!: Promise<boolean>;

      act(() => {
        request = getConfirm(confirmRef)({ title: 'Delete?' });
      });

      let settled = false;
      request.then(() => {
        settled = true;
      });

      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
      await act(async () => {});

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(settled).toBe(false);

      // The request stays pending, so the flow is finished through an
      // activation instead of leaving the await dangling.
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      await expect(request).resolves.toBe(true);
    });
  });

  describe('no side effects', () => {
    it('never touches fetch or storage while activation and replacement flows settle', async () => {
      const fetchMock = installFetchSpy();
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      // Prove the storage guard intercepts calls before trusting the negative
      // assertions below.
      localStorage.setItem('confirm-provider-probe', '1');
      expect(setItemSpy).toHaveBeenCalledTimes(1);
      setItemSpy.mockClear();

      const { confirmRef } = renderProvider(() => <span />);
      const confirm = getConfirm(confirmRef);

      // Activation flow: one confirmed request, then one declined request.
      let accepted!: Promise<boolean>;
      let declined!: Promise<boolean>;

      act(() => {
        accepted = confirm({ title: 'Delete?' });
      });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      await expect(accepted).resolves.toBe(true);

      act(() => {
        declined = confirm({ title: 'Delete?' });
      });
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await expect(declined).resolves.toBe(false);

      // Replacement flow: a second request replaces the first while it is open.
      let superseded!: Promise<boolean>;
      let replacement!: Promise<boolean>;

      act(() => {
        superseded = confirm({ title: 'First?' });
      });
      act(() => {
        replacement = confirm({ title: 'Second?' });
      });

      await expect(superseded).resolves.toBe(false);

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      await expect(replacement).resolves.toBe(true);
      expect(screen.queryByRole('alertdialog')).toBeNull();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(setItemSpy).not.toHaveBeenCalled();
      expect(getItemSpy).not.toHaveBeenCalled();

      localStorage.removeItem('confirm-provider-probe');
    });
  });

  describe('same-tick requests', () => {
    it('keeps only the latest dialog and resolves the first promise false when two requests start in one tick', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      const confirm = getConfirm(confirmRef);
      let first!: Promise<boolean>;
      let second!: Promise<boolean>;

      act(() => {
        first = confirm({ title: 'First?' });
        second = confirm({ title: 'Second?' });
      });

      await expect(first).resolves.toBe(false);

      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      expect(screen.getByRole('alertdialog', { name: 'Second?' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await expect(second).resolves.toBe(true);
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('keeps the newer dialog and settles its promise when a request starts in the same dispatch as an activation', async () => {
      const { confirmRef } = renderProvider(() => <span />);
      const confirm = getConfirm(confirmRef);
      let activated!: Promise<boolean>;
      let followUp!: Promise<boolean>;

      act(() => {
        activated = confirm({ title: 'First?' });
      });
      expect(screen.getByRole('alertdialog', { name: 'First?' })).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        followUp = confirm({ title: 'Second?' });
      });

      await expect(activated).resolves.toBe(true);

      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      expect(screen.getByRole('alertdialog', { name: 'Second?' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await expect(followUp).resolves.toBe(true);
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });
});
