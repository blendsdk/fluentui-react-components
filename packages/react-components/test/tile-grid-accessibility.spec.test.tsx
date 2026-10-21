import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type {
  TileGridHandle,
  TileGridInteractionMode,
  TileGridProps,
  TileGridStrings,
} from '../src/components/TileGrid';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { setElementSize } from './jsdomStubs';

/** Small labelled collection for observable list and selection semantics. */
interface Item {
  /** Opaque application identity, never an HTML fragment or selector. */
  id: string;
  /** Accessible name and readable application content. */
  label: string;
}

const items: readonly Item[] = ['a', 'b', 'c', 'd'].map(id => ({ id, label: `Tile ${id}` }));
const getItemId = (item: Item) => item.id;
const getItemLabel = (item: Item) => item.label;
const baseProps: TileGridProps<Item> = {
  items,
  getItemId,
  getItemLabel,
  renderItem: ({ item }) => <span>{item.label}</span>,
  ariaLabel: 'Accessible tiles',
  selectionMode: 'multiselect',
};

/** Retains the provider and external label across controlled prop updates. */
function grid(props: Partial<TileGridProps<Item>>) {
  return (
    <FluentProvider theme={webLightTheme}>
      <h2 id="collection-heading">Photographs</h2>
      <TileGrid {...baseProps} {...props} />
    </FluentProvider>
  );
}

/** Measures the real list using the existing jsdom virtualizer fixture. */
async function mount(props: Partial<TileGridProps<Item>> = {}) {
  const view = render(grid(props));
  await act(async () => setElementSize(screen.getByRole('list'), 800, 600));
  return { update: (next: Partial<TileGridProps<Item>>) => view.rerender(grid(next)) };
}

beforeEach(() => resetDevWarningsForTests());
afterEach(() => vi.restoreAllMocks());

