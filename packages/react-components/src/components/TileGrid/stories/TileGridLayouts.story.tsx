import type { ReactElement } from 'react';
import { StoryFrame, StoryGrid } from './TileGridStoryData.story';

/**
 * The default fixed grid: equal square tiles and automatic columns. Use it
 * when every tile has the same shape and the grid should read as uniform.
 */
export const Fixed = (): ReactElement => (
  <StoryFrame>
    <StoryGrid layout="fixed" />
  </StoryFrame>
);

/**
 * An explicit six-column fixed grid. Use it when the surrounding layout needs
 * a stable, predictable column count rather than an automatic fit.
 */
export const FixedColumns = (): ReactElement => (
  <StoryFrame>
    <StoryGrid layout="fixed" columns={6} tileSize={140} />
  </StoryFrame>
);

/**
 * Masonry packs variable-height tiles into the shortest lane. Use it for
 * photos or cards with different intrinsic heights where order matters.
 */
export const Masonry = (): ReactElement => (
  <StoryFrame>
    <StoryGrid layout="masonry" tileSize={180} />
  </StoryFrame>
);

/**
 * Justified scales each completed row to the full width. Use it for a photo
 * wall with a clean outer edge where row height may vary.
 */
export const Justified = (): ReactElement => (
  <StoryFrame>
    <StoryGrid layout="justified" tileSize={180} />
  </StoryFrame>
);

/**
 * Mosaic packs a dense base grid and lets every seventh tile occupy a 2x2
 * span. Use it when a gallery needs a few featured tiles among standard ones.
 */
export const Mosaic = (): ReactElement => (
  <StoryFrame>
    <StoryGrid layout="mosaic" tileSize={160} />
  </StoryFrame>
);
