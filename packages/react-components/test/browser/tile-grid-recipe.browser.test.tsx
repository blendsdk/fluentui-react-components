import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { TileGridLayout } from '../../src/components/TileGrid';
import { PhotoLibraryRecipe } from '../../src/components/TileGrid/stories/TileGridPhotoLibrary.story';
import { createTileGridFixture } from '../fixtures/tileGridFixture';

/**
 * Browser contract of the 20K photo-library recipe.
 *
 * The tests mount the exported story composition, so the toolbar, filters,
 * preview and the grid under test are the same composition Storybook renders.
 */

const GRID_LABEL = 'Photo library';
const ITEMS = createTileGridFixture(20_000);
const LAYOUTS: readonly TileGridLayout[] = ['fixed', 'masonry', 'justified', 'mosaic'];
const TEST_TIMEOUT = 30_000;
const VIEWPORT = { width: 1440, height: 900 };
const initialViewport = { width: innerWidth, height: innerHeight };

beforeAll(async () => {
  await page.viewport(VIEWPORT.width, VIEWPORT.height);
});

afterAll(async () => {
  await page.viewport(initialViewport.width, initialViewport.height);
});

/** Mounts the exported recipe inside the application provider. */
async function mountRecipe(layout: TileGridLayout = 'fixed') {
  const view = render(
    <FluentProvider theme={webLightTheme}>
      <PhotoLibraryRecipe layout={layout} />
    </FluentProvider>
  );
  const root = await screen.findByRole('list', { name: GRID_LABEL });
  await waitFor(() => {
    expect(root.querySelectorAll('[data-tile-grid-item]').length).toBeGreaterThan(0);
  });
  return { ...view, root };
}

/** Returns the visible tile labels in DOM order. */
function visibleLabels(): string[] {
  return screen.getAllByRole('listitem').map(item => item.getAttribute('aria-label') ?? '');
}

/** Returns the currently mounted tile images. */
function mountedImages(root: HTMLElement): HTMLImageElement[] {
  return Array.from(root.querySelectorAll<HTMLImageElement>('[data-tile-grid-item] img'));
}

/** Chooses an orientation from the toolbar dropdown. */
async function chooseOrientation(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('combobox', { name: 'Orientation' }));
  const option = await screen.findByRole('option', { name });
  await userEvent.click(option);
}

/** Opens the first tile's action menu. */
async function openFirstMenu(): Promise<void> {
  const first = screen.getAllByRole('listitem')[0];
  if (!first) throw new Error('The recipe did not render a tile');
  await userEvent.click(within(first).getByRole('button', { name: 'More actions' }));
}

