import {
  Checkbox,
  FieldContextProvider,
  Radio,
  RadioGroupProvider,
} from '@fluentui/react-components';
import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import type { TileGridSelectionMode } from './TileGrid.types';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Private native selection input, whose state belongs to the containing grid. */
export interface TileGridSelectionControlProps {
  /** Input variant fixed by the grid's mounted mode. */
  mode: Exclude<TileGridSelectionMode, 'none'>;
  /** Committed selection or the temporary visual preview. */
  checked: boolean;
  /** Item-derived accessible name. */
  label: string;
  /** Generated radio-group name unique to this grid. */
  name?: string;
  /** Token-based overlay placement. */
  className?: string;
}

/**
 * Renders the owned selection input without inheriting application form context.
 *
 * The input stays associated with its native form. Synchronizing its DOM reset
 * default keeps form.reset() from replacing current checked presentation with
 * a stale mount-time seed. The grid's delegated change handler owns transitions.
 */
function TileGridSelectionControlComponent({
  mode,
  checked,
  label,
  name,
  className,
}: TileGridSelectionControlProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  useIsomorphicLayoutEffect(() => {
    if (inputRef.current) inputRef.current.defaultChecked = checked;
  }, [checked]);

  return (
    <span className={className}>
      {mode === 'single' ? (
        <RadioGroupProvider value={undefined}>
          <Radio
            ref={inputRef}
            checked={checked}
            name={name}
            aria-label={label}
            data-tile-grid-selection=""
          />
        </RadioGroupProvider>
      ) : (
        <FieldContextProvider value={undefined}>
          <Checkbox
            ref={inputRef}
            checked={checked}
            aria-label={label}
            data-tile-grid-selection=""
          />
        </FieldContextProvider>
      )}
    </span>
  );
}

/** Memoized input presentation; consumer tile content keeps its original Fluent contexts. */
export const TileGridSelectionControl = memo(TileGridSelectionControlComponent);
