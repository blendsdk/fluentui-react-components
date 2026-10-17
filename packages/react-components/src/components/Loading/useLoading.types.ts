/**
 * Options of the `useLoading` controller.
 */
export type LoadingOptions = {
  /**
   * Default message reported whenever no active operation supplies a label of
   * its own, including while the controller is idle. A blank or missing value
   * means "no default"; the consumer (`LoadingOverlay` or `Loading`) then
   * applies the English `Loading…` fallback.
   */
  label?: string;
};

/**
 * The controller returned by `useLoading`.
 *
 * The hook is a normal local controller: it re-renders the component that
 * calls it when `isLoading` or `label` changes, and connects to the loading
 * components through ordinary props.
 *
 * @example
 * ```tsx
 * const { isLoading, label, run } = useLoading({ label: 'Please wait…' });
 *
 * <LoadingOverlay loading={isLoading} label={label}>
 *     <ActorForm />
 * </LoadingOverlay>;
 *
 * <Button onClick={() => run(saveActor, { label: 'Saving…' }).catch(catchError)}>
 *     Save
 * </Button>;
 * ```
 */
export type LoadingController = {
  /** True while at least one tracked operation is pending. */
  readonly isLoading: boolean;

  /**
   * The most recently started active **labeled** operation's label, else the
   * non-blank default label, else `undefined`. An unlabeled operation never
   * suppresses a labeled one. The consumer applies the visible English
   * fallback.
   */
  readonly label: string | undefined;

  /**
   * Runs one operation and tracks it until it settles.
   *
   * The operation is marked active before it is invoked and cleared in
   * `finally`, so a throw, a rejection, an early return and a synchronous
   * value all clear the busy state. The returned promise resolves to the
   * operation's value and rejects with the same error object; the hook never
   * swallows or replaces errors. Callers should return or catch the promise.
   *
   * @param operation - function performing the work; may return a value or a promise
   * @param options - optional label for this operation while it is active
   * @returns a promise settling with the operation's outcome
   */
  run<T>(operation: () => T | Promise<T>, options?: { label?: string }): Promise<T>;
};
