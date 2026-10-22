import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type { TileGridProps } from '../src/components/TileGrid/TileGrid.types';
import { setElementSize } from './jsdomStubs';

/** Application records give the real controls and selected content independent DOM oracles. */
interface Item {
  id: string;
  label: string;
}

const items: readonly Item[] = ['a', 'b', 'c', 'd'].map(id => ({ id, label: `Tile ${id}` }));
const baseProps: TileGridProps<Item> = {
  items,
  getItemId: item => item.id,
  getItemLabel: item => item.label,
  renderItem: ({ item, selected }) => (
    <>
      <span>{`${item.label}: ${selected ? 'selected' : 'unselected'}`}</span>
      <button type="button">Open {item.id}</button>
      <a href="#details">Details {item.id}</a>
      <input aria-label={`Edit ${item.id}`} />
      <div role="menu" aria-label={`Menu ${item.id}`}>
        <button role="menuitem" type="button" onKeyDown={event => event.stopPropagation()}>
          Action {item.id}
        </button>
      </div>
    </>
  ),
  ariaLabel: 'Marquee tiles',
  selectionMode: 'multiselect',
  enableMarquee: true,
  columns: 4,
  tileSize: 80,
  minTileSize: 80,
  gap: 20,
  defaultSelectedIds: ['hidden', 'a'],
  isDisabled: item => item.id === 'c',
  isSelectable: item => item.id !== 'd',
};

/** Capture belongs to one element per pointer, rather than the shared always-false fallback. */
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

/** Supplies only missing container layout; the real geometry engine positions 80px tiles at 100px intervals. */
async function mount(props: Partial<TileGridProps<Item>> = {}, border = 0, height = 400) {
  const tree = (next: Partial<TileGridProps<Item>>) => (
    <FluentProvider theme={webLightTheme}>
      <form aria-label="Marquee form">
        <input aria-label="External search" defaultValue="Original" />
        <TileGrid {...baseProps} {...next} />
      </form>
    </FluentProvider>
  );
  const view = render(tree(props));
  const root = screen.getByRole('list', { name: 'Marquee tiles' });
  Object.defineProperties(root, {
    clientLeft: { configurable: true, value: border },
    clientTop: { configurable: true, value: border },
  });
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(border ? 40 : 0, border ? 50 : 0, 380 + 2 * border, height + 2 * border)
  );
  await act(async () => setElementSize(root, 380, height));
  const outside = screen.getByRole('textbox', { name: 'External search' });
  act(() => outside.focus());
  return {
    root,
    outside,
    unmount: view.unmount,
    update: (next: Partial<TileGridProps<Item>>) => view.rerender(tree({ ...props, ...next })),
  };
}

/** Uses native event dispatch; older jsdom versions need only the missing pointer metadata. */
function pointer(target: Element, type: string, x = 90, y = 30, init: PointerEventInit = {}) {
  const fields: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    pointerId: 7,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    clientX: x,
    clientY: y,
    ...init,
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
  return event;
}

function tile(id: string) {
  return screen.getByRole('listitem', { name: `Tile ${id}` });
}

function overlay(root: HTMLElement) {
  return root.querySelector<HTMLElement>('[data-tile-grid-marquee=""]');
}

/** Checks both application rendering and the real input, so decoration alone cannot pass. */
function selected(id: string, value: boolean) {
  expect(
    within(tile(id)).getByText(`Tile ${id}: ${value ? 'selected' : 'unselected'}`)
  ).toBeVisible();
  const control = within(tile(id)).queryByRole('checkbox', { name: `Tile ${id}` });
  if (control) expect(control).toHaveProperty('checked', value);
}

/** Every terminal-path test first proves a captured, visually active gesture. */
async function start(root: HTMLElement, modifiers: PointerEventInit = {}) {
  const down = pointer(root, 'pointerdown', 90, 30, modifiers);
  pointer(root, 'pointermove', 280, 70, modifiers);
  await waitFor(() => {
    expect(overlay(root)).toBeInTheDocument();
    selected('b', true);
  });
  expect(down.defaultPrevented).toBe(true);
  expect(acquired).toHaveBeenCalledWith(root, 7);
  expect(root.hasPointerCapture(7)).toBe(true);
}

