import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useGridSelection } from '../src/components/TileGrid/selection';

const currentIds = ['a', 'b', 'c'];

describe('TileGrid single-selection range anchor', () => {
  it('selects only the range target while preserving the seeded anchor', () => {
    // A single-mode range replaces membership, but remains a range for anchor maintenance.
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useGridSelection({ mode: 'single', defaultSelectedIds: ['a'], onSelectionChange })
    );
    expect(result.current.anchorId).toBe('a');
    expect(onSelectionChange).not.toHaveBeenCalled();

    act(() => result.current.selectRange('b', currentIds));
    expect(result.current.selectedIds).toEqual(new Set(['b']));
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
    expect(result.current.anchorId).toBe('a');
  });

  it('moves the anchor on an ordinary non-range selection', () => {
    // Keeping the range anchor must not freeze the anchor for ordinary selections.
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useGridSelection({ mode: 'single', defaultSelectedIds: ['a'], onSelectionChange })
    );
    act(() => result.current.select('c'));
    expect(result.current.selectedIds).toEqual(new Set(['c']));
    expect(result.current.anchorId).toBe('c');
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['c']));
    act(() => result.current.select('c'));
    expect(result.current.selectedIds).toEqual(new Set(['c']));
    expect(result.current.anchorId).toBe('c');
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });

  it('does not invent an anchor when selecting a range after clear', () => {
    // An absent anchor stays absent even across consecutive single-target ranges.
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useGridSelection({ mode: 'single', defaultSelectedIds: ['a'], onSelectionChange })
    );
    act(() => result.current.clear());
    expect(result.current.selectedIds).toEqual(new Set());
    expect(result.current.anchorId).toBeUndefined();

    act(() => result.current.selectRange('b', currentIds));
    expect(result.current.selectedIds).toEqual(new Set(['b']));
    expect(result.current.anchorId).toBeUndefined();
    act(() => result.current.selectRange('c', currentIds));
    expect(result.current.selectedIds).toEqual(new Set(['c']));
    expect(result.current.anchorId).toBeUndefined();
    expect(onSelectionChange.mock.calls).toEqual([[new Set()], [new Set(['b'])], [new Set(['c'])]]);
  });

  it.each([false, true])('ignores an ineligible range target after clear=%s', clearFirst => {
    // Eligibility applies before either membership or the original anchor can change.
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useGridSelection({
        mode: 'single',
        defaultSelectedIds: ['a'],
        isSelectable: id => id !== 'b',
        onSelectionChange,
      })
    );
    if (clearFirst) act(() => result.current.clear());
    onSelectionChange.mockClear();
    act(() => result.current.selectRange('b', currentIds));
    expect(result.current.selectedIds).toEqual(new Set(clearFirst ? [] : ['a']));
    expect(result.current.anchorId).toBe(clearFirst ? undefined : 'a');
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('preserves the user anchor when a controlled parent accepts a range proposal', () => {
    // The accepted prop echo changes membership, never the anchor of the range action.
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() => {
      const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set(['a']));
      return useGridSelection({
        mode: 'single',
        selectedIds,
        onSelectionChange: next => {
          onSelectionChange(next);
          setSelectedIds(next);
        },
      });
    });
    act(() => result.current.selectRange('b', currentIds));
    expect(result.current.selectedIds).toEqual(new Set(['b']));
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(new Set(['b']));
    expect(result.current.anchorId).toBe('a');
  });
});
