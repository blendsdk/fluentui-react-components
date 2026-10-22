import { Button, Select } from '@fluentui/react-components';
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { TileGrid } from '../TileGrid';
import type {
  TileGridHandle,
  TileGridInteractionMode,
  TileGridSelectionMode,
} from '../TileGrid.types';
import {
  getStoryItemId,
  getStoryItemLabel,
  renderStoryTile,
  StoryFrame,
  storyItems,
} from './TileGridStoryData.story';

/** Contrasts plain-click activation with selection; changing selection mode deliberately remounts. */
export function InteractionModes(): ReactElement {
  const ref = useRef<TileGridHandle>(null);
  const [mode, setMode] = useState<TileGridSelectionMode>('multiselect');
  const [interaction, setInteraction] = useState<TileGridInteractionMode>('select');
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [activated, setActivated] = useState('None');
  return (
    <div>
      <p>
        Select: click selects, double-click activates. Browse: click activates; modifiers select.
        Owned controls always select. Selection mode is fixed per mount.
      </p>
      <Select
        aria-label="Selection mode"
        value={mode}
        onChange={(_, data) => {
          if (data.value === 'none' || data.value === 'single' || data.value === 'multiselect') {
            setMode(data.value);
            setSelected(new Set());
          }
        }}
      >
        <option value="none">None</option>
        <option value="single">Single</option>
        <option value="multiselect">Multiple</option>
      </Select>
      <Select
        aria-label="Interaction mode"
        value={interaction}
        disabled={mode === 'none'}
        onChange={(_, data) => {
          if (data.value === 'browse' || data.value === 'select') setInteraction(data.value);
        }}
      >
        <option value="select">Select</option>
        <option value="browse">Browse</option>
      </Select>
      <Button onClick={() => ref.current?.clearSelection()}>Clear</Button>
      <p>
        {selected.size} selected. Last activation: {activated}
      </p>
      <StoryFrame>
        <TileGrid
          key={mode}
          ref={ref}
          items={storyItems}
          getItemId={getStoryItemId}
          getItemLabel={getStoryItemLabel}
          renderItem={renderStoryTile}
          ariaLabel="Interaction mode photos"
          selectionMode={mode}
          interactionMode={mode === 'none' ? undefined : interaction}
          selectedIds={selected}
          onSelectionChange={setSelected}
          onItemActivate={item => setActivated(item.label)}
        />
      </StoryFrame>
    </div>
  );
}
