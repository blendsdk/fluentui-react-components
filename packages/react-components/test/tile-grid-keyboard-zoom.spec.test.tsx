import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { KeyboardEvent } from 'react';
import { userEvent } from 'storybook/test';
import { describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type {
  TileGridItemRenderArgs,
  TileGridProps,
} from '../src/components/TileGrid/TileGrid.types';
import { createTileGridFixture } from './fixtures/tileGridFixture';
import type { TileGridFixtureItem } from './fixtures/tileGridFixture';
import { setElementSize } from './jsdomStubs';

const page = createTileGridFixture(12);
const items = page.slice(0, 8);
const getItemId = (item: TileGridFixtureItem) => item.id;
const getItemLabel = (item: TileGridFixtureItem) => item.label;
const getItemAspectRatio = () => 1;

/** Exposes public size arguments and a real application control for inline focus. */
function renderItem({ item, tileSize, width }: TileGridItemRenderArgs<TileGridFixtureItem>) {
  return (
    <>
      <span>{`Size ${tileSize}, width ${width}`}</span>
      <input aria-label={`Edit ${item.label}`} />
    </>
  );
}

/** Equal-ratio tiles make the fixed and masonry viewport boundaries hand-computable. */
function grid(props: Partial<TileGridProps<TileGridFixtureItem>>) {
  return (
    <FluentProvider theme={webLightTheme}>
      <TileGrid
        items={items}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        getItemAspectRatio={getItemAspectRatio}
        renderItem={renderItem}
        ariaLabel="Zoom tiles"
        selectionMode="multiselect"
        tileSize={160}
        minTileSize={120}
        maxTileSize={320}
        gap={8}
        {...props}
      />
    </FluentProvider>
  );
}

/** Mounts with external focus and supplies only the dimensions missing from jsdom. */
async function mount(props: Partial<TileGridProps<TileGridFixtureItem>> = {}, height = 160) {
  render(<input aria-label="External search" />);
  const outside = screen.getByRole('textbox', { name: 'External search' });
  act(() => outside.focus());
  let currentProps = props;
  const view = render(grid(currentProps));
  const root = screen.getByRole('list', { name: 'Zoom tiles' });
  await act(async () => setElementSize(root, 328, height));
  return {
    root,
    outside,
    update(next: Partial<TileGridProps<TileGridFixtureItem>>) {
      currentProps = { ...currentProps, ...next };
      view.rerender(grid(currentProps));
    },
  };
}

const tile = (index: number) => screen.getByRole('listitem', { name: `Tile ${index}` });
const editor = (index: number) => screen.getByRole('textbox', { name: `Edit Tile ${index}` });
const checkbox = (index: number) => screen.getByRole('checkbox', { name: `Tile ${index}` });

/** Supplies a hand-computed scroll extent because jsdom does not lay out the tile rows. */
function setScrollHeight(root: HTMLElement, height: number) {
  Object.defineProperty(root, 'scrollHeight', { configurable: true, value: height });
}

/** Changes the real scroll offset and delivers its DOM event without simulating wheel defaults. */
async function scrollTo(root: HTMLElement, top: number) {
  // The initial eight tiles form four 160px rows separated by three 8px gaps.
  setScrollHeight(root, 664);
  await act(async () => {
    root.scrollTop = top;
    fireEvent.scroll(root);
  });
  expect(root.scrollTop).toBe(top);
}

describe('TileGrid controlled keyboard zoom', () => {
  it('reports 180, 180, and 140 from 160 and resizes only when the parent applies a value', async () => {
    // Requests never accumulate internally, select an item, or move focus to another owner.
    const onTileSizeChange = vi.fn();
    const onSelectionChange = vi.fn();
    const view = await mount({
      zoomable: true,
      onTileSizeChange,
      onSelectionChange,
      defaultSelectedIds: ['tile-1'],
    });
    act(() => tile(0).focus());
    for (const [key, size] of [
      ['+', 180],
      ['=', 180],
      ['-', 140],
    ] as const) {
      const nativeDefaultAllowed = fireEvent.keyDown(tile(0), { key });
      expect(onTileSizeChange).toHaveBeenLastCalledWith(size);
      expect(nativeDefaultAllowed).toBe(false);
      expect(within(tile(0)).getByText('Size 160, width 160')).toBeInTheDocument();
      expect(tile(0)).toHaveFocus();
      expect(checkbox(1)).toBeChecked();
    }
    expect(onTileSizeChange.mock.calls).toEqual([[180], [180], [140]]);
    act(() => view.outside.focus());
    view.update({ tileSize: 180 });
    expect(within(tile(0)).getByText('Size 180, width 328')).toBeInTheDocument();
    expect(view.outside).toHaveFocus();
    expect(checkbox(1)).toBeChecked();
    expect(onTileSizeChange).toHaveBeenCalledTimes(3);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it.each([
    { tileSize: 310, key: '+', requested: 320 },
    { tileSize: 310, key: '=', requested: 320 },
    { tileSize: 320, key: '+', requested: 320 },
    { tileSize: 130, key: '-', requested: 120 },
    { tileSize: 120, key: '-', requested: 120 },
  ])('clamps $tileSize $key to $requested, including a request already at a bound', async props => {
    // Bounds clamp each request, but do not suppress the callback at an existing bound.
    const onTileSizeChange = vi.fn();
    await mount({ tileSize: props.tileSize, zoomable: true, onTileSizeChange });
    act(() => tile(0).focus());
    fireEvent.keyDown(tile(0), { key: props.key });
    expect(onTileSizeChange).toHaveBeenCalledExactlyOnceWith(props.requested);
  });

  it.each(['missing handler', 'disabled', 'default disabled'])(
    'leaves zoom keys unhandled with %s',
    async mode => {
      // Both opt-in and a callback are required; ignored keys retain their browser defaults.
      const onTileSizeChange = vi.fn();
      const onSelectionChange = vi.fn();
      await mount({
        zoomable: mode === 'default disabled' ? undefined : mode === 'missing handler',
        onTileSizeChange: mode === 'missing handler' ? undefined : onTileSizeChange,
        defaultSelectedIds: ['tile-1'],
        onSelectionChange,
      });
      act(() => tile(0).focus());
      for (const key of ['+', '=', '-']) expect(fireEvent.keyDown(tile(0), { key })).toBe(true);
      expect(within(tile(0)).getByText('Size 160, width 160')).toBeInTheDocument();
      expect(checkbox(1)).toBeChecked();
      expect(onTileSizeChange).not.toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  it.each(['ctrlKey', 'metaKey', 'altKey'] as const)(
    'preserves browser shortcuts using %s',
    async modifier => {
      // Modified zoom and browser reset keys must not become grid size requests.
      const onTileSizeChange = vi.fn();
      const onSelectionChange = vi.fn();
      await mount({ zoomable: true, onTileSizeChange, onSelectionChange });
      act(() => tile(0).focus());
      for (const key of ['+', '=', '-', '0']) {
        expect(fireEvent.keyDown(tile(0), { key, [modifier]: true })).toBe(true);
      }
      expect(onTileSizeChange).not.toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(within(tile(0)).getByText('Size 160, width 160')).toBeInTheDocument();
    }
  );

  it('lets a nested text input type zoom characters without grid effects', async () => {
    // Editable shortcuts belong to the focused input, even when grid zoom is enabled.
    const onTileSizeChange = vi.fn();
    const onSelectionChange = vi.fn();
    await mount({ zoomable: true, onTileSizeChange, onSelectionChange });
    const input = editor(0);
    await act(async () => userEvent.setup().type(input, '+=-'));
    expect(input).toHaveValue('+=-');
    for (const key of ['+', '=', '-']) expect(fireEvent.keyDown(input, { key })).toBe(true);
    expect(input).toHaveFocus();
    expect(onTileSizeChange).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('honors consumer prevention before reporting a zoom request', async () => {
    // A prevented native event vetoes the grid shortcut, including its controlled callback.
    const onTileSizeChange = vi.fn();
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLDivElement>) => event.preventDefault());
    await mount({ zoomable: true, onTileSizeChange, onKeyDown });
    act(() => tile(0).focus());
    for (const key of ['+', '=', '-']) expect(fireEvent.keyDown(tile(0), { key })).toBe(false);
    expect(onKeyDown).toHaveBeenCalledTimes(3);
    expect(onTileSizeChange).not.toHaveBeenCalled();
  });
});

describe('TileGrid explicit reset and layout persistence', () => {
  it.each(['inline control', 'external search'])(
    'prioritizes reset over simultaneous items/layout/size changes with focus in %s',
    async owner => {
      // The surviving active tile stays mounted but lies outside the final reset viewport.
      const onSelectionChange = vi.fn();
      const view = await mount(
        {
          scrollResetKey: 'original',
          defaultSelectedIds: ['tile-0', 'tile-3'],
          isDisabled: item => item.id === 'tile-1',
          onSelectionChange,
        },
        360
      );
      await scrollTo(view.root, 193);
      act(() => editor(3).focus());
      expect(editor(3)).toHaveFocus();
      if (owner === 'external search') act(() => view.outside.focus());
      // Seven 328px rows and six 8px gaps provide the new scroll extent.
      setScrollHeight(view.root, 2344);
      view.update({
        items: items.slice(1),
        layout: 'masonry',
        tileSize: 200,
        scrollResetKey: 'filtered',
      });
      // One 328px-wide column leaves disabled tile 1 and eligible tile 2 visible at the top.
      expect(view.root.scrollTop).toBe(0);
      expect(tile(2)).toHaveAttribute('tabindex', '0');
      expect(tile(3)).toHaveAttribute('tabindex', '-1');
      expect(owner === 'external search' ? view.outside : tile(2)).toHaveFocus();
      expect(checkbox(3)).toBeChecked();
      // Returning the filtered item restores an eighth 328px row and its gap.
      setScrollHeight(view.root, 2680);
      view.update({ items });
      expect(checkbox(0)).toBeChecked();
      expect(checkbox(3)).toBeChecked();
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  const sameKey = { query: 'same' };
  it.each([
    { name: 'same object', before: sameKey, after: sameKey, top: 193 },
    { name: 'NaN repeated', before: NaN, after: NaN, top: 193 },
    {
      name: 'new equal-content object',
      before: { query: 'same' },
      after: { query: 'same' },
      top: 0,
    },
    { name: 'positive to negative zero', before: 0, after: -0, top: 0 },
  ])('uses Object.is reset-key equality for $name', async ({ before, after, top }) => {
    // Array identity alone cannot reset scrolling; key equality is React dependency equality.
    const view = await mount({ scrollResetKey: before });
    await scrollTo(view.root, 193);
    view.update({ items: [...items], scrollResetKey: after });
    expect(view.root.scrollTop).toBe(top);
    expect(view.outside).toHaveFocus();
  });

  it('preserves a scrolled anchor, mounted active item, and selection when a page is appended', async () => {
    // The 25px offset within the row starting at 168px survives an unchanged reset key.
    const onSelectionChange = vi.fn();
    const view = await mount({
      scrollResetKey: 'same',
      defaultSelectedIds: ['tile-3'],
      onSelectionChange,
    });
    await scrollTo(view.root, 193);
    act(() => editor(3).focus());
    // Twelve tiles fill six 160px rows with five 8px gaps.
    setScrollHeight(view.root, 1000);
    view.update({ items: page });
    expect(view.root.scrollTop).toBe(193);
    expect(editor(3)).toHaveFocus();
    expect(tile(3)).toHaveAttribute('tabindex', '0');
    expect(checkbox(3)).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('does not scroll or autofocus an offscreen seeded selection on mount', async () => {
    // An overscan-mounted selected tile is not a visible entry target in the 160px viewport.
    const onSelectionChange = vi.fn();
    const view = await mount({ defaultSelectedIds: ['tile-3'], onSelectionChange });
    expect(view.root.scrollTop).toBe(0);
    expect(view.outside).toHaveFocus();
    expect(tile(0)).toHaveAttribute('tabindex', '0');
    expect(tile(3)).toHaveAttribute('tabindex', '-1');
    expect(checkbox(3)).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('keeps a still-visible active item and selection through layout and size changes', async () => {
    // Tile 1 remains visible after becoming the second 328px row in a 500px viewport.
    const onSelectionChange = vi.fn();
    const view = await mount({ defaultSelectedIds: ['tile-1'], onSelectionChange }, 500);
    act(() => editor(1).focus());
    for (const next of [{ layout: 'masonry' }, { tileSize: 200 }] as const) {
      view.update(next);
      expect(editor(1)).toHaveFocus();
      expect(tile(1)).toHaveAttribute('tabindex', '0');
      expect(checkbox(1)).toBeChecked();
      expect(view.root.scrollTop).toBe(0);
    }
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});
