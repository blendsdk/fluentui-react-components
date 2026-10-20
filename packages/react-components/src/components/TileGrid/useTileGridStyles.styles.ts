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
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXXL}`,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    textAlign: 'center',
  },
});
