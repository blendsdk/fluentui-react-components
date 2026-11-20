import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Styles of an application bar command.
 *
 * The rules are qualified with `[data-app-bar-button]` so they outrank
 * Fluent's `.fui-Button` rules; the package's stylesheet is inserted before
 * Fluent's, so equal-specificity rules would lose.
 *
 * The 48px target, square corners and 12px inline padding are the Microsoft 365
 * bar command geometry. The 1.4286 line-height is the unitless equivalent of
 * the 20px `lineHeightBase300` at 14px, so the text scales at 200% text-only
 * zoom. The white overlays are the only color literals: no Fluent token
 * represents a translucent white overlay on a brand surface.
 *
 * `border: 'none'` is deliberate: Griffel's unsupported property list includes
 * `borderWidth` and `borderColor`, so the supported `border` shorthand is what
 * removes Fluent's resting and focus border.
 */
const useStyles = makeStyles({
  root: {
    '&[data-app-bar-button]': {
      minWidth: '48px',
      minHeight: '48px',
      padding: `0 ${tokens.spacingHorizontalM}`,
      border: 'none',
      borderRadius: 0,
      backgroundColor: 'transparent',
      color: tokens.colorNeutralForegroundOnBrand,
      fontSize: tokens.fontSizeBase300,
      lineHeight: 1.4286,
      fontWeight: tokens.fontWeightRegular,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    },
    '&[data-app-bar-button] svg': {
      color: tokens.colorNeutralForegroundOnBrand,
    },
    '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      color: tokens.colorNeutralForegroundOnBrand,
    },
    '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover:active, &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):active:focus-visible':
      {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        color: tokens.colorNeutralForegroundOnBrand,
      },
    '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"])[aria-expanded="true"]': {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      color: tokens.colorNeutralForegroundOnBrand,
    },
    '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover[aria-expanded="true"]':
      {
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        color: tokens.colorNeutralForegroundOnBrand,
      },
    '&[data-app-bar-button][data-fui-focus-visible]': {
      border: 'none',
      borderRadius: 0,
      boxShadow: `0 0 0 ${tokens.strokeWidthThick} ${tokens.colorNeutralForegroundOnBrand} inset`,
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorTransparentStroke}`,
    },
    '&[data-app-bar-button]:disabled, &[data-app-bar-button][aria-disabled="true"]': {
      color: tokens.colorNeutralForegroundDisabled,
      backgroundColor: 'transparent',
    },
    '&[data-app-bar-button]:disabled svg, &[data-app-bar-button][aria-disabled="true"] svg': {
      color: tokens.colorNeutralForegroundDisabled,
    },
    // Forced colors removes the brand fill. The command keeps system text at
    // rest, uses the system highlight pair for hover/pressed/open and a system
    // focus outline; without these, white on Canvas disappears.
    '@media (forced-colors: active)': {
      '&[data-app-bar-button]': {
        color: 'ButtonText',
      },
      '&[data-app-bar-button] svg': {
        color: 'ButtonText',
      },
      '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover, &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover:active, &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):active:focus-visible, &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"])[aria-expanded="true"], &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover[aria-expanded="true"]':
        {
          backgroundColor: 'Highlight',
          color: 'HighlightText',
          forcedColorAdjust: 'none',
        },
      '&[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover svg, &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover:active svg, &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):active:focus-visible svg, &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"])[aria-expanded="true"] svg, &[data-app-bar-button]:not(:disabled):not([aria-disabled="true"]):hover[aria-expanded="true"] svg':
        {
          color: 'HighlightText',
        },
      '&[data-app-bar-button][data-fui-focus-visible]': {
        border: 'none',
        borderRadius: 0,
        boxShadow: 'none',
        outline: '2px solid ButtonText',
        outlineOffset: '-2px',
      },
      '&[data-app-bar-button][data-fui-focus-visible]:not(:disabled):not([aria-disabled="true"]):hover, &[data-app-bar-button][data-fui-focus-visible]:not(:disabled):not([aria-disabled="true"]):active, &[data-app-bar-button][data-fui-focus-visible]:not(:disabled):not([aria-disabled="true"])[aria-expanded="true"]':
        {
          outlineColor: 'HighlightText',
        },
      '&[data-app-bar-button]:disabled, &[data-app-bar-button][aria-disabled="true"]': {
        color: 'GrayText',
        backgroundColor: 'Canvas',
      },
      '&[data-app-bar-button]:disabled svg, &[data-app-bar-button][aria-disabled="true"] svg': {
        color: 'GrayText',
      },
    },
  },
});

/**
 * Classes the command hands to {@link renderAppBarButton}.
 */
export type AppBarButtonClasses = {
  /** Root class. */
  root: string;
};

/**
 * Resolves the command style classes.
 *
 * @returns the class names consumed by the command's render function
 */
export function useAppBarButtonStyles(): AppBarButtonClasses {
  const styles = useStyles();

  return { root: styles.root };
}
