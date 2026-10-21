import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import type { MouseEvent, Ref } from 'react';
import { userEvent } from 'storybook/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type {
  TileGridHandle,
  TileGridItemRenderArgs,
  TileGridProps,
} from '../src/components/TileGrid/TileGrid.types';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { setElementSize } from './jsdomStubs';

/** Small ordered collection whose labels also name the owned selection inputs. */
interface Item {
  /** Opaque selection identity. */
  id: string;
  /** Readable tile and input name. */
  label: string;
}

const items: readonly Item[] = ['a', 'b', 'c', 'd'].map(id => ({ id, label: `Tile ${id}` }));
const getItemId = (item: Item) => item.id;
const getItemLabel = (item: Item) => item.label;

/** Makes committed selected presentation observable through application content. */
function renderItem({ item, selected }: TileGridItemRenderArgs<Item>) {
  return <span>{`${item.label}: ${selected ? 'selected' : 'unselected'}`}</span>;
}

/** Mounts real grid composition and supplies only the missing jsdom measurements. */
async function mount(
  props: Partial<TileGridProps<Item>> = {},
  ref?: Ref<TileGridHandle>,
  height = 600,
  width = 800
) {
  render(
    <FluentProvider theme={webLightTheme}>
      <TileGrid
        ref={ref}
        items={items}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        renderItem={renderItem}
        ariaLabel="Tile interactions"
        selectionMode="multiselect"
        {...props}
      />
    </FluentProvider>
  );
  const root = screen.getByRole('list', { name: props.ariaLabel ?? 'Tile interactions' });
  await act(async () => setElementSize(root, width, height));
  return root;
}

function tile(id: string) {
  return screen.getByRole('listitem', { name: `Tile ${id}` });
}

beforeEach(() => resetDevWarningsForTests());
afterEach(() => vi.restoreAllMocks());

