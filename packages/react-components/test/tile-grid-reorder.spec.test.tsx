import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { userEvent } from 'storybook/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type {
  TileGridItemRenderArgs,
  TileGridProps,
  TileGridReorderArgs,
} from '../src/components/TileGrid';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { setElementSize } from './jsdomStubs';

/**
 * Public reorder contract of the tile grid.
 *
 * The tests drive the grid as a black box: the custom `renderItem` turns the
 * handle and the reorder actions into ordinary buttons, so the assertions
 * observe only the public render arguments, the callback payload, and the
 * shared live region. No internal arrangement module is imported.
 */

/** Minimal application record whose identity and label are independent values. */
interface ReorderItem {
  /** Opaque identity used by selection and reorder callbacks. */
  id: string;
  /** Human-readable label shown in the tile and in the handle name. */
  label: string;
}

const GRID_LABEL = 'Reorder grid';

/** Builds a stable, ordered collection that makes indices easy to reason about. */
function makeItems(count: number): ReorderItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index + 1}`,
    label: `Tile ${index + 1}`,
  }));
}

const ITEMS = makeItems(20);
const SMALL_ITEMS = ITEMS.slice(0, 4);

const getItemId = (item: ReorderItem) => item.id;
const getItemLabel = (item: ReorderItem) => item.label;
const getItemAspectRatio = () => 1;

/**
 * Renders the public reorder surface as native buttons.
 *
 * The handle receives the pointer and keyboard listeners supplied by the grid,
 * while each reorder action calls its own `onSelect`. This keeps the test
 * independent from any future tile shell.
 */
function renderReorderTile({
  item,
  selected,
  dragHandleProps,
  reorderActions,
}: TileGridItemRenderArgs<ReorderItem>) {
  return (
    <span data-testid={`reorder-${item.id}`} data-selected={selected ? 'yes' : 'no'}>
      <span>{item.label}</span>
      {dragHandleProps ? (
        <button
          type="button"
          tabIndex={-1}
          ref={dragHandleProps.setNodeRef}
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          aria-label={dragHandleProps.label}
        >
          Handle
        </button>
      ) : null}
      {reorderActions?.map(action => (
        <button
          key={action.id}
          type="button"
          onClick={() => action.onSelect(item)}
          disabled={action.isDisabled?.(item)}
        >
          {action.label}
        </button>
      ))}
    </span>
  );
}

/** Builds the public props for one grid, forwarding only what the case sets. */
function reorderGrid(props: Partial<TileGridProps<ReorderItem>> = {}) {
  return (
    <TileGrid
      items={ITEMS}
      getItemId={getItemId}
      getItemLabel={getItemLabel}
      getItemAspectRatio={getItemAspectRatio}
      renderItem={renderReorderTile}
      selectionMode="multiselect"
      layout="fixed"
      columns={4}
      tileSize={160}
      gap={8}
      ariaLabel={GRID_LABEL}
      {...props}
    />
  );
}

/** Mounts a tree and supplies the viewport measurement that jsdom lacks. */
async function mountTree(tree: ReactNode) {
  const view = render(<>{tree}</>);
  const root = await screen.findByRole('list', { name: GRID_LABEL });

  await act(async () => {
    setElementSize(root, 800, 600);
  });

  await waitFor(() => {
    expect(root.querySelectorAll('[data-tile-grid-item]').length).toBeGreaterThan(0);
  });

  return { ...view, root };
}

function mountGrid(props: Partial<TileGridProps<ReorderItem>> = {}) {
  return mountTree(reorderGrid(props));
}

/** Returns the custom tile body for one item. */
function tile(id: string): HTMLElement {
  return screen.getByTestId(`reorder-${id}`);
}

/** Returns the single polite live region shared by selection and reorder news. */
function statusRegion(): HTMLElement {
  return screen.getByRole('status');
}

/** Asserts that a tile exposes neither a handle nor a reorder action. */
function expectNoReorderControls(id: string): void {
  const body = tile(id);
  expect(within(body).queryByRole('button', { name: /^Reorder / })).toBeNull();
  expect(within(body).queryByRole('button', { name: 'Move up' })).toBeNull();
  expect(within(body).queryByRole('button', { name: 'Move down' })).toBeNull();
}

/** Filters the warning log down to the missing reorder callback diagnostic. */
function reorderWarnings(spy: { mock: { calls: unknown[][] } }): string[] {
  return spy.mock.calls
    .map(call => call.map(value => String(value)).join(' '))
    .filter(message => /onReorder/.test(message));
}

/** Focuses a reorder action and activates it the way a keyboard user would. */
async function activateByKeyboard(itemId: string, label: string): Promise<HTMLElement> {
  const button = within(tile(itemId)).getByRole('button', { name: label });
  act(() => button.focus());
  expect(button).toHaveFocus();

  const user = userEvent.setup();
  await act(async () => {
    await user.keyboard('{Enter}');
  });

  return button;
}

/** Applies a move to an identity list, mirroring the requested resulting order. */
function moveId(ids: readonly string[], fromIndex: number, toIndex: number): string[] {
  const next = [...ids];
  const [movedId] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, movedId);
  return next;
}

/** Controlled selection owner that feeds every requested set back into the grid. */
function ControlledReorderGrid({ onReorder }: { onReorder: (args: TileGridReorderArgs) => void }) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

  return reorderGrid({
    items: SMALL_ITEMS,
    reorderable: true,
    onReorder,
    selectedIds,
    onSelectionChange: next => setSelectedIds(next),
  });
}

beforeEach(() => resetDevWarningsForTests());
afterEach(() => vi.restoreAllMocks());

describe('tile grid reorder contract', () => {
  it.each([
    { mode: 'omitted', reorderable: undefined },
    { mode: 'false', reorderable: false },
  ])('should expose no reorder controls when reorderable is $mode', async ({ reorderable }) => {
    // The callback alone never enables arranging; the feature flag is required.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountGrid({ items: SMALL_ITEMS, reorderable, onReorder });

    expectNoReorderControls('item-1');
    expectNoReorderControls('item-4');
    expect(statusRegion()).toBeEmptyDOMElement();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('should expose no reorder controls when reordering is disabled', async () => {
    // A disabled grid keeps the collection inert even with a reorder callback.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountGrid({
      items: SMALL_ITEMS,
      reorderable: true,
      reorderDisabled: true,
      onReorder,
    });

    expectNoReorderControls('item-1');
    expectNoReorderControls('item-4');
    expect(statusRegion()).toBeEmptyDOMElement();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('should warn once and expose no reorder controls when onReorder is missing', async () => {
    // The missing callback is reported once, not once per tile or per render.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const props: Partial<TileGridProps<ReorderItem>> = {
      items: SMALL_ITEMS,
      reorderable: true,
    };

    const view = await mountGrid(props);

    expectNoReorderControls('item-1');
    expectNoReorderControls('item-4');
    expect(statusRegion()).toBeEmptyDOMElement();
    expect(reorderWarnings(warn)).toHaveLength(1);

    view.rerender(reorderGrid(props));

    expectNoReorderControls('item-1');
    expectNoReorderControls('item-4');
    expect(reorderWarnings(warn)).toHaveLength(1);
  });

  it('should ignore reorder actions that cannot change the item index', async () => {
    // Boundary actions are inert: no callback and no live announcement.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountGrid({ items: SMALL_ITEMS, reorderable: true, onReorder });

    const moveUpAtStart = within(tile('item-1')).getByRole('button', { name: 'Move up' });
    const moveDownAtEnd = within(tile('item-4')).getByRole('button', { name: 'Move down' });

    expect(moveUpAtStart).toBeDisabled();
    expect(moveDownAtEnd).toBeDisabled();

    fireEvent.click(moveUpAtStart);
    fireEvent.click(moveDownAtEnd);

    expect(onReorder).not.toHaveBeenCalled();
    expect(statusRegion()).toBeEmptyDOMElement();
  });

  it('should report the requested move and announce its new position', async () => {
    // Moving index 2 forward yields the complete resulting order and position 4.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountGrid({ reorderable: true, onReorder });

    const body = tile('item-3');
    expect(within(body).getByRole('button', { name: 'Reorder Tile 3' })).toBeInTheDocument();

    fireEvent.click(within(body).getByRole('button', { name: 'Move down' }));

    expect(onReorder).toHaveBeenCalledExactlyOnceWith({
      itemId: 'item-3',
      fromIndex: 2,
      toIndex: 3,
      orderedIds: moveId(ITEMS.map(getItemId), 2, 3),
    });
    await waitFor(() => expect(statusRegion()).toHaveTextContent('Moved to position 4 of 20'));
  });

  it('should apply updated string labels without changing the item order', async () => {
    // Localized labels are part of the action identity, so a label change must
    // rebuild the cached keyboard actions.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();
    const strings = { moveUp: 'Up A', moveDown: 'Down A' };
    const view = await mountGrid({
      items: SMALL_ITEMS,
      reorderable: true,
      onReorder,
      strings,
    });

    expect(within(tile('item-1')).getByRole('button', { name: 'Down A' })).toBeInTheDocument();

    view.rerender(
      reorderGrid({
        items: SMALL_ITEMS,
        reorderable: true,
        onReorder,
        strings: { moveUp: 'Up B', moveDown: 'Down B' },
      })
    );

    expect(within(tile('item-1')).getByRole('button', { name: 'Down B' })).toBeInTheDocument();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('should fall back to the item label when the handle formatter is blank', async () => {
    await mountGrid({
      items: SMALL_ITEMS,
      reorderable: true,
      onReorder: vi.fn(),
      strings: { dragHandleLabel: () => '   ' },
    });

    expect(
      within(tile('item-1')).getByRole('button', { name: 'Reorder Tile 1' })
    ).toBeInTheDocument();
  });

  it('should disable moving up from the first position', async () => {
    // The first item has no previous slot, so its upward action does nothing.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountGrid({ items: SMALL_ITEMS, reorderable: true, onReorder });

    const body = tile('item-1');
    const moveUp = within(body).getByRole('button', { name: 'Move up' });
    expect(moveUp).toBeDisabled();
    expect(within(body).getByRole('button', { name: 'Move down' })).toBeEnabled();

    fireEvent.click(moveUp);

    expect(onReorder).not.toHaveBeenCalled();
    expect(statusRegion()).toBeEmptyDOMElement();
  });

  it('should disable moving down from the last position', async () => {
    // The last item has no following slot, so its downward action does nothing.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountGrid({ items: SMALL_ITEMS, reorderable: true, onReorder });

    const body = tile('item-4');
    const moveDown = within(body).getByRole('button', { name: 'Move down' });
    expect(moveDown).toBeDisabled();
    expect(within(body).getByRole('button', { name: 'Move up' })).toBeEnabled();

    fireEvent.click(moveDown);

    expect(onReorder).not.toHaveBeenCalled();
    expect(statusRegion()).toBeEmptyDOMElement();
  });

  it('should not expose reorder actions when reordering is disabled', async () => {
    // Disabling arrangement removes both positional actions from every tile.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountGrid({
      items: SMALL_ITEMS,
      reorderable: true,
      reorderDisabled: true,
      onReorder,
    });

    for (const item of SMALL_ITEMS) {
      const body = tile(item.id);
      expect(within(body).queryByRole('button', { name: 'Move up' })).toBeNull();
      expect(within(body).queryByRole('button', { name: 'Move down' })).toBeNull();
    }
    expect(statusRegion()).toBeEmptyDOMElement();
  });

  it('should keep a keyboard move from changing a three-item selection', async () => {
    // Keyboard activation of a reorder action never becomes a selection gesture.
    const selectedIds = new Set(['item-1', 'item-3', 'item-4']);
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountGrid({
      items: SMALL_ITEMS,
      reorderable: true,
      selectedIds,
      onSelectionChange,
      onReorder,
    });

    await activateByKeyboard('item-2', 'Move down');

    expect(onReorder).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).not.toHaveBeenCalled();
    for (const id of ['item-1', 'item-3', 'item-4']) {
      expect(tile(id)).toHaveAttribute('data-selected', 'yes');
    }
    expect(tile('item-2')).toHaveAttribute('data-selected', 'no');
  });

  it('should replace the move announcement with the next selection announcement', async () => {
    // Selection and reorder news share one polite region, so the latest wins.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountTree(<ControlledReorderGrid onReorder={onReorder} />);

    const status = statusRegion();
    expect(screen.getAllByRole('status')).toHaveLength(1);

    await activateByKeyboard('item-2', 'Move down');
    await waitFor(() => expect(status).toHaveTextContent('Moved to position 3 of 4'));

    fireEvent.click(tile('item-1'));

    await waitFor(() => expect(status).toHaveTextContent('1 of 4 selected'));
    expect(status).not.toHaveTextContent('Moved to position');
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toBe(status);
  });

  it('should omit reorder controls for a disabled item only', async () => {
    // An unavailable record keeps its content but cannot be arranged.
    const onReorder = vi.fn<(args: TileGridReorderArgs) => void>();

    await mountGrid({
      items: SMALL_ITEMS,
      reorderable: true,
      isDisabled: item => item.id === 'item-2',
      onReorder,
    });

    expectNoReorderControls('item-2');
    expect(within(tile('item-2')).queryAllByRole('button')).toHaveLength(0);

    const enabledBody = tile('item-1');
    expect(within(enabledBody).getByRole('button', { name: 'Reorder Tile 1' })).toBeInTheDocument();
    expect(within(enabledBody).getByRole('button', { name: 'Move up' })).toBeInTheDocument();
    expect(within(enabledBody).getByRole('button', { name: 'Move down' })).toBeInTheDocument();
  });
});
