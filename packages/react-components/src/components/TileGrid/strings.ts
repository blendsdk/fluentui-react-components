import type { TileGridStrings } from './TileGrid.types';

/** English defaults for every localizable grid message. */
export const defaultTileGridStrings: TileGridStrings = {
  emptyMessage: 'No items',
  selectionCount: (selected, total) =>
    `${selected.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} selected`,
  dragHandleLabel: itemLabel => `Reorder ${itemLabel}`,
  moveUp: 'Move up',
  moveDown: 'Move down',
  reorderPosition: (position, total) => `Moved to position ${position} of ${total}`,
  moreActions: 'More actions',
};

/**
 * Merges application overrides over the English defaults.
 *
 * The returned object is complete, so renderers and the tile shell can rely on
 * every key being present.
 */
export function resolveTileGridStrings(overrides?: Partial<TileGridStrings>): TileGridStrings {
  return {
    emptyMessage: overrides?.emptyMessage ?? defaultTileGridStrings.emptyMessage,
    selectionCount: overrides?.selectionCount ?? defaultTileGridStrings.selectionCount,
    dragHandleLabel: overrides?.dragHandleLabel ?? defaultTileGridStrings.dragHandleLabel,
    moveUp: overrides?.moveUp ?? defaultTileGridStrings.moveUp,
    moveDown: overrides?.moveDown ?? defaultTileGridStrings.moveDown,
    reorderPosition: overrides?.reorderPosition ?? defaultTileGridStrings.reorderPosition,
    moreActions: overrides?.moreActions ?? defaultTileGridStrings.moreActions,
  };
}
