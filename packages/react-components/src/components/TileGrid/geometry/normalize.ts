import { computeColumnCount } from './columnCount';

/** Result of removing duplicate item IDs while preserving source order. */
export interface NormalizedItems<T> {
  items: readonly T[];
  duplicateIds: readonly string[];
}

/** Keeps the first occurrence of every item ID and reports later duplicates. */
export function normalizeItems<T>(
  items: readonly T[],
  getItemId: (item: T) => string
): NormalizedItems<T> {
  const seen = new Set<string>();
  const unique: T[] = [];
  const duplicateIds: string[] = [];

  for (const item of items) {
    const id = getItemId(item);

    if (seen.has(id)) {
      duplicateIds.push(id);
      continue;
    }

    seen.add(id);
    unique.push(item);
  }

  return { items: unique, duplicateIds };
}

/** Clamps a tile-size value to a finite positive range. */
export function normalizeTileSize(value: number, minTileSize = 120, maxTileSize = 320): number {
  const maximum = Number.isFinite(maxTileSize) ? Math.max(1, maxTileSize) : 320;
  const minimum = Number.isFinite(minTileSize)
    ? Math.min(Math.max(1, minTileSize), maximum)
    : Math.min(120, maximum);
  const candidate = Number.isFinite(value) ? value : 160;

  return Math.min(Math.max(candidate, minimum), maximum);
}

/** Returns a finite positive ratio, or the normalized fallback. */
export function normalizeAspectRatio(value: number, fallback = 1): number {
  const safeFallback = Number.isFinite(fallback) && fallback > 0 ? fallback : 1;
  return Number.isFinite(value) && value > 0 ? value : safeFallback;
}

/** Normalizes a gap to a finite non-negative number. */
export function normalizeGap(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Normalizes a measured container width. */
export function normalizeContainerWidth(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Resolves an explicit column count or falls back to the automatic formula. */
export function normalizeColumns(
  value: number | undefined,
  containerWidth: number,
  tileSize: number,
  gap: number
): number {
  const automatic = computeColumnCount(containerWidth, tileSize, gap);
  const requested =
    value !== undefined && Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : automatic;
  const widthLimit =
    containerWidth > 0 && gap > 0 ? Math.floor(containerWidth / gap) + 1 : Number.MAX_SAFE_INTEGER;

  return Math.min(requested, widthLimit);
}

/** Clamps a mosaic item span to 1..2 columns and rows. */
export function normalizeSpan(
  span: { columns?: number; rows?: number } | undefined,
  columnCount: number
): { columns: number; rows: number } {
  const maximumColumns = Math.min(2, Math.max(1, columnCount));
  const columns = Math.min(
    maximumColumns,
    Math.max(1, Math.trunc(Number.isFinite(span?.columns) ? (span?.columns ?? 1) : 1))
  );
  const rows = Math.min(
    2,
    Math.max(1, Math.trunc(Number.isFinite(span?.rows) ? (span?.rows ?? 1) : 1))
  );

  return { columns, rows };
}
