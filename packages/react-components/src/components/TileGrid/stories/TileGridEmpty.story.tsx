import { Image20Regular } from '@fluentui/react-icons';
import { makeStyles, tokens } from '@fluentui/react-components';
import type { ReactElement } from 'react';
import { StoryFrame, StoryGrid } from './TileGridStoryData.story';

const useEmptyStyles = makeStyles({
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalS,
    minHeight: '100%',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground2,
    textAlign: 'center',
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  hint: {
    maxWidth: '36ch',
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
});

/** A richer empty state with artwork, a title and a short hint. */
function EmptyArtwork(): ReactElement {
  const classes = useEmptyStyles();

  return (
    <div className={classes.empty}>
      <Image20Regular aria-hidden="true" />
      <span className={classes.title}>No photos yet</span>
      <span className={classes.hint}>Photos you add to this view will appear here as a grid.</span>
    </div>
  );
}

/**
 * The default empty state: a named list with the built-in "No items" message.
 * Use it when no custom copy or artwork is needed.
 */
export const DefaultEmpty = (): ReactElement => (
  <StoryFrame>
    <StoryGrid layout="fixed" items={[]} ariaLabel="Empty photo grid" />
  </StoryFrame>
);

/**
 * A localized empty message through `strings.emptyMessage`. Use it when the
 * surrounding application owns localized copy.
 */
export const CustomMessage = (): ReactElement => (
  <StoryFrame>
    <StoryGrid
      layout="fixed"
      items={[]}
      ariaLabel="Empty photo grid"
      strings={{ emptyMessage: 'No photos match this view.' }}
    />
  </StoryFrame>
);

/**
 * A completely custom empty state through `renderEmpty`. Use it when the
 * empty view needs artwork, a title and a short explanation.
 */
export const CustomEmpty = (): ReactElement => (
  <StoryFrame>
    <StoryGrid
      layout="fixed"
      items={[]}
      ariaLabel="Empty photo grid"
      renderEmpty={() => <EmptyArtwork />}
    />
  </StoryFrame>
);
