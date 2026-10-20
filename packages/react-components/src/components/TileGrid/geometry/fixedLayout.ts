import type {
  ResolvedTileGridGeometryInput,
  TileGridBand,
  TileGridItemRect,
  TileGridLayoutResult,
} from './types';

/** Lays items out in uniform rows and columns. */
export function computeFixedLayout<T>(
  input: ResolvedTileGridGeometryInput<T>
): TileGridLayoutResult {
  const { items, columns, containerWidth, gap, tileAspectRatio } = input;
  const columnWidth = (containerWidth - gap * (columns - 1)) / columns;
  const itemHeight = columnWidth / tileAspectRatio;
  const itemRects: TileGridItemRect[] = [];
  const bands: TileGridBand[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const row = Math.floor(index / columns);
    const column = index % columns;
    itemRects.push({
      id: input.getItemId(items[index]),
      index,
      x: column * (columnWidth + gap),
      y: row * (itemHeight + gap),
      width: columnWidth,
      height: itemHeight,
    });
  }

  const rowCount = Math.ceil(items.length / columns);
  for (let row = 0; row < rowCount; row += 1) {
    const firstIndex = row * columns;
    bands.push({
      start: row * (itemHeight + gap),
      height: itemHeight,
      firstIndex,
      lastIndex: Math.min(items.length - 1, firstIndex + columns - 1),
    });
  }

  return {
    itemRects,
    bands,
    totalHeight: rowCount === 0 ? 0 : rowCount * itemHeight + (rowCount - 1) * gap,
    columnCount: columns,
    laneCount: 1,
  };
}
