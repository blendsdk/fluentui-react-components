import {
  Checkbox,
  Field,
  FluentProvider,
  Radio,
  RadioGroup,
  webLightTheme,
} from '@fluentui/react-components';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { userEvent } from 'storybook/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type {
  TileGridProps,
  TileGridSelectionMode,
} from '../src/components/TileGrid/TileGrid.types';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { setElementSize } from './jsdomStubs';

/** Labelled application data shared by real checkbox and radio scenarios. */
interface Item {
  /** Stable selection identity. */
  id: string;
  /** Accessible tile and input name. */
  label: string;
}

const items: readonly Item[] = ['a', 'b'].map(id => ({ id, label: `Tile ${id}` }));
const baseProps: TileGridProps<Item> = {
  items,
  getItemId: item => item.id,
  getItemLabel: item => item.label,
  renderItem: ({ item, selected }) => (
    <span>{`${item.label}: ${selected ? 'selected' : 'unselected'}`}</span>
  ),
  ariaLabel: 'Composed tiles',
};

/** Mounts consumer composition without replacing the real Fluent controls or grid. */
async function mount(content: ReactElement) {
  render(<FluentProvider theme={webLightTheme}>{content}</FluentProvider>);
  await act(async () =>
    setElementSize(screen.getByRole('list', { name: 'Composed tiles' }), 800, 600)
  );
}

/** Consumer-owned form state; reset deliberately leaves grid selection ownership untouched. */
function SelectionForm({
  controlled,
  selectionMode,
  onSelectionChange,
  selectionCount,
}: {
  /** Whether the application accepts each proposal into controlled state. */
  controlled: boolean;
  /** Real input variant under test. */
  selectionMode: TileGridSelectionMode;
  /** Records proposals independently from application state updates. */
  onSelectionChange: (next: ReadonlySet<string>) => void;
  /** Records committed count announcements. */
  selectionCount: (selected: number, total: number) => string;
}) {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set(['a']));
  return (
    <form aria-label="Photo form">
      <label>
        Caption
        <input defaultValue="Original caption" />
      </label>
      <TileGrid
        {...baseProps}
        selectionMode={selectionMode}
        selectedIds={controlled ? selectedIds : undefined}
        defaultSelectedIds={['a']}
        strings={{ selectionCount }}
        onSelectionChange={next => {
          onSelectionChange(next);
          if (controlled) setSelectedIds(next);
        }}
      />
    </form>
  );
}

beforeEach(() => resetDevWarningsForTests());
afterEach(() => vi.restoreAllMocks());

