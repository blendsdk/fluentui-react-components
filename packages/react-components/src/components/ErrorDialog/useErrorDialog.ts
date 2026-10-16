import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, Ref } from 'react';
import type { ErrorDialogKind, ErrorDialogProps, ErrorDialogStrings } from './ErrorDialog.types';
import { serializeError } from './serializeError';
import type { ErrorDialogClasses } from './useErrorDialogStyles.styles';
import { useErrorDialogStyles } from './useErrorDialogStyles.styles';

/** How long the copy control keeps its confirmation label, in milliseconds. */
const COPY_FEEDBACK_DURATION_MS = 2000;

/** English defaults for every key; resolved per key with the caller's overrides. */
export const errorDialogDefaultStrings: ErrorDialogStrings = {
  title: 'Application error',
  subText:
    'An unknown error has occurred in this application. Please notify the system administrators for further assistance.',
  close: 'Close',
  reload: 'Reload page',
  signOut: 'Sign out',
  detailsLabel: 'Error details',
  copy: 'Copy details',
  copied: 'Copied',
  noDetails: 'No error details are available.',
};

/**
 * Merges string overrides over the English defaults, key by key.
 *
 * An override whose value is `undefined` keeps the default, and an override
 * present as an empty string is honored verbatim — it suppresses that text.
 */
function resolveStrings(overrides?: Partial<ErrorDialogStrings>): ErrorDialogStrings {
  const resolved = { ...errorDialogDefaultStrings };
  if (overrides !== undefined) {
    for (const key of Object.keys(overrides) as Array<keyof ErrorDialogStrings>) {
      const value = overrides[key];
      if (value !== undefined) {
        resolved[key] = value;
      }
    }
  }
  return resolved;
}

/** The props union flattened into the fields the state machine works with. */
type NormalizedProps = {
  open: boolean;
  error: unknown;
  detailsText: string | undefined;
  strings: Partial<ErrorDialogStrings> | undefined;
  kind: ErrorDialogKind;
  onDismiss: (() => void) | undefined;
  onReload: (() => void) | undefined;
  onSignOut: (() => void) | undefined;
  nativeProps: Omit<ComponentPropsWithoutRef<'div'>, 'children'>;
};

/**
 * Splits the discriminated props union into the component-owned fields and
 * the native props the dialog surface element receives.
 *
 * Both variants are narrowed once here, so the rest of the hook works with a
 * single flat shape — the unauthorized variant simply leaves the two standard
 * callbacks undefined.
 */
function normalizeProps(props: ErrorDialogProps): NormalizedProps {
  if (props.kind === 'unauthorized') {
    const { open, error, detailsText, strings, onSignOut, ...nativeProps } = props;
    return {
      open,
      error,
      detailsText,
      strings,
      kind: 'unauthorized',
      onDismiss: undefined,
      onReload: undefined,
      onSignOut,
      nativeProps,
    };
  }

  const {
    open,
    error,
    detailsText,
    strings,
    kind = 'error',
    onDismiss,
    onReload,
    ...nativeProps
  } = props;
  return {
    open,
    error,
    detailsText,
    strings,
    kind,
    onDismiss,
    onReload,
    onSignOut: undefined,
    nativeProps,
  };
}

/**
 * State that {@link renderErrorDialog} renders.
 */
export type ErrorDialogState = {
  /** Whether the dialog is shown. */
  open: boolean;
  /** Resolved variant; defaults to `'error'`. */
  kind: ErrorDialogKind;
  /** Resolved texts (defaults with the caller's overrides applied). */
  strings: ErrorDialogStrings;
  /** The text of the details area. */
  details: string;
  /** Id tying the details label to the details control. */
  detailsId: string;
  /** Whether the clipboard API was detected in the mount effect. */
  copyAvailable: boolean;
  /** Whether the copy control shows its confirmation label. */
  copied: boolean;
  /** Activates the copy of the displayed details. */
  onCopy: () => void;
  /** Dismissal callback; `undefined` renders an inert action. */
  onDismiss?: () => void;
  /** Reload callback; `undefined` hides the secondary action. */
  onReload?: () => void;
  /** Sign-out callback; `undefined` renders an inert action. */
  onSignOut?: () => void;
  /** Remaining native props for the dialog surface element. */
  surfaceProps: ComponentPropsWithoutRef<'div'>;
  /** Ref to the dialog surface element, forwarded to the application. */
  surfaceRef: Ref<HTMLDivElement>;
  /** Resolved style classes. */
  classes: ErrorDialogClasses;
};

/**
 * Resolves the dialog props into render state: the texts, the details text,
 * the copy-feedback state machine, and the surface wiring.
 *
 * Details resolution: an explicit `detailsText` is used verbatim; without one,
 * a missing (`undefined`/`null`) error shows the no-details text; otherwise
 * the error is serialized, and a serializer that produces nothing falls back
 * to the no-details text as well.
 *
 * The copy control writes exactly the displayed details and confirms by
 * renaming itself for two seconds; the label returns immediately whenever the
 * details change or the dialog closes, a rejected write stays contained, and
 * a write that settles after the details changed (or after the dialog closed)
 * never flips the label. A pending confirmation timer is cleared on unmount.
 *
 * @param props - props from this instance of the dialog
 * @param ref - ref to the dialog surface element
 * @returns the state consumed by {@link renderErrorDialog}
 */
export function useErrorDialog(
  props: ErrorDialogProps,
  ref: Ref<HTMLDivElement>
): ErrorDialogState {
  const { open, error, detailsText, strings, kind, onDismiss, onReload, onSignOut, nativeProps } =
    normalizeProps(props);

  const classes = useErrorDialogStyles();
  const detailsId = useId();

  const resolvedStrings = resolveStrings(strings);
  const details =
    detailsText !== undefined
      ? detailsText
      : error == null
        ? resolvedStrings.noDetails
        : (serializeError(error) ?? resolvedStrings.noDetails);

  const [copyAvailable, setCopyAvailable] = useState(false);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const detailsRef = useRef(details);
  const openRef = useRef(open);
  // Latest-ref idiom: the write-settled handler compares against the values
  // most recently rendered; keeping them in refs lets that handler stay
  // current without re-creating the copy callback on every render.
  detailsRef.current = details;
  openRef.current = open;

  useEffect(() => {
    // Detecting availability after mount keeps server rendering simple: the
    // control simply appears once the browser environment is known.
    setCopyAvailable(typeof navigator.clipboard?.writeText === 'function');
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    // New details or a closed dialog end any running feedback: the label must
    // describe the value the user will copy next, not the previous one. The
    // effect's cleanup also clears a pending timer on unmount.
    clearTimer();
    setCopied(false);
    return clearTimer;
  }, [details, open, clearTimer]);

  const onCopy = useCallback(() => {
    const clipboard = navigator.clipboard;
    if (typeof clipboard?.writeText !== 'function') {
      return; // the control only renders when available; guard the environment race
    }
    const written = details;

    const showCopied = () => {
      if (detailsRef.current !== written || !openRef.current) {
        return;
      }
      clearTimer();
      setCopied(true);
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined;
        setCopied(false);
      }, COPY_FEEDBACK_DURATION_MS);
    };

    try {
      clipboard.writeText(written).then(showCopied, () => undefined);
    } catch {
      // A broken clipboard host must not make the dialog throw.
    }
  }, [clearTimer, details]);

  return {
    open,
    kind,
    strings: resolvedStrings,
    details,
    detailsId,
    copyAvailable,
    copied,
    onCopy,
    onDismiss,
    onReload,
    onSignOut,
    surfaceProps: nativeProps,
    surfaceRef: ref,
    classes,
  };
}
