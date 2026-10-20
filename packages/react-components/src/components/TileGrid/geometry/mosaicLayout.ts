import { normalizeSpan } from './normalize';
import type {
  ResolvedTileGridGeometryInput,
  TileGridBand,
  TileGridItemRect,
  TileGridLayoutResult,
} from './types';

/** Packs items into a dense base grid with optional 1x1/2x2 spans. */
export function computeMosaicLayout<T>(
  input: ResolvedTileGridGeometryInput<T>
): TileGridLayoutResult {
  const { items, columns, containerWidth, gap } = input;
  const cellWidth = (containerWidth - gap * (columns - 1)) / columns;
  const cellHeight = cellWidth;
  const occupancy: boolean[][] = [];
  const itemRects: TileGridItemRect[] = [];
  const placedRows: number[] = [];
  const placedSpans: { columns: number; rows: number }[] = [];
  const searchWatermarks = new Map<string, number>();
  let occupiedRows = 0;

  const ensureRows = (count: number): void => {
    while (occupancy.length < count) {
      occupancy.push(new Array<boolean>(columns).fill(false));
    }
  };

  const isFree = (row: number, column: number, spanColumns: number, spanRows: number): boolean => {
    ensureRows(row + spanRows);

    for (let rowIndex = row; rowIndex < row + spanRows; rowIndex += 1) {
      for (let columnIndex = column; columnIndex < column + spanColumns; columnIndex += 1) {
        if (occupancy[rowIndex][columnIndex]) {
          return false;
        }
      }
    }

    return true;
  };

  const occupy = (row: number, column: number, spanColumns: number, spanRows: number): void => {
    for (let rowIndex = row; rowIndex < row + spanRows; rowIndex += 1) {
      for (let columnIndex = column; columnIndex < column + spanColumns; columnIndex += 1) {
        occupancy[rowIndex][columnIndex] = true;
      }
    }
    occupiedRows = Math.max(occupiedRows, row + spanRows);
  };

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const span = normalizeSpan(input.getItemSpan?.(item), columns);
    const shapeKey = `${span.columns}x${span.rows}`;
    let row = searchWatermarks.get(shapeKey) ?? 0;
    let placed = false;

    for (; !placed; row += 1) {
      for (let column = 0; column <= columns - span.columns; column += 1) {
        if (!isFree(row, column, span.columns, span.rows)) {
          continue;
        }

        occupy(row, column, span.columns, span.rows);
        itemRects.push({
          id: input.getItemId(item),
          index,
          x: column * (cellWidth + gap),
          y: row * (cellHeight + gap),
          width: span.columns * cellWidth + (span.columns - 1) * gap,
          height: span.rows * cellHeight + (span.rows - 1) * gap,
        });
        placedRows.push(row);
        placedSpans.push(span);
        searchWatermarks.set(shapeKey, row);
        placed = true;
        break;
      }
    }
  }

  const firstByRow = new Array<number>(occupiedRows).fill(-1);
  const lastByRow = new Array<number>(occupiedRows).fill(-1);
  const rowHeightWithGap = cellHeight + gap;

  for (let index = 0; index < itemRects.length; index += 1) {
    const rect = itemRects[index];
    const span = placedSpans[index];
    const topRow = placedRows[index];

    for (let row = topRow; row < topRow + span.rows; row += 1) {
      if (firstByRow[row] === -1 || rect.index < firstByRow[row]) {
        firstByRow[row] = rect.index;
      }
      if (lastByRow[row] === -1 || rect.index > lastByRow[row]) {
        lastByRow[row] = rect.index;
      }
    }
  }

  const bands: TileGridBand[] = Array.from({ length: occupiedRows }, (_, row) => ({
    start: row * rowHeightWithGap,
    height: cellHeight,
    firstIndex: firstByRow[row],
    lastIndex: lastByRow[row],
  }));
  let totalHeight = 0;
  for (const rect of itemRects) {
    totalHeight = Math.max(totalHeight, rect.y + rect.height);
  }

  return {
    itemRects,
    bands,
    totalHeight,
    columnCount: columns,
    laneCount: 1,
  };
}
