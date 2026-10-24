import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Griffel styles for the tile shell.
 *
 * The root fills the positioned grid wrapper. Media uses a fixed aspect box,
 * content takes the remaining height, and the action layer, selection badge,
 * and drag handle sit above the media without changing the tile's layout.
 */
export const useTileGridItemStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    boxSizing: 'border-box',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    borderRadius: tokens.borderRadiusMedium,
    // The inline action row is visually quiet until the tile is hovered or
    // contains focus. It stays in the accessibility tree so keyboard users can
    // reach it; becoming visible on focus-within prevents an invisible stop.
    ':hover [data-tile-grid-inline-actions]': {
      opacity: 1,
      pointerEvents: 'auto',
    },
    ':focus-within [data-tile-grid-inline-actions]': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  },
  dragging: {
    opacity: 0.5,
  },
  overlay: {
    pointerEvents: 'none',
    boxShadow: tokens.shadow16,
  },
  media: {
    position: 'relative',
    width: '100%',
    // The media yields height before the readable content does. A square tile
    // with square media would otherwise leave zero height for the title.
    flexShrink: 1,
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  mediaCover: {
    '& img, & video': {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  },
  mediaContain: {
    '& img, & video': {
      display: 'block',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: tokens.spacingVerticalXS,
    flexShrink: 0,
    minWidth: 0,
    minHeight: 0,
    padding: tokens.spacingHorizontalS,
    overflow: 'hidden',
  },
  title: {
    minWidth: 0,
    overflow: 'hidden',
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  description: {
    minWidth: 0,
    overflow: 'hidden',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    minWidth: 0,
  },
  actions: {
    position: 'absolute',
    top: tokens.spacingVerticalXS,
    right: tokens.spacingHorizontalXS,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    zIndex: 3,
  },
  inlineActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    opacity: 0,
    pointerEvents: 'none',
    transitionProperty: 'opacity',
    transitionDuration: tokens.durationFaster,
    '@media (hover: none)': {
      display: 'none',
    },
  },
  action: {
    minWidth: 0,
  },
  menuTrigger: {
    minWidth: 0,
  },
  danger: {
    color: tokens.colorPaletteRedForeground1,
  },
  handleSlot: {
    position: 'absolute',
    left: tokens.spacingHorizontalXS,
    bottom: tokens.spacingVerticalXS,
    display: 'flex',
    zIndex: 4,
  },
  handleButton: {
    minWidth: 0,
  },
  selection: {
    position: 'absolute',
    right: tokens.spacingHorizontalXS,
    bottom: tokens.spacingVerticalXS,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForeground1,
    boxShadow: tokens.shadow4,
    zIndex: 2,
  },
  selectionIcon: {
    width: '20px',
    height: '20px',
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalS,
    pointerEvents: 'none',
    zIndex: 1,
    '@media (forced-colors: active)': {
      border: `${tokens.strokeWidthThin} solid Highlight`,
    },
    '& button, & a, & input, & select, & textarea, & [role="button"], & [role="menuitem"]': {
      pointerEvents: 'auto',
    },
  },
});

/** Class names for the tile shell regions. */
export type TileGridItemClasses = ReturnType<typeof useTileGridItemStyles>;
