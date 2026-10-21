import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type { TileGridProps } from '../src/components/TileGrid';
import { TileGridSelectionControl } from '../src/components/TileGrid/TileGridSelectionControl';
import { TileGridItemView } from '../src/components/TileGrid/TileGridItemView';
import { useGridSelection } from '../src/components/TileGrid/selection';
import { useTileGridInteractions } from '../src/components/TileGrid/selection/useTileGridInteractions';
import { resetDevWarningsForTests } from '../src/components/TileGrid/devWarnings';
import { setElementSize } from './jsdomStubs';

const items = ['a', 'b'];
const getItemId = (item: string) => item;

/** Real provider boundary shared by standalone internal views. */
function themed(content: ReactElement) {
  return <FluentProvider theme={webLightTheme}>{content}</FluentProvider>;
}

/** Supplies layout measurements without replacing the store, renderer, or native controls. */
async function mount(props: Partial<TileGridProps<string>> = {}) {
  render(
    themed(
      <TileGrid
        items={items}
        getItemId={getItemId}
        getItemLabel={getItemId}
        renderItem={({ item }) => <span>{item}</span>}
        ariaLabel="Interactions"
        selectionMode="multiselect"
        {...props}
      />
    )
  );
  await act(async () => setElementSize(screen.getByRole('list'), 800, 600));
}

beforeEach(() => resetDevWarningsForTests());
afterEach(() => vi.restoreAllMocks());

describe('TileGrid interaction internals', () => {
  it('keeps delegated handlers stable while reading updated native and activation callbacks', () => {
    const first = vi.fn();
    const second = vi.fn();
    const itemById = new Map(items.map(id => [id, id]));
    const { result, rerender } = renderHook(
      ({ onItemActivate }) => {
        const selection = useGridSelection({ mode: 'multiselect' });
        return useTileGridInteractions({
          selection,
          interactionMode: 'browse',
          itemById,
          currentIds: items,
          isDisabled: () => false,
          onItemActivate,
          rootProps: { onClick: () => {} },
        });
      },
      { initialProps: { onItemActivate: first } }
    );
    const original = result.current;
    rerender({ onItemActivate: second });
    for (const name of ['onClick', 'onDoubleClick', 'onChange', 'onKeyDown'] as const) {
      expect(result.current[name]).toBe(original[name]);
    }
    render(
      <div data-tile-grid-root="" onClick={result.current.onClick}>
        <div data-tile-grid-item="a">Activate</div>
      </div>
    );
    fireEvent.click(screen.getByText('Activate'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('honors native change cancellation before an owned input changes the store', async () => {
    const onSelectionChange = vi.fn();
    const onChange = vi.fn(event => event.preventDefault());
    await mount({ onChange, onSelectionChange });
    await act(async () => fireEvent.click(screen.getByRole('checkbox', { name: 'a' })));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'a' })).not.toBeChecked();
  });

  it('does not commit a cancelled native click through the separate change event', async () => {
    const onSelectionChange = vi.fn();
    const onClick = vi.fn(event => event.preventDefault());
    await mount({ onClick, onSelectionChange });
    await act(async () => fireEvent.click(screen.getByRole('checkbox', { name: 'a' })));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'a' })).not.toBeChecked();
  });

  it('does not invoke tile content for control-only presentation changes', () => {
    const rect = { id: 'a', index: 0, x: 0, y: 0, width: 160, height: 160 };
    const renderItem = vi.fn(() => <span>Content</span>);
    const view = (controlClassName: string) =>
      themed(
        <TileGridItemView
          rect={rect}
          item="a"
          index={0}
          setSize={1}
          tileSize={160}
          selected={false}
          selectable
          disabled={false}
          label="a"
          renderItem={renderItem}
          selectionMode="multiselect"
          controlClassName={controlClassName}
        />
      );
    const { rerender } = render(view('first'));
    rerender(view('second'));
    expect(renderItem).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('checkbox', { name: 'a' }).parentElement?.parentElement).toHaveClass(
      'second'
    );
  });

  it.each(['single', 'multiselect'] as const)(
    'refreshes the DOM reset default for %s projection',
    mode => {
      const view = (checked: boolean) =>
        themed(
          <TileGridSelectionControl
            mode={mode}
            checked={checked}
            label="Owned input"
            name="owned-group"
          />
        );
      const { rerender, unmount } = render(view(false));
      const input = screen.getByRole(mode === 'single' ? 'radio' : 'checkbox');
      expect(input).toHaveProperty('defaultChecked', false);
      rerender(view(true));
      expect(input).toHaveProperty('defaultChecked', true);
      rerender(view(false));
      expect(input).toHaveProperty('defaultChecked', false);
      unmount();
      expect(input.isConnected).toBe(false);
    }
  );

  it('uses static warning text when incompatible props contain private data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount({
      items: ['secret-id'],
      getItemLabel: () => 'private-label',
      selectionMode: 'none',
      interactionMode: 'browse',
      enableMarquee: true,
    });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.flat().join(' ')).not.toMatch(/secret-id|private-label/);
  });
});
