import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLoading } from '../src/index';

/**
 * A promise whose settlement the test controls.
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

describe('useLoading internals', () => {
  it('reports busy immediately after a run starts', () => {
    const { result } = renderHook(() => useLoading());
    const deferred = createDeferred<number>();

    act(() => {
      void result.current.run(() => deferred.promise);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('removes operations by id when they settle out of order', async () => {
    const { result } = renderHook(() => useLoading());
    const first = createDeferred<number>();
    const second = createDeferred<number>();
    const third = createDeferred<number>();
    let firstRun!: Promise<number>;
    let secondRun!: Promise<number>;
    let thirdRun!: Promise<number>;

    act(() => {
      firstRun = result.current.run(() => first.promise, { label: 'A' });
      secondRun = result.current.run(() => second.promise, { label: 'B' });
      thirdRun = result.current.run(() => third.promise, { label: 'C' });
    });

    expect(result.current.label).toBe('C');

    await act(async () => {
      second.resolve(2);
      await secondRun;
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.label).toBe('C');

    await act(async () => {
      third.resolve(3);
      await thirdRun;
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.label).toBe('A');

    await act(async () => {
      first.resolve(1);
      await firstRun;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('falls back through the label stack as operations settle', async () => {
    const { result } = renderHook(() => useLoading());
    const labeled = createDeferred<number>();
    const unlabeled = createDeferred<number>();
    const latest = createDeferred<number>();
    let labeledRun!: Promise<number>;
    let unlabeledRun!: Promise<number>;
    let latestRun!: Promise<number>;

    act(() => {
      labeledRun = result.current.run(() => labeled.promise, { label: 'A' });
      unlabeledRun = result.current.run(() => unlabeled.promise);
      latestRun = result.current.run(() => latest.promise, { label: 'C' });
    });

    expect(result.current.label).toBe('C');

    await act(async () => {
      latest.resolve(3);
      await latestRun;
    });

    // The unlabeled operation contributes no label, so the earlier labeled
    // one remains visible.
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

    expect(result.current.isLoading).toBe(false);
  });

  it('does not keep stale entries after many sequential runs', async () => {
    const { result } = renderHook(() => useLoading({ label: 'Working…' }));

    for (let index = 0; index < 10; index += 1) {
      let operation!: Promise<number>;

      act(() => {
        operation = result.current.run(() => Promise.resolve(index), { label: `Run ${index}` });
      });

      await act(async () => {
        await operation;
      });
    }

    expect(result.current.isLoading).toBe(false);
    expect(result.current.label).toBe('Working…');
  });

  it('keeps the busy state while an unlabeled operation is still pending', async () => {
    const { result } = renderHook(() => useLoading());
    const labeled = createDeferred<number>();
    const unlabeled = createDeferred<number>();
    let labeledRun!: Promise<number>;
    let unlabeledRun!: Promise<number>;

    act(() => {
      labeledRun = result.current.run(() => labeled.promise, { label: 'A' });
      unlabeledRun = result.current.run(() => unlabeled.promise);
    });

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

    expect(result.current.isLoading).toBe(false);
  });
});
