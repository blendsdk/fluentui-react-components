/**
 * Deterministic fixture for TileGrid stories, browser tests, and performance
 * tests. The data-URL thumbnails keep the suite offline and reproducible.
 */
export interface TileGridFixtureItem {
  /** Stable fixture identifier. */
  id: string;
  /** Human-readable tile label. */
  label: string;
  /** Intrinsic image width in fixture pixels. */
  width: number;
  /** Intrinsic image height in fixture pixels. */
  height: number;
  /** Intrinsic width divided by height. */
  aspectRatio: number;
  /** Inline data-URL thumbnail. */
  thumbnailUrl: string;
}

const ASPECT_RATIOS = [0.8, 1, 1.25, 1.5, 2] as const;
const THUMBNAIL_COLORS = ['#0f6cbd', '#2b88d8', '#5c2d91', '#107c10', '#c50f1f'] as const;

const THUMBNAIL_URLS = THUMBNAIL_COLORS.map(
  color =>
    `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${color}"/></svg>`
    )}`
);

/**
 * Creates a deterministic tile fixture. Aspect ratios cycle through
 * 0.8–2.0 and the thumbnail URL cycles through five inline SVGs.
 */
export function createTileGridFixture(count = 20_000): readonly TileGridFixtureItem[] {
  return Array.from({ length: count }, (_, index) => {
    const aspectRatio = ASPECT_RATIOS[index % ASPECT_RATIOS.length];
    const height = 100;
    const width = Math.round(height * aspectRatio);

    return {
      id: `tile-${index}`,
      label: `Tile ${index}`,
      width,
      height,
      aspectRatio,
      thumbnailUrl: THUMBNAIL_URLS[index % THUMBNAIL_URLS.length],
    };
  });
}
