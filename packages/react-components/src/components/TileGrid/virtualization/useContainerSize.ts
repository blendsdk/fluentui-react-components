import { useEffect, useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Measured content-box size of the scroll container. */
export interface ContainerSize {
  /** Content width in CSS pixels. */
  width: number;
  /** Content height in CSS pixels. */
  height: number;
}

/**
 * Observes an element's content-box size.
 *
 * The first layout effect reads the current size before any resize event, so
 * a container that is already mounted is measured without waiting for an
 * observer callback. The observer then keeps the size current.
 */
export function useContainerSize(ref: RefObject<HTMLElement | null>): ContainerSize {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const update = (): void => {
      setSize(current => {
        const next = { width: element.clientWidth, height: element.clientHeight };
        return current.width === next.width && current.height === next.height ? current : next;
      });
    };

    update();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}
