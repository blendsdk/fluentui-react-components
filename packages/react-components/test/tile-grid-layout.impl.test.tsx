import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type { TileGridItemRenderArgs, TileGridProps } from '../src/components/TileGrid';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { TileGridItemView } from '../src/components/TileGrid/TileGridItemView';
import { setElementSize } from './jsdomStubs';

interface ImplItem {
  id: string;
  label: string;
  aspectRatio?: number;
}

const defaultItems: readonly ImplItem[] = [
  { id: 'a', label: 'Alpha', aspectRatio: 1 },
  { id: 'b', label: 'Bravo', aspectRatio: 1.5 },
  { id: 'c', label: 'Charlie', aspectRatio: 0.8 },
];

function renderGrid(props: Partial<TileGridProps<ImplItem>> = {}) {
  const { items = defaultItems, ...rest } = props;

  return render(
    <FluentProvider theme={webLightTheme}>
      <TileGrid
        items={items}
        getItemId={item => item.id}
        getItemLabel={item => item.label}
        getItemAspectRatio={item => item.aspectRatio}
        renderItem={({ item }) => <span>{item.label}</span>}
        ariaLabel="Impl grid"
        {...rest}
      />
    </FluentProvider>
  );
}

function measureList(width = 800, height = 600): HTMLElement {
  const list = screen.getByRole('list');
  act(() => {
    setElementSize(list, width, height);
  });
  return list;
}

describe('TileGrid layout implementation details', () => {
  it('renders no item wrappers before the container is measured', () => {
    renderGrid();

    expect(screen.getByRole('list', { name: 'Impl grid' })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.queryByText('No items')).not.toBeInTheDocument();
  });

  it.each(['fixed', 'masonry', 'justified', 'mosaic'] as const)(
    'renders a small %s fixture through the public component',
    layout => {
      renderGrid({ layout });
      measureList();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    }
  );

  it('falls back for a blank empty message and lets renderEmpty win', () => {
    const blank = renderGrid({ items: [], strings: { emptyMessage: '   ' } });
    expect(screen.getByText('No items')).toBeInTheDocument();
    blank.unmount();

    renderGrid({ items: [], renderEmpty: () => null });
    expect(screen.queryByText('No items')).not.toBeInTheDocument();
  });

  it('keeps the first duplicate ID and warns only once across grids', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resetDevWarningsForTests();
    const duplicateItems: readonly ImplItem[] = [defaultItems[0], defaultItems[1], defaultItems[0]];

    renderGrid({ items: duplicateItems });
    measureList();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    cleanup();

    renderGrid({ items: duplicateItems });
    measureList();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    const duplicateWarnings = warn.mock.calls.filter(([message]) =>
      String(message).includes('duplicate item IDs')
    );
    expect(duplicateWarnings).toHaveLength(1);
    warn.mockRestore();
  });

  it('does not log hostile labels or IDs and never fetches an image', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const hostile = '<img src="https://example.invalid/tile.png" onerror=alert(1)>';

    renderGrid({ items: [{ id: hostile, label: hostile }] });
    measureList();

    const messages = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map(value => String(value))
      .join(' ');
    expect(messages).not.toContain(hostile);
    expect(messages).not.toContain('example.invalid');
    expect(fetchSpy).not.toHaveBeenCalled();

    warn.mockRestore();
    error.mockRestore();
    fetchSpy.mockRestore();
  });

  it('marks mounted wrappers with their normalized index', () => {
    renderGrid();
    measureList();

    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('data-index', '0');
  });

  it('keeps the empty state as a single listitem after measurement', () => {
    renderGrid({ items: [] });
    measureList();

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('keeps the mounted window bounded when the measured width changes', async () => {
    const manyItems: readonly ImplItem[] = Array.from({ length: 200 }, (_, index) => ({
      id: `item-${index}`,
      label: `Item ${index}`,
    }));

    renderGrid({ items: manyItems });
    const list = measureList(800, 600);
    const initialCount = screen.getAllByRole('listitem').length;

    expect(initialCount).toBeGreaterThan(0);
    expect(initialCount).toBeLessThan(manyItems.length);

    act(() => {
      setElementSize(list, 400, 600);
    });

    await waitFor(() => {
      const nextCount = screen.getAllByRole('listitem').length;
      expect(nextCount).toBeGreaterThan(0);
      expect(nextCount).toBeLessThan(manyItems.length);
    });
  });

  it('re-renders the memoized cell only when its selection changes', () => {
    const item: ImplItem = { id: 'a', label: 'Alpha' };
    const rect = { id: 'a', index: 0, x: 0, y: 0, width: 100, height: 100 };
    const renderItem = vi.fn((args: TileGridItemRenderArgs<ImplItem>) => (
      <span>{args.item.label}</span>
    ));
    const cell = (selected: boolean) => (
      <TileGridItemView
        rect={rect}
        item={item}
        index={0}
        setSize={1}
        tileSize={100}
        selected={selected}
        selectable
        disabled={false}
        label="Alpha"
        renderItem={renderItem}
        className="cell"
      />
    );

    const { rerender } = render(cell(false));
    expect(renderItem).toHaveBeenCalledTimes(1);

    rerender(cell(false));
    expect(renderItem).toHaveBeenCalledTimes(1);

    rerender(cell(true));
    expect(renderItem).toHaveBeenCalledTimes(2);
  });
});
