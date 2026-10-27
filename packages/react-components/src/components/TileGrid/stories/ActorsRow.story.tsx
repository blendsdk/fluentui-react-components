import { Text, makeStyles, tokens } from '@fluentui/react-components';
import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';
import { TileGrid } from '../TileGrid';
import type { TileGridItemRenderArgs, TileGridReorderArgs } from '../TileGrid.types';
import { castingActors, getCastingActorId, getCastingActorName } from './ActorData.story';
import type { CastingActor } from './ActorData.story';
import {
  ACTOR_TILE_GAP,
  ACTOR_TILE_HEIGHT,
  ACTOR_TILE_WIDTH,
  ActorPortraitCard,
} from './ActorPortraitCard.story';
import { useActorStoryState } from './ActorDialogs.story';

/** All actors stay in one row; the frame scrolls horizontally. */
const ROW_ACTORS = castingActors;
const COLUMNS = ROW_ACTORS.length;
const OUTER_MARGIN = 48;
/** Extra height leaves room for the horizontal scrollbar below the row. */
const SCROLLBAR_ALLOWANCE = 24;
const GRID_WIDTH = COLUMNS * ACTOR_TILE_WIDTH + (COLUMNS - 1) * ACTOR_TILE_GAP;
const FRAME_WIDTH = 1230;
const FRAME_HEIGHT = ACTOR_TILE_HEIGHT + OUTER_MARGIN * 2 + SCROLLBAR_ALLOWANCE;

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  frame: {
    boxSizing: 'border-box',
    width: `${FRAME_WIDTH}px`,
    height: `${FRAME_HEIGHT}px`,
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: `${OUTER_MARGIN}px`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
  },
  note: {
    color: tokens.colorNeutralForeground2,
  },
});

/**
 * A single horizontal actor row with pointer drag arranging.
 *
 * All 28 actors stay in one fixed-width row while the outer frame scrolls
 * horizontally. Every tile exposes a visible grip. Dragging a grip horizontally
 * shows a vertical insertion line; dropping commits the new order through
 * `onReorder`. Escape cancels the active drag.
 */
export function ActorsRow(): ReactElement {
  const classes = useStyles();
  const { items, setItems, onPreview, onZoom, onEdit, dialogs } = useActorStoryState(ROW_ACTORS);

  const handleReorder = useCallback(
    ({ orderedIds }: TileGridReorderArgs) => {
      setItems(current => {
        const byId = new Map(current.map(actor => [actor.id, actor]));
        return orderedIds.flatMap(id => {
          const actor = byId.get(id);
          return actor ? [actor] : [];
        });
      });
    },
    [setItems]
  );

  const renderActorTile = useCallback(
    ({ item, dragHandleProps, isDragging, isOverlay }: TileGridItemRenderArgs<CastingActor>) => (
      <ActorPortraitCard
        actor={item}
        onPreview={onPreview}
        onZoom={onZoom}
        onEdit={onEdit}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
        isOverlay={isOverlay}
      />
    ),
    [onEdit, onPreview, onZoom]
  );

  const gridStyle = useMemo(
    () => ({
      width: `${GRID_WIDTH}px`,
      height: `${ACTOR_TILE_HEIGHT}px`,
      overflow: 'visible' as const,
    }),
    []
  );

  return (
    <div className={classes.root}>
      <div className={classes.frame}>
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
          ariaLabel="Actor row"
          onItemActivate={onPreview}
          reorderable
          onReorder={handleReorder}
          style={gridStyle}
        />
      </div>
      <Text size={200} className={classes.note}>
        Scroll horizontally for more actors. Drag a grip to reorder; Escape cancels.
      </Text>
      {dialogs}
    </div>
  );
}
