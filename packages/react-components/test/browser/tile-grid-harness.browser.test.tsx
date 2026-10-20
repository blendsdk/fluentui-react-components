import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/**
 * Browser-harness smoke test.
 *
 * Proves the Vitest browser project can render React content and use the
 * shared jest-dom matchers before the TileGrid browser suite exists.
 */
describe('tile-grid browser harness', () => {
  it('renders and measures a DOM node in a real browser', () => {
    render(
      <>
        <button type="button">Harness ready</button>
        <div data-testid="measured" style={{ width: 120, height: 40 }} />
      </>
    );

    expect(screen.getByRole('button', { name: 'Harness ready' })).toBeInTheDocument();
    expect(screen.getByTestId('measured').getBoundingClientRect().width).toBe(120);
  });
});
