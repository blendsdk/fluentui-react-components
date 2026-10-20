import { computeFixedLayout } from './fixedLayout';
import { computeJustifiedLayout } from './justifiedLayout';
import { computeMasonryLayout } from './masonryLayout';
import { computeMosaicLayout } from './mosaicLayout';
import {
  normalizeAspectRatio,
  normalizeColumns,
  normalizeContainerWidth,
  normalizeGap,
  normalizeItems,
  normalizeTileSize,
} from './normalize';
import type {
  ResolvedTileGridGeometryInput,
  TileGridGeometryInput,
  TileGridGeometryResult,
  TileGridItemRect,
  TileGridLayoutResult,
} from './types';

function createResult(layout: TileGridLayoutResult): TileGridGeometryResult {
  const rectById = new Map(layout.itemRects.map(rect => [rect.id, rect]));

  return {
    itemRects: layout.itemRects,
    bands: layout.bands,
    totalHeight: layout.totalHeight,
    columnCount: layout.columnCount,
    laneCount: layout.laneCount,
    indexAtPoint(x, y) {
      let found: number | undefined;

      for (const rect of layout.itemRects) {
        if (x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height) {
          found = rect.index;
        }
      }

      return found;
    },
    firstVisibleItem(scrollTop) {
      let best: TileGridItemRect | undefined;

      for (const rect of layout.itemRects) {
        if (rect.y + rect.height <= scrollTop) {
          continue;
        }

        if (
          best === undefined ||
          rect.y < best.y ||
          (rect.y === best.y && (rect.x < best.x || (rect.x === best.x && rect.index < best.index)))
        ) {
          best = rect;
        }
      }

      return best;
    },
    offsetForItem(id) {
      return rectById.get(id)?.y;
    },
    itemsInRange(startY, endY) {
      return layout.itemRects
        .filter(rect => rect.y < endY && rect.y + rect.height > startY)
        .map(rect => rect.index)
        .sort((left, right) => left - right);
    },
  };
}

/** Computes the normalized geometry for one of the four supported layouts. */
export function computeGeometry<T>(input: TileGridGeometryInput<T>): TileGridGeometryResult {
  const containerWidth = normalizeContainerWidth(input.containerWidth);
  const tileSize = normalizeTileSize(input.tileSize, 1, Number.MAX_SAFE_INTEGER);
  const gap = normalizeGap(input.gap);
  const tileAspectRatio = normalizeAspectRatio(input.tileAspectRatio, 1);
  const fallbackAspectRatio = normalizeAspectRatio(input.fallbackAspectRatio, 1);
  const uniqueItems = normalizeItems(input.items, input.getItemId).items;
  const columns = normalizeColumns(input.columns, containerWidth, tileSize, gap);

  if (containerWidth === 0) {
    return createResult({
      itemRects: [],
      bands: [],
      totalHeight: 0,
      columnCount: 1,
      laneCount: 1,
    });
  }

  const resolved: ResolvedTileGridGeometryInput<T> = {
    ...input,
    items: uniqueItems,
    columns,
    tileSize,
    gap,
    tileAspectRatio,
    fallbackAspectRatio,
    containerWidth,
  };

  switch (input.layout) {
    case 'masonry':
      return createResult(computeMasonryLayout(resolved));
    case 'justified':
      return createResult(computeJustifiedLayout(resolved));
    case 'mosaic':
      return createResult(computeMosaicLayout(resolved));
    case 'fixed':
    default:
      return createResult(computeFixedLayout(resolved));
  }
}
