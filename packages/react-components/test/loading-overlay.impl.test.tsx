import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoadingOverlay } from '../src/index';

/** Wraps a subtree in the theme provider the way an application mounts it. */
function wrap(element: ReactElement): ReactElement {
  return <FluentProvider theme={webLightTheme}>{element}</FluentProvider>;
}

/** Renders a subtree inside the theme provider. */
function renderOverlay(element: ReactElement) {
  return render(wrap(element));
}

/** Returns the direct child that acts as the scrim, if it is rendered. */
function scrim(root: HTMLElement): HTMLElement | null {
  const found = Array.from(root.children).find(
    child => child.getAttribute('aria-busy') === null && child.getAttribute('role') !== 'status'
  );

  return found instanceof HTMLElement ? found : null;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('LoadingOverlay internals', () => {
  it('keeps the caller class beside the component class', () => {
    renderOverlay(
      <LoadingOverlay loading={false} data-testid="overlay" className="caller">
        content
      </LoadingOverlay>
    );

    const root = screen.getByTestId('overlay');

    expect(root).toHaveClass('caller');
    expect(root.className.trim().split(/\s+/).length).toBeGreaterThan(1);
  });

  it('renders content, status and scrim in that order when visible', () => {
    renderOverlay(
      <LoadingOverlay loading delay={0} data-testid="overlay">
        content
      </LoadingOverlay>
    );

    const root = screen.getByTestId('overlay');
    const content = root.children[0] as HTMLElement;
    const status = root.children[1] as HTMLElement;

    expect(root.children).toHaveLength(3);
    expect(content).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('role', 'status');
    expect(scrim(root)).toBe(root.children[2]);
    expect(root).toHaveAttribute('aria-labelledby', status.id);
    expect(scrim(root)?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('captures focus before the content becomes inert', () => {
    vi.useFakeTimers();
    const { container, rerender } = renderOverlay(
      <LoadingOverlay loading={false} delay={300} data-testid="overlay">
        <button>Save</button>
      </LoadingOverlay>
    );

    const inside = screen.getByRole('button', { name: 'Save' });
    const content = container.querySelector<HTMLElement>('[aria-busy]');

    act(() => {
      inside.focus();
    });

    rerender(
      wrap(
        <LoadingOverlay loading delay={300} data-testid="overlay">
          <button>Save</button>
        </LoadingOverlay>
      )
    );

    // During the delay the content is still interactive and focus has not
    // moved; only the reveal makes the content inert and moves focus.
    expect(content).not.toHaveAttribute('inert');
    expect(document.activeElement).toBe(inside);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(content).toHaveAttribute('inert');
    expect(document.activeElement).toBe(screen.getByTestId('overlay'));
  });

  it('does not use the body fallback when the captured element was outside', () => {
    vi.useFakeTimers();
    const { rerender } = renderOverlay(
      <>
        <button>Outside</button>
        <LoadingOverlay loading={false} delay={300} data-testid="overlay">
          <button>Inside</button>
        </LoadingOverlay>
      </>
    );

    const outside = screen.getByRole('button', { name: 'Outside' });

    act(() => {
      outside.focus();
    });

    rerender(
      wrap(
        <>
          <button>Outside</button>
          <LoadingOverlay loading delay={300} data-testid="overlay">
            <button>Inside</button>
          </LoadingOverlay>
        </>
      )
    );

    act(() => {
      outside.blur();
      vi.advanceTimersByTime(300);
    });

    expect(document.activeElement).toBe(document.body);
    expect(screen.getByTestId('overlay')).not.toBe(document.activeElement);
  });

  it('does not steal focus back after the user moved it outside', () => {
    const { rerender } = renderOverlay(
      <>
        <button>Outside</button>
        <LoadingOverlay loading={false} delay={0} data-testid="overlay">
          <button>Inside</button>
        </LoadingOverlay>
      </>
    );

    const outside = screen.getByRole('button', { name: 'Outside' });
    const inside = screen.getByRole('button', { name: 'Inside' });

    act(() => {
      inside.focus();
    });

    rerender(
      wrap(
        <>
          <button>Outside</button>
          <LoadingOverlay loading delay={0} data-testid="overlay">
            <button>Inside</button>
          </LoadingOverlay>
        </>
      )
    );

    expect(document.activeElement).toBe(screen.getByTestId('overlay'));

    act(() => {
      outside.focus();
    });

    rerender(
      wrap(
        <>
          <button>Outside</button>
          <LoadingOverlay loading={false} delay={0} data-testid="overlay">
            <button>Inside</button>
          </LoadingOverlay>
        </>
      )
    );

    // The hook moved focus on reveal, but the user moved it away afterwards;
    // restoration is ownership- and position-guarded.
    expect(document.activeElement).toBe(outside);
  });

  it('tears down cleanly when unmounted while visible', () => {
    const { unmount } = renderOverlay(
      <LoadingOverlay loading delay={0} data-testid="overlay">
        <button>Inside</button>
      </LoadingOverlay>
    );

    const inside = screen.getByRole('button', { name: 'Inside' });

    act(() => {
      inside.focus();
    });

    const root = screen.getByTestId('overlay');
    expect(root).toBeInTheDocument();

    expect(() => unmount()).not.toThrow();
    expect(document.activeElement).toBe(document.body);
  });

  it('keeps the idle structure to the content and the status only', () => {
    const { container } = renderOverlay(
      <LoadingOverlay loading={false} data-testid="overlay">
        content
      </LoadingOverlay>
    );

    const root = screen.getByTestId('overlay');
    const content = container.querySelector<HTMLElement>('[aria-busy]');

    expect(root.children).toHaveLength(2);
    expect(content).toHaveAttribute('aria-busy', 'false');
    expect(content).not.toHaveAttribute('inert');
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('keeps the status node across label and visibility changes', () => {
    const { rerender } = renderOverlay(
      <LoadingOverlay loading delay={0} label="One">
        content
      </LoadingOverlay>
    );

    const status = screen.getByRole('status');

    rerender(
      wrap(
        <LoadingOverlay loading delay={0} label="Two">
          content
        </LoadingOverlay>
      )
    );

    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('Two');

    rerender(
      wrap(
        <LoadingOverlay loading={false} delay={0} label="Two">
          content
        </LoadingOverlay>
      )
    );

    expect(screen.getByRole('status')).toBe(status);
    expect(status.textContent).toBe('');
  });
});
