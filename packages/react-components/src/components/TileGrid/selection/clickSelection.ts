import type { MouseEvent } from 'react';
import type { GridSelection, GridSelectionMode } from './types';

const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[data-tile-grid-interactive]',
].join(',');

/**
 * Returns true when a click target belongs to an interactive control or an
 * element explicitly marked by the application.
 * Pass the root document when handling elements from another window or iframe.
 */
export function isInteractiveClickTarget(
  target: EventTarget | null,
  ownerDocument?: Document
): boolean {
  const ElementType =
    ownerDocument?.defaultView?.Element ?? (typeof Element === 'undefined' ? undefined : Element);
  if (!ElementType || !(target instanceof ElementType)) {
    return false;
  }
  if (target.closest(INTERACTIVE_SELECTOR)) {
    return true;
  }

  // A label's original click precedes the input click it activates. Treat that
  // first event as part of the control too, without swallowing ordinary labels
  // that have no associated input. Native association covers wrapping and for.
  const label = target.closest('label');
  const LabelType = label?.ownerDocument.defaultView?.HTMLLabelElement;
  if (LabelType && label instanceof LabelType && label.control !== null) {
    return true;
  }

  // Editable state is inherited. The nearest explicit valid value wins, so
  // a non-editable island inside an editor must not inherit the outer value.
  for (let element: Element | null = target; element; element = element.parentElement) {
    const value = element.getAttribute('contenteditable')?.toLowerCase();
    if (value === 'false') return false;
    if (value === '' || value === 'true' || value === 'plaintext-only') return true;
  }
  return false;
}

/** Inputs for the public item click mapping. */
export interface ApplyItemClickInput {
  /** Event flags and target from the item wrapper click. */
  event: Pick<MouseEvent, 'shiftKey' | 'ctrlKey' | 'metaKey' | 'target' | 'defaultPrevented'>;
  /** ID of the clicked item. */
  id: string;
  /** Current selection mode. */
  mode: GridSelectionMode;
  /** Current item IDs in source order. */
  currentIds: readonly string[];
  /** Effective selection store. */
  selection: GridSelection;
  /** Root document whose native element constructors classify event targets. */
  ownerDocument?: Document;
}

/**
 * Maps one item click to the selection action for the current mode.
 *
 * The handler never prevents the default action or stops propagation, so
 * application controls inside a tile keep their normal behavior.
 */
export function applyItemClick({
  event,
  id,
  mode,
  currentIds,
  selection,
  ownerDocument,
}: ApplyItemClickInput): void {
  if (
    mode === 'none' ||
    event.defaultPrevented ||
    isInteractiveClickTarget(event.target, ownerDocument)
  ) {
    return;
  }

  if (mode === 'single') {
    selection.select(id);
    return;
  }

  if (event.shiftKey) {
    selection.selectRange(id, currentIds);
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    selection.toggle(id);
    return;
  }

  selection.selectOnly(id);
}