describe('TileGrid control composition', () => {
  it.each([
    { controlled: true, selectionMode: 'multiselect', role: 'checkbox' },
    { controlled: false, selectionMode: 'multiselect', role: 'checkbox' },
    { controlled: true, selectionMode: 'single', role: 'radio' },
    { controlled: false, selectionMode: 'single', role: 'radio' },
  ] as const)(
    'preserves current $role selection on native reset with controlled=$controlled',
    async ({ controlled, selectionMode, role }) => {
      // Native form reset must preserve committed input state while ordinary sibling fields reset.
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
      const selectionCount = vi.fn(
        (selected: number, total: number) => `${selected} of ${total} selected`
      );
      await mount(
        <SelectionForm {...{ controlled, selectionMode, onSelectionChange, selectionCount }} />
      );
      const a = screen.getByRole(role, { name: 'Tile a' });
      const b = screen.getByRole(role, { name: 'Tile b' });
      const form = screen.getByRole('form', { name: 'Photo form' });
      if (!(form instanceof HTMLFormElement)) throw new Error('Expected a native form');
      expect(a).toBeChecked();
      expect(b).not.toBeChecked();
      expect(a).toHaveProperty('form', form);
      expect(b).toHaveProperty('form', form);
      const user = userEvent.setup();
      await act(async () => user.click(b));
      if (selectionMode === 'multiselect') await act(async () => user.click(a));
      expect(a).not.toBeChecked();
      expect(b).toBeChecked();
      expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['b']));
      expect(onSelectionChange).toHaveBeenCalledTimes(selectionMode === 'multiselect' ? 2 : 1);
      const caption = screen.getByRole('textbox', { name: 'Caption' });
      fireEvent.change(caption, { target: { value: 'Edited caption' } });
      expect(caption).toHaveValue('Edited caption');
      const status = screen.getByRole('status');
      const message = status.textContent;
      const announcements = selectionCount.mock.calls.length;
      const changes = onSelectionChange.mock.calls.length;
      act(() => form.reset());
      expect(caption).toHaveValue('Original caption');
      expect(a).not.toBeChecked();
      expect(b).toBeChecked();
      expect(
        within(screen.getByRole('listitem', { name: 'Tile b' })).getByText('Tile b: selected')
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole('listitem', { name: 'Tile a' })).getByText('Tile a: unselected')
      ).toBeInTheDocument();
      expect(onSelectionChange).toHaveBeenCalledTimes(changes);
      expect(selectionCount).toHaveBeenCalledTimes(announcements);
      expect(status.textContent).toBe(message);
      expect(error).not.toHaveBeenCalled();
    }
  );

  it('isolates owned checkboxes from Field defaults while consumer content keeps its Field context', async () => {
    // Required Field identity and validation belong to consumer controls, not private selection inputs.
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount(
      <Field label="Photos" required>
        <TileGrid
          {...baseProps}
          selectionMode="multiselect"
          defaultSelectedIds={['b']}
          onSelectionChange={onSelectionChange}
          renderItem={({ item }) => (item.id === 'a' ? <Checkbox /> : <span>{item.label}</span>)}
        />
      </Field>
    );
    const consumer = screen.getByRole('checkbox', { name: /Photos/ });
    expect(consumer).toBeRequired();
    expect(consumer).not.toBeChecked();
    const a = screen.getByRole('checkbox', { name: 'Tile a' });
    const b = screen.getByRole('checkbox', { name: 'Tile b' });
    const inputs = [a, b, consumer];
    expect(new Set(inputs.map(input => input.id)).size).toBe(inputs.length);
    for (const input of inputs) expect(input.id).not.toBe('');
    for (const input of [a, b]) {
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input).not.toBeRequired();
      expect(input).toBeEnabled();
    }
    expect(a).not.toBeChecked();
    expect(b).toBeChecked();
    fireEvent.click(consumer);
    expect(consumer).toBeChecked();
    expect(onSelectionChange).not.toHaveBeenCalled();
    fireEvent.click(a);
    expect(a).toBeChecked();
    expect(b).toBeChecked();
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a', 'b']));
  });

  it('isolates owned radios from RadioGroup defaults while consumer radios keep their group context', async () => {
    // Enclosing disabled, required, value, and name defaults cannot redefine grid selection.
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount(
      <RadioGroup
        aria-label="Consumer choices"
        name="consumer-group"
        required
        disabled
        defaultValue="a"
      >
        <TileGrid
          {...baseProps}
          selectionMode="single"
          defaultSelectedIds={['b']}
          onSelectionChange={onSelectionChange}
          renderItem={({ item }) => <Radio value={item.id} label={`Consumer ${item.id}`} />}
        />
      </RadioGroup>
    );
    const consumerA = screen.getByRole('radio', { name: 'Consumer a' });
    const consumerB = screen.getByRole('radio', { name: 'Consumer b' });
    for (const consumer of [consumerA, consumerB]) {
      expect(consumer).toBeDisabled();
      expect(consumer).toBeRequired();
      expect(consumer).toHaveAttribute('name', 'consumer-group');
    }
    expect(consumerA).toBeChecked();
    expect(consumerB).not.toBeChecked();
    const a = screen.getByRole('radio', { name: 'Tile a' });
    const b = screen.getByRole('radio', { name: 'Tile b' });
    expect(a.getAttribute('name')).toBeTruthy();
    expect(a.getAttribute('name')).not.toBe('consumer-group');
    expect(b).toHaveAttribute('name', a.getAttribute('name'));
    for (const input of [a, b]) {
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input).toBeEnabled();
      expect(input).not.toBeRequired();
    }
    expect(new Set([a.id, b.id, consumerA.id, consumerB.id]).size).toBe(4);
    expect(a).not.toBeChecked();
    expect(b).toBeChecked();
    fireEvent.click(a);
    expect(a).toBeChecked();
    expect(b).not.toBeChecked();
    expect(consumerA).toBeChecked();
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a']));
  });

  it('keeps one eligible item as one real radio without synthetic peers or tiles', async () => {
    // A singleton result retains native radio semantics despite its accepted authoring limitation.
    const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
    await mount(
      <TileGrid
        {...baseProps}
        items={items.slice(0, 1)}
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      />
    );
    expect(screen.getAllByRole('listitem', { hidden: true })).toHaveLength(1);
    expect(screen.getAllByRole('radio', { hidden: true })).toHaveLength(1);
    expect(document.querySelectorAll('input')).toHaveLength(1);
    const radio = screen.getByRole('radio', { name: 'Tile a' });
    expect(radio).toBeInstanceOf(HTMLInputElement);
    expect(radio).toHaveAttribute('type', 'radio');
    expect(radio.getAttribute('name')).toBeTruthy();
    fireEvent.click(radio);
    fireEvent.click(radio);
    expect(radio).toBeChecked();
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a']));
  });
});
