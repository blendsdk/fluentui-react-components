import type { ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { TileGridOverlayOffset, TileGridOverlayRect } from './types';

/** Props for the fixed-position drag copy. */
export interface TileGridDragOverlayProps {
  /** Viewport rectangle captured at drag start. */
  rect?: TileGridOverlayRect;
  /** Translation since drag start. */
  offset: TileGridOverlayOffset;
  /** Presentational tile copy. */
  children?: ReactNode;
}

/**
 * Renders the dragged tile in a body portal above the rest of the page.
 *
 * The portal is fixed, ignores pointer events, and is hidden from assistive
 * technology so the list does not expose a duplicate item. It only exists on
 * the client while a drag is active.
 */
export function TileGridDragOverlay({
  rect,
  offset,
  children,
}: TileGridDragOverlayProps): ReactElement | null {
  if (!rect || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-tile-grid-overlay=""
      aria-hidden="true"
      inert
      style={{
        position: 'fixed',
        left: rect.left + offset.x,
        top: rect.top + offset.y,
        width: rect.width,
        height: rect.height,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
