import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorDialog } from '../src/index';
import { serializeError } from '../src/components/ErrorDialog/serializeError';

/** A callback that does nothing; used where a test only cares that nothing throws. */
const noop = (): void => {};

/**
 * Wraps a dialog in the theme provider the way an application mounts it.
 */
function wrapDialog(dialog: ReactElement): ReactElement {
  return <FluentProvider theme={webLightTheme}>{dialog}</FluentProvider>;
}

/** Renders a dialog inside the theme provider and returns the render result. */
function renderDialog(dialog: ReactElement) {
  return render(wrapDialog(dialog));
}

/**
 * Installs a stub clipboard on the navigator for the current test.
 *
 * jsdom provides no clipboard API; the file's afterEach hook removes the stub
 * again so tests stay independent of their execution order.
 */
function stubClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

/**
 * Reads the dialog's title element.
 *
 * Dialog titles carry a stable Fluent class name, which makes the lookup
 * independent of the heading level the component happens to render.
 */
function readTitle(): Element {
  const title = document.querySelector('.fui-DialogTitle');
  if (title === null) {
    throw new Error('The dialog title is not rendered.');
  }
  return title;
}

afterEach(() => {
  // Restore spies before the fake timers, so the real implementations return.
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('ErrorDialog internals', () => {
  describe('serializeError', () => {
    it('marks a shared reference as circular within one serialization', () => {
      const shared = { id: 1 };

      const serialized = serializeError({ left: shared, right: shared });

      // The replacer marks any object it has seen before within the same call,
      // so a second reference to the same object reads as a circular one.
      expect(JSON.parse(serialized as string)).toEqual({
        left: { id: 1 },
        right: '[Circular]',
      });
    });

    it('serializes the same value identically on repeated calls', () => {
      const value: Record<string, unknown> = { id: 1 };
      value.self = value;

      const first = serializeError(value);
      const second = serializeError(value);

      // The circular-reference bookkeeping is created per call, so the
      // second serialization starts fresh instead of remembering the first.
      expect(first).toContain('"[Circular]"');
      expect(second).toBe(first);
    });

    it('omits the stack for error-like values without one', () => {
      const serialized = serializeError({ name: 'X', message: 'Y' });

      expect(JSON.parse(serialized as string)).toEqual({ name: 'X', message: 'Y' });
    });

    it('keeps colliding name, message and stack keys single', () => {
      const serialized = serializeError({ name: 'N', message: 'M', stack: 'S' }) as string;

      // The named keys are written once even though the source object carries
      // them as own enumerable properties too.
      expect(serialized.match(/"name"/g)).toHaveLength(1);
      expect(serialized.match(/"message"/g)).toHaveLength(1);
      expect(serialized.match(/"stack"/g)).toHaveLength(1);
      expect(JSON.parse(serialized)).toEqual({ name: 'N', message: 'M', stack: 'S' });
    });

    it('keeps an own __proto__ key as a plain field', () => {
      // JSON payloads can carry an own `__proto__` key; building the
      // structured object must keep it as a visible field instead of
      // letting it reach the prototype setter.
      const errorLike = JSON.parse('{"name": "E", "message": "M", "__proto__": {"x": 1}}') as {
        name: string;
        message: string;
      };

      const serialized = serializeError(errorLike) as string;
      const parsed = JSON.parse(serialized) as Record<string, unknown>;

      expect(Object.getOwnPropertyDescriptor(parsed, '__proto__')?.value).toEqual({ x: 1 });
      expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    });

    it('maps nested bigints, functions and cycles at any depth', () => {
      const leaf: Record<string, unknown> = { big: 10n, fn: () => undefined };
      leaf.inner = { again: leaf };

      const serialized = serializeError(leaf);

      expect(JSON.parse(serialized as string)).toEqual({
        big: '10',
        fn: '[Function]',
        inner: { again: '[Circular]' },
      });
    });

    it('returns no text when every serialization step fails', () => {
      const hostile = {
        get boom(): string {
          throw new Error('cannot serialize');
        },
        toString(): string {
          throw new Error('cannot stringify');
        },
      };

      expect(serializeError(hostile)).toBeUndefined();
    });
  });

  describe('copy state machine', () => {
    it('clears the pending confirmation timer on unmount', async () => {
      vi.useFakeTimers();
      stubClipboard(vi.fn().mockResolvedValue(undefined));
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      const view = renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />);
      fireEvent.click(screen.getByRole('button', { name: 'Copy details' }));
      await act(async () => {});

      const confirmations = setTimeoutSpy.mock.calls
        .map((call, index) => ({ delay: call[1], id: setTimeoutSpy.mock.results[index]?.value }))
        .filter(entry => entry.delay === 2000);
      const confirmation = confirmations[confirmations.length - 1];
      expect(confirmation).toBeDefined();

      view.unmount();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(confirmation?.id);
    });

    it('contains a clipboard write that throws synchronously', () => {
      const writeText = vi.fn(() => {
        throw new Error('broken clipboard');
      });
      stubClipboard(writeText);

      renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />);

      expect(() =>
        fireEvent.click(screen.getByRole('button', { name: 'Copy details' }))
      ).not.toThrow();
      expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument();
    });

    it('detects clipboard availability once at mount', () => {
      const view = renderDialog(<ErrorDialog open error="first" onDismiss={noop} />);
      expect(screen.queryByRole('button', { name: 'Copy details' })).toBeNull();

      // The availability check runs in a mount effect: a clipboard that
      // appears after mount does not bring the control in on a re-render...
      stubClipboard(vi.fn().mockResolvedValue(undefined));
      view.rerender(wrapDialog(<ErrorDialog open error="second" onDismiss={noop} />));
      expect(screen.queryByRole('button', { name: 'Copy details' })).toBeNull();

      // ...but a fresh mount finds it.
      view.unmount();
      renderDialog(<ErrorDialog open error="first" onDismiss={noop} />);
      expect(screen.getByRole('button', { name: 'Copy details' })).toBeInTheDocument();
    });
  });

  describe('styles', () => {
    it('caps the surface at 700 px and colors the title with the danger token', () => {
      renderDialog(<ErrorDialog open error="boom" onDismiss={noop} />);

      const surface = screen.getByRole('alertdialog');

      // jsdom resolves the Griffel classes attached to the elements, so the
      // computed values prove the component's own rules win the cascade.
      expect(getComputedStyle(surface).maxWidth).toBe('700px');
      expect(getComputedStyle(readTitle()).color).toBe('var(--colorPaletteRedForeground1)');
    });

    it('references no literal colors in the styles module', () => {
      // The tests run with the package as the working directory, so the
      // styles module resolves from the package root.
      const source = readFileSync(
        resolve('src/components/ErrorDialog/useErrorDialogStyles.styles.ts'),
        'utf8'
      );

      expect(source).toContain('tokens.colorPaletteRedForeground1');
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    });
  });
});
