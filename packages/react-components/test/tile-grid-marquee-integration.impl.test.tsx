import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type { TileGridProps } from '../src/components/TileGrid';
import { setElementSize } from './jsdomStubs';

const items = ['a', 'b'];
const getId = (item: string) => item;
const captures = new Map<number, Element>();
const released = vi.fn();
const captureFailures = [
  'acquisition throws',
  'verification fails',
  'verification throws',
] as const;
/** Fault injection stays inside one shim so nested spy restoration cannot disable capture support. */
let captureFailure: (typeof captureFailures)[number] | undefined;
const base: TileGridProps<string> = {
  items,
  getItemId: getId,
  getItemLabel: getId,
  renderItem: ({ item, selected }) => <span>{`${item}:${selected}`}</span>,
  ariaLabel: 'Marquee internals',
  selectionMode: 'multiselect',
  enableMarquee: true,
  defaultSelectedIds: ['a'],
  columns: 2,
};

beforeEach(() => {
  captures.clear();
  released.mockClear();
  captureFailure = undefined;
  vi.spyOn(Element.prototype, 'setPointerCapture').mockImplementation(function (this: Element, id) {
    if (captureFailure === 'acquisition throws') throw new Error('Unavailable');
    captures.set(id, this);
  });
  vi.spyOn(Element.prototype, 'hasPointerCapture').mockImplementation(function (this: Element, id) {
    if (captureFailure === 'verification throws') throw new Error('Unavailable');
    if (captureFailure === 'verification fails') return false;
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

/** Renders real grid ownership while supplying only missing native size/capture support. */
async function mount(props: Partial<TileGridProps<string>> = {}) {
  const tree = (next: Partial<TileGridProps<string>>) => (
    <FluentProvider theme={webLightTheme}>
      <input aria-label="Outside" />
      <TileGrid {...base} {...next} />
    </FluentProvider>
  );
  const view = render(tree(props));
  const root = screen.getByRole('list');
  vi.spyOn(root, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 328, 400));
  await act(async () => setElementSize(root, 328, 400));
  return {
    root,
    unmount: view.unmount,
    update: (next: Partial<TileGridProps<string>>) => view.rerender(tree({ ...props, ...next })),
  };
}

/** The fixture's gap is x=164; moving right intersects only the second tile. */
function pointer(root: HTMLElement, type: string, x = 164, y = 30, init: PointerEventInit = {}) {
  const fields: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    pointerId: 7,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerdown' || type === 'pointermove' ? 1 : 0,
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
  fireEvent(root, event);
  return event;
}

/** Establishes a genuinely active mounted host before inspecting its resource lifecycle. */
function start(root: HTMLElement) {
  pointer(root, 'pointerdown');
  pointer(root, 'pointermove', 220, 70);
  expect(root.querySelector('[data-tile-grid-marquee]')).toBeInTheDocument();
  expect(root.hasPointerCapture(7)).toBe(true);
}

describe('TileGrid mounted marquee internals', () => {
  it('registers document Escape only for an accepted gesture and removes exactly that listener', async () => {
    const view = await mount();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    pointer(view.root, 'pointerdown', 164, 30, { pointerType: 'touch' });
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(0);
    start(view.root);
    for (let x = 221; x < 240; x++) pointer(view.root, 'pointermove', x, 70);
    const keys = add.mock.calls.filter(([type]) => type === 'keydown');
    expect(keys).toHaveLength(1);
    const listener = keys[0][1];
    fireEvent.keyDown(view.root, { key: 'Escape' });
    expect(
      remove.mock.calls.filter(([type, fn]) => type === 'keydown' && fn === listener)
    ).toHaveLength(1);
    view.unmount();
    expect(
      remove.mock.calls.filter(([type, fn]) => type === 'keydown' && fn === listener)
    ).toHaveLength(1);
    expect(fireEvent.keyDown(document, { key: 'Escape' })).toBe(true);
  });

  it.each(captureFailures)(
    'abandons capture when %s without a key listener, callback, or stranded capture',
    async failure => {
      const changes = vi.fn();
      const view = await mount({ onSelectionChange: changes });
      const add = vi.spyOn(document, 'addEventListener');
      captureFailure = failure;
      expect(pointer(view.root, 'pointerdown').defaultPrevented).toBe(false);
      pointer(view.root, 'pointermove', 220, 70);
      pointer(view.root, 'pointerup', 220, 70);
      expect(captures.size).toBe(0);
      expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(0);
      expect(changes).not.toHaveBeenCalled();
      captureFailure = undefined;
      start(view.root);
      fireEvent.keyDown(view.root, { key: 'Escape' });
      expect(changes).not.toHaveBeenCalled();
    }
  );

  it('keeps geometry and capture ownership through equal echoes while using the latest callback', async () => {
    const oldChange = vi.fn();
    const nextChange = vi.fn();
    const view = await mount({ selectedIds: new Set(['a']), onSelectionChange: oldChange });
    const add = vi.spyOn(document, 'addEventListener');
    start(view.root);
    view.update({ selectedIds: new Set(['a']), onSelectionChange: nextChange });
    pointer(view.root, 'pointermove', 230, 75);
    expect(view.root.hasPointerCapture(7)).toBe(true);
    expect(released).not.toHaveBeenCalled();
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
    pointer(view.root, 'pointerup', 230, 75);
    expect(oldChange).not.toHaveBeenCalled();
    expect(nextChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
    expect(released).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('checkbox', { name: 'a' })).toBeChecked();
  });

  it('cancels to the latest parent authority without sending its old snapshot back', async () => {
    const changes = vi.fn();
    const view = await mount({ selectedIds: new Set(['a']), onSelectionChange: changes });
    start(view.root);
    view.update({ selectedIds: new Set(['hidden', 'b']) });
    expect(view.root.querySelector('[data-tile-grid-marquee]')).toBeNull();
    expect(captures.size).toBe(0);
    pointer(view.root, 'pointerup', 220, 70);
    pointer(view.root, 'lostpointercapture');
    expect(changes).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'a' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'b' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('2 of 2 selected');
  });

  it('releases capture and its document handler when unmounted during a gesture', async () => {
    const changes = vi.fn();
    const view = await mount({ onSelectionChange: changes });
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    start(view.root);
    const listener = add.mock.calls.find(([type]) => type === 'keydown')?.[1];
    expect(listener).toBeDefined();
    view.unmount();
    expect(captures.size).toBe(0);
    expect(released).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith('keydown', listener);
    expect(fireEvent.keyDown(document, { key: 'Escape' })).toBe(true);
    expect(changes).not.toHaveBeenCalled();
  });

  it('does not acquire scrollbar or border points outside the root client viewport', async () => {
    const view = await mount();
    for (const [x, y] of [
      [-1, 30],
      [329, 30],
      [164, -1],
      [164, 401],
    ]) {
      expect(pointer(view.root, 'pointerdown', x, y).defaultPrevented).toBe(false);
      expect(captures.size).toBe(0);
    }
  });
});
