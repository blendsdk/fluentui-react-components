import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { DeleteRegular } from '@fluentui/react-icons';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConfirmAction, ConfirmDialogProps } from '../src/index';
import { ConfirmDialog } from '../src/index';

/** A callback that does nothing; used where a test only cares that nothing throws. */
const noop = (): void => {};

/**
 * The explicit action set the actions-variant tests share.
 *
 * Declared as a literal tuple so the resolution callback can be pinned to the
 * exact union of the action values.
 */
const ACTIONS = [
  { value: 'cancel', label: 'Cancel' },
  { value: 'discard', label: 'Discard', intent: 'danger' },
  { value: 'save', label: 'Save', appearance: 'primary' },
] as const;

/**
 * Wraps a dialog in the theme provider the way an application mounts it.
 *
 * Every render goes through here because Fluent resolves its design tokens
 * from the provider's theme.
 */
function wrapDialog(dialog: ReactElement): ReactElement {
  return <FluentProvider theme={webLightTheme}>{dialog}</FluentProvider>;
}

/** Renders a dialog inside the theme provider and returns the render result. */
function renderDialog(dialog: ReactElement) {
  return render(wrapDialog(dialog));
}

/**
 * Returns the dialog's backdrop element.
 *
 * Fluent renders the surface and the backdrop into a portal on the document
 * body, a sibling of the container the test renders into, so the lookup goes
 * through the document rather than the render container.
 */
function getBackdrop(): HTMLElement {
  const backdrop = document.querySelector('.fui-DialogSurface__backdrop');
  if (!(backdrop instanceof HTMLElement)) {
    throw new Error('The dialog backdrop is not rendered.');
  }
  return backdrop;
}

/**
 * Returns an element's classes as a sorted list.
 *
 * Class order carries no meaning — Fluent merges the classes of every styling
 * layer in its own order — so sorted lists keep the assertions about which
 * classes are present and not about the order they were merged in.
 */
function classTokens(element: Element): string[] {
  return [...element.classList].sort();
}

/**
 * Class names whose stylesheet rules consume the danger tokens.
 *
 * Griffel compiles one style slot into atomic classes — one class per
 * declaration and pseudo-state — so a flagged action's danger styling is a
 * set of classes, not a single class name. The set is read back from the
 * injected stylesheets: every class whose rule consumes one of the danger
 * tokens through `var(...)` belongs to the danger recipe. (Rules that merely
 * define the tokens, such as the theme provider's, are not styling.)
 */
function dangerTokenClasses(): Set<string> {
  const names = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (!(rule instanceof CSSStyleRule)) {
        continue;
      }
      if (!/var\(--colorStatusDanger(Background3|ForegroundInverted)/.test(rule.cssText)) {
        continue;
      }
      for (const match of rule.selectorText.matchAll(/\.([A-Za-z0-9_-]+)/g)) {
        names.add(match[1]);
      }
    }
  }
  return names;
}

/**
 * Whether a class token is a Griffel development artifact.
 *
 * Griffel's development build adds `___`-prefixed merge-sequence classes that
 * encode the order in which style classes were merged; they change whenever
 * the merged set changes and carry no styling rules. Assertions about which
 * styling a render adds therefore ignore them.
 */
function isGriffelDebugClass(token: string): boolean {
  return token.startsWith('___');
}

/** Props of the invoker harness the focus-restoration tests share. */
type InvokerHostProps = {
  /** Whether the invoker button is mounted next to the dialog. */
  showInvoker: boolean;
  /** Whether the confirmation dialog is open. */
  open: boolean;
};

/**
 * Renders the dialog next to an invoker button that a test can remove from
 * the tree while the dialog is open.
 */
