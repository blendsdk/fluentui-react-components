import {
  Checkbox,
  Field,
  FluentProvider,
  Radio,
  RadioGroup,
  webLightTheme,
} from '@fluentui/react-components';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { createRef, useState } from 'react';
import type { Ref } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import type { UserEventClickOptions } from 'vitest/browser';
import { TileGrid } from '../../src/components/TileGrid';
import type {
  TileGridHandle,
  TileGridItemRenderArgs,
  TileGridProps,
  TileGridSelectionMode,
} from '../../src/components/TileGrid/TileGrid.types';
import { createTileGridFixture } from '../fixtures/tileGridFixture';

/** Square items give the combined flow an explicit two-column display order. */
const ITEMS = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => ({ id, label: id }));
const PAIR = ITEMS.slice(0, 2);
const FILTERED = ITEMS.filter(item => ['b', 'e', 'f'].includes(item.id));
const APPENDED = [...FILTERED, ITEMS[2]];
const MANY = createTileGridFixture(200);
type Item = (typeof ITEMS)[number];
const getId = (item: Item) => item.id;
const getLabel = (item: Item) => item.label;
const tile = (name: string) => screen.getByRole('listitem', { name });
const overlay = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-tile-grid-marquee]');

/** Stable consumer content makes selected state and controlled zoom observable. */
function content({ item, selected, tileSize }: TileGridItemRenderArgs<Item>) {
  return (
    <div style={{ paddingTop: 36 }} data-testid={`content-${item.id}`} data-selected={selected}>
      <span>{`${item.label}; size ${tileSize}`}</span>
      <button type="button">Open {item.label}</button>
      <button type="button">More {item.label}</button>
    </div>
  );
}

/** The application's real dimensions are the only geometry setup in these tests. */
function Grid(props: Partial<TileGridProps<Item>> & { gridRef?: Ref<TileGridHandle> }) {
  const { gridRef, ...rest } = props;
  return (
    <div style={{ width: 340, height: 360 }}>
      <TileGrid
        ref={gridRef}
        items={ITEMS}
        getItemId={getId}
        getItemLabel={getLabel}
        renderItem={content}
        ariaLabel="Photos"
        selectionMode="multiselect"
        columns={2}
        tileSize={160}
        gap={20}
        style={{ scrollbarWidth: 'none' }}
        {...rest}
      />
    </div>
  );
}