describe('TileGrid accessibility contract', () => {
  it('announces only effective committed count changes using the latest formatter and total', async () => {
    // Parent proposals, equal counts, and presentation changes must not create announcements.
    const selectionCount = vi.fn((selected: number, total: number) => `${selected} / ${total}`);
    const latestFormatter = vi.fn((selected: number, total: number) => `${selected} from ${total}`);
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    const initial = { selectedIds: new Set(['a']), strings: { selectionCount }, onSelectionChange };
    const view = await mount(initial);
    const status = screen.getByRole('status');
    const list = screen.getByRole('list');
    expect(status).toBeEmptyDOMElement();
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(list).not.toContainElement(status);
    expect(list.nextElementSibling).toBe(status);
    expect(selectionCount).not.toHaveBeenCalled();
    view.update({ ...initial, selectedIds: new Set(['a', 'b']) });
    expect(status).toHaveTextContent('2 / 4');
    expect(selectionCount).toHaveBeenCalledExactlyOnceWith(2, 4);
    const replaced = { ...initial, selectedIds: new Set(['b', 'c']) };
    view.update(replaced);
    view.update({ ...replaced, items: items.slice(1) });
    const latest = {
      ...replaced,
      items: items.slice(1),
      strings: { selectionCount: latestFormatter },
      isDisabled: (item: Item) => item.id === 'c',
    };
    view.update(latest);
    expect(status).toHaveTextContent('2 / 4');
    expect(selectionCount).toHaveBeenCalledTimes(1);
    expect(latestFormatter).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tile d' }));
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b', 'c', 'd']));
    view.update({ ...latest, selectedIds: new Set(['b', 'c']) });
    expect(screen.getByRole('checkbox', { name: 'Tile d' })).not.toBeChecked();
    expect(status).toHaveTextContent('2 / 4');
    expect(latestFormatter).not.toHaveBeenCalled();
    // Hidden and disabled stored IDs still contribute to the authoritative count.
    view.update({ ...latest, selectedIds: new Set(['b', 'c', 'hidden']) });
    expect(status).toHaveTextContent('3 from 3');
    expect(latestFormatter).toHaveBeenCalledExactlyOnceWith(3, 3);
    view.update({ ...latest, selectedIds: new Set() });
    expect(status).toHaveTextContent('0 from 3');
    expect(latestFormatter).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('formats default counts with English grouping and does not invent hidden tiles', async () => {
    // Both count arguments use grouped numbers; absent selected IDs never become items.
    const manyItems = Array.from({ length: 2000 }, (_, index) => ({
      id: `visible-${index}`,
      label: `Photo ${index}`,
    }));
    const view = await mount({ items: manyItems, selectedIds: new Set() });
    const hidden = new Set(Array.from({ length: 1001 }, (_, index) => `hidden-${index}`));
    view.update({ items: manyItems, selectedIds: hidden });
    expect(screen.getByRole('status')).toHaveTextContent('1,001 of 2,000 selected');
    expect(screen.getAllByRole('listitem').length).toBeLessThan(120);
    for (const tile of screen.getAllByRole('listitem')) {
      expect(tile).toHaveAccessibleName(/^Photo /);
    }
  });

  it.each(['fixed', 'masonry', 'justified', 'mosaic'] as const)(
    'preserves named list, position, description, and empty semantics in %s layout',
    async layout => {
      // Irregular layouts are still lists, with readable descriptions rather than grid roles.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const props: Partial<TileGridProps<Item>> = {
        layout,
        'aria-labelledby': 'collection-heading',
        isDisabled: (item: Item) => item.id === 'b',
        renderItem: ({ item }) => <span>{item.id === 'b' ? 'Unavailable' : item.label}</span>,
      };
      const view = await mount(props);
      const list = screen.getByRole('list', { name: 'Photographs' });
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      expect(within(list).getAllByRole('listitem')).toHaveLength(items.length);
      items.forEach((item, index) => {
        const tile = within(list).getByRole('listitem', { name: item.label });
        expect(tile).toHaveAttribute('aria-setsize', String(items.length));
        expect(tile).toHaveAttribute('aria-posinset', String(index + 1));
        expect(tile).toHaveAccessibleDescription(item.id === 'b' ? 'Unavailable' : item.label);
        if (item.id === 'b') {
          expect(tile).toHaveAttribute('aria-disabled', 'true');
          expect(within(tile).queryByRole('checkbox')).not.toBeInTheDocument();
        } else {
          expect(tile).not.toHaveAttribute('aria-disabled', 'true');
          expect(within(tile).getByRole('checkbox', { name: item.label })).toBeInTheDocument();
        }
      });
      view.update({ ...props, items: [], strings: { emptyMessage: 'No photographs' } });
      expect(within(list).getByText('No photographs')).toBeInTheDocument();
      expect(screen.getAllByRole('status')).toHaveLength(1);
      expect(list).not.toContainElement(screen.getByRole('status'));
      expect(warn).not.toHaveBeenCalled();
      view.update({ layout, ariaLabel: undefined });
      expect(warn).toHaveBeenCalled();
      for (const call of warn.mock.calls) {
        expect(call).toHaveLength(1);
        expect(typeof call[0]).toBe('string');
        for (const item of items) expect(call[0]).not.toContain(item.label);
      }
    }
  );

  it('renders hostile labels and announcements as text and selects exact opaque IDs without logging data', async () => {
    // Untrusted text cannot create HTML, selector errors, synthetic items, or diagnostic data leaks.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const literal = '<img src=x onerror=alert(1)>';
    const hostileItems = ['quote"[id]', "bracket']", '照片🧩', '__proto__'].map((id, index) => ({
      id,
      label: `${literal} ${index}`,
    }));
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount({
      ariaLabel: undefined,
      items: hostileItems,
      defaultSelectedIds: ['https://private.example/hidden'],
      strings: { selectionCount: () => literal },
      onSelectionChange,
    });
    expect(warn).toHaveBeenCalled();
    const expected = new Set(['https://private.example/hidden']);
    for (const item of hostileItems) {
      expect(
        within(screen.getByRole('listitem', { name: item.label })).getByText(item.label)
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('checkbox', { name: item.label }));
      expected.add(item.id);
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(expected));
      expect(screen.getByRole('checkbox', { name: item.label })).toBeChecked();
    }
    expect(onSelectionChange).toHaveBeenCalledTimes(hostileItems.length);
    expect(screen.getByRole('status')).toHaveTextContent(literal);
    expect(screen.getAllByRole('listitem')).toHaveLength(hostileItems.length);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
    for (const call of warn.mock.calls) {
      expect(call).toHaveLength(1);
      expect(typeof call[0]).toBe('string');
      for (const privateText of [...expected, literal]) expect(call[0]).not.toContain(privateText);
    }
    expect(error).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
  });

  it.each(['single', 'none'] as const)(
    'warns statically when marquee is requested in %s mode',
    async selectionMode => {
      // Unsupported marquee configuration is diagnosed without interpolating item data.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await mount({
        selectionMode,
        enableMarquee: true,
        items: [{ id: 'private-id', label: 'Private label' }],
      });
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/marquee/i));
      for (const call of warn.mock.calls) {
        expect(call).toHaveLength(1);
        expect(typeof call[0]).toBe('string');
        expect(call[0]).not.toContain('private-id');
        expect(call[0]).not.toContain('Private label');
      }
    }
  );

  it.each(['browse', 'select'] as const)(
    'warns for explicit %s interaction in none mode but not its omitted default',
    async interactionMode => {
      // Only an explicitly supplied, ineffective interaction mode warrants this warning.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const props = {
        selectionMode: 'none' as const,
        items: [{ id: 'secret-id', label: 'Secret label' }],
      };
      const view = await mount(props);
      expect(warn).not.toHaveBeenCalled();
      view.update({ ...props, interactionMode });
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/interaction/i));
      for (const call of warn.mock.calls) {
        expect(call).toHaveLength(1);
        expect(typeof call[0]).toBe('string');
        expect(call[0]).not.toContain('secret-id');
        expect(call[0]).not.toContain('Secret label');
      }
    }
  );

  it('accepts the local selection contract and rejects invalid interaction modes and caller tab stops', () => {
    // The local API owns root tab order and exposes only the three documented ref operations.
    expectTypeOf<TileGridInteractionMode>().toEqualTypeOf<'browse' | 'select'>();
    expectTypeOf<TileGridStrings['selectionCount']>().toEqualTypeOf<
      (selected: number, total: number) => string
    >();
    expectTypeOf<keyof TileGridHandle>().toEqualTypeOf<
      'selectAll' | 'clearSelection' | 'scrollToSelected'
    >();
    const props: TileGridProps<Item> = {
      ...baseProps,
      interactionMode: 'browse',
      enableMarquee: true,
      isSelectable: (item: Item) => item.id !== 'a',
      isDisabled: (item: Item) => item.id === 'b',
      onItemActivate: (item: Item) => {
        expectTypeOf(item).toEqualTypeOf<Item>();
      },
      scrollResetKey: { query: 'new' },
      zoomable: true,
      onTileSizeChange: (size: number) => {
        expectTypeOf(size).toEqualTypeOf<number>();
      },
      strings: { selectionCount: (selected: number, total: number) => `${selected}/${total}` },
    };
    const ref = createRef<TileGridHandle>();
    const element = <TileGrid {...props} ref={ref} />;
    expect(element.props.ref).toBe(ref);
    expectTypeOf<TileGridHandle['selectAll']>().toEqualTypeOf<() => void>();
    expectTypeOf<TileGridHandle['clearSelection']>().toEqualTypeOf<() => void>();
    expectTypeOf<TileGridHandle['scrollToSelected']>().toEqualTypeOf<() => void>();
    // @ts-expect-error Only browse and select are valid interaction modes.
    const invalidMode: TileGridProps<Item> = { ...baseProps, interactionMode: 'edit' };
    // @ts-expect-error The grid owns its root tab stop.
    const invalidTabStop: TileGridProps<Item> = { ...baseProps, tabIndex: 0 };
    void invalidMode;
    void invalidTabStop;
  });
});
