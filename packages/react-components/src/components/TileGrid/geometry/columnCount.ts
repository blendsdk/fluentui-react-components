/**
 * Computes the automatic column count for fixed, masonry, and mosaic layouts.
 * Returns at least one column, including before the container is measured.
 */
export function computeColumnCount(containerWidth: number, tileSize: number, gap: number): number {
  const width = Number.isFinite(containerWidth) && containerWidth > 0 ? containerWidth : 0;
  const size = Number.isFinite(tileSize) && tileSize > 0 ? tileSize : 160;
  const spacing = Number.isFinite(gap) && gap > 0 ? gap : 0;

  if (width <= 0) {
    return 1;
  }

  return Math.max(1, Math.floor((width + spacing) / (size + spacing)));
}
