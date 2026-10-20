import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/index';
import type { TileGridProps } from '../src/index';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { setElementSize } from './jsdomStubs';

interface TestItem {
  id: string;
  label: string;
  aspectRatio?: number;
}

const defaultItems: readonly TestItem[] = [
  { id: 'a', label: 'Alpha', aspectRatio: 1 },
  { id: 'b', label: 'Bravo', aspectRatio: 1.5 },
  { id: 'c', label: 'Charlie', aspectRatio: 0.8 },
];

function renderGrid(props: Partial<TileGridProps<TestItem>> = {}) {
  const { items = defaultItems, ...rest } = props;

  return render(
    <FluentProvider theme={webLightTheme}>
      <TileGrid
        items={items}
        getItemId={item => item.id}
        getItemLabel={item => item.label}
        getItemAspectRatio={item => item.aspectRatio}
        renderItem={({ item }) => <span>{item.label}</span>}
        ariaLabel="Test grid"
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

describe('TileGrid layout and list contract', () => {
  it('renders the default empty message inside the named list root', () => {
    renderGrid({ items: [] });

    expect(screen.getByRole('list', { name: 'Test grid' })).toBeInTheDocument();
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('prefers renderEmpty over the empty string', () => {
    renderGrid({
      items: [],
      strings: { emptyMessage: 'Custom empty' },
      renderEmpty: () => <span>Custom empty node</span>,
    });

    expect(screen.getByText('Custom empty node')).toBeInTheDocument();
    expect(screen.queryByText('Custom empty')).not.toBeInTheDocument();
  });

  it('renders a custom empty string when renderEmpty is absent', () => {
    renderGrid({ items: [], strings: { emptyMessage: 'Custom empty' } });

    expect(screen.getByText('Custom empty')).toBeInTheDocument();
  });

  it('renders list semantics with setsize, posinset, and item labels', () => {
    renderGrid();
    measureList();

    expect(screen.getByRole('list', { name: 'Test grid' })).toBeInTheDocument();
    const renderedItems = screen.getAllByRole('listitem');

    expect(renderedItems).toHaveLength(3);
    expect(renderedItems[0]).toHaveAttribute('aria-setsize', '3');
    expect(renderedItems[0]).toHaveAttribute('aria-posinset', '1');
    expect(renderedItems[0]).toHaveAttribute('aria-label', 'Alpha');
    expect(renderedItems[0]).toHaveAttribute('data-tile-grid-item');
  });

  it('uses ariaLabel for the list accessible name', () => {
    renderGrid({ ariaLabel: 'Photos' });

    expect(screen.getByRole('list', { name: 'Photos' })).toBeInTheDocument();
  });

  it('uses aria-labelledby when both naming props are present', () => {
    render(<h2 id="photos-heading">Photos</h2>);
    renderGrid({ ariaLabel: undefined, 'aria-labelledby': 'photos-heading' });

    expect(screen.getByRole('list', { name: 'Photos' })).toBeInTheDocument();
  });

  it('warns when the list has no accessible name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resetDevWarningsForTests();

    renderGrid({ ariaLabel: undefined });

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('keeps the first duplicate ID and warns for invalid numeric props', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resetDevWarningsForTests();
    const duplicateItems: readonly TestItem[] = [defaultItems[0], defaultItems[1], defaultItems[0]];

    renderGrid({
      items: duplicateItems,
      minTileSize: 400,
      maxTileSize: 300,
      tileSize: 350,
      columns: 0,
    });
    measureList();

    const renderedItems = screen.getAllByRole('listitem');
    expect(renderedItems).toHaveLength(2);
    expect(renderedItems[0]).toHaveAttribute('aria-setsize', '2');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('renders hostile labels as text and never parses HTML', () => {
    const hostile = '<img src=x onerror=alert(1)>';

    renderGrid({ items: [{ id: 'x', label: hostile }] });
    measureList();

    expect(screen.getByText(hostile)).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});
