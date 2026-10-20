import type { TileGridItemRect } from './types';

/** Live geometry view consumed by the marquee controller. */
export interface TileGridGeometryPort {
  getItemRect(id: string): Pick<TileGridItemRect, 'x' | 'y' | 'width' | 'height'> | undefined;
  getVisibleItemIds(): readonly string[];
  getScrollContainer(): HTMLElement | null;
  getScrollOffset(): number;
  scrollBy(delta: number): void;
}
