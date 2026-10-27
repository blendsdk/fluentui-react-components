import { makeStyles, tokens } from '@fluentui/react-components';
import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';
import { TileGrid } from '../TileGrid';
import type { TileGridItemRenderArgs } from '../TileGrid.types';
import { castingActors, getCastingActorId, getCastingActorName } from './ActorData.story';
import type { CastingActor } from './ActorData.story';
import {
  ACTOR_TILE_GAP,
  ACTOR_TILE_HEIGHT,
  ACTOR_TILE_WIDTH,
  ActorPortraitCard,
} from './ActorPortraitCard.story';
import { useActorStoryState } from './ActorDialogs.story';

const COLUMNS = 4;
const OUTER_MARGIN = 48;
const GRID_WIDTH = COLUMNS * ACTOR_TILE_WIDTH + (COLUMNS - 1) * ACTOR_TILE_GAP;
const ROW_COUNT = Math.ceil(castingActors.length / COLUMNS);
const GRID_HEIGHT = ROW_COUNT * ACTOR_TILE_HEIGHT + (ROW_COUNT - 1) * ACTOR_TILE_GAP;
const FRAME_WIDTH = 1000;
const FRAME_HEIGHT = 760;

const useStyles = makeStyles({
  frame: {
    boxSizing: 'border-box',
    width: `${FRAME_WIDTH}px`,
    height: `${FRAME_HEIGHT}px`,
    overflowX: 'hidden',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
  scrollContent: {
    boxSizing: 'border-box',
    width: '100%',
    paddingTop: `${OUTER_MARGIN}px`,
    paddingLeft: `${OUTER_MARGIN}px`,
    paddingBottom: `${OUTER_MARGIN}px`,
  },
});

/**
 * The legacy actor-overview reference.
 *
 * The outer frame owns scrolling while the grid keeps the legacy fixed tile
 * width. That preserves the 150 x 228 cards and 96px gaps even when a vertical
 * scrollbar is present. The first row's hover toolbar can therefore slide into
 * the 48px top inset without being clipped by the grid root.
 */
export function Actors(): ReactElement {
  const classes = useStyles();
  const { items, onPreview, onZoom, onEdit, dialogs } = useActorStoryState(castingActors);

  const renderActorTile = useCallback(
    ({ item }: TileGridItemRenderArgs<CastingActor>) => (
      <ActorPortraitCard actor={item} onPreview={onPreview} onZoom={onZoom} onEdit={onEdit} />
    ),
    [onEdit, onPreview, onZoom]
  );

  const gridStyle = useMemo(
    () => ({
      width: `${GRID_WIDTH}px`,
      height: `${GRID_HEIGHT}px`,
      overflow: 'visible' as const,
    }),
    []
  );

  return (
    <>
      <div className={classes.frame}>
        <div className={classes.scrollContent}>
          <TileGrid
            items={items}
            getItemId={getCastingActorId}
            getItemLabel={getCastingActorName}
            renderItem={renderActorTile}
            layout="fixed"
            columns={COLUMNS}
            tileSize={ACTOR_TILE_WIDTH}
            tileAspectRatio={ACTOR_TILE_WIDTH / ACTOR_TILE_HEIGHT}
            gap={ACTOR_TILE_GAP}
            selectionMode="none"
            ariaLabel="Actor overview"
            onItemActivate={onPreview}
            style={gridStyle}
          />
        </div>
      </div>
      {dialogs}
    </>
  );
}
