import { makeStyles, tokens } from '@fluentui/react-components';

/** An inset ring remains visible for tiles touching the clipped scroll-container edge. */
const focusOutline = {
  outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}`,
  outlineOffset: `calc(-1 * ${tokens.strokeWidthThick})`,
};

/** Griffel styles for grid layout, focus, selection controls, and the decorative marquee. */
export const useTileGridStyles = makeStyles({
  root: {
    position: 'relative',
    overflow: 'auto',
    height: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
    padding: 0,
    ':focus-visible': focusOutline,
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
    ':focus-visible': focusOutline,
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
  marquee: {
    position: 'absolute',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorNeutralStencil1Alpha,
    // Draw the translucent rectangle over tile content without intercepting input.
    zIndex: 1,
    '@media (forced-colors: active)': { backgroundColor: 'transparent' },
  },
  // The rectangle may extend beyond content while capture follows an outside
  // pointer. Clip its paint so it cannot enlarge the very scroll range it drives.
  marqueeCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    minHeight: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 1,
  },
  // The insertion line can sit beyond the last tile; clipping its paint keeps
  // the decoration from enlarging the scrollable area.
  dropIndicatorCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    minHeight: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 1,
  },
  dropIndicator: {
    position: 'absolute',
    pointerEvents: 'none',
    backgroundColor: tokens.colorBrandStroke1,
    borderRadius: tokens.borderRadiusSmall,
    zIndex: 2,
    '@media (forced-colors: active)': { backgroundColor: 'Highlight' },
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
