import { normalizeAspectRatio } from './normalize';
import type {
  ResolvedTileGridGeometryInput,
  TileGridBand,
  TileGridItemRect,
  TileGridLayoutResult,
} from './types';

interface JustifiedRowItem<T> {
  item: T;
  index: number;
  widthAtTarget: number;
}

/** Packs variable-width items into justified rows at a target height. */
export function computeJustifiedLayout<T>(
  input: ResolvedTileGridGeometryInput<T>
): TileGridLayoutResult {
  const { items, containerWidth, gap, tileSize, fallbackAspectRatio } = input;
  const itemRects: TileGridItemRect[] = [];
  const bands: TileGridBand[] = [];
  let row: JustifiedRowItem<T>[] = [];
  let rowWidth = 0;
  let y = 0;

  const flushRow = (isLast: boolean): void => {
    if (row.length === 0) {
      return;
    }

    const available = containerWidth - gap * (row.length - 1);
    const sum = row.reduce((total, entry) => total + entry.widthAtTarget, 0);
    const scale = isLast ? 1 : available / sum;
    const rowHeight = tileSize * scale;
    let x = 0;

    for (const entry of row) {
      const width = entry.widthAtTarget * scale;
      itemRects.push({
        id: input.getItemId(entry.item),
        index: entry.index,
        x,
        y,
        width,
        height: rowHeight,
      });
      x += width + gap;
    }

    bands.push({
      start: y,
      height: rowHeight,
      firstIndex: row[0].index,
      lastIndex: row[row.length - 1].index,
    });
    y += rowHeight + gap;
    row = [];
    rowWidth = 0;
  };

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const aspectRatio = normalizeAspectRatio(
      input.getItemAspectRatio?.(item) ?? fallbackAspectRatio,
      fallbackAspectRatio
    );
    const widthAtTarget = Math.min(tileSize * aspectRatio, containerWidth);
    const nextWidth = row.length === 0 ? widthAtTarget : rowWidth + gap + widthAtTarget;

    if (row.length > 0 && nextWidth > containerWidth) {
      flushRow(false);
    }

    row.push({ item, index, widthAtTarget });
    rowWidth += (row.length === 1 ? 0 : gap) + widthAtTarget;
  }

  flushRow(true);

  const lastBand = bands[bands.length - 1];
  return {
    itemRects,
    bands,
    totalHeight: lastBand ? lastBand.start + lastBand.height : 0,
    columnCount: 1,
    laneCount: 1,
  };
}
