import type { ButtonProps } from '@fluentui/react-components';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Internal button-only base for the command props.
 *
 * The public type intersects this base with the accessible-name union. The
 * base is exported from this module so the state hook can type the remaining
 * props; it is not exported from the folder barrel or the package root.
 */
export type AppBarButtonBase = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'dangerouslySetInnerHTML' | 'type'
> & {
  /** Icon rendered through Fluent's Button icon slot. */
  icon?: ButtonProps['icon'];

  /** Position of the icon relative to the label. */
  iconPosition?: ButtonProps['iconPosition'];

  /** Renders disabled but keeps the command focusable. */
  disabledFocusable?: boolean;

  /** Defaults to `button` so a bar command never submits a form. */
  type?: 'button' | 'submit' | 'reset';

  /** The command always uses Fluent's transparent appearance. */
  appearance?: never;

  /** The command always uses Fluent's square shape. */
  shape?: never;

  /** The command always uses Fluent's medium size. */
  size?: never;

  /** Link commands are not part of the API. */
  as?: never;

  /** Link commands are not part of the API. */
  href?: never;

  /** Visible command label; omit only when `aria-label` names the command. */
  children?: ReactNode;
};

/**
 * Props of an application bar command.
 *
 * The command is button-only: bar commands are actions, and `AppBarTitle`
 * owns navigation. `appearance`, `shape` and `size` are fixed by the component
 * and are not part of the API. The accessible-name union requires a non-empty
 * `aria-label` for an icon-only command; TypeScript cannot reject an empty
 * string, so the documentation states that visible text and `aria-label` must
 * be non-empty.
 *
 * The M365 12% hover and 22% pressed/open overlays keep the white label at
 * 4.29:1 and 3.58:1; icon-only commands meet the 3:1 non-text threshold. Text
 * commands carry the documented contrast exception.
 *
 * @example
 * ```tsx
 * <AppBarButton aria-label="Settings" icon={<Settings20Regular />} />
 * <AppBarButton>Settings</AppBarButton>
 * ```
 */
export type AppBarButtonProps = AppBarButtonBase &
  ({ 'aria-label': string } | { children: NonNullable<ReactNode> });
