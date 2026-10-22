import { Button, makeStyles, tokens } from '@fluentui/react-components';
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { TileGrid } from '../TileGrid';
import type { TileGridHandle, TileGridItemRenderArgs } from '../TileGrid.types';
import {
  getStoryItemId,
  getStoryItemLabel,
  renderStoryTile,
  StoryFrame,
  storyItems,
} from './TileGridStoryData.story';
import type { StoryItem } from './TileGridStoryData.story';

const isDisabled = (item: StoryItem) => item.id === 'story-3';
const isSelectable = (item: StoryItem) => item.id !== 'story-4';
const useStyles = makeStyles({
  tile: { height: '100%', position: 'relative' },
  reason: {
    position: 'absolute',
    insetInlineEnd: tokens.spacingHorizontalS,
    top: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

/** Retained disabled selections remain readable and expose an explanation in their description. */
function EligibilityTile(args: TileGridItemRenderArgs<StoryItem>): ReactElement {
  const classes = useStyles();
  return (
    <div className={classes.tile}>
      {renderStoryTile(args)}
      {!args.selectable && (
        <span className={classes.reason}>{args.disabled ? 'Unavailable' : 'Not selectable'}</span>
      )}
    </div>
  );
}

/** Stable application rendering and predicates avoid cancelling an active gesture on rerender. */
function renderEligibleTile(args: TileGridItemRenderArgs<StoryItem>): ReactElement {
  return <EligibilityTile {...args} />;
}

/** Demonstrates committed membership versus temporary drag preview, including hidden IDs. */
export function MarqueeSelection(): ReactElement {
  const ref = useRef<TileGridHandle>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    new Set(['story-3', 'hidden-photo'])
  );
  const [commits, setCommits] = useState(0);
  return (
    <div>
      <p>
        Drag from a gap. Hold Shift, Ctrl, or Command to add. Escape cancels without a callback.
        Touch scrolling stays native. Photo 3 is disabled; Photo 4 cannot be selected.
      </p>
      <Button onClick={() => ref.current?.selectAll()}>Select eligible</Button>
      <Button onClick={() => ref.current?.clearSelection()}>Clear including hidden</Button>
      <p>
        Committed: {selected.size}; callbacks: {commits}; hidden photo:{' '}
        {selected.has('hidden-photo') ? 'selected' : 'clear'}.
      </p>
      <StoryFrame>
        <TileGrid
          ref={ref}
          items={storyItems}
          getItemId={getStoryItemId}
          getItemLabel={getStoryItemLabel}
          renderItem={renderEligibleTile}
          gap={16}
          ariaLabel="Marquee photos"
          selectionMode="multiselect"
          enableMarquee
          isDisabled={isDisabled}
          isSelectable={isSelectable}
          selectedIds={selected}
          onSelectionChange={next => {
            setSelected(next);
            setCommits(count => count + 1);
          }}
        />
      </StoryFrame>
    </div>
  );
}
