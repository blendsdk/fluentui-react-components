import { useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import type { ConfirmDialogProps, ConfirmDialogStrings } from './ConfirmDialog.types';
import type { ConfirmDialogClasses } from './useConfirmDialogStyles.styles';
import { useConfirmDialogStyles } from './useConfirmDialogStyles.styles';

/** English defaults for the visible action labels. */
export const confirmDialogDefaultStrings: ConfirmDialogStrings = {
  confirm: 'Confirm',
  decline: 'Cancel',
};

/** Whether a caller-supplied label is blank: empty or only whitespace. */
function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Resolves the visible labels over the English defaults.
 *
 * A blank override never wins, whichever variant it belongs to: a blank
 * button label would leave the control without an accessible name, so the
 * default applies instead.
 */
function resolveStrings(overrides?: Partial<ConfirmDialogStrings>): ConfirmDialogStrings {
  const resolved = { ...confirmDialogDefaultStrings };
  if (overrides?.confirm !== undefined && !isBlank(overrides.confirm)) {
    resolved.confirm = overrides.confirm;
  }
  if (overrides?.decline !== undefined && !isBlank(overrides.decline)) {
    resolved.decline = overrides.decline;
  }
  return resolved;
}

/**
 * One rendered action, fully resolved.
 */
export type ConfirmDialogActionDescriptor = {
  /** Stable React key: `pair-confirm`/`pair-decline`, or `action-<index>`. */
  key: string;
  /** Outcome reported on activation: a boolean for the pair, the value for custom sets. */
  outcome: boolean | string;
  /** Resolved visible label (fallbacks applied). */
  label: string;
  /** Resolved Button appearance. */
  appearance: 'primary' | 'secondary';
  /** Whether the danger recipe applies to this action button. */
  danger: boolean;
  /** Decorative glyph rendered inside the button. */
  icon?: ReactNode;
};

/**
 * The activation bridge from the render function back to the caller.
 *
 * Method syntax is deliberate: it relates both caller callback shapes —
 * `(confirmed: boolean) => void` for the default pair and `(value: V) => void`
 * for custom action sets — to the union parameter without a cast, including
 * the runtime-empty-actions fallback where an untyped consumer's
 * actions-typed callback receives a boolean.
 */
type ConfirmOutcomeReporter = {
  report(outcome: boolean | string): void;
};

/**
 * State that {@link renderConfirmDialog} renders.
 */
export type ConfirmDialogState = {
  /** Whether the dialog is shown. */
  open: boolean;
  /** The question, rendered as the dialog title. */
  title: ReactNode;
  /** The optional explanation. */
  message: ReactNode | undefined;
  /** Id of the message element, tying it to the surface's description. */
  messageId: string;
  /** `aria-describedby` for the surface: caller value wins, else the message id, else absent. */
  describedBy: string | undefined;
  /** Resolved labels (defaults with non-blank overrides applied). */
  strings: ConfirmDialogStrings;
  /** The rendered actions, in DOM order. */
  actions: readonly ConfirmDialogActionDescriptor[];
  /** Whether every action is disabled. */
  busy: boolean;
  /** Reports one activation through the caller's `onResolve`. */
  onAction: (outcome: boolean | string) => void;
  /** Remaining native props for the dialog surface element. */
  surfaceProps: ComponentPropsWithoutRef<'div'>;
  /** Ref to the dialog surface element, merged with the forwarded ref. */
  surfaceRef: Ref<HTMLDivElement>;
  /** Resolved style classes. */
  classes: ConfirmDialogClasses;
};

/**
 * Resolves the dialog props into render state: the action descriptors, the
 * labels, the accessibility wiring and the two focus effects.
 *
 * A runtime-empty action array (possible only through untyped consumers)
 * falls back to the default pair and reports pair outcomes, so an alert
 * dialog is never rendered without an exit. Label resolution guarantees every
 * rendered action has a visible name.
 *
 * Focus policy: the dialog is trigger-less, and Fluent's built-in restore
 * needs a trigger, so the hook captures the focused element on the open
 * transition (a layout effect, which runs before Fluent moves focus into the
 * dialog) and re-focuses it on close when it is still connected. While `busy`
 * disables the focused action, a rescue effect moves focus to the dialog
 * surface — it recognizes both the environment where the focused button
 * keeps focus and the one where the browser has already moved focus to the
 * document body.
 *
 * @param props - props from this instance of the dialog
 * @param ref - ref to the dialog surface element
 * @returns the state consumed by {@link renderConfirmDialog}
 */
export function useConfirmDialog<V extends string>(
  props: ConfirmDialogProps<V>,
  ref: Ref<HTMLDivElement>
): ConfirmDialogState {
  const { open, title, message, strings, busy, intent, actions, onResolve, ...nativeProps } = props;

  const classes = useConfirmDialogStyles();
  const messageId = useId();

  // One bridge serves both callback shapes; the method signature keeps the
  // assignment cast-free, and the runtime-empty-actions fallback reports its
  // boolean through the same bridge.
  const reporter: ConfirmOutcomeReporter = { report: onResolve };

  const resolvedStrings = resolveStrings(strings);
  const descriptors: ConfirmDialogActionDescriptor[] =
    actions !== undefined && actions.length > 0
      ? actions.map((action, index) => ({
          key: `action-${index}`,
          outcome: action.value,
          label: isBlank(action.label) ? action.value : action.label,
          appearance: action.appearance ?? 'secondary',
          danger: action.intent === 'danger',
          icon: action.icon,
        }))
      : [
          {
            key: 'pair-decline',
            outcome: false,
            label: resolvedStrings.decline,
            appearance: 'secondary',
            danger: false,
          },
          {
            key: 'pair-confirm',
            outcome: true,
            label: resolvedStrings.confirm,
            appearance: 'primary',
            danger: intent === 'danger',
          },
        ];

  const surfaceElementRef = useRef<HTMLDivElement | null>(null);

  // The forwarded ref and the hook's internal ref travel together: the busy
  // rescue needs the surface element, and the application's ref must keep
  // pointing at it. Both inputs are stable, so the callback identity is too.
  const setSurfaceRef = useCallback(
    (element: HTMLDivElement | null) => {
      surfaceElementRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref !== null) {
        ref.current = element;
      }
    },
    [ref]
  );

  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useLayoutEffect(() => {
    // A layout effect runs before Fluent's own (passive) focus move, so the
    // capture sees the element that was focused before the dialog opened —
    // including a dialog that mounts already open.
    if (open && !wasOpenRef.current) {
      const active = document.activeElement;
      previouslyFocusedRef.current = active instanceof HTMLElement ? active : null;
    } else if (!open && wasOpenRef.current) {
      const previous = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (previous !== null && previous.isConnected) {
        previous.focus();
      }
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!busy) {
      return;
    }
    const surface = surfaceElementRef.current;
    if (surface === null) {
      return;
    }
    const active = document.activeElement;
    // Two environments, one invariant: jsdom (and some browsers) keep focus on
    // the button that just turned disabled, others move it to the document
    // body. Either way the focus must land on the dialog surface, not the
    // page. The effect only runs on `busy` transitions, so unrelated
    // re-renders never move focus.
    if ((active instanceof HTMLElement && surface.contains(active)) || active === document.body) {
      surface.focus();
    }
  }, [busy]);

  const callerDescribedBy = nativeProps['aria-describedby'];
  const describedBy = callerDescribedBy ?? (message != null ? messageId : undefined);

  return {
    open,
    title,
    message,
    messageId,
    describedBy,
    strings: resolvedStrings,
    actions: descriptors,
    busy: busy ?? false,
    onAction: reporter.report,
    surfaceProps: nativeProps,
    surfaceRef: setSurfaceRef,
    classes,
  };
}
