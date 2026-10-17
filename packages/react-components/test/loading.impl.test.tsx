import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Loading } from '../src/index';

/** Wraps a loader in the theme provider the way an application mounts it. */
function renderLoader(loader: ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{loader}</FluentProvider>);
}

/** Returns the decorative wrapper that owns the hidden indicator. */
function indicator(status: HTMLElement): HTMLElement {
  const wrapper = status.querySelector<HTMLElement>('[aria-hidden="true"]');
  if (wrapper === null) {
    throw new Error('expected the loading indicator to be rendered');
  }
  return wrapper;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Loading internals', () => {
  it('keeps the root out of the tab order', () => {
    renderLoader(<Loading />);

    // A plain div reports -1; the explicit assertion rejects a regression to
    // tabIndex={0}, which would make the filler a tab stop.
    expect(screen.getByRole('status').tabIndex).toBe(-1);
  });

  it('merges the caller class with the component class', () => {
    renderLoader(<Loading className="caller" />);

    const status = screen.getByRole('status');

    expect(status).toHaveClass('caller');
    expect(status.className.trim().split(/\s+/).length).toBeGreaterThan(1);
  });

  it('renders the hidden label and the decorative indicator as siblings', () => {
    renderLoader(<Loading label="Loading records" />);

    const status = screen.getByRole('status');
    const hiddenLabel = status.firstElementChild;

    expect(hiddenLabel?.tagName).toBe('SPAN');
    expect(hiddenLabel).toHaveTextContent('Loading records');
    expect(indicator(status)).toHaveTextContent('Loading records');
    expect(status.children).toHaveLength(2);
  });

  it('owns the aria-hidden wrapper instead of hiding the whole root', () => {
    renderLoader(<Loading />);

    const status = screen.getByRole('status');

    expect(status).not.toHaveAttribute('aria-hidden');
    expect(status.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(indicator(status).querySelector('[role="progressbar"]')).not.toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('normalizes a non-positive delay to an immediate reveal', () => {
    const view = renderLoader(<Loading delay={-25} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    view.unmount();
  });

  it('normalizes NaN and Infinity to an immediate reveal', () => {
    const view = renderLoader(<Loading delay={Number.NaN} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    view.unmount();

    renderLoader(<Loading delay={Number.POSITIVE_INFINITY} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
  });

  it('clears its pending timer when unmounted during the delay', () => {
    vi.useFakeTimers();
    const view = renderLoader(<Loading delay={5000} />);

    expect(screen.getByRole('status').textContent).toBe('');

    view.unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
  });

  it('keeps a mounted delayed loader hidden until the timer elapses', () => {
    vi.useFakeTimers();
    renderLoader(<Loading delay={1000} />);

    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(status.textContent).toContain('Loading…');
  });
});
