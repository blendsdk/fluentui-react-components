import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoadingOverlay } from '../src/index';

/** Wraps an overlay in the theme provider the way an application mounts it. */
function wrap(element: ReactElement): ReactElement {
  return <FluentProvider theme={webLightTheme}>{element}</FluentProvider>;
}

/** Renders an overlay inside the theme provider. */
function renderOverlay(element: ReactElement) {
  return render(wrap(element));
}

/**
 * Reads the text assistive technology receives from the status region.
 *
 * The visible indicator is hidden from assistive technology, so its copy of
 * the label is removed before the text is read.
 */
function announcedText(status: HTMLElement): string {
  const clone = status.cloneNode(true) as HTMLElement;
  for (const hidden of Array.from(clone.querySelectorAll('[aria-hidden="true"]'))) {
    hidden.remove();
  }
  return clone.textContent ?? '';
}

/** Returns the content wrapper that carries the busy state. */
function contentWrapper(container: HTMLElement): HTMLElement {
  const wrapper = container.querySelector<HTMLElement>('[aria-busy]');
  if (wrapper === null) {
    throw new Error('expected the overlay content wrapper to be rendered');
  }
  return wrapper;
}

/**
 * Returns the scrim: the root's direct child that is neither the content
 * wrapper nor the status region.
 */
