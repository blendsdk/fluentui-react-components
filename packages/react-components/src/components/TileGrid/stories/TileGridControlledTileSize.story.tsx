import { Button, Slider, Text, makeStyles, tokens } from '@fluentui/react-components';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { StoryFrame, StoryGrid } from './TileGridStoryData.story';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBlockEnd: tokens.spacingVerticalM,
  },
  slider: {
    width: '240px',
  },
  value: {
    minWidth: '4ch',
    fontVariantNumeric: 'tabular-nums',
  },
});

/**
 * A controlled tile size: the story owns the value and the grid clamps it to
 * the documented bounds. Use it when the application provides its own size
 * control or persists a preferred size.
 */
export const ControlledTileSize = (): ReactElement => {
  const classes = useStyles();
  const [tileSize, setTileSize] = useState(160);

  return (
    <div>
      <div className={classes.toolbar}>
        <Text weight="semibold">Tile size</Text>
        <Slider
          className={classes.slider}
          min={120}
          max={320}
          step={20}
          value={tileSize}
          onChange={(_, data) => setTileSize(data.value)}
          aria-label="Tile size"
        />
        <Text className={classes.value}>{tileSize}px</Text>
        <Button appearance="subtle" onClick={() => setTileSize(160)}>
          Reset
        </Button>
      </div>
      <StoryFrame>
        <StoryGrid layout="fixed" tileSize={tileSize} minTileSize={120} maxTileSize={320} />
      </StoryFrame>
    </div>
  );
};
