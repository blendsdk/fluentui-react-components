import { makeStyles, tokens } from '@fluentui/react-components';

/** Griffel styles for the TileGrid scroll container and item wrappers. */
export const useTileGridStyles = makeStyles({
  root: {
    position: 'relative',
    overflow: 'auto',
    height: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
    padding: 0,
  },
  spacer: {
    position: 'relative',
    width: '100%',
    pointerEvents: 'none',
  },
  item: {
    position: 'absolute',
    boxSizing: 'border-box',
    minWidth: 0,
    minHeight: 0,
  },
  emptyItem: {
    display: 'flex',
    width: '100%',
    minHeight: '100%',
  },
  control: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    insetInlineStart: tokens.spacingHorizontalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    // Place the selection surface above application content without a portal.
    zIndex: 1,
  },
  content: {
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
  },
  // A clipped one-pixel box is structural accessibility CSS, not theme spacing.
  status: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 'none',
  },
  empty: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '100%',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL}`,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    textAlign: 'center',
  },
});
