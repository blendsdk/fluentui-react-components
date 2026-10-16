import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ReactElement } from 'react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../src/index';

/** A callback that does nothing; used where a test only cares that nothing throws. */
const noop = (): void => {};

/** Wraps a dialog in the theme provider the way an application mounts it. */
function wrapDialog(dialog: ReactElement): ReactElement {
  return <FluentProvider theme={webLightTheme}>{dialog}</FluentProvider>;
}

/** Renders a dialog inside the theme provider and returns the render result. */
function renderDialog(dialog: ReactElement) {
  return render(wrapDialog(dialog));
}

/** Reads the file at a path relative to the repository's package source. */
function readSource(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');
}

/** A style rule found in the document's stylesheets. */
type CssRule = {
  selector: string;
  background: string;
  color: string;
};

/**
 * Collects the emitted danger rules.
 *
 * The danger recipe is the set of rules that both guard on the enabled state
 * and consume a danger background token; reading them back from the injected
 * stylesheets is the only way to prove the declarations were emitted with
 * the selector shapes the contract requires.
 */
function readDangerRules(): CssRule[] {
  const found: CssRule[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (!(rule instanceof CSSStyleRule) || !rule.selectorText.includes('aria-disabled')) {
        continue;
      }
      const background = rule.style.getPropertyValue('background-color');
      const color = rule.style.getPropertyValue('color');
      if (!background.includes('colorStatusDanger') && !color.includes('colorStatusDanger')) {
        continue;
      }
      found.push({
        selector: rule.selectorText,
        background,
        color,
      });
    }
  }
  return found;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ConfirmDialog internals', () => {
  describe('danger recipe', () => {
    it('emits the four guarded selectors with the danger tokens', () => {
      renderDialog(
        <ConfirmDialog open title="Delete this record?" intent="danger" onResolve={noop} />
      );

      const rules = readDangerRules();

      // Griffel is per-declaration atomic: the background and the foreground
      // of one state arrive as separate rules; merge them by state suffix.
      const states = new Map<string, { background: string; color: string }>();
      const guard = ':enabled:not([aria-disabled="true"])';
      for (const rule of rules) {
        const guardIndex = rule.selector.indexOf(guard);
        if (guardIndex === -1) {
          continue;
        }
        const suffix = rule.selector.slice(guardIndex + guard.length);
        const entry = states.get(suffix) ?? { background: '', color: '' };
        states.set(suffix, {
          background: entry.background || rule.background,
          color: entry.color || rule.color,
        });
      }

      expect([...states.keys()].sort()).toEqual(
        [':hover', ':hover:active', ':active:focus-visible', ''].sort()
      );

      expect(states.get('')?.background).toContain('colorStatusDangerBackground3');
      expect(states.get(':hover')?.background).toContain('colorStatusDangerBackground3Hover');
      expect(states.get(':hover:active')?.background).toContain(
        'colorStatusDangerBackground3Pressed'
      );
      expect(states.get(':active:focus-visible')?.background).toContain(
        'colorStatusDangerBackground3Pressed'
      );

      for (const entry of states.values()) {
        expect(entry.color).toContain('colorStatusDangerForegroundInverted');
      }
    });

    it('applies the emitted classes to the flagged button and stays off the pair without danger', () => {
      const dangerView = renderDialog(
        <ConfirmDialog open title="Delete this record?" intent="danger" onResolve={noop} />
      );

      const dangerRules = readDangerRules();
      const dangerClasses = dangerRules
        .map(rule => rule.selector.split(':')[0].replace(/^\./, ''))
        .filter(className => className.length > 0);
      const flagged = screen.getByRole('button', { name: 'Confirm' });

      expect(dangerClasses.length).toBeGreaterThan(0);
      for (const className of dangerClasses) {
        expect(flagged.classList.contains(className)).toBe(true);
      }

      dangerView.unmount();

      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={noop} />);

      const plainConfirm = screen.getByRole('button', { name: 'Confirm' });
      for (const className of dangerClasses) {
        expect(plainConfirm.classList.contains(className)).toBe(false);
      }
    });
  });

  describe('label fallbacks', () => {
    it('keeps the decline default for a blank override', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          strings={{ decline: '   ' }}
          onResolve={noop}
        />
      );

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('falls back per action when a custom set mixes blank and non-blank labels', () => {
      renderDialog(
        <ConfirmDialog
          open
          title="Delete this record?"
          actions={[
            { value: 'alpha', label: '' },
            { value: 'beta', label: 'Beta' },
          ]}
          onResolve={noop}
        />
      );

      expect(screen.getByRole('button', { name: 'alpha' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument();
    });
  });

  describe('accessibility wiring', () => {
    it('keeps the description pointing at the current message element across renders', () => {
      const view = renderDialog(
        <ConfirmDialog open title="Delete this record?" message="first" onResolve={noop} />
      );

      const firstDialog = screen.getByRole('alertdialog');
      const firstId = firstDialog.getAttribute('aria-describedby');
      expect(firstId).not.toBeNull();
      expect(document.getElementById(firstId ?? '')?.textContent).toBe('first');

      view.rerender(
        wrapDialog(
          <ConfirmDialog open title="Delete this record?" message="second" onResolve={noop} />
        )
      );

      const secondDialog = screen.getByRole('alertdialog');
      const secondId = secondDialog.getAttribute('aria-describedby');
      expect(document.getElementById(secondId ?? '')?.textContent).toBe('second');
    });
  });

  describe('focus effect conditions', () => {
    it('leaves focus alone when busy turns on while focus is outside the dialog', () => {
      const view = renderDialog(
        <>
          <button type="button" data-testid="outside">
            Outside
          </button>
          <ConfirmDialog open title="Delete this record?" onResolve={noop} />
        </>
      );

      const outside = screen.getByTestId('outside');
      act(() => {
        outside.focus();
      });
      expect(document.activeElement).toBe(outside);

      view.rerender(
        wrapDialog(
          <>
            <button type="button" data-testid="outside">
              Outside
            </button>
            <ConfirmDialog open title="Delete this record?" busy onResolve={noop} />
          </>
        )
      );

      expect(document.activeElement).toBe(outside);
    });

    it('restores the open-time capture, not the last focused element', () => {
      const view = renderDialog(
        <>
          <button type="button" data-testid="invoker">
            Invoker
          </button>
          <ConfirmDialog open={false} title="Delete this record?" onResolve={noop} />
        </>
      );

      const invoker = screen.getByTestId('invoker');
      act(() => {
        invoker.focus();
      });

      view.rerender(
        wrapDialog(
          <>
            <button type="button" data-testid="invoker">
              Invoker
            </button>
            <ConfirmDialog open title="Delete this record?" onResolve={noop} />
          </>
        )
      );

      const confirm = screen.getByRole('button', { name: 'Confirm' });
      act(() => {
        confirm.focus();
      });

      view.rerender(
        wrapDialog(
          <>
            <button type="button" data-testid="invoker">
              Invoker
            </button>
            <ConfirmDialog open={false} title="Delete this record?" onResolve={noop} />
          </>
        )
      );

      expect(document.activeElement).toBe(invoker);
    });

    it('does not move focus when busy turns off', () => {
      const view = renderDialog(
        <ConfirmDialog open title="Delete this record?" busy onResolve={noop} />
      );

      const surface = screen.getByRole('alertdialog');
      expect(document.activeElement).toBe(surface);

      const outside = document.createElement('button');
      document.body.appendChild(outside);
      act(() => {
        outside.focus();
      });

      view.rerender(
        wrapDialog(<ConfirmDialog open title="Delete this record?" onResolve={noop} />)
      );

      expect(document.activeElement).toBe(outside);
      outside.remove();
    });
  });

  describe('ref and class handling', () => {
    it('reports the surface element to a callback ref and clears it on unmount', () => {
      const ref = vi.fn();

      const view = renderDialog(
        <ConfirmDialog ref={ref} open title="Delete this record?" onResolve={noop} />
      );

      const surface = screen.getByRole('alertdialog');
      expect(ref).toHaveBeenLastCalledWith(surface);

      view.unmount();
      expect(ref).toHaveBeenLastCalledWith(null);
    });

    it('carries the caller class alongside the component surface classes', () => {
      const ref = createRef<HTMLDivElement>();

      renderDialog(
        <ConfirmDialog
          ref={ref}
          open
          title="Delete this record?"
          className="caller-class"
          onResolve={noop}
        />
      );

      const className = ref.current?.className ?? '';
      // Griffel orders merged classes by its own buckets, so the observable
      // contract is co-presence: the caller class and at least one component
      // class both apply to the surface.
      const tokens = className.split(/\s+/).filter(token => !token.startsWith('___'));
      expect(tokens).toContain('caller-class');
      expect(tokens.length).toBeGreaterThan(1);
    });
  });

  describe('dependency hygiene', () => {
    it('imports no v8 artifacts and keeps the dependency set unchanged', () => {
      const sources = [
        '../src/components/ConfirmDialog/ConfirmDialog.tsx',
        '../src/components/ConfirmDialog/ConfirmDialog.types.ts',
        '../src/components/ConfirmDialog/useConfirmDialog.ts',
        '../src/components/ConfirmDialog/useConfirmDialogStyles.styles.ts',
        '../src/components/ConfirmDialog/renderConfirmDialog.tsx',
        '../src/components/ConfirmDialog/ConfirmDialog.stories.tsx',
        '../src/components/ConfirmDialog/index.ts',
        '../src/index.ts',
        './confirm-dialog.spec.test.tsx',
        './confirm-dialog.impl.test.tsx',
        './package-exports.spec.test.ts',
      ];

      for (const source of sources) {
        const content = readSource(source);
        expect(content).not.toMatch(/from\s+['"]@fluentui\/react['"]/);
        expect(content).not.toMatch(/require\(\s*['"]@fluentui\/react['"]\s*\)/);
      }

      const manifest = JSON.parse(readSource('../package.json')) as {
        peerDependencies?: Record<string, string>;
        dependencies?: Record<string, string>;
      };
      expect(manifest.dependencies?.['@fluentui/react']).toBeUndefined();
      expect(manifest.peerDependencies?.['@fluentui/react']).toBeUndefined();
    });
  });

  describe('controlled activation', () => {
    it('keeps the dialog mounted and reports nothing extra on a backdrop click', () => {
      const onResolve = vi.fn();

      renderDialog(<ConfirmDialog open title="Delete this record?" onResolve={onResolve} />);

      const backdrop = document.querySelector('.fui-DialogSurface__backdrop');
      if (!(backdrop instanceof HTMLElement)) {
        throw new Error('The dialog backdrop is not rendered.');
      }

      fireEvent.click(backdrop);

      expect(onResolve).not.toHaveBeenCalled();
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });
});
