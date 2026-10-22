import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, Suspense, startTransition, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type { TileGridItemRenderArgs } from '../src/components/TileGrid';
import { setElementSize } from './jsdomStubs';
import { computeGeometry } from '../src/components/TileGrid/geometry';
import { useTileGridFocus } from '../src/components/TileGrid/focus/useTileGridFocus';

const items = ['a', 'b'];
const getId = (item: string) => item;

/** Uses a stable renderer so focus-only updates can be distinguished from application changes. */
function actions({ item }: TileGridItemRenderArgs<string>) {
  return <button type="button">Action {item}</button>;
}

/** The normal application shell, optionally sharing an iframe's document. */
function grid(
  renderItem: (args: TileGridItemRenderArgs<string>) => ReactNode = actions,
  targetDocument?: Document,
  onSelectionChange?: (ids: ReadonlySet<string>) => void
) {
  return (
    <FluentProvider theme={webLightTheme} targetDocument={targetDocument}>
      <input aria-label="Outside" />
      <TileGrid
        items={items}
        getItemId={getId}
        getItemLabel={getId}
        renderItem={renderItem}
        ariaLabel="Focus internals"
        selectionMode="multiselect"
        onSelectionChange={onSelectionChange}
      />
    </FluentProvider>
  );
}

/** Supplies only the browser dimensions missing from jsdom. */
async function measure(root = screen.getByRole('list')) {
  await act(async () => setElementSize(root, 328, 600));
}

afterEach(() => vi.restoreAllMocks());

