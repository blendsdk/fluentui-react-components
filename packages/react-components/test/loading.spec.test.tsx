import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Loading } from '../src/index';

/**
 * Renders a loader inside the theme provider, mirroring how applications mount
 * the components.
 */
function renderLoader(loader: ReactElement) {
  return render(<FluentProvider theme={webLightTheme}>{loader}</FluentProvider>);
}

/**
 * Reads the text assistive technology receives from the status region.
 *
 * The visible indicator is deliberately hidden from assistive technology, so
 * its copy of the label is removed before the text is read; what remains is the
 * single announced string.
 */
function announcedText(status: HTMLElement): string {
  const clone = status.cloneNode(true) as HTMLElement;
  for (const hidden of Array.from(clone.querySelectorAll('[aria-hidden="true"]'))) {
    hidden.remove();
  }
  return clone.textContent ?? '';
}

/** Returns the decorative indicator wrapper, or null while it is hidden. */
function indicator(status: HTMLElement): HTMLElement | null {
  return status.querySelector('[aria-hidden="true"]');
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Loading', () => {
  it('renders a single status region with the default label', () => {
    renderLoader(<Loading />);

    const status = screen.getByRole('status');

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(announcedText(status)).toBe('Loading…');
    expect(indicator(status)).not.toBeNull();
    expect(indicator(status)).toHaveTextContent('Loading…');
  });

  it('shows a custom label in the status region and the visible indicator', () => {
    renderLoader(<Loading label="Loading records" />);

    const status = screen.getByRole('status');

    expect(announcedText(status)).toBe('Loading records');
    expect(indicator(status)).toHaveTextContent('Loading records');
  });

  it('falls back to the default label when the label is blank', () => {
    renderLoader(<Loading label="   " />);

    expect(announcedText(screen.getByRole('status'))).toBe('Loading…');
  });

  it('forwards native props while keeping the single status region', () => {
    renderLoader(
      <Loading data-testid="loader" className="caller" aria-label="Busy" />
    );

    const status = screen.getByTestId('loader');

    expect(status).toHaveAttribute('data-testid', 'loader');
    expect(status).toHaveClass('caller');
    expect(status).toHaveAttribute('aria-label', 'Busy');
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();

    renderLoader(<Loading ref={ref} />);

    expect(ref.current).toBe(screen.getByRole('status'));
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('keeps the root out of the tab order', () => {
    renderLoader(<Loading />);

    expect(screen.getByRole('status').tabIndex).toBeLessThanOrEqual(0);
  });

  it('applies the minHeight prop to the root style', () => {
    renderLoader(<Loading minHeight={240} />);

    expect(screen.getByRole('status').style.minHeight).toBe('240px');
  });

  it("keeps the caller's style minHeight when the prop is omitted", () => {
    renderLoader(<Loading style={{ minHeight: 120 }} />);

    expect(screen.getByRole('status').style.minHeight).toBe('120px');
  });

  it('prefers the minHeight prop over the caller style', () => {
    renderLoader(<Loading minHeight={240} style={{ minHeight: 120 }} />);

    expect(screen.getByRole('status').style.minHeight).toBe('240px');
  });

  it('delays both the status text and the indicator', () => {
    vi.useFakeTimers();
    renderLoader(<Loading delay={300} />);

    const status = screen.getByRole('status');

    expect(announcedText(status)).toBe('');
    expect(indicator(status)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(announcedText(status)).toBe('');
    expect(indicator(status)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(announcedText(status)).toBe('Loading…');
    expect(indicator(status)).not.toBeNull();
  });

  it('exposes the live-region attributes and hides the visual indicator', () => {
    renderLoader(<Loading />);

    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(indicator(status)).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('updates the label without remounting the live region', () => {
    const { rerender } = renderLoader(<Loading label="One" />);

    const statusBefore = screen.getByRole('status');
    expect(announcedText(statusBefore)).toBe('One');

    rerender(
      <FluentProvider theme={webLightTheme}>
        <Loading label="Two" />
      </FluentProvider>
    );

    const statusAfter = screen.getByRole('status');
    expect(statusAfter).toBe(statusBefore);
    expect(announcedText(statusAfter)).toBe('Two');
  });
});
