import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * How severe the pending decision is; drives the affirmative action's emphasis.
 *
 * `'confirmation'` (the default) keeps the standard primary emphasis.
 * `'danger'` applies the danger token recipe to the affirmative action only —
 * the dialog surface stays neutral in both variants.
 */
export type ConfirmIntent = 'confirmation' | 'danger';

/**
 * One action of a custom action set.
 *
 * Custom sets replace the default confirm/decline pair and report the chosen
 * `value` through `onResolve`; the action array order is the rendered DOM
 * order, and the first action receives initial focus, so callers put the safe
 * action first.
 */
export interface ConfirmAction<V extends string = string> {
  /** Outcome reported to the host when this action is activated. */
  value: V;
  /**
   * Visible action label; also the accessible name. A blank label (empty or
   * whitespace-only) falls back to `value` — a rendered action can never be
   * unnamed.
   */
  label: string;
  /** Visual emphasis of the button. Default: `'secondary'`. */
  appearance?: 'primary' | 'secondary';
  /** `'danger'` applies the danger token recipe to this action. Default: `'default'`. */
  intent?: 'default' | 'danger';
  /** Decorative glyph rendered inside the button; never part of the accessible name. */
  icon?: ReactNode;
}

/**
 * The visible action labels of the default pair.
 *
 * English defaults apply; callers localize by passing a partial override
 * object. Unlike descriptive text, an empty or whitespace-only override never
 * wins: the label falls back to the default, because a blank button has no
 * accessible name.
 */
export interface ConfirmDialogStrings {
  /** Label of the affirmative action. Default: `"Confirm"`. */
  confirm: string;
  /** Label of the negative action. Default: `"Cancel"`. */
  decline: string;
}

interface ConfirmDialogBaseProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'title'
> {
  /** Whether the dialog is shown; the host owns this state. */
  open: boolean;
  /** The question, rendered as the dialog title; also the accessible name. */
  title: ReactNode;
  /**
   * Optional explanation under the title. A plain string preserves newlines as
   * visible line breaks; content is never parsed as HTML.
   */
  message?: ReactNode;
  /** Partial label overrides, merged key by key over the English defaults. */
  strings?: Partial<ConfirmDialogStrings>;
  /**
   * While true, every action is disabled and cannot resolve anything; focus
   * moves to the dialog surface when the focused action becomes disabled, so
   * keyboard focus never falls to the page body.
   */
  busy?: boolean;
}

interface ConfirmDialogPairProps extends ConfirmDialogBaseProps {
  /** Emphasis of the affirmative action; the default pair only. */
  intent?: ConfirmIntent;
  actions?: undefined;
  /**
   * Called once per activation with the adopted outcome; the dialog stays open
   * until the host reacts (closing it, or setting `busy`). Repeat activations
   * while it stays open report again.
   */
  onResolve: (confirmed: boolean) => void;
}

interface ConfirmDialogActionsProps<V extends string> extends ConfirmDialogBaseProps {
  intent?: undefined;
  /** A non-empty action set replacing the default pair; order is DOM order. */
  actions: readonly [ConfirmAction<V>, ...ConfirmAction<V>[]];
  /** Called once per activation with the chosen action's `value`. */
  onResolve: (value: V) => void;
}

/**
 * Props of the confirmation dialog — a discriminated union over the action
 * model.
 *
 * The pair variant (the default) renders the localized confirm/decline pair
 * and reports a boolean; the actions variant renders a custom non-empty
 * action set and reports the chosen value with its literal type preserved at
 * the call site. One source of truth for emphasis: the dialog-level `intent`
 * belongs to the pair variant exclusively, per-action `intent` to the actions
 * variant.
 *
 * All native `div` props (`className`, `style`, `data-*`, `aria-*`, event
 * handlers, ...) except `children` and `title` pass through to the dialog
 * surface element, where `className`/`style` merge with the component's own
 * (the caller wins) and a forwarded `ref` points at it.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *     open={pending}
 *     title="Delete this record?"
 *     message={'This cannot be undone.\nThe record is removed for everyone.'}
 *     intent="danger"
 *     onResolve={confirmed => {
 *         setPending(false);
 *         if (confirmed) deleteRecord();
 *     }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *     open={pending}
 *     title="Save your changes?"
 *     actions={[
 *         { value: 'cancel', label: 'Cancel' },
 *         { value: 'discard', label: 'Discard', intent: 'danger' },
 *         { value: 'save', label: 'Save', appearance: 'primary' },
 *     ]}
 *     onResolve={outcome => {
 *         setPending(false);
 *         apply(outcome); // 'cancel' | 'discard' | 'save'
 *     }}
 * />
 * ```
 */
export type ConfirmDialogProps<V extends string = string> =
  ConfirmDialogPairProps | ConfirmDialogActionsProps<V>;

export type { ConfirmDialogActionsProps, ConfirmDialogPairProps };
