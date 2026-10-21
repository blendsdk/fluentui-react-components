import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { TileGrid } from '../TileGrid';
import type { TileGridHandle, TileGridItemRenderArgs } from '../TileGrid.types';
import {
  getStoryItemAspectRatio,
  getStoryItemId,
  getStoryItemLabel,
  getStoryItemSpan,
  StoryFrame,
  storyItems,
} from './TileGridStoryData.story';
import type { StoryItem } from './TileGridStoryData.story';

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
  tile: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    outline: '2px solid transparent',
    outlineOffset: '-2px',
  },
  selected: {
    outlineColor: tokens.colorBrandStroke1,
  },
  image: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  label: {
    position: 'absolute',
    insetInlineStart: tokens.spacingHorizontalS,
    insetBlockEnd: tokens.spacingVerticalS,
    maxWidth: `calc(100% - (${tokens.spacingHorizontalS} * 2))`,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    overflow: 'hidden',
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

function SelectionTile({ item, selected }: { item: StoryItem; selected: boolean }): ReactElement {
  const classes = useStyles();

  return (
    <div className={mergeClasses(classes.tile, selected && classes.selected)}>
      <img className={classes.image} src={item.image} alt="" />
      <span className={classes.label}>{item.label}</span>
    </div>
  );
}

function renderSelectionTile({ item, selected }: TileGridItemRenderArgs<StoryItem>): ReactElement {
  return <SelectionTile item={item} selected={selected} />;
}

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
          renderItem={renderSelectionTile}
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
