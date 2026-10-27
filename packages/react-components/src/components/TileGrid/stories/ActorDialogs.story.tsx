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
import { useCallback, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { CastingActor } from './ActorData.story';

const useStyles = makeStyles({
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

/** Application-owned actor state and dialog surfaces shared by actor stories. */
export interface ActorStoryState {
  /** Current actor order and names. */
  items: readonly CastingActor[];
  /** Updates the actor order or edited names. */
  setItems: Dispatch<SetStateAction<readonly CastingActor[]>>;
  /** Opens the preview dialog. */
  onPreview: (actor: CastingActor) => void;
  /** Opens the zoom dialog. */
  onZoom: (actor: CastingActor) => void;
  /** Opens the edit dialog. */
  onEdit: (actor: CastingActor) => void;
  /** Preview, zoom, and edit dialogs. */
  dialogs: ReactNode;
}

/**
 * Owns the actor list and the three app-owned dialog surfaces.
 *
 * Reorder callbacks can update `items` through `setItems`; the dialogs never
 * move into the TileGrid package.
 */
export function useActorStoryState(initialItems: readonly CastingActor[]): ActorStoryState {
  const classes = useStyles();
  const [items, setItems] = useState<readonly CastingActor[]>(initialItems);
  const [previewItem, setPreviewItem] = useState<CastingActor | null>(null);
  const [zoomItem, setZoomItem] = useState<CastingActor | null>(null);
  const [editItem, setEditItem] = useState<CastingActor | null>(null);
  const [draftName, setDraftName] = useState('');

  const onPreview = useCallback((actor: CastingActor) => {
    setPreviewItem(actor);
  }, []);

  const onZoom = useCallback((actor: CastingActor) => {
    setZoomItem(actor);
  }, []);

  const onEdit = useCallback((actor: CastingActor) => {
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

  const dialogs = (
    <>
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

  return { items, setItems, onPreview, onZoom, onEdit, dialogs };
}
