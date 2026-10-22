import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from 'storybook/test';
import { describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../src/components/TileGrid';
import type { TileGridProps } from '../src/components/TileGrid/TileGrid.types';
import { setElementSize } from './jsdomStubs';

/** One tile keeps application checkbox state distinct from grid selection. */
interface Item {
  /** Stable selection identity. */
  id: string;
  /** Accessible name of the tile and its owned selection control. */
  label: string;
}

const items: readonly Item[] = [{ id: 'a', label: 'Tile a' }];
const getItemId = (item: Item) => item.id;
const getItemLabel = (item: Item) => item.label;

/** Mounts real controls and supplies the layout measurements missing from jsdom. */
async function mount(
  props: Pick<
    TileGridProps<Item>,
    'renderItem' | 'interactionMode' | 'onSelectionChange' | 'onItemActivate'
  >
) {
  render(
    <FluentProvider theme={webLightTheme}>
      <TileGrid
        items={items}
        getItemId={getItemId}
        getItemLabel={getItemLabel}
        ariaLabel="Tile label interactions"
        selectionMode="multiselect"
        {...props}
      />
    </FluentProvider>
  );
  const root = screen.getByRole('list', { name: 'Tile label interactions' });
  await act(async () => setElementSize(root, 800, 600));
}

describe.each(['browse', 'select'] as const)(
  'TileGrid label interactions in %s mode',
  interactionMode => {
    describe.each(['wrapping', 'htmlFor-associated'] as const)(
      '%s native checkbox label',
      association => {
        it.each(['text', 'descendant'] as const)(
          'keeps label %s clicks local while toggling the application checkbox',
          async target => {
            // Associated labels and their descendants belong to the native control, not the tile.
            const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
            const onItemActivate = vi.fn<(item: Item) => void>();
            const onLocalChange = vi.fn();
            const labelContent =
              target === 'text' ? 'Local preference' : <span>Local preference</span>;
            await mount({
              interactionMode,
              onSelectionChange,
              onItemActivate,
              renderItem: () =>
                association === 'wrapping' ? (
                  <label>
                    <input type="checkbox" onChange={onLocalChange} />
                    {labelContent}
                  </label>
                ) : (
                  <>
                    <input id="local-preference" type="checkbox" onChange={onLocalChange} />
                    <label htmlFor="local-preference">{labelContent}</label>
                  </>
                ),
            });
            const checkbox = screen.getByRole('checkbox', { name: 'Local preference' });
            const labelTarget = screen.getByText('Local preference');
            expect(checkbox).not.toBeChecked();

            // Let jsdom forward native label clicks; userEvent's cloned PointerEvent rejects its Window.
            act(() => labelTarget.click());
            expect(checkbox).toBeChecked();
            expect(onLocalChange).toHaveBeenCalledTimes(1);
            act(() => labelTarget.click());
            expect(checkbox).not.toBeChecked();
            expect(onLocalChange).toHaveBeenCalledTimes(2);

            expect.soft(onSelectionChange).not.toHaveBeenCalled();
            expect.soft(onItemActivate).not.toHaveBeenCalled();
            expect(screen.getByRole('checkbox', { name: 'Tile a' })).not.toBeChecked();
          }
        );
      }
    );

    it.each(['text', 'descendant'] as const)(
      'maps an unassociated label %s click to the ordinary tile action',
      async target => {
        // A label without an associated control remains ordinary application content.
        const onSelectionChange = vi.fn<(next: ReadonlySet<string>) => void>();
        const onItemActivate = vi.fn<(item: Item) => void>();
        await mount({
          interactionMode,
          onSelectionChange,
          onItemActivate,
          renderItem: () => (
            <label>{target === 'text' ? 'Ordinary content' : <span>Ordinary content</span>}</label>
          ),
        });

        await act(async () => userEvent.setup().click(screen.getByText('Ordinary content')));

        if (interactionMode === 'select') {
          expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['a']));
          expect(onItemActivate).not.toHaveBeenCalled();
          expect(screen.getByRole('checkbox', { name: 'Tile a' })).toBeChecked();
        } else {
          expect(onItemActivate).toHaveBeenCalledExactlyOnceWith(items[0]);
          expect(onSelectionChange).not.toHaveBeenCalled();
          expect(screen.getByRole('checkbox', { name: 'Tile a' })).not.toBeChecked();
        }
      }
    );
  }
);