describe('TileGrid interaction contract', () => {
  it.each(['ctrlKey', 'metaKey'] as const)(
    'selects, toggles with %s, ranges, and activates once after double-click selection',
    async modifier => {
      // Each changed membership notifies once; dblclick follows its two ordinary clicks.
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const onItemActivate = vi.fn<(item: Item) => void>();
      await mount({ onSelectionChange, onItemActivate });
      fireEvent.click(tile('a'));
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a']));
      fireEvent.click(tile('c'), { [modifier]: true });
      expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set(['a', 'c']));
      fireEvent.click(tile('d'), { shiftKey: true });
      expect(onSelectionChange).toHaveBeenNthCalledWith(3, new Set(['a', 'c', 'd']));
      expect(onSelectionChange).toHaveBeenCalledTimes(3);
      expect(onItemActivate).not.toHaveBeenCalled();
      await act(async () => userEvent.setup().dblClick(tile('d')));
      expect(onSelectionChange).toHaveBeenNthCalledWith(4, new Set(['d']));
      expect(onSelectionChange).toHaveBeenCalledTimes(4);
      expect(onItemActivate).toHaveBeenCalledExactlyOnceWith(items[3]);
    }
  );

  it('replaces single selection and never toggles the selected wrapper off', async () => {
    // Single selection keeps radio semantics for plain and modified clicks alike.
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount({ selectionMode: 'single', onSelectionChange });
    fireEvent.click(tile('a'));
    fireEvent.click(tile('a'));
    fireEvent.click(tile('a'), { ctrlKey: true });
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a']));
    fireEvent.click(tile('b'), { metaKey: true });
    fireEvent.click(tile('b'));
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set(['b']));
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(within(tile('b')).getByText('Tile b: selected')).toBeInTheDocument();
    expect(within(tile('a')).getByText('Tile a: unselected')).toBeInTheDocument();
  });

  it.each(['ctrlKey', 'metaKey'] as const)(
    'activates a browse click but only selects on %s and Shift clicks',
    async modifier => {
      // Browse activation is immediate; modified selection never also activates the item.
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const onItemActivate = vi.fn<(item: Item) => void>();
      await mount({ interactionMode: 'browse', onSelectionChange, onItemActivate });
      fireEvent.click(tile('a'));
      expect(onItemActivate).toHaveBeenCalledExactlyOnceWith(items[0]);
      expect(onSelectionChange).not.toHaveBeenCalled();
      fireEvent.click(tile('b'), { [modifier]: true });
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
      fireEvent.click(tile('d'), { shiftKey: true });
      expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set(['b', 'c', 'd']));
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(onItemActivate).toHaveBeenCalledTimes(1);
    }
  );

  it.each(['click', 'Enter'] as const)(
    'activates an enabled none-mode tile with %s without controls or selection',
    async gesture => {
      // None mode still provides activation, including the wrapper's Enter action.
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const onItemActivate = vi.fn<(item: Item) => void>();
      await mount({ selectionMode: 'none', onSelectionChange, onItemActivate });
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
      if (gesture === 'click') fireEvent.click(tile('a'));
      else fireEvent.keyDown(tile('a'), { key: 'Enter' });
      expect(onItemActivate).toHaveBeenCalledExactlyOnceWith(items[0]);
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  it.each(['select', 'browse'] as const)(
    'keeps nested native controls, disclosure, and editing local in %s mode',
    async interactionMode => {
      // Native controls and effective editable hosts must never become wrapper gestures.
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const onItemActivate = vi.fn<(item: Item) => void>();
      const onLocalClick = vi.fn();
      await mount({
        items: items.slice(0, 1),
        interactionMode,
        onSelectionChange,
        onItemActivate,
        renderItem: () => (
          <div onClick={onLocalClick}>
            <button type="button">Local action</button>
            <a href="#local">Local link</a>
            <input aria-label="Local input" />
            <details>
              <summary>Local disclosure</summary>
              <span>Disclosure content</span>
            </details>
            <div
              ref={node => {
                node?.setAttribute('contenteditable', '');
              }}
              suppressContentEditableWarning
              aria-label="Empty editor"
            >
              <span>Empty editor child</span>
            </div>
            <div
              contentEditable="plaintext-only"
              suppressContentEditableWarning
              aria-label="Plain editor"
            >
              <span>Plain editor child</span>
            </div>
          </div>
        ),
      });
      const user = userEvent.setup();
      const targets = [
        screen.getByRole('button', { name: 'Local action' }),
        screen.getByRole('link', { name: 'Local link' }),
        screen.getByRole('textbox', { name: 'Local input' }),
        screen.getByText('Local disclosure'),
        screen.getByLabelText('Empty editor'),
        screen.getByText('Empty editor child'),
        screen.getByLabelText('Plain editor'),
        screen.getByText('Plain editor child'),
      ];
      for (const target of targets) {
        await act(async () => user.click(target));
        expect(onSelectionChange).not.toHaveBeenCalled();
        expect(onItemActivate).not.toHaveBeenCalled();
      }
      expect(onLocalClick).toHaveBeenCalledTimes(targets.length);
      expect(screen.getByText('Local disclosure').closest('details')).toHaveAttribute('open');
      fireEvent.change(screen.getByRole('textbox', { name: 'Local input' }), {
        target: { value: 'Local edit' },
      });
      expect(screen.getByRole('textbox', { name: 'Local input' })).toHaveValue('Local edit');
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(onItemActivate).not.toHaveBeenCalled();
    }
  );

  it.each(['select', 'browse'] as const)(
    'treats contenteditable=false as ordinary non-interactive content in %s mode',
    async interactionMode => {
      // Merely having the attribute does not make content an editing host.
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const onItemActivate = vi.fn<(item: Item) => void>();
      await mount({
        items: items.slice(0, 1),
        interactionMode,
        onSelectionChange,
        onItemActivate,
        renderItem: () => <span contentEditable={false}>Ordinary content</span>,
      });
      fireEvent.click(screen.getByText('Ordinary content'));
      if (interactionMode === 'select') {
        expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a']));
        expect(onItemActivate).not.toHaveBeenCalled();
      } else {
        expect(onItemActivate).toHaveBeenCalledExactlyOnceWith(items[0]);
        expect(onSelectionChange).not.toHaveBeenCalled();
      }
    }
  );

  it.each(['select', 'browse'] as const)(
    'runs the native click handler once and honors its prevention in %s mode',
    async interactionMode => {
      // Consumer cancellation of the same bubbling event vetoes the default grid action.
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const onItemActivate = vi.fn<(item: Item) => void>();
      const onClick = vi.fn((event: MouseEvent<HTMLDivElement>) => event.preventDefault());
      await mount({ interactionMode, onSelectionChange, onItemActivate, onClick });
      expect(fireEvent.click(tile('a'))).toBe(false);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(onItemActivate).not.toHaveBeenCalled();
    }
  );

  it.each(['browse', 'select'] as const)(
    'toggles a real named checkbox once per click and native Space in %s mode',
    async interactionMode => {
      // The input's own change is authoritative; neither click bubbling nor Space may duplicate it.
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const onItemActivate = vi.fn<(item: Item) => void>();
      await mount({ interactionMode, onSelectionChange, onItemActivate });
      const checkbox = screen.getByRole('checkbox', { name: 'Tile a' });
      expect(checkbox).toBeInstanceOf(HTMLInputElement);
      expect(checkbox).toHaveAttribute('type', 'checkbox');
      expect(checkbox).not.toBeChecked();
      const user = userEvent.setup();
      await act(async () => user.click(checkbox));
      expect(checkbox).toBeChecked();
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a']));
      expect(checkbox).toHaveFocus();
      await act(async () => user.keyboard(' '));
      expect(checkbox).not.toBeChecked();
      expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set());
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(onItemActivate).not.toHaveBeenCalled();
    }
  );

  it('selects a real named radio once and keeps it checked on repetition', async () => {
    // Owned radios select instead of toggling and never activate the surrounding tile.
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    const onItemActivate = vi.fn<(item: Item) => void>();
    await mount({
      selectionMode: 'single',
      interactionMode: 'browse',
      onSelectionChange,
      onItemActivate,
    });
    const radio = screen.getByRole('radio', { name: 'Tile b' });
    expect(radio).toBeInstanceOf(HTMLInputElement);
    expect(radio).toHaveAttribute('type', 'radio');
    fireEvent.click(radio);
    fireEvent.click(radio);
    expect(radio).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tile a' })).not.toBeChecked();
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
    expect(onItemActivate).not.toHaveBeenCalled();
  });

  it('groups radios within each grid without sharing a group across grids', async () => {
    // Native radio grouping cannot clear another mounted grid's selected input.
    const first = await mount({
      selectionMode: 'single',
      items: items.slice(0, 2),
      ariaLabel: 'First',
    });
    const second = await mount({
      selectionMode: 'single',
      items: items.slice(0, 2),
      ariaLabel: 'Second',
    });
    const firstRadios = within(first).getAllByRole('radio');
    const secondRadios = within(second).getAllByRole('radio');
    const firstName = firstRadios[0].getAttribute('name');
    const secondName = secondRadios[0].getAttribute('name');
    expect(firstName).toBeTruthy();
    expect(secondName).toBeTruthy();
    expect(firstName).not.toBe(secondName);
    for (const radio of firstRadios) expect(radio).toHaveAttribute('name', firstName);
    for (const radio of secondRadios) expect(radio).toHaveAttribute('name', secondName);
    fireEvent.click(within(first).getByRole('radio', { name: 'Tile a' }));
    fireEvent.click(within(second).getByRole('radio', { name: 'Tile b' }));
    expect(within(first).getByRole('radio', { name: 'Tile a' })).toBeChecked();
    expect(within(second).getByRole('radio', { name: 'Tile b' })).toBeChecked();
  });

  it('selects only eligible current items, preserves hidden IDs, and clears once per changed set', async () => {
    // Imperative changes share gesture eligibility and no-op callback suppression.
    const ref = createRef<TileGridHandle>();
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    const root = await mount(
      {
        items: items.slice(0, 3),
        defaultSelectedIds: ['hidden'],
        onSelectionChange,
        isDisabled: (item: Item) => item.id === 'b',
      },
      ref
    );
    expect(ref.current).not.toBeNull();
    act(() => ref.current?.scrollToSelected());
    expect(root.scrollTop).toBe(0);
    expect(onSelectionChange).not.toHaveBeenCalled();
    act(() => ref.current?.selectAll());
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['hidden', 'a', 'c']));
    act(() => ref.current?.selectAll());
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    act(() => ref.current?.clearSelection());
    expect(onSelectionChange).toHaveBeenNthCalledWith(2, new Set());
    act(() => ref.current?.clearSelection());
    act(() => ref.current?.scrollToSelected());
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(root.scrollTop).toBe(0);
    expect(screen.getByRole('checkbox', { name: 'Tile a' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Tile c' })).not.toBeChecked();
  });

  it('scrolls explicitly to a present selection without changing membership or notifying', async () => {
    // A hidden seed is skipped; scrolling to a present selected tile is not a selection action.
    const ref = createRef<TileGridHandle>();
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    const selectedIds = new Set(['hidden', 'c']);
    const root = await mount(
      {
        items: items.slice(0, 3),
        columns: 1,
        selectedIds,
        onSelectionChange,
      },
      ref,
      120,
      160
    );
    // jsdom does not derive scroll extent from the three 160px rows and two 8px gaps.
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 496 });
    expect(root.scrollTop).toBe(0);
    expect(ref.current).not.toBeNull();
    await act(async () => ref.current?.scrollToSelected());
    expect(root.scrollTop).toBeGreaterThan(0);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(selectedIds).toEqual(new Set(['hidden', 'c']));
    expect(within(tile('c')).getByText('Tile c: selected')).toBeInTheDocument();
  });

  it.each(['single', 'none'] as const)(
    'warns and ignores select-all in %s mode',
    async selectionMode => {
      // Select-all is available only for a mounted multiselect grid.
      const ref = createRef<TileGridHandle>();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      await mount({ selectionMode, onSelectionChange }, ref);
      expect(warn).not.toHaveBeenCalled();
      expect(ref.current).not.toBeNull();
      act(() => ref.current?.selectAll());
      expect(warn).toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
      for (const item of items) {
        expect(within(tile(item.id)).getByText(`${item.label}: unselected`)).toBeInTheDocument();
      }
    }
  );
});
