import { normalizeAspectRatio } from './normalize';
import type {
  ResolvedTileGridGeometryInput,
  TileGridItemRect,
  TileGridLayoutResult,
} from './types';

/** Packs variable-height items into fixed-width columns. */
export function computeMasonryLayout<T>(
  input: ResolvedTileGridGeometryInput<T>
): TileGridLayoutResult {
  const { items, columns, containerWidth, gap, fallbackAspectRatio } = input;
  const columnWidth = (containerWidth - gap * (columns - 1)) / columns;
  const laneEnds = new Array<number>(columns).fill(0);
  const itemRects: TileGridItemRect[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const aspectRatio = normalizeAspectRatio(
      input.getItemAspectRatio?.(item) ?? fallbackAspectRatio,
      fallbackAspectRatio
    );
    const height = columnWidth / aspectRatio;
    let lane = 0;

    for (let candidate = 1; candidate < columns; candidate += 1) {
      if (laneEnds[candidate] < laneEnds[lane]) {
        lane = candidate;
      }
    }

    const y = laneEnds[lane];
    itemRects.push({
      id: input.getItemId(item),
      index,
      x: lane * (columnWidth + gap),
      y,
      width: columnWidth,
      height,
    });
    laneEnds[lane] = y + height + gap;
  }

  let totalHeight = 0;
  for (const rect of itemRects) {
    totalHeight = Math.max(totalHeight, rect.y + rect.height);
  }

  return {
    itemRects,
    bands: [],
    totalHeight,
    columnCount: columns,
    laneCount: columns,
  };
}
