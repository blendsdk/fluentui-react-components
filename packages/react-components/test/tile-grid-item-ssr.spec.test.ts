// @vitest-environment node
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TileGridAction, TileGridDragHandleProps } from '../src/components/TileGrid';
import { TileGridItem } from '../src/components/TileGridItem';

/**
 * Server-render smoke for the tile shell.
 *
 * The shell is presentation-only, so rendering it to a string must cover the
 * shared slots and the library-owned handle wiring without touching `window`
 * or `document`. The node environment selected at the top of this file makes
 * any browser-global access during import or render fail the test.
 */

/** Minimal application item; action callbacks receive the original value. */
interface PhotoItem {
  id: string;
  label: string;
}

/** The item rendered by the assertions below. */
const photo: PhotoItem = { id: 'photo-1', label: 'Lake sunrise' };

/** Handle wiring shaped the way the grid supplies it. */
const dragHandleProps: TileGridDragHandleProps = {
  setNodeRef: () => {},
  attributes: {},
  listeners: {},
  isDragging: false,
  disabled: false,
  label: 'Reorder Lake sunrise',
};

/** Action shown inline on the tile surface while the row is revealed. */
const actions: readonly TileGridAction<PhotoItem>[] = [
  { id: 'open', label: 'Open photo', onSelect: () => {} },
];

/** Menu-only action; its entry mounts when the user opens the menu. */
const overflowActions: readonly TileGridAction<PhotoItem>[] = [
  { id: 'remove', label: 'Remove photo', onSelect: () => {} },
];

/** Concrete shell type for createElement, which does not infer the item generic. */
const TypedTileGridItem = TileGridItem<PhotoItem>;

describe('TileGridItem server rendering', () => {
  it('should render the shell slots and handle without browser globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');

    const html = renderToString(
      createElement(TypedTileGridItem, {
        item: photo,
        media: createElement('img', {
          alt: '',
          src: 'data:image/png;base64,iVBORw0KGgo=',
        }),
        title: 'Sunrise over the lake',
        description: 'Lake Tahoe, 06:14',
        actions,
        overflowActions,
        dragHandleProps,
        strings: { moreActions: 'Photo actions' },
      })
    );

    expect(html).toContain('data-tile-grid-item-shell');
    expect(html).toContain('data-tile-grid-media');
    expect(html).toContain('data:image/png;base64,iVBORw0KGgo=');
    expect(html).toContain('Sunrise over the lake');
    expect(html).toContain('Lake Tahoe, 06:14');
    expect(html).toContain('data-tile-grid-inline-actions');
    expect(html).toContain('Open photo');
    expect(html).toContain('data-tile-grid-action-id="open"');
    expect(html).toContain('data-tile-grid-menu-trigger');
    expect(html).toContain('Photo actions');
    expect(html).toContain('data-tile-grid-drag-handle');
    expect(html).toContain('Reorder Lake sunrise');
  });
});