/** Later terminal input must be harmless after a cancellation or a successful commit. */
function lateEvents(root: HTMLElement) {
  pointer(root, 'pointermove', 370, 70);
  pointer(root, 'pointerup', 370, 70);
  pointer(root, 'pointercancel');
  pointer(root, 'lostpointercapture');
}

describe('TileGrid mounted marquee', () => {
  it.each(['plain', 'shiftKey', 'ctrlKey', 'metaKey'] as const)(
    'commits %s membership once, retaining hidden IDs only for addition',
    async modifier => {
      // Only eligible intersections can be added; modifiers preserve the complete original set.
      const onSelectionChange = vi.fn();
      const onItemActivate = vi.fn();
      const { root } = await mount({ onSelectionChange, onItemActivate });
      await start(root, modifier === 'plain' ? {} : { [modifier]: true });
      selected('a', modifier !== 'plain');
      selected('c', false);
      selected('d', false);
      expect(onSelectionChange).not.toHaveBeenCalled();
      pointer(root, 'pointerup', 370, 70);
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(
        new Set(modifier === 'plain' ? ['b'] : ['hidden', 'a', 'b'])
      );
      expect(overlay(root)).not.toBeInTheDocument();
      expect(released).toHaveBeenCalledExactlyOnceWith(root, 7);
      expect(onItemActivate).not.toHaveBeenCalled();
    }
  );

  it.each(['mouse', 'pen'])('keeps 3px pending and activates at 4px for %s', async pointerType => {
    // A short background gesture neither clears the seed nor activates a tile.
    const onSelectionChange = vi.fn();
    const onItemActivate = vi.fn();
    const { root } = await mount({ onSelectionChange, onItemActivate });
    pointer(root, 'pointerdown', 90, 30, { pointerType });
    pointer(root, 'pointermove', 93, 30, { pointerType });
    expect(overlay(root)).not.toBeInTheDocument();
    selected('a', true);
    pointer(root, 'pointerup', 93, 30, { pointerType });
    expect(onSelectionChange).not.toHaveBeenCalled();
    pointer(root, 'pointerdown', 90, 30, { pointerType });
    pointer(root, 'pointermove', 94, 30, { pointerType });
    await waitFor(() => expect(overlay(root)).toBeInTheDocument());
    pointer(root, 'pointermove', 140, 70, { pointerType });
    await waitFor(() => selected('b', true));
    pointer(root, 'pointerup', 140, 70, { pointerType });
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
    expect(onItemActivate).not.toHaveBeenCalled();
  });

  it.each(['tile', 'checkbox', 'button', 'link', 'textbox', 'menu', 'nested list'])(
    'excludes the %s origin after proving background gestures work',
    async origin => {
      // Tile descendants, controls and nested lists never become background gestures.
      const onSelectionChange = vi.fn();
      const { root } = await mount({ onSelectionChange });
      await start(root);
      fireEvent.keyDown(root, { key: 'Escape' });
      const target =
        origin === 'tile'
          ? tile('a')
          : origin === 'nested list'
            ? root.appendChild(document.createElement('div'))
            : within(tile('a')).getByRole(origin);
      if (origin === 'nested list') target.setAttribute('role', 'list');
      const acquisitions = acquired.mock.calls.length;
      pointer(target, 'pointerdown');
      pointer(root, 'pointermove', 280, 70);
      pointer(root, 'pointerup', 280, 70);
      expect(acquired).toHaveBeenCalledTimes(acquisitions);
      expect(overlay(root)).not.toBeInTheDocument();
      selected('a', true);
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  it.each([
    { name: 'touch', pointerType: 'touch' },
    { name: 'secondary button', button: 2 },
    { name: 'nonprimary pointer', isPrimary: false },
  ])('leaves $name gestures native', async ({ name: _name, ...init }) => {
    // Unaccepted streams must not prevent native scrolling or acquire capture.
    const onSelectionChange = vi.fn();
    const { root } = await mount({ onSelectionChange });
    await start(root);
    fireEvent.keyDown(root, { key: 'Escape' });
    const acquisitions = acquired.mock.calls.length;
    expect(pointer(root, 'pointerdown', 90, 30, init).defaultPrevented).toBe(false);
    pointer(root, 'pointermove', 280, 70, init);
    pointer(root, 'pointerup', 280, 70, init);
    expect(acquired).toHaveBeenCalledTimes(acquisitions);
    expect(overlay(root)).not.toBeInTheDocument();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('excludes empty-state content and preserves its placeholder listitem', async () => {
    // Empty content belongs inside the list but is not a fabricated selected data item.
    const onSelectionChange = vi.fn();
    const { root, update } = await mount({ onSelectionChange });
    await start(root);
    fireEvent.keyDown(root, { key: 'Escape' });
    update({ items: [], renderEmpty: () => <span>No photos</span> });
    const empty = within(root).getByText('No photos');
    expect(empty.closest('[role="listitem"]')).toBeInTheDocument();
    expect(screen.queryByRole('listitem', { name: 'Tile hidden' })).not.toBeInTheDocument();
    const acquisitions = acquired.mock.calls.length;
    pointer(empty, 'pointerdown');
    lateEvents(root);
    expect(acquired).toHaveBeenCalledTimes(acquisitions);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('honors a prevented consumer pointerdown', async () => {
    // Native root handlers can veto library gesture ownership.
    const onSelectionChange = vi.fn();
    const { root } = await mount({
      onSelectionChange,
      onPointerDown: event => event.preventDefault(),
    });
    pointer(root, 'pointerdown');
    lateEvents(root);
    expect(acquired).not.toHaveBeenCalled();
    expect(overlay(root)).not.toBeInTheDocument();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it.each(['Escape on root', 'Escape outside', 'pointercancel', 'lostpointercapture'])(
    'cancels active preview with %s and ignores later terminal events',
    async reason => {
      // Cancellation restores the source without committing preview or stealing external focus.
      const onSelectionChange = vi.fn();
      const { root, outside } = await mount({ onSelectionChange });
      await start(root);
      selected('a', false);
      expect(outside).toHaveFocus();
      if (reason.startsWith('Escape')) {
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        fireEvent(reason === 'Escape outside' ? outside : root, event);
        expect(event.defaultPrevented).toBe(true);
      } else {
        if (reason === 'lostpointercapture') captures.delete(7);
        pointer(root, reason);
      }
      expect(overlay(root)).not.toBeInTheDocument();
      selected('a', true);
      selected('b', false);
      lateEvents(root);
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(root.hasPointerCapture(7)).toBe(false);
      expect(fireEvent.keyDown(outside, { key: 'Escape' })).toBe(true);
    }
  );

  it.each(['prevented', 'menu'])('respects %s Escape before document cancellation', async kind => {
    // The document listener must not consume an Escape already owned by another control.
    const onSelectionChange = vi.fn();
    const { root, outside } = await mount({ onSelectionChange });
    await start(root);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    if (kind === 'prevented') event.preventDefault();
    fireEvent(kind === 'menu' ? within(tile('a')).getByRole('menuitem') : outside, event);
    expect(overlay(root)).toBeInTheDocument();
    selected('b', true);
    pointer(root, 'pointerup', 280, 70);
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
  });

  it('ignores foreign pointers and keeps one committed result after duplicate terminal events', async () => {
    // Only the captured pointer may update or terminate this gesture.
    const onSelectionChange = vi.fn();
    const { root } = await mount({ onSelectionChange });
    await start(root);
    for (const type of ['pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) {
      pointer(root, type, 370, 70, { pointerId: 8 });
    }
    expect(overlay(root)).toHaveStyle({
      left: '90px',
      top: '30px',
      width: '190px',
      height: '40px',
    });
    expect(onSelectionChange).not.toHaveBeenCalled();
    pointer(root, 'pointerup', 280, 70);
    lateEvents(root);
    selected('b', true);
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
    expect(released).toHaveBeenCalledExactlyOnceWith(root, 7);
  });

  it('moves the decorative rectangle with unchanged hits and samples the release point', async () => {
    // Rectangle updates and final coordinates are independent of changes to the preview hit set.
    const onSelectionChange = vi.fn();
    const { root } = await mount({ onSelectionChange, isDisabled: () => false });
    pointer(root, 'pointerdown');
    pointer(root, 'pointermove', 140, 70);
    await waitFor(() => selected('b', true));
    expect(overlay(root)).toHaveAttribute('aria-hidden', 'true');
    expect(overlay(root)).toHaveStyle({ pointerEvents: 'none' });
    pointer(root, 'pointermove', 150, 80);
    await waitFor(() =>
      expect(overlay(root)).toHaveStyle({
        left: '90px',
        top: '30px',
        width: '60px',
        height: '50px',
      })
    );
    expect(root.querySelectorAll('[data-tile-grid-marquee]')).toHaveLength(1);
    expect(onSelectionChange).not.toHaveBeenCalled();
    pointer(root, 'pointerup', 240, 70);
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b', 'c']));
  });

  it.each([0, 10])('uses the client-area origin with a %ipx root border', async border => {
    // A rectangle wholly in the gap left of x=100 cannot hit the tile at x=100.
    const onSelectionChange = vi.fn();
    const { root } = await mount({ onSelectionChange }, border);
    const x = border ? 50 : 0;
    const y = border ? 60 : 0;
    pointer(root, 'pointerdown', x + 85, y + 30);
    pointer(root, 'pointermove', x + 95, y + 70);
    await waitFor(() =>
      expect(overlay(root)).toHaveStyle({
        left: '85px',
        top: '30px',
        width: '10px',
        height: '40px',
      })
    );
    selected('a', false);
    selected('b', false);
    pointer(root, 'pointerup', x + 95, y + 70);
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set());
  });

  it('uses cached full geometry at release and excludes boundary-only intersections', async () => {
    // An offscreen final rectangle uses cached layout, never tile DOM measurements.
    const onSelectionChange = vi.fn();
    const many = 'abcdefghijkl'.split('').map(id => ({ id, label: `Tile ${id}` }));
    const { root } = await mount(
      { items: many, onSelectionChange, isDisabled: () => false },
      0,
      120
    );
    const measurements = ['a', 'b'].map(id => vi.spyOn(tile(id), 'getBoundingClientRect'));
    await start(root);
    pointer(root, 'pointerup', 200, 230);
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b', 'f', 'j']));
    for (const measurement of measurements) expect(measurement).not.toHaveBeenCalled();
  });

  it.each(['items', 'order', 'layout', 'size', 'selectable', 'disabled', 'selection', 'enabled'])(
    'cancels pending and active gestures when %s changes',
    async change => {
      // External inputs invalidate the gesture; cancellation must use the latest authoritative source.
      const onSelectionChange = vi.fn();
      const { root, update } = await mount({ selectedIds: new Set(['a']), onSelectionChange });
      const changes: Record<string, Partial<TileGridProps<Item>>> = {
        items: { items: items.slice(0, 3) },
        order: { items: [...items].reverse() },
        layout: { layout: 'masonry' },
        size: { tileSize: 100 },
        selectable: { isSelectable: item => item.id !== 'd' },
        disabled: { isDisabled: item => item.id === 'c' },
        selection: { selectedIds: new Set(['b']) },
        enabled: { enableMarquee: false },
      };
      await start(root);
      update(changes[change]);
      expect(overlay(root)).not.toBeInTheDocument();
      selected(change === 'selection' ? 'b' : 'a', true);
      lateEvents(root);
      expect(onSelectionChange).not.toHaveBeenCalled();
      expect(root.hasPointerCapture(7)).toBe(false);
      update({});
      pointer(root, 'pointerdown');
      expect(root.hasPointerCapture(7)).toBe(true);
      update(changes[change]);
      lateEvents(root);
      expect(root.hasPointerCapture(7)).toBe(false);
      expect(onSelectionChange).not.toHaveBeenCalled();
    }
  );

  it('keeps an equal-membership controlled rerender active', async () => {
    // Set allocation is not a selection change, including a different iteration order.
    const onSelectionChange = vi.fn();
    const { root, update } = await mount({
      selectedIds: new Set(['hidden', 'a']),
      onSelectionChange,
    });
    await start(root);
    update({ selectedIds: new Set(['a', 'hidden']) });
    expect(overlay(root)).toBeInTheDocument();
    selected('a', false);
    selected('b', true);
    pointer(root, 'pointerup', 280, 70);
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
  });

  it.each([true, false])(
    'renders actual controlled state when parent acceptance is %s',
    async accept => {
      // Preview may differ from controlled state, but a rejected proposal never becomes committed.
      const onSelectionChange = vi.fn();
      const view = await mount({
        selectedIds: new Set(['hidden', 'a']),
        onSelectionChange: next => {
          onSelectionChange(next);
          if (accept) view.update({ selectedIds: next });
        },
      });
      await start(view.root);
      selected('a', false);
      pointer(view.root, 'pointerup', 280, 70);
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
      selected('a', !accept);
      selected('b', accept);
      expect(overlay(view.root)).not.toBeInTheDocument();
      if (accept) expect(screen.getByRole('status')).toHaveTextContent('1 of 4 selected');
      else expect(screen.getByRole('status')).toBeEmptyDOMElement();
    }
  );

  it('abandons failed capture without installing an active gesture', async () => {
    // Failed acquisition cannot leave a host listening for an uncaptured pointer stream.
    const onSelectionChange = vi.fn();
    const { root, outside } = await mount({ onSelectionChange });
    vi.spyOn(root, 'setPointerCapture').mockImplementation(id => acquired(root, id));
    pointer(root, 'pointerdown');
    expect(acquired).toHaveBeenCalledExactlyOnceWith(root, 7);
    lateEvents(root);
    expect(overlay(root)).not.toBeInTheDocument();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(outside, { key: 'Escape' })).toBe(true);
  });

  it('releases capture and document Escape ownership on active unmount', async () => {
    // Disposal cannot emit a proposal or keep handling keys in the surrounding document.
    const onSelectionChange = vi.fn();
    const { root, unmount } = await mount({ onSelectionChange });
    await start(root);
    unmount();
    expect(released).toHaveBeenCalledExactlyOnceWith(root, 7);
    lateEvents(root);
    expect(fireEvent.keyDown(document, { key: 'Escape' })).toBe(true);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('keeps preview and native form reset silent, then announces only changed committed counts', async () => {
    // Reset preserves visual preview; cancellation restores committed state without a count message.
    const onSelectionChange = vi.fn();
    const selectionCount = vi.fn((count: number, total: number) => `${count} of ${total} selected`);
    const { root, outside } = await mount({ onSelectionChange, strings: { selectionCount } });
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
    selectionCount.mockClear();
    await start(root);
    for (let x = 140; x < 170; x += 5) pointer(root, 'pointermove', x, 70);
    await waitFor(() => expect(overlay(root)).toHaveStyle({ width: '75px' }));
    selected('a', false);
    selected('b', true);
    fireEvent.change(outside, { target: { value: 'Edited' } });
    const form = root.closest('form');
    if (!form) throw new Error('Expected a native ancestor form');
    act(() => form.reset());
    expect(outside).toHaveValue('Original');
    selected('a', false);
    selected('b', true);
    expect(overlay(root)).toBeInTheDocument();
    expect(selectionCount).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.keyDown(outside, { key: 'Escape' });
    selected('a', true);
    selected('b', false);
    expect(selectionCount).not.toHaveBeenCalled();
    expect(status).toBeEmptyDOMElement();
    await start(root);
    pointer(root, 'pointerup', 280, 70);
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
    expect(selectionCount).toHaveBeenCalledExactlyOnceWith(1, 4);
    expect(status).toHaveTextContent('1 of 4 selected');
    await start(root);
    pointer(root, 'pointerup', 280, 70);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(selectionCount).toHaveBeenCalledTimes(1);
    await start(root);
    pointer(root, 'pointerup', 40, 70);
    selected('a', true);
    selected('b', false);
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a']));
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(selectionCount).toHaveBeenCalledTimes(1);
  });
});