/** Native paint and React effects settle without replacing animation-frame scheduling. */
async function frames() {
  await act(async () => {
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

/** A provider click holds the real mouse; consuming its lazy promise starts pointer-down. */
async function held(
  root: HTMLElement,
  during: (pointerId: number) => Promise<void>,
  options: UserEventClickOptions = {}
) {
  const events: { down?: PointerEvent } = {};
  const record = (event: PointerEvent) => {
    events.down = event;
  };
  root.addEventListener('pointerdown', record);
  const release = userEvent
    .click(root, {
      position: { x: 170, y: 80 },
      delay: 3_000,
      ...options,
    })
    .then(() => undefined);
  try {
    await waitFor(() => expect(events.down?.isTrusted).toBe(true));
    const down = events.down;
    if (!down) throw new Error('The native pointer-down was not observed');
    expect(root.hasPointerCapture(down.pointerId)).toBe(true);
    await during(down.pointerId);
  } finally {
    await release;
    root.removeEventListener('pointerdown', record);
  }
}

/** Selection belongs to the application or grid; the native form owns only its ordinary field. */
function SelectionForm({
  controlled,
  selectionMode,
  changes,
  count,
}: {
  controlled: boolean;
  selectionMode: TileGridSelectionMode;
  changes: (next: ReadonlySet<string>) => void;
  count: (selected: number, total: number) => string;
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(['a']));
  return (
    <FluentProvider theme={webLightTheme}>
      <form aria-label="Photo form">
        <input aria-label="Caption" defaultValue="Original caption" />
        <Grid
          items={PAIR}
          selectionMode={selectionMode}
          selectedIds={controlled ? selected : undefined}
          defaultSelectedIds={['a']}
          strings={{ selectionCount: count }}
          onSelectionChange={next => {
            changes(next);
            if (controlled) setSelected(next);
          }}
        />
      </form>
    </FluentProvider>
  );
}

/** Only the first consumer checkbox receives the enclosing Field's single-control context. */
function fieldContent({ item }: TileGridItemRenderArgs<Item>) {
  return <div style={{ paddingTop: 36 }}>{item.id === 'a' ? <Checkbox /> : item.label}</div>;
}

/** Consumer radios intentionally inherit the enclosing group's value and disabled state. */
function radioContent({ item }: TileGridItemRenderArgs<Item>) {
  return (
    <div style={{ paddingTop: 36 }}>
      <Radio value={item.id} label={`Consumer ${item.id}`} />
    </div>
  );
}

afterEach(() => vi.restoreAllMocks());

describe('TileGrid native combined interactions', () => {
  it.each([
    { controlled: true, selectionMode: 'multiselect', role: 'checkbox' },
    { controlled: false, selectionMode: 'multiselect', role: 'checkbox' },
    { controlled: true, selectionMode: 'single', role: 'radio' },
    { controlled: false, selectionMode: 'single', role: 'radio' },
  ] as const)(
    'keeps current $role selection through native form reset, controlled=$controlled',
    async ({ controlled, selectionMode, role }) => {
      const errors = vi.spyOn(console, 'error');
      const changes = vi.fn();
      const count = vi.fn((selected: number, total: number) => `${selected} of ${total}`);
      render(<SelectionForm {...{ controlled, selectionMode, changes, count }} />);
      const a = await screen.findByRole(role, { name: 'a' });
      const b = screen.getByRole(role, { name: 'b' });
      const form = screen.getByRole('form', { name: 'Photo form' });
      if (!(form instanceof HTMLFormElement)) throw new Error('Expected a native form');
      expect(a).toBeInstanceOf(HTMLInputElement);
      expect(a).toHaveProperty('form', form);
      expect(b).toHaveProperty('form', form);
      expect(a).toBeChecked();
      await userEvent.click(b);
      if (selectionMode === 'multiselect') await userEvent.click(a);
      expect(a).not.toBeChecked();
      expect(b).toBeChecked();
      expect(changes).toHaveBeenLastCalledWith(new Set(['b']));
      expect(changes).toHaveBeenCalledTimes(selectionMode === 'multiselect' ? 2 : 1);
      const caption = screen.getByRole('textbox', { name: 'Caption' });
      await userEvent.fill(caption, 'Edited caption');
      expect(caption).toHaveValue('Edited caption');
      const calls = changes.mock.calls.length;
      const announcements = count.mock.calls.length;
      const message = screen.getByRole('status').textContent;
      await act(async () => form.reset());
      await frames();
      expect(caption).toHaveValue('Original caption');
      expect(a).not.toBeChecked();
      expect(b).toBeChecked();
      expect(screen.getByTestId('content-a')).toHaveAttribute('data-selected', 'false');
      expect(screen.getByTestId('content-b')).toHaveAttribute('data-selected', 'true');
      expect(changes).toHaveBeenCalledTimes(calls);
      expect(count).toHaveBeenCalledTimes(announcements);
      expect(screen.getByRole('status').textContent).toBe(message);
      expect(errors).not.toHaveBeenCalled();
    }
  );

  it('isolates private checkboxes from a required Field while consumer content retains it', async () => {
    const changes = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <Field label="Photos" required>
          <Grid
            items={PAIR}
            defaultSelectedIds={['b']}
            renderItem={fieldContent}
            onSelectionChange={changes}
          />
        </Field>
      </FluentProvider>
    );
    const a = await screen.findByRole('checkbox', { name: 'a' });
    const b = screen.getByRole('checkbox', { name: 'b' });
    const consumer = screen.getByRole('checkbox', { name: /Photos/ });
    expect(consumer).toBeRequired();
    expect(new Set([a.id, b.id, consumer.id]).size).toBe(3);
    for (const input of [a, b]) {
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input.id).not.toBe('');
      expect(input).toBeEnabled();
      expect(input).not.toBeRequired();
    }
    expect(a).not.toBeChecked();
    expect(b).toBeChecked();
    await userEvent.click(consumer);
    expect(consumer).toBeChecked();
    expect(changes).not.toHaveBeenCalled();
    await userEvent.click(a);
    expect(a).toBeChecked();
    expect(b).toBeChecked();
    expect(changes).toHaveBeenCalledExactlyOnceWith(new Set(['a', 'b']));
  });

  it('isolates private radios from required disabled RadioGroup defaults while consumers retain them', async () => {
    const changes = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <RadioGroup
          aria-label="Consumer choices"
          name="consumer-group"
          required
          disabled
          defaultValue="a"
        >
          <Grid
            items={PAIR}
            selectionMode="single"
            defaultSelectedIds={['b']}
            renderItem={radioContent}
            onSelectionChange={changes}
          />
        </RadioGroup>
      </FluentProvider>
    );
    const a = await screen.findByRole('radio', { name: 'a' });
    const b = screen.getByRole('radio', { name: 'b' });
    const consumerA = screen.getByRole('radio', { name: 'Consumer a' });
    const consumerB = screen.getByRole('radio', { name: 'Consumer b' });
    for (const consumer of [consumerA, consumerB]) {
      expect(consumer).toBeRequired();
      expect(consumer).toBeDisabled();
      expect(consumer).toHaveAttribute('name', 'consumer-group');
    }
    for (const input of [a, b]) {
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input.id).not.toBe('');
      expect(input).toBeEnabled();
      expect(input).not.toBeRequired();
    }
    expect(new Set([a.id, b.id, consumerA.id, consumerB.id]).size).toBe(4);
    expect(a.getAttribute('name')).toBeTruthy();
    expect(a.getAttribute('name')).not.toBe('consumer-group');
    expect(b).toHaveAttribute('name', a.getAttribute('name'));
    expect(a).not.toBeChecked();
    expect(b).toBeChecked();
    expect(consumerA).toBeChecked();
    expect(consumerB).not.toBeChecked();
    await userEvent.click(a);
    expect(a).toBeChecked();
    expect(b).not.toBeChecked();
    expect(consumerA).toBeChecked();
    expect(consumerB).not.toBeChecked();
    expect(changes).toHaveBeenCalledExactlyOnceWith(new Set(['a']));
  });

  it('uses one real radio for a singleton without synthetic peers or fake tiles', async () => {
    const changes = vi.fn();
    render(
      <FluentProvider theme={webLightTheme}>
        <Grid items={PAIR.slice(0, 1)} selectionMode="single" onSelectionChange={changes} />
      </FluentProvider>
    );
    const radio = await screen.findByRole('radio', { name: 'a' });
    expect(screen.getAllByRole('listitem', { hidden: true })).toHaveLength(1);
    expect(screen.getAllByRole('radio', { hidden: true })).toHaveLength(1);
    expect(document.querySelectorAll('input')).toHaveLength(1);
    expect(radio).toBeInstanceOf(HTMLInputElement);
    expect(radio).toHaveAttribute('type', 'radio');
    expect(radio.getAttribute('name')).toBeTruthy();
    await userEvent.click(radio);
    await userEvent.keyboard(' ');
    await userEvent.click(radio);
    expect(radio).toBeChecked();
    expect(changes).toHaveBeenCalledExactlyOnceWith(new Set(['a']));
  });

  it('keeps hidden membership through native range, checkbox, filter, append, zoom, marquee and clear', async () => {
    const handle = createRef<TileGridHandle>();
    const changes = vi.fn();
    const count = vi.fn((selected: number, total: number) => `${selected} of ${total}`);
    let props: Partial<TileGridProps<Item>> = {
      defaultSelectedIds: new Set(['b', 'hidden']),
      scrollResetKey: 'all',
      enableMarquee: true,
      onSelectionChange: changes,
      strings: { selectionCount: count },
    };
    const tree = () => (
      <FluentProvider theme={webLightTheme}>
        <button type="button">Before</button>
        <Grid {...props} gridRef={handle} />
      </FluentProvider>
    );
    const view = render(tree());
    const update = (next: Partial<TileGridProps<Item>>) => {
      props = { ...props, ...next };
      view.rerender(tree());
    };
    await screen.findByRole('listitem', { name: 'b' });
    const root = screen.getByRole('list', { name: 'Photos' });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    expect(tile('b')).toHaveFocus();
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(tile('d')).toHaveFocus();
    expect(changes).toHaveBeenLastCalledWith(new Set(['hidden', 'b', 'c', 'd']));
    expect(screen.getByRole('status')).toHaveTextContent('4 of 6');
    await userEvent.click(screen.getByRole('checkbox', { name: 'c' }));
    expect(changes).toHaveBeenLastCalledWith(new Set(['hidden', 'b', 'd']));
    expect(screen.getByRole('status')).toHaveTextContent('3 of 6');
    await userEvent.wheel(root, { delta: { y: 100 } });
    await waitFor(() => expect(root.scrollTop).toBe(100));
    expect(screen.getByRole('checkbox', { name: 'c' })).toHaveFocus();
    update({ items: FILTERED, scrollResetKey: 'filtered' });
    await waitFor(() => expect(tile('b')).toHaveFocus());
    expect(root.scrollTop).toBe(0);
    update({ items: APPENDED });
    await frames();
    expect(tile('b')).toHaveFocus();
    update({ tileSize: 200 });
    await frames();
    expect(within(tile('b')).getByText('b; size 200')).toBeVisible();
    expect(tile('b')).toHaveFocus();
    expect(root.scrollTop).toBe(0);
    expect(changes).toHaveBeenCalledTimes(2);
    expect(count.mock.calls).toEqual([
      [4, 6],
      [3, 6],
    ]);
    await held(
      root,
      async () => {
        await userEvent.hover(root, { position: { x: 300, y: 120 } });
        await waitFor(() => expect(overlay(root)).toBeVisible());
        expect(screen.getByRole('checkbox', { name: 'e' })).toBeChecked();
        expect(changes).toHaveBeenCalledTimes(2);
        expect(count).toHaveBeenCalledTimes(2);
      },
      { modifiers: ['Shift'] }
    );
    expect(overlay(root)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('4 of 4');
    expect(handle.current).not.toBeNull();
    await act(async () => handle.current?.clearSelection());
    expect(changes.mock.calls).toEqual([
      [new Set(['hidden', 'b', 'c', 'd'])],
      [new Set(['hidden', 'b', 'd'])],
      [new Set(['hidden', 'b', 'd', 'e'])],
      [new Set()],
    ]);
    expect(count.mock.calls).toEqual([
      [4, 6],
      [3, 6],
      [4, 4],
      [0, 4],
    ]);
    expect(screen.getByRole('status')).toHaveTextContent('0 of 4');
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).not.toBeChecked();
  }, 20_000);

  it('releases repeated captured scrolling mounts without late callbacks, frame growth or external focus theft', async () => {
    render(<input aria-label="External search" />);
    const search = screen.getByRole('textbox', { name: 'External search' });
    const changes = vi.fn();
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await userEvent.click(search);
      const view = render(
        <FluentProvider theme={webLightTheme}>
          <Grid items={MANY} enableMarquee onSelectionChange={changes} />
        </FluentProvider>
      );
      await screen.findByRole('listitem', { name: 'Tile 0' });
      const root = screen.getByRole('list', { name: 'Photos' });
      expect(search).toHaveFocus();
      await act(async () => tile('Tile 0').focus());
      await userEvent.wheel(root, { delta: { y: 1800 } });
      await waitFor(() => expect(screen.queryByRole('listitem', { name: 'Tile 0' })).toBeNull());
      await waitFor(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) throw new Error('Expected a focused tile wrapper');
        expect(root).toContainElement(active);
        expect(active).toHaveAttribute('role', 'listitem');
      });
      await userEvent.click(search);
      const added = vi.spyOn(document, 'addEventListener');
      const removed = vi.spyOn(document, 'removeEventListener');
      const scheduled = vi.spyOn(window, 'requestAnimationFrame');
      try {
        await held(root, async id => {
          const top = root.scrollTop;
          await userEvent.hover(root, { position: { x: 300, y: 350 } });
          await waitFor(() => {
            expect(overlay(root)).toBeVisible();
            expect(root.scrollTop).toBeGreaterThan(top);
          });
          expect(search).toHaveFocus();
          const listeners = added.mock.calls.filter(([type]) => type === 'keydown');
          expect(listeners.length).toBeGreaterThan(0);
          view.unmount();
          expect(root.hasPointerCapture(id)).toBe(false);
          expect(root.isConnected).toBe(false);
          for (const [, listener] of listeners) {
            expect(
              removed.mock.calls.some(([type, value]) => type === 'keydown' && value === listener)
            ).toBe(true);
          }
          await frames();
          const requests = scheduled.mock.calls.length;
          const detachedTop = root.scrollTop;
          await frames();
          expect(scheduled).toHaveBeenCalledTimes(requests + 2);
          expect(root.scrollTop).toBe(detachedTop);
          expect(search).toHaveFocus();
        });
        await userEvent.keyboard('{Escape}');
        expect(search).toHaveFocus();
        expect(changes).not.toHaveBeenCalled();
      } finally {
        view.unmount();
        added.mockRestore();
        removed.mockRestore();
        scheduled.mockRestore();
      }
    }
  }, 30_000);

  it('shows a visible keyboard focus stroke and stable non-animated marquee decoration', async () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <button type="button">Before</button>
        <Grid items={PAIR} enableMarquee />
      </FluentProvider>
    );
    await screen.findByRole('listitem', { name: 'a' });
    await userEvent.click(screen.getByRole('button', { name: 'Before' }));
    await userEvent.tab();
    const focused = tile('a');
    expect(focused).toHaveFocus();
    const style = getComputedStyle(focused);
    expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(style.outlineStyle).not.toBe('none');
    expect(style.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
    const root = screen.getByRole('list', { name: 'Photos' });
    await held(root, async () => {
      await userEvent.hover(root, { position: { x: 300, y: 120 } });
      await waitFor(() => expect(overlay(root)).toBeVisible());
      const decoration = overlay(root);
      if (!decoration) throw new Error('Expected active marquee decoration');
      const before = decoration.getBoundingClientRect().toJSON();
      const paint = getComputedStyle(decoration);
      expect(Number.parseFloat(paint.borderTopWidth)).toBeGreaterThan(0);
      expect(paint.borderTopStyle).not.toBe('none');
      expect(paint.borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(paint.pointerEvents).toBe('none');
      expect(paint.animationName).toBe('none');
      expect(
        paint.transitionDuration.split(',').every(value => Number.parseFloat(value) === 0)
      ).toBe(true);
      expect(decoration).toHaveAttribute('aria-hidden', 'true');
      await frames();
      expect(decoration.getBoundingClientRect().toJSON()).toEqual(before);
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
      await userEvent.keyboard('{Escape}');
      expect(overlay(root)).toBeNull();
    });
  }, 20_000);

  it('keeps hostile labels literal and opaque IDs intact through native controls and static warnings', async () => {
    const label = '<img src=x onerror=alert(1)>';
    const hostile = [
      { id: 'quote"[雪]', label },
      { id: '__proto__', label: 'Prototype item' },
      { id: 'https://private.example/item?q="', label: 'Private record' },
    ];
    const changes = vi.fn();
    const warn = vi.spyOn(console, 'warn');
    const error = vi.spyOn(console, 'error');
    const log = vi.spyOn(console, 'log');
    const info = vi.spyOn(console, 'info');
    const tree = (selectionMode: TileGridSelectionMode) => (
      <FluentProvider theme={webLightTheme}>
        <Grid
          items={hostile}
          selectionMode={selectionMode}
          defaultSelectedIds={['private-hidden-id']}
          onSelectionChange={changes}
        />
      </FluentProvider>
    );
    const view = render(tree('multiselect'));
    const input = await screen.findByRole('checkbox', { name: label });
    expect(within(tile(label)).getByText(`${label}; size 160`)).toBeVisible();
    expect(view.container.querySelector('img')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    await userEvent.click(input);
    expect(changes).toHaveBeenLastCalledWith(new Set(['private-hidden-id', hostile[0].id]));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Prototype item' }));
    expect(changes).toHaveBeenLastCalledWith(
      new Set(['private-hidden-id', hostile[0].id, '__proto__'])
    );
    view.rerender(tree('single'));
    expect(warn).toHaveBeenCalledTimes(1);
    // Mode is fixed for this mount, so a configuration warning cannot change native input semantics.
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(screen.queryByRole('radio')).toBeNull();
    expect(changes).toHaveBeenCalledTimes(2);
    const messages = [warn, error, log, info]
      .flatMap(spy => spy.mock.calls.flat())
      .map(String)
      .join('\n');
    for (const value of [label, ...hostile.map(getId), 'private-hidden-id']) {
      expect(messages).not.toContain(value);
    }
    expect(error).not.toHaveBeenCalled();
  });
});
