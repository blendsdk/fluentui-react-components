import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { TileGrid } from '../../src/components/TileGrid';
import type {
  TileGridItemRenderArgs,
  TileGridProps,
} from '../../src/components/TileGrid/TileGrid.types';
import { createTileGridFixture } from '../fixtures/tileGridFixture';
import type { TileGridFixtureItem } from '../fixtures/tileGridFixture';

const MANY = createTileGridFixture(80);
const SINGLE = MANY.slice(0, 1);
type GridProps = Partial<TileGridProps<TileGridFixtureItem>> & { height?: number };
const getId = (item: TileGridFixtureItem) => item.id;
const getLabel = (item: TileGridFixtureItem) => item.label;
const content = ({ item }: TileGridItemRenderArgs<TileGridFixtureItem>) => (
  <span>{item.label}</span>
);
const tile = (name: string) => screen.getByRole('listitem', { name });
const button = (name: string) => screen.getByRole('button', { name });

/** A real measured host with outside Tab targets and square fixed-layout tiles. */
function Grid({ height = 360, ...props }: GridProps) {
  return (
    <FluentProvider theme={webLightTheme}>
      <button type="button" autoFocus>
        Before
      </button>
      <div style={{ width: 328, height }}>
        <TileGrid
          items={SINGLE}
          getItemId={getId}
          getItemLabel={getLabel}
          renderItem={content}
          ariaLabel="Photos"
          layout="fixed"
          selectionMode="none"
          tileSize={160}
          gap={8}
          style={{ scrollbarWidth: 'none' }}
          {...props}
        />
      </div>
      <button type="button">After</button>
    </FluentProvider>
  );
}

/** Parent rerenders change public props while preserving the same grid and item identities. */
async function mount(props: GridProps = {}) {
  const view = render(<Grid {...props} />);
  const root = screen.getByRole('list', { name: 'Photos' });
  await screen.findByRole('listitem', { name: 'Tile 0' });
  await waitFor(() => expect(tile('Tile 0').style.width).toBe('160px'));
  expect(root.clientWidth).toBe(328);
  expect(root.clientHeight).toBe(360);
  return {
    root,
    update: (next: GridProps) => view.rerender(<Grid {...props} {...next} />),
  };
}

/** Application focus entry must not move the established scroll anchor. */
async function focus(element: HTMLElement) {
  await act(async () => element.focus({ preventScroll: true }));
  expect(element).toHaveFocus();
}

/** Sends a real browser Tab, leaving native focus eligibility as the oracle. */
async function tabTo(element: HTMLElement, shift = false) {
  await userEvent.tab({ shift });
  await waitFor(() => expect(element).toHaveFocus());
}

