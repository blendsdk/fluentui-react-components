import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { EditRegular, EyeRegular, ReorderRegular, ZoomInRegular } from '@fluentui/react-icons';
import type { ReactElement } from 'react';
import type { TileGridDragHandleProps } from '../TileGrid.types';
import type { CastingActor } from './ActorData.story';

/** Legacy actor card width, including its 2px border. */
export const ACTOR_TILE_WIDTH = 150;
/** Legacy actor card height, including the border and 24px caption. */
export const ACTOR_TILE_HEIGHT = 228;
/** Fixed image area inside the card. */
export const ACTOR_IMAGE_HEIGHT = 200;
/** One-line caption height. */
export const ACTOR_CAPTION_HEIGHT = 24;
/** Transparent border included in the card's border-box. */
export const ACTOR_TILE_BORDER = 2;
/** Space between adjacent cards. */
export const ACTOR_TILE_GAP = 96;
/** Distance the hover toolbar slides above the card. */
export const ACTOR_TOOLBAR_OFFSET = 48;

const useStyles = makeStyles({
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'visible',
    border: `${ACTOR_TILE_BORDER}px solid transparent`,
    borderRadius: '3px',
    backgroundColor: 'transparent',
    ':hover [data-casting-toolbar]': {
      top: `-${ACTOR_TOOLBAR_OFFSET}px`,
      opacity: 1,
      pointerEvents: 'auto',
    },
    ':focus-within [data-casting-toolbar]': {
      top: `-${ACTOR_TOOLBAR_OFFSET}px`,
      opacity: 1,
      pointerEvents: 'auto',
    },
  },
  dragging: {
    opacity: 0.35,
  },
  overlay: {
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow16,
  },
  media: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '100%',
    height: `${ACTOR_IMAGE_HEIGHT}px`,
    overflow: 'hidden',
  },
  image: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
  },
  caption: {
    display: 'block',
    flexShrink: 0,
    width: '100%',
    height: `${ACTOR_CAPTION_HEIGHT}px`,
    boxSizing: 'border-box',
    padding: tokens.spacingVerticalXS,
    overflow: 'hidden',
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  toolbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    opacity: 0,
    pointerEvents: 'none',
    transitionProperty: 'opacity, top',
    transitionDuration: tokens.durationNormal,
    zIndex: 2,
  },
  toolbarRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    boxSizing: 'border-box',
    padding: tokens.spacingVerticalS,
    gap: tokens.spacingHorizontalL,
  },
  toolbarButton: {
    minWidth: 0,
  },
  dragHandle: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    left: tokens.spacingHorizontalXS,
    zIndex: 3,
    minWidth: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
  },
});

/** A single actor card with the hover toolbar and an optional drag grip. */
export function ActorPortraitCard({
  actor,
  onPreview,
  onZoom,
  onEdit,
  dragHandleProps,
  isDragging = false,
  isOverlay = false,
}: {
  /** Actor rendered by the card. */
  actor: CastingActor;
  /** Opens the app-owned preview surface. */
  onPreview: (actor: CastingActor) => void;
  /** Opens the app-owned zoom surface. */
  onZoom: (actor: CastingActor) => void;
  /** Opens the app-owned edit surface. */
  onEdit: (actor: CastingActor) => void;
  /** Handle wiring supplied by a reorderable TileGrid. */
  dragHandleProps?: TileGridDragHandleProps;
  /** Reduces the source tile while its portal overlay is active. */
  isDragging?: boolean;
  /** Marks the portal copy. */
  isOverlay?: boolean;
}): ReactElement {
  const classes = useStyles();

  return (
    <div
      className={mergeClasses(
        classes.card,
        isDragging && !isOverlay && classes.dragging,
        isOverlay && classes.overlay
      )}
      data-casting-actor={actor.id}
    >
      <div className={classes.media}>
        <img
          className={classes.image}
          src={actor.image}
          alt=""
          width={512}
          height={683}
          loading="lazy"
          decoding="async"
        />
      </div>
      <span className={classes.caption}>{actor.name}</span>

      {dragHandleProps ? (
        <Button
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          ref={dragHandleProps.setNodeRef}
          type="button"
          appearance="subtle"
          size="small"
          icon={<ReorderRegular />}
          className={classes.dragHandle}
          aria-label={dragHandleProps.label}
          title="Drag to reorder"
          tabIndex={-1}
          disabled={dragHandleProps.disabled}
          data-actor-drag-handle=""
        />
      ) : null}

      <div className={classes.toolbar} data-casting-toolbar>
        <div className={classes.toolbarRow}>
          <Button
            className={classes.toolbarButton}
            appearance="subtle"
            size="medium"
            icon={<EyeRegular />}
            aria-label={`Preview ${actor.name}`}
            title="Preview"
            onClick={() => onPreview(actor)}
          />
          <Button
            className={classes.toolbarButton}
            appearance="subtle"
            size="medium"
            icon={<ZoomInRegular />}
            aria-label={`Zoom ${actor.name}`}
            title="Zoom"
            onClick={() => onZoom(actor)}
          />
          <Button
            className={classes.toolbarButton}
            appearance="subtle"
            size="medium"
            icon={<EditRegular />}
            aria-label={`Edit ${actor.name}`}
            title="Edit"
            onClick={() => onEdit(actor)}
          />
        </div>
      </div>
    </div>
  );
}
