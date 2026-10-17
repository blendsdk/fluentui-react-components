import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLoading } from '../src/index';

/**
 * A promise whose settlement the test controls.
 *
 * The controller's observable state changes while an operation is pending, so
 * the tests need to hold an operation open, then settle it and inspect the
 * hook again.
 */
function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolveValue, rejectValue) => {
    resolve = resolveValue;
    reject = rejectValue;
  });

  return { promise, resolve, reject };
}

describe('useLoading', () => {
  it('starts idle with no label and a run function', () => {
    const { result } = renderHook(() => useLoading());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.label).toBeUndefined();
    expect(typeof result.current.run).toBe('function');
  });

  it('reports busy while a deferred operation is pending and the value after it resolves', async () => {
    const { result } = renderHook(() => useLoading());
    const deferred = createDeferred<number>();
    let operation!: Promise<number>;

    act(() => {
      operation = result.current.run(() => deferred.promise);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      deferred.resolve(42);
      await operation;
    });

    expect(result.current.isLoading).toBe(false);
    await expect(operation).resolves.toBe(42);
  });

  it('rejects with the operation error and clears the busy state', async () => {
    const { result } = renderHook(() => useLoading());
    const error = new Error('save failed');
    let operation!: Promise<never>;

    act(() => {
      operation = result.current.run(() => Promise.reject(error));
    });

    await act(async () => {
      await expect(operation).rejects.toBe(error);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('keeps the busy state until every overlapping operation settles', async () => {
    const { result } = renderHook(() => useLoading());
    const first = createDeferred<number>();
    const second = createDeferred<string>();
    let firstRun!: Promise<number>;
    let secondRun!: Promise<string>;

    act(() => {
      firstRun = result.current.run(() => first.promise);
      secondRun = result.current.run(() => second.promise);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      first.resolve(1);
      await firstRun;
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      second.resolve('two');
      await secondRun;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('removes only the rejected operation from an overlap', async () => {
    const { result } = renderHook(() => useLoading({ label: 'Default' }));
    const failing = createDeferred<never>();
    const remaining = createDeferred<string>();
    const error = new Error('first failed');
    let failingRun!: Promise<never>;
    let remainingRun!: Promise<string>;

    act(() => {
      failingRun = result.current.run(() => failing.promise, { label: 'First' });
      remainingRun = result.current.run(() => remaining.promise, { label: 'Second' });
    });

    expect(result.current.label).toBe('Second');

    await act(async () => {
      failing.reject(error);
      await expect(failingRun).rejects.toBe(error);
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.label).toBe('Second');

    await act(async () => {
      remaining.resolve('done');
      await remainingRun;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.label).toBe('Default');
  });

  it('reports a non-blank default label while idle', () => {
    const { result } = renderHook(() => useLoading({ label: 'Please wait…' }));

    expect(result.current.label).toBe('Please wait…');
  });

  it('treats a blank default label as no default', () => {
    const { result } = renderHook(() => useLoading({ label: '   ' }));

    expect(result.current.label).toBeUndefined();
  });

  it('shows a per-operation label while active and falls back after settlement', async () => {
    const { result } = renderHook(() => useLoading({ label: 'Default' }));
    const deferred = createDeferred<number>();
    let operation!: Promise<number>;

    act(() => {
      operation = result.current.run(() => deferred.promise, { label: 'Saving…' });
    });

    expect(result.current.label).toBe('Saving…');

    await act(async () => {
      deferred.resolve(1);
      await operation;
    });

    expect(result.current.label).toBe('Default');
  });

  it('treats a blank per-operation label as no label', async () => {
    const { result } = renderHook(() => useLoading({ label: 'Default' }));
    const deferred = createDeferred<number>();
    let operation!: Promise<number>;

    act(() => {
      operation = result.current.run(() => deferred.promise, { label: '   ' });
    });

    expect(result.current.label).toBe('Default');

    await act(async () => {
      deferred.resolve(1);
      await operation;
    });
  });

  it('reports the most recently started labeled operation', async () => {
    const { result } = renderHook(() => useLoading({ label: 'Default' }));
    const first = createDeferred<number>();
    const second = createDeferred<number>();
    let firstRun!: Promise<number>;
    let secondRun!: Promise<number>;

    act(() => {
      firstRun = result.current.run(() => first.promise, { label: 'A' });
      secondRun = result.current.run(() => second.promise, { label: 'B' });
    });

    expect(result.current.label).toBe('B');

    await act(async () => {
      second.resolve(2);
      await secondRun;
    });

    expect(result.current.label).toBe('A');

    await act(async () => {
      first.resolve(1);
      await firstRun;
    });

    expect(result.current.label).toBe('Default');
  });

  it('keeps the run function identity across renders', () => {
    const { result, rerender } = renderHook(() => useLoading());
    const firstRun = result.current.run;

    rerender();

    expect(result.current.run).toBe(firstRun);
  });

  it('resolves a synchronous value through a promise', async () => {
    const { result } = renderHook(() => useLoading());
    let operation!: Promise<number>;

    act(() => {
      operation = result.current.run(() => 7);
    });

    expect(operation).toBeInstanceOf(Promise);
    await act(async () => {
      await expect(operation).resolves.toBe(7);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('rejects with the same error when the operation throws synchronously', async () => {
    const { result } = renderHook(() => useLoading());
    const error = new Error('synchronous failure');
    let operation!: Promise<never>;

    act(() => {
      operation = result.current.run(() => {
        throw error;
      });
    });

    await act(async () => {
      await expect(operation).rejects.toBe(error);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('exposes only the documented controller members', () => {
    const { result } = renderHook(() => useLoading());

    expect(Object.keys(result.current).sort()).toEqual(['isLoading', 'label', 'run']);
    expect(result.current).not.toHaveProperty('busy');
    expect(result.current).not.toHaveProperty('done');
    expect(result.current).not.toHaveProperty('begin');
  });

  it('settles the returned promise after the host unmounts', async () => {
    const { result, unmount } = renderHook(() => useLoading());
    const deferred = createDeferred<number>();
    let operation!: Promise<number>;

    act(() => {
      operation = result.current.run(() => deferred.promise);
    });

    unmount();

    await act(async () => {
      deferred.resolve(9);
    });

    await expect(operation).resolves.toBe(9);
  });

  it('updates the default label while idle', () => {
    const { result, rerender } = renderHook(
      ({ label }: { label: string }) => useLoading({ label }),
      { initialProps: { label: 'One' } }
    );

    expect(result.current.label).toBe('One');

    rerender({ label: 'Two' });

    expect(result.current.label).toBe('Two');
  });

  it('never lets an unlabeled operation suppress a later labeled one', async () => {
    const { result } = renderHook(() => useLoading());
    const unlabeled = createDeferred<number>();
    const labeled = createDeferred<number>();
    let unlabeledRun!: Promise<number>;
    let labeledRun!: Promise<number>;

    act(() => {
      unlabeledRun = result.current.run(() => unlabeled.promise);
      labeledRun = result.current.run(() => labeled.promise, { label: 'A' });
    });

    expect(result.current.label).toBe('A');

    await act(async () => {
      labeled.resolve(1);
      await labeledRun;
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.label).toBeUndefined();

    await act(async () => {
      unlabeled.resolve(2);
      await unlabeledRun;
    });
  });

  it('does not let a later unlabeled operation replace an active label', async () => {
    const { result } = renderHook(() => useLoading());
    const labeled = createDeferred<number>();
    const unlabeled = createDeferred<number>();
    let labeledRun!: Promise<number>;
    let unlabeledRun!: Promise<number>;

    act(() => {
      labeledRun = result.current.run(() => labeled.promise, { label: 'A' });
      unlabeledRun = result.current.run(() => unlabeled.promise);
    });

    expect(result.current.label).toBe('A');

    await act(async () => {
      labeled.resolve(1);
      await labeledRun;
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.label).toBeUndefined();

    await act(async () => {
      unlabeled.resolve(2);
      await unlabeledRun;
    });
  });

  it('returns to the remaining label after an out-of-order settlement', async () => {
    const { result } = renderHook(() => useLoading());
    const first = createDeferred<number>();
    const second = createDeferred<number>();
    let firstRun!: Promise<number>;
    let secondRun!: Promise<number>;

    act(() => {
      firstRun = result.current.run(() => first.promise, { label: 'A' });
      secondRun = result.current.run(() => second.promise, { label: 'B' });
    });

    expect(result.current.label).toBe('B');

    await act(async () => {
      second.resolve(2);
      await secondRun;
    });

    expect(result.current.label).toBe('A');

    await act(async () => {
      first.resolve(1);
      await firstRun;
    });
  });

  it('rejects with the exact same error object', async () => {
    const { result } = renderHook(() => useLoading());
    const error = { code: 'E_SAVE', detail: 'the record was stale' };
    let operation!: Promise<never>;

    act(() => {
      operation = result.current.run(() => Promise.reject(error));
    });

    await act(async () => {
      await expect(operation).rejects.toBe(error);
    });
  });
});
