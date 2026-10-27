import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { EditRegular, EyeRegular, ZoomInRegular } from '@fluentui/react-icons';
import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { TileGrid } from '../TileGrid';
import type { TileGridItemRenderArgs } from '../TileGrid.types';
import { castingActors, getCastingActorId, getCastingActorName } from './ActorData.story';
import type { CastingActor } from './ActorData.story';

/**
 * Exact geometry taken from the legacy actor-overview `ActorTile`:
 * 150px wide, 2px border on every side, 200px image area, 24px caption.
 */
const TILE_WIDTH = 150;
const TILE_HEIGHT = 228;
const IMAGE_HEIGHT = 200;
const CAPTION_HEIGHT = 24;
const TILE_BORDER = 2;
const TILE_GAP = 96;
const COLUMNS = 4;
const OUTER_MARGIN = 48;
const TOOLBAR_OFFSET = 48;
const GRID_WIDTH = COLUMNS * TILE_WIDTH + (COLUMNS - 1) * TILE_GAP;
const ROW_COUNT = Math.ceil(castingActors.length / COLUMNS);
const GRID_HEIGHT = ROW_COUNT * TILE_HEIGHT + (ROW_COUNT - 1) * TILE_GAP;
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
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'visible',
    border: `${TILE_BORDER}px solid transparent`,
    borderRadius: '3px',
    backgroundColor: 'transparent',
    ':hover [data-casting-toolbar]': {
      top: `-${TOOLBAR_OFFSET}px`,
      opacity: 1,
      pointerEvents: 'auto',
    },
    ':focus-within [data-casting-toolbar]': {
      top: `-${TOOLBAR_OFFSET}px`,
      opacity: 1,
      pointerEvents: 'auto',
    },
  },
  media: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '100%',
    height: `${IMAGE_HEIGHT}px`,
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
    height: `${CAPTION_HEIGHT}px`,
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
  dialogSurface: {
    width: 'calc(100vw - 48px)',
    maxWidth: '720px',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
  },
  previewImage: {
    display: 'block',
    width: '100%',
    maxHeight: '52vh',
    objectFit: 'contain',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  zoomImage: {
    display: 'block',
    width: '100%',
    maxHeight: '70vh',
    objectFit: 'contain',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  editField: {
    width: '100%',
  },
});

/** A single actor tile with the legacy hover toolbar. */
function ActorPortraitCard({
  actor,
  onPreview,
  onZoom,
  onEdit,
}: {
  actor: CastingActor;
  onPreview: (actor: CastingActor) => void;
  onZoom: (actor: CastingActor) => void;
  onEdit: (actor: CastingActor) => void;
}): ReactElement {
  const classes = useStyles();

  return (
    <div className={classes.card} data-casting-actor={actor.id}>
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
  const [items, setItems] = useState<readonly CastingActor[]>(castingActors);
  const [previewItem, setPreviewItem] = useState<CastingActor | null>(null);
  const [zoomItem, setZoomItem] = useState<CastingActor | null>(null);
  const [editItem, setEditItem] = useState<CastingActor | null>(null);
  const [draftName, setDraftName] = useState('');

  const openPreview = useCallback((actor: CastingActor) => {
    setPreviewItem(actor);
  }, []);

  const openZoom = useCallback((actor: CastingActor) => {
    setZoomItem(actor);
  }, []);

  const openEdit = useCallback((actor: CastingActor) => {
    setEditItem(actor);
    setDraftName(actor.name);
  }, []);

  const saveEdit = useCallback(() => {
    const name = draftName.trim();
    if (!editItem || name.length === 0) return;
    setItems(current =>
      current.map(actor => (actor.id === editItem.id ? { ...actor, name } : actor))
    );
    setEditItem(null);
  }, [draftName, editItem]);

  const renderActorTile = useCallback(
    ({ item }: TileGridItemRenderArgs<CastingActor>) => (
      <ActorPortraitCard actor={item} onPreview={openPreview} onZoom={openZoom} onEdit={openEdit} />
    ),
    [openEdit, openPreview, openZoom]
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
            tileSize={TILE_WIDTH}
            tileAspectRatio={TILE_WIDTH / TILE_HEIGHT}
            gap={TILE_GAP}
            selectionMode="none"
            ariaLabel="Actor overview"
            onItemActivate={openPreview}
            style={gridStyle}
          />
        </div>
      </div>

      <Dialog
        open={previewItem !== null}
        onOpenChange={(_, data) => {
          if (!data.open) setPreviewItem(null);
        }}
      >
        <DialogSurface className={classes.dialogSurface}>
          <DialogBody>
            <DialogTitle>{previewItem?.name ?? 'Actor preview'}</DialogTitle>
            <DialogContent>
              <div className={classes.dialogContent}>
                {previewItem ? (
                  <img
                    className={classes.previewImage}
                    src={previewItem.image}
                    alt={`Synthetic portrait of ${previewItem.name}`}
                  />
                ) : null}
                <Text size={200}>Synthetic portrait used as an actor-grid reference fixture.</Text>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setPreviewItem(null)}>
                Close
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={zoomItem !== null}
        onOpenChange={(_, data) => {
          if (!data.open) setZoomItem(null);
        }}
      >
        <DialogSurface className={classes.dialogSurface}>
          <DialogBody>
            <DialogTitle>{zoomItem ? `Zoom — ${zoomItem.name}` : 'Zoom'}</DialogTitle>
            <DialogContent>
              <div className={classes.dialogContent}>
                {zoomItem ? (
                  <img
                    className={classes.zoomImage}
                    src={zoomItem.image}
                    alt={`Synthetic portrait of ${zoomItem.name}`}
                  />
                ) : null}
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setZoomItem(null)}>
                Close
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog
        open={editItem !== null}
        onOpenChange={(_, data) => {
          if (!data.open) setEditItem(null);
        }}
      >
        <DialogSurface className={classes.dialogSurface}>
          <DialogBody>
            <DialogTitle>Edit actor</DialogTitle>
            <DialogContent>
              <Field label="Actor name" className={classes.editField}>
                <Input
                  value={draftName}
                  onChange={(_, data) => setDraftName(data.value)}
                  maxLength={80}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                disabled={draftName.trim().length === 0}
                onClick={saveEdit}
              >
                Save
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