describe('photo-library recipe', () => {
  it(
    'should filter by label, reset scroll, preserve selection, and disable arranging while filtered',
    async () => {
      const { root } = await mountRecipe();
      const searchbox = screen.getByRole('searchbox', { name: 'Filter photos' });

      expect(screen.getByRole('toolbar', { name: 'Photo library controls' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: ITEMS[0].label })).toBeChecked();
      root.scrollTop = 400;
      fireEvent.scroll(root);
      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /^Reorder / }).length).toBeGreaterThan(0);

      await userEvent.type(searchbox, 'Tile 10');

      await waitFor(() => {
        const labels = visibleLabels();
        expect(labels.length).toBeGreaterThan(0);
        expect(labels.every(label => label.toLowerCase().includes('tile 10'))).toBe(true);
      });
      expect(root.scrollTop).toBe(0);
      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.queryAllByRole('button', { name: /^Reorder / })).toHaveLength(0);

      await openFirstMenu();
      expect(screen.queryByRole('menuitem', { name: 'Move up' })).toBeNull();
      expect(screen.queryByRole('menuitem', { name: 'Move down' })).toBeNull();
      await userEvent.keyboard('{Escape}');

      await userEvent.clear(searchbox);
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /^Reorder / }).length).toBeGreaterThan(0);
      });
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: ITEMS[0].label })).toBeChecked();
      });
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    },
    TEST_TIMEOUT
  );

  it(
    'should keep only the chosen orientation, reset scroll, and restore arranging when cleared',
    async () => {
      const { root } = await mountRecipe();

      for (const [name, expected] of [
        ['Portrait', 'portrait'],
        ['Square', 'square'],
        ['Landscape', 'landscape'],
      ] as const) {
        root.scrollTop = 300;
        fireEvent.scroll(root);
        await chooseOrientation(name);

        await waitFor(() => {
          const images = mountedImages(root);
          expect(images.length).toBeGreaterThan(0);
          for (const image of images) {
            const width = Number(image.getAttribute('width'));
            const height = Number(image.getAttribute('height'));
            if (expected === 'portrait') expect(width).toBeLessThan(height);
            else if (expected === 'square') expect(width).toBe(height);
            else expect(width).toBeGreaterThan(height);
          }
        });
        expect(root.scrollTop).toBe(0);
        expect(screen.getByText('2 selected')).toBeInTheDocument();
        expect(screen.queryAllByRole('button', { name: /^Reorder / })).toHaveLength(0);
      }

      await chooseOrientation('All orientations');
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /^Reorder / }).length).toBeGreaterThan(0);
      });
    },
    TEST_TIMEOUT
  );

  it(
    'should show the empty state and keep the toolbar usable for an empty result',
    async () => {
      const { root } = await mountRecipe();
      const searchbox = screen.getByRole('searchbox', { name: 'Filter photos' });

      await userEvent.type(searchbox, 'no-such-photo');
      await waitFor(() => {
        expect(screen.getByText('No photos')).toBeInTheDocument();
      });
      expect(root.querySelectorAll('[data-tile-grid-item]')).toHaveLength(0);
      expect(searchbox).toBeEnabled();

      await userEvent.clear(searchbox);
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /^Reorder / }).length).toBeGreaterThan(0);
      });
    },
    TEST_TIMEOUT
  );

  it(
    'should open the app-owned preview and close it when the previewed item leaves the filter',
    async () => {
      await mountRecipe();
      const searchbox = screen.getByRole('searchbox', { name: 'Filter photos' });

      await userEvent.dblClick(screen.getByRole('listitem', { name: ITEMS[0].label }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(ITEMS[0].label)).toBeInTheDocument();
      const preview = dialog.querySelector('img');
      expect(preview?.getAttribute('src')).toBe(ITEMS[0].thumbnailUrl);

      await userEvent.click(within(dialog).getByRole('button', { name: 'Close preview' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

      await userEvent.dblClick(screen.getByRole('listitem', { name: ITEMS[0].label }));
      await screen.findByRole('dialog');
      await userEvent.type(searchbox, 'Tile 19999');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    },
    TEST_TIMEOUT
  );

  it(
    'should apply a menu reorder and keep the new order after filtering and clearing',
    async () => {
      await mountRecipe();
      const searchbox = screen.getByRole('searchbox', { name: 'Filter photos' });
      expect(visibleLabels()[0]).toBe(ITEMS[0].label);
      expect(visibleLabels()[1]).toBe(ITEMS[1].label);

      await openFirstMenu();
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Move down' }));
      await waitFor(() => {
        expect(visibleLabels()[0]).toBe(ITEMS[1].label);
        expect(visibleLabels()[1]).toBe(ITEMS[0].label);
      });

      await userEvent.type(searchbox, 'Tile 10');
      await waitFor(() => {
        expect(screen.queryAllByRole('button', { name: /^Reorder / })).toHaveLength(0);
      });
      await userEvent.clear(searchbox);
      await waitFor(() => {
        expect(visibleLabels()[0]).toBe(ITEMS[1].label);
        expect(visibleLabels()[1]).toBe(ITEMS[0].label);
      });
    },
    TEST_TIMEOUT
  );

  it.each(LAYOUTS)(
    'should mount fewer than 120 tiles and lazy images in the %s layout',
    async layout => {
      const { root } = await mountRecipe(layout);

      const mounted = root.querySelectorAll('[data-tile-grid-item]');
      expect(mounted.length).toBeGreaterThan(20);
      expect(mounted.length).toBeLessThan(120);
      expect(mounted[0]).toHaveAttribute('aria-setsize', String(ITEMS.length));
      const images = mountedImages(root);
      expect(images.length).toBeGreaterThan(0);
      expect(images.length).toBeLessThan(120);
      for (const image of images) {
        expect(image.getAttribute('loading')).toBe('lazy');
        expect(image.getAttribute('decoding')).toBe('async');
      }
    },
    TEST_TIMEOUT
  );
});