function scrim(root: HTMLElement): HTMLElement | null {
  const found = Array.from(root.children).find(
    child => child.getAttribute('aria-busy') === null && child.getAttribute('role') !== 'status'
  );

  return found instanceof HTMLElement ? found : null;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('LoadingOverlay', () => {
  it('keeps the content interactive and unannounced while idle', () => {
    const { container } = renderOverlay(
      <LoadingOverlay loading={false} data-testid="overlay">
        <button>Save</button>
      </LoadingOverlay>
    );

    const root = screen.getByTestId('overlay');
    const content = contentWrapper(container);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(announcedText(screen.getByRole('status'))).toBe('');
    expect(content).toHaveAttribute('aria-busy', 'false');
    expect(content).not.toHaveAttribute('inert');
    expect(scrim(root)).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('covers the content and announces the default label immediately at delay zero', () => {
    const { container } = renderOverlay(
      <LoadingOverlay loading delay={0}>
        <button>Save</button>
      </LoadingOverlay>
    );

    const root = screen.getByRole('status').parentElement as HTMLElement;
    const content = contentWrapper(container);
    const status = screen.getByRole('status');

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(announcedText(status)).toBe('Loading…');
    expect(content).toHaveAttribute('aria-busy', 'true');
    expect(content).toHaveAttribute('inert');
    expect(scrim(root)).not.toBeNull();
    expect(scrim(root)?.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(content.contains(status)).toBe(false);
  });

  it('shows a custom label in the status and the visual indicator', () => {
    renderOverlay(
      <LoadingOverlay loading delay={0} label="Saving…">
        content
      </LoadingOverlay>
    );

    expect(announcedText(screen.getByRole('status'))).toBe('Saving…');
    expect(
      screen.getByRole('status').parentElement?.querySelector('[aria-hidden="true"]')
    ).toHaveTextContent('Saving…');
  });

  it('falls back to the default label when the label is blank', () => {
    renderOverlay(
      <LoadingOverlay loading delay={0} label="   ">
        content
      </LoadingOverlay>
    );

    expect(announcedText(screen.getByRole('status'))).toBe('Loading…');
  });

  it('waits for the default delay before covering the content', () => {
    vi.useFakeTimers();
    const { container } = renderOverlay(
      <LoadingOverlay loading>
        <button>Save</button>
      </LoadingOverlay>
    );

    const status = screen.getByRole('status');
    const content = contentWrapper(container);

    expect(announcedText(status)).toBe('');
    expect(content).not.toHaveAttribute('inert');
    expect(content).toHaveAttribute('aria-busy', 'true');
    expect(scrim(status.parentElement as HTMLElement)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(announcedText(status)).toBe('');
    expect(content).not.toHaveAttribute('inert');
    expect(scrim(status.parentElement as HTMLElement)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(announcedText(status)).toBe('Loading…');
    expect(content).toHaveAttribute('inert');
    expect(scrim(status.parentElement as HTMLElement)).not.toBeNull();
  });

  it('cancels the overlay when loading ends before the delay', () => {
    vi.useFakeTimers();
    const { container, rerender } = renderOverlay(
      <LoadingOverlay loading>
        <button>Save</button>
      </LoadingOverlay>
    );

    const status = screen.getByRole('status');
    const content = contentWrapper(container);

    rerender(
      wrap(
        <LoadingOverlay loading={false}>
          <button>Save</button>
        </LoadingOverlay>
      )
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(announcedText(status)).toBe('');
    expect(content).not.toHaveAttribute('inert');
    expect(content).toHaveAttribute('aria-busy', 'false');
    expect(scrim(status.parentElement as HTMLElement)).toBeNull();
  });

  it('moves focus to the named root when focus was inside the content', () => {
    const { rerender } = renderOverlay(
      <LoadingOverlay loading={false} delay={0} data-testid="overlay">
        <button>Save</button>
      </LoadingOverlay>
    );

    const root = screen.getByTestId('overlay');
    const inside = screen.getByRole('button', { name: 'Save' });

    act(() => {
      inside.focus();
    });

    rerender(
      wrap(
        <LoadingOverlay loading delay={0} data-testid="overlay">
          <button>Save</button>
        </LoadingOverlay>
      )
    );

    const status = screen.getByRole('status');

    expect(document.activeElement).toBe(root);
    expect(root.tabIndex).toBe(-1);
    expect(root).toHaveAttribute('aria-labelledby', status.id);
  });

  it('leaves focus outside the overlay alone', () => {
    const { rerender } = renderOverlay(
      <>
        <button>Outside</button>
        <LoadingOverlay loading={false} delay={0}>
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
          <LoadingOverlay loading delay={0}>
            <button>Inside</button>
          </LoadingOverlay>
        </>
      )
    );

    expect(document.activeElement).toBe(outside);
  });

  it('restores focus to the previously focused element when loading ends', () => {
    const { container, rerender } = renderOverlay(
      <LoadingOverlay loading={false} delay={0} data-testid="overlay">
        <button>Save</button>
      </LoadingOverlay>
    );

    const inside = screen.getByRole('button', { name: 'Save' });

    act(() => {
      inside.focus();
    });

    rerender(
      wrap(
        <LoadingOverlay loading delay={0} data-testid="overlay">
          <button>Save</button>
        </LoadingOverlay>
      )
    );

    expect(document.activeElement).toBe(screen.getByTestId('overlay'));

    rerender(
      wrap(
        <LoadingOverlay loading={false} delay={0} data-testid="overlay">
          <button>Save</button>
        </LoadingOverlay>
      )
    );

    expect(document.activeElement).toBe(inside);
    expect(contentWrapper(container)).not.toContainElement(screen.getByRole('status'));
    expect(scrim(screen.getByTestId('overlay'))).toBeNull();
    expect(announcedText(screen.getByRole('status'))).toBe('');
  });

  it('restores the reveal-time element when focus moved during the delay', () => {
    vi.useFakeTimers();
    const { rerender } = renderOverlay(
      <LoadingOverlay loading={false} delay={300} data-testid="overlay">
        <button>A</button>
        <button>B</button>
      </LoadingOverlay>
    );

    const first = screen.getByRole('button', { name: 'A' });
    const second = screen.getByRole('button', { name: 'B' });

    act(() => {
      first.focus();
    });

    rerender(
      wrap(
        <LoadingOverlay loading delay={300} data-testid="overlay">
          <button>A</button>
          <button>B</button>
        </LoadingOverlay>
      )
    );

    act(() => {
      vi.advanceTimersByTime(100);
      second.focus();
      vi.advanceTimersByTime(200);
    });

    const root = screen.getByTestId('overlay');
    expect(document.activeElement).toBe(root);

    rerender(
      wrap(
        <LoadingOverlay loading={false} delay={300} data-testid="overlay">
          <button>A</button>
          <button>B</button>
        </LoadingOverlay>
      )
    );

    expect(document.activeElement).toBe(second);
  });

  it('uses the captured element when the browser blurred focus to the body', () => {
    vi.useFakeTimers();
    const { rerender } = renderOverlay(
      <LoadingOverlay loading={false} delay={300} data-testid="overlay">
        <button>Save</button>
      </LoadingOverlay>
    );

    const inside = screen.getByRole('button', { name: 'Save' });

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

    act(() => {
      inside.blur();
      vi.advanceTimersByTime(300);
    });

    expect(document.activeElement).toBe(screen.getByTestId('overlay'));
  });

  it('does not focus a disconnected captured element', () => {
    vi.useFakeTimers();
    const { rerender } = renderOverlay(
      <LoadingOverlay loading={false} delay={300} data-testid="overlay">
        <button>Save</button>
      </LoadingOverlay>
    );

    const inside = screen.getByRole('button', { name: 'Save' });

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

    rerender(
      wrap(
        <LoadingOverlay loading delay={300} data-testid="overlay">
          <span>replacement</span>
        </LoadingOverlay>
      )
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(document.activeElement).toBe(document.body);
    expect(screen.getByTestId('overlay')).not.toBe(document.activeElement);
  });

  it('merges native props while keeping the busy and focus contract', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = renderOverlay(
      <LoadingOverlay
        loading={false}
        data-testid="overlay"
        className="caller"
        style={{ padding: 4 }}
        ref={ref}
      >
        content
      </LoadingOverlay>
    );

    const root = screen.getByTestId('overlay');
    const content = contentWrapper(container);

    expect(root).toHaveAttribute('data-testid', 'overlay');
    expect(root).toHaveClass('caller');
    expect(root.style.padding).toBe('4px');
    expect(ref.current).toBe(root);
    expect(root.tabIndex).toBe(-1);
    expect(root).not.toHaveAttribute('aria-busy');
    expect(content).toHaveAttribute('aria-busy', 'false');
  });

  it('keeps the status outside the busy subtree and inside the root', () => {
    const { container } = renderOverlay(
      <LoadingOverlay loading delay={0} data-testid="overlay">
        content
      </LoadingOverlay>
    );

    const root = screen.getByTestId('overlay');
    const content = contentWrapper(container);
    const status = screen.getByRole('status');

    expect(root.contains(content)).toBe(true);
    expect(root.contains(status)).toBe(true);
    expect(content.contains(status)).toBe(false);
    expect(content.parentElement).toBe(root);
    expect(status.parentElement).toBe(root);
    expect(container).toContainElement(root);
  });

  it('ignores stale timers when loading toggles quickly', () => {
    vi.useFakeTimers();
    const { rerender } = renderOverlay(
      <LoadingOverlay loading delay={300}>
        content
      </LoadingOverlay>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender(
      wrap(
        <LoadingOverlay loading={false} delay={300}>
          content
        </LoadingOverlay>
      )
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(announcedText(screen.getByRole('status'))).toBe('');

    rerender(
      wrap(
        <LoadingOverlay loading delay={300}>
          content
        </LoadingOverlay>
      )
    );

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(announcedText(screen.getByRole('status'))).toBe('');

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(announcedText(screen.getByRole('status'))).toBe('Loading…');
  });

  it('applies a delay change to the next activation, not the current one', () => {
    vi.useFakeTimers();
    const { rerender } = renderOverlay(
      <LoadingOverlay loading delay={300}>
        content
      </LoadingOverlay>
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender(
      wrap(
        <LoadingOverlay loading delay={0}>
          content
        </LoadingOverlay>
      )
    );

    expect(announcedText(screen.getByRole('status'))).toBe('');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(announcedText(screen.getByRole('status'))).toBe('Loading…');
  });

  it('clears its timer when unmounted during the delay', () => {
    vi.useFakeTimers();
    const { unmount } = renderOverlay(
      <LoadingOverlay loading delay={300}>
        content
      </LoadingOverlay>
    );

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(() => vi.advanceTimersByTime(300)).not.toThrow();
  });

  it('updates the label while the content stays mounted and inert', () => {
    const { container, rerender } = renderOverlay(
      <LoadingOverlay loading delay={0} label="Saving…">
        content
      </LoadingOverlay>
    );

    const status = screen.getByRole('status');
    const content = contentWrapper(container);

    expect(announcedText(status)).toBe('Saving…');
    expect(content).toHaveAttribute('inert');

    rerender(
      wrap(
        <LoadingOverlay loading delay={0} label="Publishing…">
          content
        </LoadingOverlay>
      )
    );

    expect(announcedText(status)).toBe('Publishing…');
    expect(content).toHaveAttribute('inert');
    expect(content.contains(status)).toBe(false);
  });

  it('reuses the status node across a loading toggle', () => {
    const { rerender } = renderOverlay(
      <LoadingOverlay loading delay={0} label="Saving…">
        content
      </LoadingOverlay>
    );

    const statusBefore = screen.getByRole('status');

    rerender(
      wrap(
        <LoadingOverlay loading={false} delay={0} label="Saving…">
          content
        </LoadingOverlay>
      )
    );

    rerender(
      wrap(
        <LoadingOverlay loading delay={0} label="Saving…">
          content
        </LoadingOverlay>
      )
    );

    expect(screen.getByRole('status')).toBe(statusBefore);
    expect(announcedText(screen.getByRole('status'))).toBe('Saving…');
  });
});
