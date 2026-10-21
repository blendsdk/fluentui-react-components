import type { TileGridGeometryPort } from '../geometry';

/** Axis-aligned rectangle in scroll-container content coordinates. */
export interface MarqueeRect {
  /** Left edge in content coordinates. */
  x: number;
  /** Top edge in content coordinates. */
  y: number;
  /** Non-negative width. */
  width: number;
  /** Non-negative height. */
  height: number;
}

/** Pointer data consumed by the marquee controller without a DOM dependency. */
export interface PointerLikeEvent {
  /** Pointer X in client coordinates. */
  clientX: number;
  /** Pointer Y in client coordinates. */
  clientY: number;
  /** Pointer identifier used for capture. */
  pointerId: number;
  /** Browser button number; only the primary button starts a gesture. */
  button: number;
  /** Whether Shift is held. */
  shiftKey: boolean;
  /** Whether Control is held. */
  ctrlKey: boolean;
  /** Whether Meta is held. */
  metaKey: boolean;
  /** Event target. */
  target: EventTarget | null;
  /** Current event target. */
  currentTarget: EventTarget | null;
  /** Prevents the browser default, when the host needs it. */
  preventDefault(): void;
}

/** Options for one marquee controller instance. */
export interface MarqueeSelectionOptions {
  /** Cached geometry view for visible IDs and item rectangles. */
  geometry: TileGridGeometryPort;
  /** Returns the current item IDs in display order. */
  getCurrentIds(): readonly string[];
  /** Returns the selection present when the gesture starts. */
  getSelectedIds(): ReadonlySet<string>;
  /** Whether an item may be included in the marquee preview. */
  isSelectable(id: string): boolean;
  /** Receives the final set exactly once on a successful commit. */
  onCommit(next: ReadonlySet<string>): void;
  /** Receives the pre-marquee set when the gesture is cancelled. */
  onCancel?(preSelection: ReadonlySet<string>): void;
  /** Receives changes to the preview set only. */
  onPreview?(preview: ReadonlySet<string>): void;
  /** Distance from an edge that starts auto-scroll. Defaults to 24. */
  edgeThreshold?: number;
  /** Maximum auto-scroll distance per frame. Defaults to 20. */
  maxScrollSpeed?: number;
  /** Distance required before a gesture becomes active. Defaults to 4. */
  activationDistance?: number;
  /** Element that receives pointer capture, when available. */
  pointerCaptureTarget?: HTMLElement | null;
  /** Injectable frame scheduler; defaults to requestAnimationFrame. */
  requestFrame?: (callback: FrameRequestCallback) => number;
  /** Injectable frame canceller; defaults to cancelAnimationFrame. */
  cancelFrame?: (handle: number) => void;
}

/** Imperative API of the internal marquee state machine. */
export interface MarqueeController {
  /** Handles a pointer-down from the background host. */
  handlePointerDown(event: PointerLikeEvent): void;
  /** Handles a pointer move while a gesture is pending or active. */
  handlePointerMove(event: PointerLikeEvent): void;
  /** Handles pointer-up and commits an active gesture. */
  handlePointerUp(event: PointerLikeEvent): void;
  /** Handles a cancelled pointer stream. */
  handlePointerCancel(event: PointerLikeEvent): void;
  /** Handles capture loss without reverting a committed gesture. */
  handleLostPointerCapture(event: PointerLikeEvent): void;
  /** Handles Escape while a gesture is pending or active. */
  handleKeyDown(event: Pick<KeyboardEvent, 'key' | 'preventDefault'>): void;
  /** Returns a copy of the current marquee rectangle, or null. */
  getRect(): MarqueeRect | null;
  /** Returns a fresh copy of the current preview set. */
  getPreviewSelection(): ReadonlySet<string>;
  /** Whether the pointer has crossed the activation threshold. */
  isActive(): boolean;
  /** Stops frames and releases capture without notifying selection. */
  dispose(): void;
}
