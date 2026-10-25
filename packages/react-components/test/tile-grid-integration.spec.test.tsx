import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { existsSync, readFileSync } from 'node:fs';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as packageRoot from '../src/index';
import { TileGrid } from '../src/components/TileGrid';
import type { TileGridHandle, TileGridProps } from '../src/components/TileGrid/TileGrid.types';
import { setElementSize } from './jsdomStubs';

/** Small application records keep selection independent of labels and mounted item order. */
interface Item {
  id: string;
  label: string;
}

const items: readonly Item[] = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => ({
  id,
  label: `Tile ${id}`,
}));
const baseProps: TileGridProps<Item> = {
  items,
  getItemId: item => item.id,
  getItemLabel: item => item.label,
  renderItem: ({ item, selected, tileSize }) => (
    <span data-selected={String(selected)}>{`${item.label}; preferred size ${tileSize}`}</span>
  ),
  ariaLabel: 'Integration tiles',
  selectionMode: 'multiselect',
  enableMarquee: true,
  layout: 'fixed',
  columns: 2,
  tileSize: 160,
  gap: 20,
};

/** jsdom lacks capture ownership; keep this double local and keyed by the actual pointer ID. */
const captures = new Map<number, Element>();
const acquired = vi.fn<(owner: Element, pointerId: number) => void>();
const released = vi.fn<(owner: Element, pointerId: number) => void>();

beforeEach(() => {
  captures.clear();
  acquired.mockClear();
  released.mockClear();
  vi.spyOn(Element.prototype, 'setPointerCapture').mockImplementation(function (this: Element, id) {
    captures.set(id, this);
    acquired(this, id);
  });
  vi.spyOn(Element.prototype, 'hasPointerCapture').mockImplementation(function (this: Element, id) {
    return captures.get(id) === this;
  });
  vi.spyOn(Element.prototype, 'releasePointerCapture').mockImplementation(function (
    this: Element,
    id
  ) {
    if (captures.get(id) === this) {
      captures.delete(id);
      released(this, id);
    }
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  captures.clear();
});

/** Measures only the scroll host; the real geometry engine lays out 160px squares in two columns. */
async function mount(props: Partial<TileGridProps<Item>> = {}, height = 520) {
  const handle = createRef<TileGridHandle>();
  let current = props;
  const tree = () => (
    <FluentProvider theme={webLightTheme}>
      <TileGrid {...baseProps} {...current} ref={handle} />
    </FluentProvider>
  );
  const view = render(tree());
  const root = screen.getByRole('list', { name: 'Integration tiles' });
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 340, height));
  await act(async () => setElementSize(root, 340, height));
  return {
    root,
    handle,
    unmount: view.unmount,
    update(next: Partial<TileGridProps<Item>>) {
      current = { ...current, ...next };
      view.rerender(tree());
    },
  };
}

function tile(id: string) {
  return screen.getByRole('listitem', { name: `Tile ${id}` });
}

function overlay(root: HTMLElement) {
  return root.querySelector('[data-tile-grid-marquee=""]');
}

/** Dispatches real events, supplying only metadata missing in older jsdom pointer support. */
function pointer(target: Element, type: string, x: number, y: number, shiftKey = false) {
  const fields: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    pointerId: 17,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    clientX: x,
    clientY: y,
    shiftKey,
  };
  const event =
    typeof PointerEvent === 'function'
      ? new PointerEvent(type, fields)
      : new MouseEvent(type, fields);
  if (!(typeof PointerEvent === 'function' && event instanceof PointerEvent)) {
    Object.defineProperties(event, {
      pointerId: { value: fields.pointerId },
      pointerType: { value: fields.pointerType },
      isPrimary: { value: fields.isPrimary },
    });
  }
  fireEvent(target, event);
}

