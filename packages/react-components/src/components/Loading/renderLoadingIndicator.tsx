import { Spinner, tokens } from '@fluentui/react-components';
import type { SpinnerProps } from '@fluentui/react-components';
import type { ReactElement } from 'react';

/**
 * Renders the visual loading indicator shared by the filler and the overlay.
 *
 * The wrapper owns `aria-hidden="true"`, so the Fluent spinner's progressbar
 * role and its visible label never reach assistive technology. The caller
 * supplies the single announced copy of the label; this renderer only draws
 * the decorative part. Keeping the wrapper here means neither primitive can
 * forget the attribute or repeat the reasoning.
 *
 * Fluent's spinner label is statically inverted (white) because the spinner is
 * designed for dark or brand-colored surfaces. On a page background or the
 * overlay's light veil that white text is unreadable, so the shared renderer
 * overrides it with the theme's normal foreground color. Both loading
 * primitives therefore show a label that follows light and dark themes.
 *
 * @param props - resolved label, Fluent spinner options and the wrapper class
 * @returns the hidden wrapper with the visible spinner and label
 */
export function renderLoadingIndicator(props: {
  /** Resolved, non-empty label drawn beside the ring. */
  label: string;
  /** Fluent spinner size after defaulting. */
  size: NonNullable<SpinnerProps['size']>;
  /** Fluent spinner appearance after defaulting. */
  appearance: NonNullable<SpinnerProps['appearance']>;
  /** Fluent label placement after defaulting. */
  labelPosition: NonNullable<SpinnerProps['labelPosition']>;
  /** Layout class supplied by the calling primitive. */
  className?: string;
}): ReactElement {
  return (
    <div className={props.className} aria-hidden="true">
      <Spinner
        label={{
          children: props.label,
          style: { color: tokens.colorNeutralForeground1 },
        }}
        size={props.size}
        appearance={props.appearance}
        labelPosition={props.labelPosition}
      />
    </div>
  );
}
