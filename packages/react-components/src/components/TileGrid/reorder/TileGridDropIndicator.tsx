import type { ReactElement } from 'react';
import type { TileGridLayout } from '../geometry';
import type { TileGridInsertion } from './types';

/** Props for the insertion line. */
export interface TileGridDropIndicatorProps {
  /** Resolved insertion, or undefined when no pointer position exists. */
  insertion?: TileGridInsertion;
  /** Layout that defines the line orientation. */
  layout: TileGridLayout;
  /** Gap between tiles, used to centre the line in the gap. */
  gap: number;
  /** Number of items, used to keep the collection-end line inside the canvas. */
  itemCount: number;
  /** Class from the grid styles. */
  className: string;
}

/**
 * Draws a two-pixel insertion line in scroll-content coordinates.
 *
 * Row-based layouts use a vertical line between tiles; masonry uses a
 * horizontal line between items in a lane. The line is decorative, ignores
 * pointer events, and is clipped by the scroll container. At the collection
 * end it is pinned to the content edge so the clip does not hide it.
 */
export function TileGridDropIndicator({
  insertion,
  layout,
  gap,
  itemCount,
  className,
}: TileGridDropIndicatorProps): ReactElement | null {
  if (!insertion) return null;

  const half = gap / 2;
  const atEnd = insertion.boundary >= itemCount;
  const common = {
    'data-tile-grid-drop-indicator': '',
    'aria-hidden': true,
    className,
  } as const;

  if (layout === 'masonry') {
    const boundary =
      insertion.edge === 'before'
        ? insertion.rect.y - half
        : insertion.rect.y + insertion.rect.height + half;

    return (
      <div
        {...common}
        style={{
          top: atEnd ? 'calc(100% - 2px)' : Math.max(boundary - 1, 0),
          left: insertion.rect.x,
          width: insertion.rect.width,
          height: 2,
        }}
      />
    );
  }

  const boundary =
    insertion.edge === 'before'
      ? insertion.rect.x - half
      : insertion.rect.x + insertion.rect.width + half;

  return (
    <div
      {...common}
      style={{
        top: insertion.rect.y,
        left: atEnd ? 'calc(100% - 2px)' : Math.max(boundary - 1, 0),
        width: 2,
        height: insertion.rect.height,
      }}
    />
  );
}