/** Allows native mutation observers, measured windows, and paint work to settle. */
async function frames() {
  await act(async () => {
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

describe('TileGrid browser focus recovery and native eligibility', () => {
  // A partially visible active tile remains active after zoom restores the first visible anchor.
  it('preserves the visible active wrapper through scrolled zoom without reversing scroll or selecting', async () => {
    const onSelectionChange = vi.fn();
    const { root, update } = await mount({
      items: MANY,
      selectionMode: 'multiselect',
      defaultSelectedIds: ['tile-41'],
      onSelectionChange,
    });

    // Two 160px columns plus an 8px gap place Tile 40 and Tile 41 at row 20: 20 * 168 = 3360.
    await userEvent.wheel(root, { delta: { y: 3360 } });
    await waitFor(() => {
      expect(root.scrollTop).toBe(3360);
      expect(tile('Tile 40').style.top).toBe('3360px');
      expect(tile('Tile 41').style.top).toBe('3360px');
      expect(tile('Tile 41').style.left).toBe('168px');
      expect(tile('Tile 41').style.height).toBe('160px');
    });
    await focus(tile('Tile 41'));
    expect(tile('Tile 41')).toHaveAttribute('tabindex', '0');
    expect(root.scrollTop).toBe(3360);

    update({ tileSize: 200 });

    // One 328px column has a 336px row stride: Tile 40 anchors at 13440 and Tile 41 at 13776.
    await waitFor(() => {
      expect(tile('Tile 40').style.top).toBe('13440px');
      expect(tile('Tile 40').style.width).toBe('328px');
      expect(tile('Tile 40').style.height).toBe('328px');
      expect(tile('Tile 41').style.top).toBe('13776px');
      expect(tile('Tile 41').style.left).toBe('0px');
      expect(tile('Tile 41').style.width).toBe('328px');
      expect(tile('Tile 41').style.height).toBe('328px');
      expect(root.scrollTop).toBe(13440);
    });
    await frames();

    const active = tile('Tile 41');
    const viewportTop = root.getBoundingClientRect().top + root.clientTop;
    const viewportBottom = viewportTop + root.clientHeight;
    // The resulting viewport ends at 13800, leaving 24px of the active tile visible.
    expect(root.scrollTop + root.clientHeight).toBe(13800);
    expect(viewportBottom - active.getBoundingClientRect().top).toBe(24);
    expect(root.scrollTop).toBe(13440);
    expect(screen.getByRole('checkbox', { name: 'Tile 41' })).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(active).toHaveFocus();
    expect(active).toHaveAttribute('tabindex', '0');
    expect(tile('Tile 40')).toHaveAttribute('tabindex', '-1');
  });

  // Closed disclosure content is not a native Tab target, and author tabindex=-1 stays excluded.
  it('tabs from the wrapper past a closed details element without trapping focus or entering hidden content', async () => {
    const onHiddenFocus = vi.fn();
    await mount({
      renderItem: () => (
        <details>
          <summary tabIndex={-1}>Details</summary>
          <button type="button" onFocus={onHiddenFocus}>
            Hidden action
          </button>
        </details>
      ),
    });
    const wrapper = tile('Tile 0');
    const summary = screen.getByText('Details');
    const hiddenAction = screen.getByText('Hidden action');
    expect(summary.closest('details')).not.toHaveAttribute('open');
    expect(summary).toHaveAttribute('tabindex', '-1');
    expect(hiddenAction).not.toBeVisible();

    await userEvent.click(button('Before'));
    await tabTo(wrapper);
    await frames();
    expect(summary).toHaveAttribute('tabindex', '-1');
    await tabTo(button('After'));
    expect(summary).toHaveAttribute('tabindex', '-1');
    expect(hiddenAction).not.toHaveFocus();
    expect(onHiddenFocus).not.toHaveBeenCalled();
  });

  // Removing href removes native link eligibility when the author supplied no tabindex.
  it('leaves the grid on Tab after the parent removes href from the previously reachable link', async () => {
    const { update } = await mount({ renderItem: () => <a href="#local">Link</a> });
    const wrapper = tile('Tile 0');
    const link = screen.getByRole('link', { name: 'Link' });
    await userEvent.click(button('Before'));
    await tabTo(wrapper);
    await tabTo(link);
    await tabTo(wrapper, true);

    update({ renderItem: () => <a>Link</a> });
    await waitFor(() => expect(link).not.toHaveAttribute('href'));
    await frames();
    expect(screen.getByText('Link')).toBe(link);
    expect(wrapper).toHaveFocus();
    await tabTo(button('After'));
    expect(link).not.toHaveFocus();
  });

  // New inline focus supersedes a pending keyboard target before that target is attached.
  it('recovers to the first visible tile after inline focus supersedes a pending End request', async () => {
    const onSelectionChange = vi.fn();
    const onObsoleteFocus = vi.fn();
    const beforeCompletion: { scrolled: boolean; attached: boolean }[] = [];
    let inlineFocusedBeforeAttachment = false;

    /** Parent bubbling runs after End scrolls and before React attaches the destination window. */
    function PendingUpdate() {
      return (
        <div
          onKeyDown={event => {
            if (event.key !== 'End') return;
            beforeCompletion.push({
              scrolled: screen.getByRole('list', { name: 'Photos' }).scrollTop > 0,
              attached: screen.queryByRole('listitem', { name: 'Tile 79' }) !== null,
            });
            const inline = button('Open Tile 0');
            inline.focus({ preventScroll: true });
            inlineFocusedBeforeAttachment = inline.ownerDocument.activeElement === inline;
          }}
          onFocusCapture={event => {
            if (event.target.getAttribute('aria-label') === 'Tile 79') onObsoleteFocus();
          }}
        >
          <Grid
            items={MANY}
            height={160}
            selectionMode="multiselect"
            onSelectionChange={onSelectionChange}
            renderItem={({ item }) => (
              <div style={{ paddingTop: 32 }}>
                <button type="button">Open {item.label}</button>
              </div>
            )}
          />
        </div>
      );
    }

    render(<PendingUpdate />);
    const old = await screen.findByRole('listitem', { name: 'Tile 0' });
    const root = screen.getByRole('list', { name: 'Photos' });
    expect(root.clientWidth).toBe(328);
    expect(root.clientHeight).toBe(160);
    expect(root.scrollTop).toBe(0);
    expect(screen.queryByRole('listitem', { name: 'Tile 79' })).toBeNull();
    await focus(old);
    await userEvent.keyboard('{End}');
    expect(beforeCompletion).toEqual([{ scrolled: true, attached: false }]);
    expect(inlineFocusedBeforeAttachment).toBe(true);

    // Eighty tiles form 40 rows. The last row starts at 39 * (160 + 8) = 6552.
    await waitFor(() => {
      expect(old).not.toBeInTheDocument();
      expect(root.scrollTop).toBe(6552);
      expect(tile('Tile 78').style.top).toBe('6552px');
      expect(tile('Tile 79').style.top).toBe('6552px');
    });
    await waitFor(() => expect(tile('Tile 78')).toHaveFocus());
    await frames();
    expect(root.scrollTop).toBe(6552);
    expect(tile('Tile 78')).toHaveFocus();
    expect(tile('Tile 78')).toHaveAttribute('tabindex', '0');
    expect(tile('Tile 79')).toHaveAttribute('tabindex', '-1');
    expect(onObsoleteFocus).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  // A parent geometry change re-evaluates pending focus against the final anchored viewport.
  it('focuses the visible anchor after parent zoom supersedes a pending End request', async () => {
    const onSelectionChange = vi.fn();
    const onObsoleteFocus = vi.fn();
    const beforeCompletion: { scrolled: boolean; attached: boolean }[] = [];

    /** The parent applies the new size while the old End destination is still unattached. */
    function PendingUpdate() {
      const [tileSize, setTileSize] = useState(160);
      return (
        <div
          onKeyDown={event => {
            if (event.key !== 'End') return;
            beforeCompletion.push({
              scrolled: screen.getByRole('list', { name: 'Photos' }).scrollTop > 0,
              attached: screen.queryByRole('listitem', { name: 'Tile 79' }) !== null,
            });
            setTileSize(200);
          }}
          onFocusCapture={event => {
            if (event.target.getAttribute('aria-label') === 'Tile 79') onObsoleteFocus();
          }}
        >
          <Grid
            items={MANY}
            height={160}
            tileSize={tileSize}
            selectionMode="multiselect"
            onSelectionChange={onSelectionChange}
          />
        </div>
      );
    }

    render(<PendingUpdate />);
    const old = await screen.findByRole('listitem', { name: 'Tile 0' });
    const root = screen.getByRole('list', { name: 'Photos' });
    expect(root.clientWidth).toBe(328);
    expect(root.clientHeight).toBe(160);
    expect(root.scrollTop).toBe(0);
    expect(screen.queryByRole('listitem', { name: 'Tile 79' })).toBeNull();
    await focus(old);
    await userEvent.keyboard('{End}');
    expect(beforeCompletion).toEqual([{ scrolled: true, attached: false }]);

    // End originally exposes Tile 78 first at 39 * 168 = 6552. With one column,
    // the retained anchor is 78 * 336 = 26208; Tile 79 moves to 79 * 336 = 26544.
    await waitFor(() => {
      expect(old).not.toBeInTheDocument();
      expect(root.scrollTop).toBe(26208);
      expect(tile('Tile 78').style.top).toBe('26208px');
      expect(tile('Tile 78').style.width).toBe('328px');
      expect(tile('Tile 78').style.height).toBe('328px');
      expect(tile('Tile 79').style.top).toBe('26544px');
      expect(tile('Tile 79').style.width).toBe('328px');
      expect(tile('Tile 79').style.height).toBe('328px');
    });
    const viewportTop = root.getBoundingClientRect().top + root.clientTop;
    const viewportBottom = viewportTop + root.clientHeight;
    // The 160px viewport ends at 26368, so the old target is 176px below it.
    expect(root.scrollTop + root.clientHeight).toBe(26368);
    expect(tile('Tile 78').getBoundingClientRect().top).toBe(viewportTop);
    expect(tile('Tile 79').getBoundingClientRect().top - viewportBottom).toBe(176);
    await waitFor(() => expect(tile('Tile 78')).toHaveFocus());
    await frames();
    expect(root.scrollTop).toBe(26208);
    expect(tile('Tile 78')).toHaveFocus();
    expect(tile('Tile 78')).toHaveAttribute('tabindex', '0');
    expect(tile('Tile 79')).toHaveAttribute('tabindex', '-1');
    expect(onObsoleteFocus).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