describe('TileGrid focus internals', () => {
  it('leaves native Tab available if a consumer disables the cached target during key dispatch', async () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <TileGrid
          items={items}
          getItemId={getId}
          getItemLabel={getId}
          ariaLabel="Focus internals"
          renderItem={actions}
          onKeyDownCapture={event => {
            if (event.key === 'Tab')
              screen.getByRole('button', { name: 'Action a' }).setAttribute('disabled', '');
          }}
        />
      </FluentProvider>
    );
    await measure();
    const wrapper = screen.getByRole('listitem', { name: 'a' });
    act(() => wrapper.focus());
    // The observer has not reconciled the just-disabled control yet. A failed
    // focus attempt must not swallow the browser's subsequent native Tab action.
    expect(fireEvent.keyDown(wrapper, { key: 'Tab' })).toBe(true);
    expect(wrapper).toHaveFocus();
  });

  it('bounds the callback cache to mounted wrappers across abandoned transition renders', async () => {
    const liveId = 'registry-live';
    const ids = [liveId];
    const geometry = computeGeometry({
      items: ids,
      getItemId: getId,
      layout: 'fixed',
      tileSize: 160,
      tileAspectRatio: 1,
      fallbackAspectRatio: 1,
      gap: 8,
      containerWidth: 328,
    });
    const neverReady = new Promise<void>(() => {});
    const attempted: string[] = [];
    let update: Dispatch<SetStateAction<string | undefined>> = () => {
      throw new Error('Expected the mounted application setter');
    };
    // Spy without replacing Map behavior; the cache is identified by its live
    // callback value, not by a production-only debug API.
    const writes = vi.spyOn(Map.prototype, 'set');

    /** Suspends after requesting a ref, before React can attach that attempted wrapper. */
    function Registry({ attempt }: { attempt?: string }) {
      const rootRef = useRef<HTMLDivElement>(null);
      const focus = useTileGridFocus({
        rootRef,
        geometry,
        geometryKey: 'fixed',
        visibleItemRects: geometry.itemRects,
        itemList: ids,
        scrollResetKey: undefined,
        selectedIds: new Set(),
        isSelectable: () => true,
      });
      const liveRef = focus.getItemRef(liveId);
      if (attempt) {
        focus.getItemRef(attempt);
        attempted.push(attempt);
        throw neverReady;
      }
      return (
        <div ref={rootRef}>
          <div ref={liveRef} data-registry-wrapper="">
            Mounted
          </div>
        </div>
      );
    }

    /** A recovery update commits the old visible tree between aborted attempts. */
    function App() {
      const [attempt, setAttempt] = useState<string>();
      update = setAttempt;
      return (
        <Suspense fallback={<span>Pending</span>}>
          <Registry attempt={attempt} />
        </Suspense>
      );
    }

    const view = render(<App />);
    const index = writes.mock.calls.findIndex(
      ([key, value]) => key === liveId && typeof value === 'function'
    );
    const cache: unknown = writes.mock.contexts[index];
    if (!(cache instanceof Map)) throw new Error('Expected the mounted callback cache');
    for (let index = 0; index < 20; index++) {
      const id = `registry-abandoned-${index}`;
      await act(async () => startTransition(() => update(id)));
      expect(attempted).toContain(id);
      await act(async () => update(undefined));
    }
    expect(view.container.querySelectorAll('[data-registry-wrapper]')).toHaveLength(1);
    expect(cache.size).toBe(1);
    view.unmount();
    expect(cache.size).toBe(0);
  });

  it('drains a pending author change before restoring attributes on unmount', async () => {
    const view = render(grid());
    await measure();
    const control = screen.getByRole('button', { name: 'Action b' });
    expect(control).toHaveAttribute('tabindex', '-1');
    // Cleanup runs before observer delivery, but the author value must still win.
    act(() => {
      control.setAttribute('tabindex', '3');
      view.unmount();
    });
    expect(control).toHaveAttribute('tabindex', '3');
  });

  it('does not feed managed writes back into the author observer', async () => {
    render(grid());
    await measure();
    const control = screen.getByRole('button', { name: 'Action b' });
    const writes = vi.spyOn(control, 'setAttribute');
    await act(async () => control.setAttribute('tabindex', '2'));
    expect(control).toHaveAttribute('tabindex', '-1');
    const settled = writes.mock.calls.length;
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(writes).toHaveBeenCalledTimes(settled);
    act(() => screen.getByRole('listitem', { name: 'b' }).focus());
    expect(control).toHaveAttribute('tabindex', '0');
  });

  it('keeps hidden, disabled, and authored-negative controls out of entered tab order', async () => {
    render(
      grid(({ item }) => (
        <>
          <button type="button" hidden>
            Hidden {item}
          </button>
          <span style={{ display: 'none' }}>
            <button type="button">Collapsed {item}</button>
          </span>
          <button type="button" disabled>
            Disabled {item}
          </button>
          <button type="button" tabIndex={-2}>
            Negative {item}
          </button>
          <button type="button">Enabled {item}</button>
        </>
      ))
    );
    await measure();
    act(() => screen.getByRole('listitem', { name: 'a' }).focus());
    for (const label of ['Hidden a', 'Collapsed a', 'Disabled a', 'Negative a']) {
      expect(screen.getByText(label)).toHaveAttribute('tabindex', '-1');
    }
    expect(screen.getByRole('button', { name: 'Enabled a' })).toHaveAttribute('tabindex', '0');
  });

  it('does not rerender content for focus-only moves and rerenders only the changed selection', async () => {
    const renderItem = vi.fn(actions);
    render(grid(renderItem));
    await measure();
    renderItem.mockClear();
    act(() => screen.getByRole('listitem', { name: 'a' }).focus());
    fireEvent.keyDown(screen.getByRole('listitem', { name: 'a' }), { key: 'ArrowRight' });
    expect(screen.getByRole('listitem', { name: 'b' })).toHaveFocus();
    expect(renderItem).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('listitem', { name: 'b' }), { key: ' ' });
    expect(renderItem).toHaveBeenCalledTimes(1);
    expect(renderItem.mock.calls[0][0]).toMatchObject({ item: 'b', selected: true });
  });

  it('releases StrictMode observers and ignores detached nodes after unmount', async () => {
    const view = render(<StrictMode>{grid()}</StrictMode>);
    await measure();
    const control = screen.getByRole('button', { name: 'Action b' });
    act(() => screen.getByRole('listitem', { name: 'a' }).focus());
    view.unmount();
    expect(control).not.toHaveAttribute('tabindex');
    await act(async () => control.setAttribute('tabindex', '5'));
    expect(control).toHaveAttribute('tabindex', '5');
  });

  it('uses the root ownerDocument for focus and keeps foreign-realm consumer actions local', async () => {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    const viewWindow = doc?.defaultView;
    if (!doc || !viewWindow) throw new Error('Expected the iframe document');
    // The child jsdom window lacks ResizeObserver too; reuse the existing shim.
    Object.defineProperty(viewWindow, 'ResizeObserver', {
      configurable: true,
      value: ResizeObserver,
    });
    const onSelectionChange = vi.fn();
    const view = render(grid(actions, doc, onSelectionChange), {
      container: doc.body,
      baseElement: doc.body,
    });
    try {
      const root = view.getByRole('list');
      await measure(root);
      const a = view.getByRole('listitem', { name: 'a' });
      const b = view.getByRole('listitem', { name: 'b' });
      act(() => a.focus());
      fireEvent.keyDown(a, { key: 'ArrowRight' });
      expect(doc.activeElement).toBe(b);
      fireEvent.click(view.getByRole('button', { name: 'Action b' }));
      expect(onSelectionChange).not.toHaveBeenCalled();
    } finally {
      view.unmount();
      iframe.remove();
    }
  });
});
