import { useCallback, useReducer, useRef } from 'react';
import { normalizeLabel } from './loadingLabel';
import type { LoadingController, LoadingOptions } from './useLoading.types';

/**
 * One operation that is currently pending.
 */
type ActiveOperation = {
  /** Monotonic id from a ref; unique for the lifetime of the hook instance. */
  id: number;
  /** Non-blank per-operation label, if one was supplied. */
  label?: string;
};

/**
 * State of the controller: the operations that have started and not settled.
 */
type State = {
  active: ActiveOperation[];
};

/**
 * A state transition: an operation started or settled.
 */
type Action = { type: 'begin'; id: number; label?: string } | { type: 'end'; id: number };

/**
 * Adds and removes active operations by id.
 *
 * Removal is by id, never by position. Operations settle in any order, so a
 * last-in-first-out rule would remove the wrong entry and corrupt both the
 * busy count and the label.
 *
 * @param state - current active-operation list
 * @param action - transition to apply
 * @returns the next state, or the same state when an id is already gone
 */
function reducer(state: State, action: Action): State {
  if (action.type === 'begin') {
    return { active: [...state.active, { id: action.id, label: action.label }] };
  }

  if (action.type === 'end') {
    const active = state.active.filter(operation => operation.id !== action.id);

    // Settling an operation twice, or after an unmount, is a no-op.
    return active.length === state.active.length ? state : { active };
  }

  return state;
}

/**
 * Local controller for arbitrary async operations.
 *
 * `run` marks an operation active before invoking it, clears it in `finally`,
 * returns the operation's value and rethrows its error. Overlapping
 * operations are counted; the busy state stays true until the last one
 * settles. The reported label is the most recently started active labeled
 * operation, so an unlabeled operation never suppresses a labeled one.
 *
 * The hook holds one active-operation array and re-renders only the component
 * that calls it. It is intentionally local: there is no provider, store or
 * global subscription. Calls after unmount are safe — React ignores the
 * dispatch and the returned promise still settles.
 *
 * @param options - optional default label for operations without their own
 * @returns the busy state, the resolved label and the stable `run` function
 *
 * @example
 * ```tsx
 * const { isLoading, label, run } = useLoading({ label: 'Please wait…' });
 *
 * const save = () => run(() => api.save(), { label: 'Saving…' }).catch(catchError);
 *
 * <LoadingOverlay loading={isLoading} label={label}>
 *     <ActorForm />
 * </LoadingOverlay>;
 * ```
 */
export function useLoading(options?: LoadingOptions): LoadingController {
  const [state, dispatch] = useReducer(reducer, { active: [] });
  const nextIdRef = useRef(0);

  const run = useCallback(async function run<T>(
    operation: () => T | Promise<T>,
    runOptions?: { label?: string }
  ): Promise<T> {
    const id = nextIdRef.current;
    nextIdRef.current += 1;

    dispatch({ type: 'begin', id, label: normalizeLabel(runOptions?.label) });

    try {
      return await operation();
    } finally {
      dispatch({ type: 'end', id });
    }
  }, []);

  const activeLabel = [...state.active]
    .reverse()
    .find(operation => operation.label !== undefined)?.label;

  return {
    isLoading: state.active.length > 0,
    label: activeLabel ?? normalizeLabel(options?.label),
    run,
  };
}
