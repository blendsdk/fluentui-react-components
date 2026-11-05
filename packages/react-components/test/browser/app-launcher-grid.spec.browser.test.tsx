import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { Mail32Regular } from '@fluentui/react-icons';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLauncherGrid, AppLauncherItem, AppLauncherList } from '../../src/index';

/** App names that place a single tile in the second row of a three-column grid. */
const APP_LABELS = ['Mail', 'Calendar', 'Chat', 'Files'];
const LONG_LABEL = 'Contoso Resource Planning';

/**
 * Renders four standard tiles without sections or dividers to measure their
 * natural rows or the rows inside a caller-sized grid.
 */
function renderFourTiles(height?: number, labels: readonly string[] = APP_LABELS) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <div style={{ height }}>
        <AppLauncherGrid style={{ height: height === undefined ? undefined : '100%' }}>
          {labels.map(label => (
            <AppLauncherItem key={label} label={label} icon={<Mail32Regular />} />
          ))}
        </AppLauncherGrid>
      </div>
    </FluentProvider>
  );
}

/** Real-browser sizing contract; jsdom cannot measure grid tracks or line clamping. */
describe('AppLauncherGrid tile sizing', () => {
  it('keeps four tiles in two content-sized rows inside a tall container without a divider', () => {
    renderFourTiles(400);

    const grid = screen.getByRole('list');
    const tiles = screen.getAllByRole('button');
    const boxes = tiles.map(tile => tile.getBoundingClientRect());
    const gridBox = grid.getBoundingClientRect();
    const gap = Number.parseFloat(getComputedStyle(grid).rowGap);

    expect(tiles).toHaveLength(4);
    expect(gridBox.height).toBeCloseTo(400, 1);
    for (const box of boxes) {
      expect(box.height).toBeCloseTo(88, 1);
    }
    expect(boxes[0].top).toBeCloseTo(gridBox.top, 1);
    expect(boxes[1].top).toBeCloseTo(boxes[0].top, 1);
    expect(boxes[2].top).toBeCloseTo(boxes[0].top, 1);
    expect(boxes[3].top).toBeCloseTo(boxes[0].bottom + gap, 1);
    expect(boxes[3].bottom).toBeLessThan(gridBox.bottom);
  });

  it.each([undefined, 400])(
    'limits a long tile name to two lines without growing its row (grid height: %s)',
    height => {
      renderFourTiles(height, ['Mail', 'Calendar', 'Chat', LONG_LABEL]);

      const label = screen.getByText(LONG_LABEL);
      const lineHeight = Number.parseFloat(getComputedStyle(label).lineHeight);

      expect(screen.getByRole('button', { name: LONG_LABEL })).toHaveAccessibleName(LONG_LABEL);
      expect(label.textContent).toBe(LONG_LABEL);
      expect(label.getBoundingClientRect().height).toBeCloseTo(lineHeight * 2, 1);
      expect(label.scrollHeight).toBeGreaterThan(label.clientHeight);
      for (const tile of screen.getAllByRole('button')) {
        expect(tile.getBoundingClientRect().height).toBeCloseTo(88, 1);
      }
    }
  );

  it('keeps a naturally sized four-item grid compact', () => {
    renderFourTiles();

    const grid = screen.getByRole('list');
    const gap = Number.parseFloat(getComputedStyle(grid).rowGap);

    expect(grid.getBoundingClientRect().height).toBeCloseTo(88 * 2 + gap, 1);
    for (const tile of screen.getAllByRole('button')) {
      expect(tile.getBoundingClientRect().height).toBeCloseTo(88, 1);
    }
  });

  it('keeps list labels on one line with their full accessible name', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <AppLauncherList>
          <AppLauncherItem label={LONG_LABEL.repeat(3)} icon={<Mail32Regular />} />
        </AppLauncherList>
      </FluentProvider>
    );

    const label = screen.getByText(LONG_LABEL.repeat(3));
    const styles = getComputedStyle(label);

    expect(screen.getByRole('button', { name: LONG_LABEL.repeat(3) })).toBeVisible();
    expect(label.getBoundingClientRect().height).toBeCloseTo(
      Number.parseFloat(styles.lineHeight),
      1
    );
    expect(styles.textOverflow).toBe('ellipsis');
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
  });

  it('allows larger text to increase tile height instead of imposing a hard cap', () => {
    render(
      <FluentProvider
        theme={{ ...webLightTheme, fontSizeBase200: '24px', lineHeightBase200: '32px' }}
      >
        <AppLauncherGrid>
          <AppLauncherItem label={LONG_LABEL} icon={<Mail32Regular />} />
        </AppLauncherGrid>
      </FluentProvider>
    );

    const tile = screen.getByRole('button', { name: LONG_LABEL });
    const label = screen.getByText(LONG_LABEL);

    expect(label.getBoundingClientRect().height).toBeCloseTo(64, 1);
    expect(tile.getBoundingClientRect().height).toBeGreaterThan(88);
    expect(label.getBoundingClientRect().top).toBeGreaterThan(tile.getBoundingClientRect().top);
    expect(label.getBoundingClientRect().bottom).toBeLessThan(tile.getBoundingClientRect().bottom);
  });
});