describe('TileGrid combined application flows', () => {
  it('keeps hidden selection through range, checkbox, filter, append, zoom, marquee and clear', async () => {
    // Only committed membership changes notify; data and geometry updates retain the user state.
    const onSelectionChange = vi.fn();
    const selectionCount = vi.fn((selected: number, total: number) => `${selected} of ${total}`);
    const view = await mount(
      {
        defaultSelectedIds: new Set(['b', 'hidden']),
        scrollResetKey: 'all',
        onSelectionChange,
        strings: { selectionCount },
      },
      360
    );
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(selectionCount).not.toHaveBeenCalled();

    act(() => tile('b').focus());
    fireEvent.keyDown(tile('b'), { key: 'ArrowDown', shiftKey: true });
    expect(tile('d')).toHaveFocus();
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['hidden', 'b', 'c', 'd']));
    expect(screen.getByRole('status')).toHaveTextContent('4 of 6');

    const control = screen.getByRole('checkbox', { name: 'Tile c' });
    // fireEvent does not perform the browser's pointer focus default, so establish it explicitly.
    act(() => control.focus());
    fireEvent.click(control);
    expect(control).toHaveFocus();
    expect(control).not.toBeChecked();
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['hidden', 'b', 'd']));
    expect(screen.getByRole('status')).toHaveTextContent('3 of 6');

    // Three rows occupy 520px; start from a real nonzero offset so reset-to-top is observable.
    Object.defineProperty(view.root, 'scrollHeight', { configurable: true, value: 520 });
    await act(async () => {
      view.root.scrollTop = 100;
      fireEvent.scroll(view.root);
    });
    expect(view.root.scrollTop).toBe(100);
    expect(control).toHaveFocus();

    const filtered = items.filter(item => ['b', 'e', 'f'].includes(item.id));
    view.update({ items: filtered, scrollResetKey: 'filtered' });
    await waitFor(() => expect(tile('b')).toHaveFocus());
    expect(view.root.scrollTop).toBe(0);
    expect(tile('b')).toHaveAttribute('tabindex', '0');
    const appended = [...filtered, ...items.filter(item => item.id === 'c')];
    view.update({ items: appended });
    expect(tile('b')).toHaveFocus();
    expect(tile('b')).toHaveAttribute('tabindex', '0');
    view.update({ tileSize: 200 });
    expect(within(tile('b')).getByText('Tile b; preferred size 200')).toBeVisible();
    expect(tile('b')).toHaveFocus();
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(selectionCount.mock.calls).toEqual([
      [4, 6],
      [3, 6],
    ]);

    // Explicit columns retain 160px actual widths; e occupies x=180..340, y=0..160.
    pointer(view.root, 'pointerdown', 170, 40, true);
    pointer(view.root, 'pointermove', 300, 120, true);
    await waitFor(() => {
      expect(overlay(view.root)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'Tile e' })).toBeChecked();
    });
    expect(acquired).toHaveBeenCalledExactlyOnceWith(view.root, 17);
    expect(view.root.hasPointerCapture(17)).toBe(true);
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(selectionCount).toHaveBeenCalledTimes(2);
    pointer(view.root, 'pointerup', 300, 120, true);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['hidden', 'b', 'd', 'e']));
    expect(overlay(view.root)).not.toBeInTheDocument();
    expect(released).toHaveBeenCalledExactlyOnceWith(view.root, 17);
    expect(screen.getByRole('status')).toHaveTextContent('4 of 4');

    expect(view.handle.current).not.toBeNull();
    act(() => view.handle.current?.clearSelection());
    expect(onSelectionChange.mock.calls).toEqual([
      [new Set(['hidden', 'b', 'c', 'd'])],
      [new Set(['hidden', 'b', 'd'])],
      [new Set(['hidden', 'b', 'd', 'e'])],
      [new Set()],
    ]);
    expect(selectionCount.mock.calls).toEqual([
      [4, 6],
      [3, 6],
      [4, 4],
      [0, 4],
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('0 of 4');
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).not.toBeChecked();
  });

  it('releases captured scrolling gestures across remounts without reclaiming external focus', async () => {
    // Recovery and gesture teardown share one lifecycle; detached input must never commit later.
    render(<input aria-label="External search" />);
    const outside = screen.getByRole('textbox', { name: 'External search' });
    const onSelectionChange = vi.fn();
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame');
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');
    const addListener = vi.spyOn(document, 'addEventListener');
    const removeListener = vi.spyOn(document, 'removeEventListener');
    for (let cycle = 0; cycle < 3; cycle += 1) {
      act(() => outside.focus());
      const view = await mount({ onSelectionChange }, 200);
      expect(outside).toHaveFocus();
      act(() => tile('c').focus());
      view.update({ items: items.filter(item => item.id !== 'c'), scrollResetKey: cycle });
      await waitFor(() => expect(tile('a')).toHaveFocus());
      act(() => outside.focus());
      Object.defineProperty(view.root, 'scrollHeight', { configurable: true, value: 520 });
      pointer(view.root, 'pointerdown', 170, 100);
      pointer(view.root, 'pointermove', 300, 198);
      await waitFor(() => {
        expect(overlay(view.root)).toBeInTheDocument();
        expect(view.root.scrollTop).toBeGreaterThan(0);
      });
      expect(screen.getByRole('checkbox', { name: 'Tile b' })).toBeChecked();
      expect(view.root.hasPointerCapture(17)).toBe(true);
      expect(outside).toHaveFocus();
      const frame = requestFrame.mock.results.at(-1);
      expect(frame?.type).toBe('return');
      const gestureListeners = addListener.mock.calls.filter(([type]) => type === 'keydown');
      expect(gestureListeners.length).toBeGreaterThan(0);
      view.unmount();
      expect(captures.size).toBe(0);
      expect(released).toHaveBeenCalledWith(view.root, 17);
      expect(cancelFrame).toHaveBeenCalledWith(frame?.value);
      for (const [, listener] of gestureListeners) {
        expect(
          removeListener.mock.calls.some(
            ([type, removed]) => type === 'keydown' && removed === listener
          )
        ).toBe(true);
      }
      const scheduled = requestFrame.mock.calls.length;
      const top = view.root.scrollTop;
      pointer(view.root, 'pointermove', 300, 198);
      pointer(view.root, 'pointerup', 300, 198);
      fireEvent.keyDown(outside, { key: 'Escape' });
      await act(async () => new Promise(resolve => setTimeout(resolve, 50)));
      expect(requestFrame).toHaveBeenCalledTimes(scheduled);
      expect(view.root.scrollTop).toBe(top);
      expect(outside).toHaveFocus();
      expect(onSelectionChange).not.toHaveBeenCalled();
      addListener.mockClear();
      removeListener.mockClear();
    }
    expect(acquired).toHaveBeenCalledTimes(3);
    expect(released).toHaveBeenCalledTimes(3);
  });

  it('keeps hostile labels literal and opaque IDs intact through selection, filtering and warnings', async () => {
    // Combined actions must not parse labels, construct selectors from IDs, or leak values in warnings.
    const literal = '<img src=x onerror=alert(1)>';
    const privateItems = [
      { id: 'quote"[雪]', label: literal },
      { id: '__proto__', label: 'Prototype item' },
      { id: 'https://private.example/item?q="', label: 'Private record' },
    ];
    const hidden = 'private-hidden-id';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const onSelectionChange = vi.fn();
    const view = await mount({
      items: privateItems,
      defaultSelectedIds: [hidden],
      onSelectionChange,
      strings: { selectionCount: () => literal },
    });
    const first = screen.getByRole('checkbox', { name: literal });
    act(() => first.focus());
    fireEvent.click(first);
    const firstTile = screen.getByRole('listitem', { name: literal });
    expect(within(firstTile).getByText(`${literal}; preferred size 160`)).toBeVisible();
    expect(document.querySelector('img')).toBeNull();
    act(() => firstTile.focus());
    fireEvent.keyDown(firstTile, { key: 'ArrowDown', shiftKey: true });
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      new Set([hidden, ...privateItems.map(item => item.id)])
    );
    const last = privateItems[2]!;
    view.update({ items: [last], scrollResetKey: 'private-filter' });
    expect(screen.getByRole('listitem', { name: last.label })).toHaveFocus();
    view.update({ selectionMode: 'single' });
    fireEvent.click(screen.getByRole('checkbox', { name: last.label }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(
      new Set([hidden, privateItems[0]!.id, '__proto__'])
    );
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(literal);
    expect(document.querySelector('img')).toBeNull();
    expect(warn).toHaveBeenCalled();
    for (const call of warn.mock.calls) {
      expect(call).toHaveLength(1);
      expect(typeof call[0]).toBe('string');
      for (const value of [hidden, ...privateItems.flatMap(item => [item.id, item.label])]) {
        expect(call[0]).not.toContain(value);
      }
    }
    expect(error).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
  });

  it('exposes the completed TileGrid surface in the stable runtime and declaration package', () => {
    // The complete public surface replaces the earlier "keep TileGrid local" guard.
    expect(TileGrid).toBeTypeOf('function');
    expect(packageRoot.TileGrid).toBe(TileGrid);
    expect(packageRoot.TileGridItem).toBeTypeOf('function');
    expect(Object.keys(packageRoot).some(name => /GridSelection|Marquee/.test(name))).toBe(false);
    // Package test commands run here; jsdom's transformed module URLs are HTTP, not file URLs.
    expect(readFileSync('dist/index.js', 'utf8')).toContain('TileGrid');
    expect(readFileSync('dist/index.d.ts', 'utf8')).toContain('TileGrid');
    expect(existsSync('dist/components/TileGrid')).toBe(true);
    expect(existsSync('dist/components/TileGridItem')).toBe(true);
  });
});
