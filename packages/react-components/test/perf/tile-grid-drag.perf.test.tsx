import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TileGrid } from '../../src/components/TileGrid';
import type { TileGridItemRenderArgs } from '../../src/components/TileGrid';
import { createTileGridFixture, type TileGridFixtureItem } from '../fixtures/tileGridFixture';

/** 20K fixture shared by the drag measurements. */
const items = createTileGridFixture(20_000);

const getItemId = (item: TileGridFixtureItem): string => item.id;
const getItemLabel = (item: TileGridFixtureItem): string => item.label;
const getItemAspectRatio = (item: TileGridFixtureItem): number => item.aspectRatio;

const TILE_ITEM_SELECTOR = '[data-tile-grid-item]';
const OVERLAY_SELECTOR = '[data-tile-grid-overlay]';
const MOUNTED_BUDGET = 120;
const MOVE_RENDER_BUDGET = 6;

/** Waits for two animation frames so layout and RAF work settle. */
async function frames(): Promise<void> {
  await act(async () => {
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

describe('TileGrid reorder performance', () => {
  it('should keep the 20K window bounded and avoid item measurement during a drag', async () => {
    const onReorder = vi.fn();
    const renderSpy = vi.fn();

    const renderItem = (args: TileGridItemRenderArgs<TileGridFixtureItem>) => {
      renderSpy();
      return (
        <div style={{ width: '100%', height: '100%', background: '#f3f3f3' }}>
          <span>{args.item.label}</span>
          {args.dragHandleProps ? (
            <button
              type="button"
              tabIndex={-1}
              ref={args.dragHandleProps.setNodeRef}
              {...args.dragHandleProps.attributes}
              {...args.dragHandleProps.listeners}
              aria-label={args.dragHandleProps.label}
            >
              Reorder
            </button>
          ) : null}
        </div>
      );
    };

    const view = render(
      <FluentProvider theme={webLightTheme}>
        <div data-testid="frame" style={{ width: 1440, height: 900, overflow: 'hidden' }}>
          <TileGrid
            items={items}
            getItemId={getItemId}
            getItemLabel={getItemLabel}
            getItemAspectRatio={getItemAspectRatio}
            renderItem={renderItem}
            layout="fixed"
            tileSize={160}
            gap={8}
            selectionMode="none"
            ariaLabel="Reorder performance grid"
            reorderable
            onReorder={onReorder}
          />
        </div>
      </FluentProvider>
    );

    const root = await screen.findByRole('list', { name: 'Reorder performance grid' });
    await waitFor(() =>
      expect(root.querySelectorAll(TILE_ITEM_SELECTOR).length).toBeGreaterThan(0)
    );

    const mountedBefore = root.querySelectorAll(TILE_ITEM_SELECTOR).length;
    expect(mountedBefore).toBeLessThan(MOUNTED_BUDGET);

    const first = root.querySelector<HTMLElement>(TILE_ITEM_SELECTOR);
    const second = root.querySelectorAll<HTMLElement>(TILE_ITEM_SELECTOR)[1];
    if (!first || !second) throw new Error('The virtual window did not mount two tiles');

    const handle = within(first).getByRole('button', { name: /^Reorder / });
    const handleRect = handle.getBoundingClientRect();
    const secondRect = second.getBoundingClientRect();

    const originalRect = Element.prototype.getBoundingClientRect;
    let itemReads = 0;
    Element.prototype.getBoundingClientRect = function (this: Element): DOMRect {
      if (this instanceof HTMLElement && this.matches(TILE_ITEM_SELECTOR)) itemReads += 1;
      return originalRect.call(this);
    };

    const start = {
      pointerId: 81,
      isPrimary: true,
      button: 0,
      clientX: handleRect.left + handleRect.width / 2,
      clientY: handleRect.top + handleRect.height / 2,
    };

    try {
      fireEvent.pointerDown(handle, { ...start, bubbles: true });
      await frames();
      renderSpy.mockClear();

      for (let step = 1; step <= 3; step += 1) {
        fireEvent.pointerMove(document, {
          pointerId: 81,
          isPrimary: true,
          clientX: secondRect.left + step * 8,
          clientY: secondRect.top + secondRect.height / 2,
          bubbles: true,
        });
        await frames();
      }

      const mountedDuringDrag = root.querySelectorAll(TILE_ITEM_SELECTOR).length;
      expect(mountedDuringDrag).toBeLessThan(MOUNTED_BUDGET);
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(MOVE_RENDER_BUDGET);
      expect(itemReads).toBe(0);

      const rootRect = root.getBoundingClientRect();
      renderSpy.mockClear();
      fireEvent.pointerMove(document, {
        pointerId: 81,
        isPrimary: true,
        clientX: rootRect.left + 120,
        clientY: rootRect.bottom - 10,
        bubbles: true,
      });

      await frames();
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(6);

      await waitFor(() => expect(root.scrollTop).toBeGreaterThan(0), { timeout: 5_000 });
      await frames();

      const mountedDuringScroll = root.querySelectorAll(TILE_ITEM_SELECTOR).length;
      expect(mountedDuringScroll).toBeLessThan(MOUNTED_BUDGET);
      expect(document.querySelector(OVERLAY_SELECTOR)).not.toBeNull();
      expect(itemReads).toBe(0);
    } finally {
      fireEvent.pointerUp(document, { ...start, bubbles: true });
      Element.prototype.getBoundingClientRect = originalRect;
    }

    await waitFor(() => expect(document.querySelector(OVERLAY_SELECTOR)).toBeNull());
    expect(root.querySelectorAll(TILE_ITEM_SELECTOR).length).toBeLessThan(MOUNTED_BUDGET);

    view.unmount();
  }, 120_000);
});
