import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { TileGrid } from '../TileGrid';
import type { TileGridHandle } from '../TileGrid.types';
import {
  getStoryItemAspectRatio,
  getStoryItemId,
  getStoryItemLabel,
  getStoryItemSpan,
  renderStoryTile,
  StoryFrame,
  storyItems,
} from './TileGridStoryData.story';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBlockEnd: tokens.spacingVerticalM,
  },
  count: {
    color: tokens.colorNeutralForeground2,
    fontVariantNumeric: 'tabular-nums',
  },
});

/**
 * Controlled multiselect: plain click replaces, Ctrl/Cmd toggles, Shift
 * extends from the anchor, and the handle can select all or clear. Use it as
 * the starting point for a photo picker.
 */
export const Selection = (): ReactElement => {
  const classes = useStyles();
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(['story-1', 'story-3'])
  );
  const handle = useRef<TileGridHandle>(null);

  return (
    <div>
      <div className={classes.toolbar}>
        <Button appearance="primary" onClick={() => handle.current?.selectAll()}>
          Select all
        </Button>
        <Button onClick={() => handle.current?.clearSelection()}>Clear</Button>
        <span className={classes.count}>{selectedIds.size} selected</span>
      </div>
      <StoryFrame>
        <TileGrid
          items={storyItems}
          getItemId={getStoryItemId}
          getItemLabel={getStoryItemLabel}
          getItemAspectRatio={getStoryItemAspectRatio}
          getItemSpan={getStoryItemSpan}
          renderItem={renderStoryTile}
          layout="fixed"
          tileSize={160}
          gap={8}
          selectionMode="multiselect"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          ariaLabel="Selectable photo grid"
        />
      </StoryFrame>
    </div>
  );
};
