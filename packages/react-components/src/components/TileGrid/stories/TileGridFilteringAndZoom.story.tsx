import { Button, Input, Slider, makeStyles, tokens } from '@fluentui/react-components';
import { useId, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { TileGrid } from '../TileGrid';
import type { TileGridHandle } from '../TileGrid.types';
import {
  getStoryItemId,
  getStoryItemLabel,
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
    marginBottom: tokens.spacingVerticalM,
  },
});

/** Shows application-owned filtering, paging, and size while the grid retains selected IDs. */
export function FilteringAndZoom(): ReactElement {
  const classes = useStyles();
  const inputId = useId();
  const ref = useRef<TileGridHandle>(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(12);
  const [size, setSize] = useState(160);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(['story-2']));
  const visible = useMemo(
    () =>
      storyItems
        .slice(0, limit)
        .filter(item => item.label.toLowerCase().includes(query.toLowerCase())),
    [limit, query]
  );
  return (
    <div>
      <p>
        Search resets the viewport without clearing selection or stealing input focus. Appending
        uses the same reset key. Use +/− on a tile or the slider; the story applies requested size.
      </p>
      <div className={classes.toolbar}>
        <label htmlFor={inputId}>Filter photos</label>
        <Input id={inputId} value={query} onChange={(_, data) => setQuery(data.value)} />
        <Button disabled={limit === storyItems.length} onClick={() => setLimit(storyItems.length)}>
          Load more
        </Button>
        <Button onClick={() => ref.current?.scrollToSelected()}>Scroll to selected</Button>
        <Button onClick={() => ref.current?.clearSelection()}>Clear</Button>
        <Slider
          aria-label="Preferred tile size"
          min={120}
          max={320}
          step={20}
          value={size}
          onChange={(_, data) => setSize(data.value)}
        />
        <span>
          {size}px; {selected.size} selected, including filtered photos
        </span>
      </div>
      <StoryFrame>
        <TileGrid
          ref={ref}
          items={visible}
          getItemId={getStoryItemId}
          getItemLabel={getStoryItemLabel}
          renderItem={renderStoryTile}
          ariaLabel="Filtered photos"
          selectionMode="multiselect"
          selectedIds={selected}
          onSelectionChange={setSelected}
          scrollResetKey={query}
          tileSize={size}
          zoomable
          onTileSizeChange={setSize}
          enableMarquee
        />
      </StoryFrame>
    </div>
  );
}
