import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Select,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { TileGrid } from '../TileGrid';
import type { TileGridItemRenderArgs, TileGridLayout } from '../TileGrid.types';
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
  tile: {
    height: '100%',
    boxSizing: 'border-box',
    padding: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalXXXL,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    overflow: 'auto',
  },
  actions: { display: 'flex', flexWrap: 'wrap', gap: tokens.spacingHorizontalXS },
});

/** Real inline actions and an application-owned portal exercise both keyboard boundaries. */
function ActionTile({ item, selected }: TileGridItemRenderArgs<StoryItem>): ReactElement {
  const classes = useStyles();
  const [message, setMessage] = useState('');
  return (
    <div className={classes.tile}>
      <p>
        {item.label}
        {selected ? ' — selected' : ''}
      </p>
      <div className={classes.actions}>
        <Button size="small" onClick={() => setMessage('Opened')}>
          Open
        </Button>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button size="small">More</Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem onClick={() => setMessage('Details opened')}>Details</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
      <span>{message}</span>
    </div>
  );
}

/** Stable renderer avoids invoking unchanged content for focus-only updates. */
function renderActions(args: TileGridItemRenderArgs<StoryItem>): ReactElement {
  return <ActionTile {...args} />;
}

/** Shows spatial movement, range selection, inline traversal, and portalled menu Escape behavior. */
export function KeyboardNavigation(): ReactElement {
  const [layout, setLayout] = useState<TileGridLayout>('fixed');
  return (
    <div>
      <p>
        Tab enters one tile. Arrows move spatially; Shift+Arrow selects a range. Tab enters its
        checkbox and actions. Escape returns to the tile. A menu handles its own first Escape.
      </p>
      <Select
        aria-label="Layout"
        value={layout}
        onChange={(_, data) => {
          if (
            data.value === 'fixed' ||
            data.value === 'masonry' ||
            data.value === 'justified' ||
            data.value === 'mosaic'
          )
            setLayout(data.value);
        }}
      >
        <option value="fixed">Fixed</option>
        <option value="masonry">Masonry</option>
        <option value="justified">Justified</option>
        <option value="mosaic">Mosaic</option>
      </Select>
      <Button>Before grid</Button>
      <StoryFrame>
        <TileGrid
          items={storyItems}
          getItemId={getStoryItemId}
          getItemLabel={getStoryItemLabel}
          getItemAspectRatio={getStoryItemAspectRatio}
          getItemSpan={getStoryItemSpan}
          renderItem={renderActions}
          layout={layout}
          ariaLabel="Keyboard navigation photos"
          selectionMode="multiselect"
        />
      </StoryFrame>
      <Button>After grid</Button>
    </div>
  );
}