function InvokerHost(props: InvokerHostProps): ReactElement {
  const { showInvoker, open } = props;
  return (
    <>
      {showInvoker ? (
        <button type="button" data-testid="invoker">
          Open confirmation
        </button>
      ) : null}
      <ConfirmDialog open={open} title="Delete this record?" onResolve={noop} />
    </>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ConfirmDialog', () => {
  describe('visibility and alert semantics', () => {
    it('renders no alert dialog and reports nothing while closed', () => {
      const onResolve = vi.fn();

      renderDialog(
        <ConfirmDialog open={false} title="Delete this record?" onResolve={onResolve} />
      );

      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(onResolve).not.toHaveBeenCalled();
    });

    it('shows exactly one alert dialog named by the title', () => {
      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={noop} />);

      expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
      expect(screen.getByRole('alertdialog', { name: 'Delete this record?' })).toBeInTheDocument();
    });

    it('moves focus inside the dialog when it opens', () => {
      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={noop} />);

      const dialog = screen.getByRole('alertdialog');

      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('stays open and reports nothing when Escape is pressed', () => {
      const onResolve = vi.fn();

      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={onResolve} />);

      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(onResolve).not.toHaveBeenCalled();
    });

    it('stays open and reports nothing when the backdrop is clicked', () => {
      const onResolve = vi.fn();

      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={onResolve} />);

      fireEvent.click(getBackdrop());

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      expect(onResolve).not.toHaveBeenCalled();
    });
  });

  describe('default action pair', () => {
    it('renders the decline action before the confirm action and no other action', () => {
      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={noop} />);

      const buttons = screen.getAllByRole('button');

      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveAccessibleName('Cancel');
      expect(buttons[1]).toHaveAccessibleName('Confirm');
    });

    it('renders the decline action secondary and the confirm action primary', () => {
      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={noop} />);

      const decline = screen.getByRole('button', { name: 'Cancel' });
      const confirm = screen.getByRole('button', { name: 'Confirm' });

      // Both are Fluent buttons. The secondary appearance is Fluent's plain
      // button look and adds no classes of its own, while the primary
      // appearance layers its branding classes over the shared ones.
      expect(decline).toHaveClass('fui-Button');
      expect(confirm).toHaveClass('fui-Button');

      const declineClasses = classTokens(decline);
      const confirmClasses = classTokens(confirm);

      expect(confirmClasses).not.toEqual(declineClasses);
      expect(confirmClasses).toEqual(expect.arrayContaining(declineClasses));
    });

    it('reports true exactly once when the confirm action is activated and keeps the dialog open', () => {
      const onResolve = vi.fn();

      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={onResolve} />);

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(onResolve).toHaveBeenCalledTimes(1);
      expect(onResolve).toHaveBeenCalledWith(true);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('reports false exactly once when the decline action is activated', () => {
      const onResolve = vi.fn();

      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={onResolve} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onResolve).toHaveBeenCalledTimes(1);
      expect(onResolve).toHaveBeenCalledWith(false);
    });

    it('reports false again for a repeated decline activation', () => {
      const onResolve = vi.fn();

      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={onResolve} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onResolve).toHaveBeenCalledTimes(2);
      expect(onResolve).toHaveBeenNthCalledWith(1, false);
      expect(onResolve).toHaveBeenNthCalledWith(2, false);
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  describe('danger intent', () => {
    it('adds exactly the danger styling to the confirm action and changes nothing else', () => {
      const plain = renderDialog(
        <ConfirmDialog open title="Delete this record?" onResolve={noop} />
      );
      const plainConfirm = classTokens(screen.getByRole('button', { name: 'Confirm' })).filter(
        token => !isGriffelDebugClass(token)
      );
      const plainDecline = classTokens(screen.getByRole('button', { name: 'Cancel' }));
      const plainSurface = classTokens(screen.getByRole('alertdialog'));
      plain.unmount();

      renderDialog(
        <ConfirmDialog open title="Delete this record?" intent="danger" onResolve={noop} />
      );
      const dangerConfirm = classTokens(screen.getByRole('button', { name: 'Confirm' })).filter(
        token => !isGriffelDebugClass(token)
      );

      expect(classTokens(screen.getByRole('button', { name: 'Cancel' }))).toEqual(plainDecline);
      expect(classTokens(screen.getByRole('alertdialog'))).toEqual(plainSurface);

      const addedClasses = dangerConfirm.filter(token => !plainConfirm.includes(token));
      const removedClasses = plainConfirm.filter(token => !dangerConfirm.includes(token));

      expect(removedClasses).toEqual([]);
      expect(addedClasses.length).toBeGreaterThan(0);
      // The danger slot arrives as atomic classes, so the added set must be
      // exactly the classes whose rules carry the danger tokens.
      expect(new Set(addedClasses)).toEqual(dangerTokenClasses());
    });
  });

  describe('explicit actions', () => {
    it('renders the actions in array order and reports the activated value', () => {
      const onResolve = vi.fn();

      renderDialog(
        <ConfirmDialog open title="Delete this record?" actions={ACTIONS} onResolve={onResolve} />
      );

      const buttons = screen.getAllByRole('button');

      expect(buttons).toHaveLength(3);
      expect(buttons[0]).toHaveAccessibleName('Cancel');
      expect(buttons[1]).toHaveAccessibleName('Discard');
      expect(buttons[2]).toHaveAccessibleName('Save');

      fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

      expect(onResolve).toHaveBeenCalledTimes(1);
      expect(onResolve).toHaveBeenCalledWith('discard');
    });

    it('labels an action without a label with its value', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          actions={[{ value: 'save', label: '' }]}
          onResolve={noop}
        />
      );

      const save = screen.getByRole('button', { name: 'save' });

      expect(save.textContent).toBe('save');
    });

    it('labels an action with a whitespace-only label with its value', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          actions={[{ value: 'save', label: '  ' }]}
          onResolve={noop}
        />
      );

      const save = screen.getByRole('button', { name: 'save' });

      expect(save.textContent).toBe('save');
    });

    it('renders an element icon inside the button without affecting its accessible name', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          actions={[
            { value: 'cancel', label: 'Cancel' },
            { value: 'save', label: 'Save', icon: <span>glyph</span> },
          ]}
          onResolve={noop}
        />
      );

      const save = screen.getByRole('button', { name: 'Save' });
      const glyph = screen.getByText('glyph');

      expect(save.contains(glyph)).toBe(true);
      expect(glyph.closest('[aria-hidden="true"]')).not.toBeNull();
    });

    it('renders a Fluent icon inside the button without affecting its accessible name', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          actions={[
            { value: 'cancel', label: 'Cancel' },
            { value: 'save', label: 'Save', icon: <DeleteRegular /> },
          ]}
          onResolve={noop}
        />
      );

      const save = screen.getByRole('button', { name: 'Save' });
      const icon = save.querySelector('svg');
      if (icon === null) {
        throw new Error('The Fluent icon is not rendered inside the action button.');
      }

      expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  describe('string overrides', () => {
    it('replaces only the affirmative label', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          strings={{ confirm: 'Delete' }}
          onResolve={noop}
        />
      );

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
    });

    it('keeps the default affirmative label for an empty override', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          strings={{ confirm: '' }}
          onResolve={noop}
        />
      );

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('keeps the default affirmative label for a whitespace-only override', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          strings={{ confirm: '  ' }}
          onResolve={noop}
        />
      );

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });
  });

  describe('message', () => {
    it('renders the message with preserved line breaks', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          message={'line one\nline two'}
          onResolve={noop}
        />
      );

      const message = screen.getByText('line one line two');

      expect(getComputedStyle(message).whiteSpace).toBe('pre-line');
    });

    it('describes the dialog with the message element and drops the attribute without a message', () => {
      const view = renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          message="This removes the record permanently."
          onResolve={noop}
        />
      );

      const dialog = screen.getByRole('alertdialog');
      const describedBy = dialog.getAttribute('aria-describedby');
      if (describedBy === null) {
        throw new Error('The open dialog must reference its message element.');
      }

      expect(document.getElementById(describedBy)).toBe(
        screen.getByText('This removes the record permanently.')
      );

      view.rerender(
        wrapDialog(<ConfirmDialog open title="Delete this record?" onResolve={noop} />)
      );

      expect(screen.getByRole('alertdialog')).not.toHaveAttribute('aria-describedby');
    });

    it('keeps the caller-provided aria-describedby value', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          message="This removes the record permanently."
          aria-describedby="caller-id"
          onResolve={noop}
        />
      );

      expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-describedby', 'caller-id');
    });
  });

  describe('content safety', () => {
    it('renders title and message markup as literal text', () => {
      const titleMarkup = '<script>alert(1)</script>';
      const messageMarkup = '<img src=x onerror=alert(1)>';

      renderDialog(
        <ConfirmDialog open title={titleMarkup} message={messageMarkup} onResolve={noop} />
      );

      const dialog = screen.getByRole('alertdialog');

      expect(dialog.querySelector('script')).toBeNull();
      expect(dialog.querySelector('img')).toBeNull();
      expect(screen.getByText(titleMarkup)).toBeInTheDocument();
      expect(screen.getByText(messageMarkup)).toBeInTheDocument();
    });
  });

  describe('busy state', () => {
    it('disables every action while busy and reports nothing', () => {
      const onResolve = vi.fn();

      renderDialog(<ConfirmDialog open title="Delete this record?" busy onResolve={onResolve} />);

      const decline = screen.getByRole('button', { name: 'Cancel' });
      const confirm = screen.getByRole('button', { name: 'Confirm' });

      expect(decline).toBeDisabled();
      expect(confirm).toBeDisabled();

      fireEvent.click(decline);
      fireEvent.click(confirm);

      expect(onResolve).not.toHaveBeenCalled();
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('disables the actions and reports nothing when busy turns on after render', () => {
      const onResolve = vi.fn();
      const view = renderDialog(
        <ConfirmDialog open title="Delete this record?" onResolve={onResolve} />
      );

      view.rerender(
        wrapDialog(<ConfirmDialog open title="Delete this record?" busy onResolve={onResolve} />)
      );

      const decline = screen.getByRole('button', { name: 'Cancel' });
      const confirm = screen.getByRole('button', { name: 'Confirm' });

      expect(decline).toBeDisabled();
      expect(confirm).toBeDisabled();

      fireEvent.click(decline);
      fireEvent.click(confirm);

      expect(onResolve).not.toHaveBeenCalled();
    });

    it('moves focus to the dialog surface when busy turns on and leaves it there on later renders', () => {
      const view = renderDialog(
        <ConfirmDialog open title="Delete this record?" onResolve={noop} />
      );
      const confirm = screen.getByRole('button', { name: 'Confirm' });

      act(() => {
        confirm.focus();
      });
      expect(document.activeElement).toBe(confirm);

      view.rerender(
        wrapDialog(<ConfirmDialog open title="Delete this record?" busy onResolve={noop} />)
      );

      const dialog = screen.getByRole('alertdialog');
      expect(document.activeElement).toBe(dialog);

      view.rerender(
        wrapDialog(
          <ConfirmDialog
            open
            title="Delete this record?"
            busy
            data-testid="unrelated"
            onResolve={noop}
          />
        )
      );

      expect(document.activeElement).toBe(dialog);
    });
  });

  describe('focus restoration', () => {
    it('returns focus to the invoker when the dialog closes', async () => {
      const view = renderDialog(<InvokerHost showInvoker open={false} />);
      const invoker = screen.getByTestId('invoker');

      act(() => {
        invoker.focus();
      });
      expect(document.activeElement).toBe(invoker);

      view.rerender(wrapDialog(<InvokerHost showInvoker open />));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      view.rerender(wrapDialog(<InvokerHost showInvoker open={false} />));

      await waitFor(() => {
        expect(document.activeElement).toBe(invoker);
      });
    });

    it('copes when the invoker is removed while the dialog is open', () => {
      const view = renderDialog(<InvokerHost showInvoker open={false} />);
      const invoker = screen.getByTestId('invoker');

      act(() => {
        invoker.focus();
      });

      view.rerender(wrapDialog(<InvokerHost showInvoker open />));
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();

      view.rerender(wrapDialog(<InvokerHost showInvoker={false} open />));
      expect(invoker.isConnected).toBe(false);

      // A detached focus target must be recognized as gone: the restore path
      // must not even attempt to focus it (jsdom ignores focus on detached
      // elements, so only the spy can discriminate the guard).
      const focusSpy = vi.spyOn(invoker, 'focus');

      expect(() => {
        view.rerender(wrapDialog(<InvokerHost showInvoker={false} open={false} />));
      }).not.toThrow();

      expect(focusSpy).not.toHaveBeenCalled();
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(document.activeElement).not.toBe(invoker);
    });
  });

  describe('native props', () => {
    it('merges native props onto the surface element and forwards the ref to it', () => {
      const ref = createRef<HTMLDivElement>();
      const view = renderDialog(
        <ConfirmDialog open title="Delete this record?" onResolve={noop} />
      );
      const plainSurface = classTokens(screen.getByRole('alertdialog'));

      view.rerender(
        wrapDialog(
          <ConfirmDialog
            ref={ref}
            open
            title="Delete this record?"
            onResolve={noop}
            className="custom"
            style={{ maxWidth: '700px' }}
            data-testid="confirm-surface"
          />
        )
      );

      const surface = screen.getByTestId('confirm-surface');

      expect(surface).toBe(screen.getByRole('alertdialog'));
      expect(classTokens(surface)).toEqual([...plainSurface, 'custom'].sort());
      expect(surface).toHaveStyle({ maxWidth: '700px' });
      expect(ref.current).toBe(surface);
    });
  });

  describe('compile-time contract', () => {
    // The negative pins below assert through the type checker: each
    // `@ts-expect-error` fails the type-check as soon as its construct stops
    // being an error. The constructs stay on one line so a directive provably
    // covers its whole statement, and minimal props keep those lines short.

    it('accepts a variable of the declared props union', () => {
      const props: ConfirmDialogProps = {
        open: true,
        title: 'Delete this record?',
        onResolve: noop,
      };

      renderDialog(<ConfirmDialog {...props} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('accepts a callback typed for exactly the literal action values', () => {
      const onResolveValues = (value: 'cancel' | 'discard' | 'save'): void => {
        void value;
      };

      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          actions={ACTIONS}
          onResolve={onResolveValues}
        />
      );

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('rejects a callback typed for foreign action values', () => {
      const foreign = (value: 'other'): void => {
        void value;
      };

      // @ts-expect-error a callback typed for foreign values cannot resolve these actions
      void (<ConfirmDialog open title="t" actions={ACTIONS} onResolve={foreign} />);
    });

    it('rejects the pair-only intent prop combined with actions', () => {
      // @ts-expect-error the danger intent applies to the default pair, not to explicit actions
      void (<ConfirmDialog open title="t" actions={ACTIONS} intent="danger" onResolve={noop} />);
    });

    it('rejects a plain action array', () => {
      const plainActions: ConfirmAction[] = [{ value: 'save', label: 'Save' }];

      // @ts-expect-error a plain array is not the non-empty action tuple
      void (<ConfirmDialog open title="t" actions={plainActions} onResolve={noop} />);
    });

    it('falls back to the default pair when an untyped consumer passes an empty action list', () => {
      const onResolve = vi.fn();

      // @ts-expect-error an empty array deliberately bypasses the non-empty action tuple
      renderDialog(<ConfirmDialog open title="t" actions={[]} onResolve={onResolve} />);

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(onResolve).toHaveBeenCalledTimes(1);
      expect(onResolve).toHaveBeenCalledWith(true);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onResolve).toHaveBeenCalledTimes(2);
      expect(onResolve).toHaveBeenLastCalledWith(false);
    });
  });

  describe('no side effects', () => {
    it('never fetches and never touches storage during a full interaction cycle', () => {
      const fetchStub = vi.fn();
      vi.stubGlobal('fetch', fetchStub);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      // Prove the storage guard intercepts calls before trusting the
      // negative assertions below.
      localStorage.setItem('confirm-dialog-probe', '1');
      expect(setItemSpy).toHaveBeenCalledTimes(1);
      setItemSpy.mockClear();

      const onResolve = vi.fn();

      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={onResolve} />);

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
      fireEvent.click(getBackdrop());

      expect(fetchStub).not.toHaveBeenCalled();
      expect(setItemSpy).not.toHaveBeenCalled();
      expect(getItemSpy).not.toHaveBeenCalled();

      localStorage.removeItem('confirm-dialog-probe');
    });
  });
});
