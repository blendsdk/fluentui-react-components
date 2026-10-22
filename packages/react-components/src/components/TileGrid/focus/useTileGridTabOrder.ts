import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const CONTROL_SELECTOR =
  'button,input,select,textarea,a[href],area[href],summary,audio[controls],video[controls],[contenteditable],[tabindex]';

/** HTML and SVG elements both support programmatic focus and authored tabindex. */
type FocusTarget = HTMLElement | SVGElement;

/** Inputs limited to this grid's currently mounted content. */
export interface TileGridTabOrderInput {
  /** Scroll/list root whose descendants are managed. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Current logical tile, or undefined for named-root entry. */
  activeId: string | undefined;
  /** Whether physical focus is currently inside the grid. */
  entered: boolean;
  /** Returns the active wrapper or temporary/root fallback. */
  getEntry: () => HTMLElement | null;
  /** Recovers an independently removed focused consumer control. */
  recoverFocus: () => void;
}

/** Resolves inherited editable state, including explicit non-editable islands. */
function editable(element: Element | null): boolean {
  for (let node = element; node; node = node.parentElement) {
    const value = node.getAttribute('contenteditable')?.toLowerCase();
    if (value === 'false') return false;
    if (value === '' || value === 'true' || value === 'plaintext-only') return true;
  }
  return false;
}

/** Checks native semantics with the author attribute restored, without probing focus or geometry. */
function eligible(element: FocusTarget, root: HTMLElement, author: string | null): boolean {
  if (element.matches(':disabled,input[type="hidden"]') || element.closest('[hidden],[inert]'))
    return false;
  const view = root.ownerDocument.defaultView;
  if (!view) return false;
  const visibility = view.getComputedStyle(element).visibility;
  if (visibility === 'hidden' || visibility === 'collapse') return false;
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (view.getComputedStyle(node).display === 'none') return false;
    if (node === root) break;
  }
  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
    if (
      ancestor.matches('details:not([open])') &&
      !ancestor.querySelector(':scope > summary')?.contains(element)
    )
      return false;
    if (ancestor === root) break;
  }
  const authoredIndex = author === null ? NaN : Number.parseInt(author, 10);
  if (Number.isFinite(authoredIndex)) return authoredIndex >= 0;
  // Some native tabIndex getters report zero even without the semantics that
  // make an element focusable, notably anchors after href has been removed.
  if (
    element.matches(
      'button,input,select,textarea,a[href],area[href],audio[controls],video[controls]'
    )
  )
    return true;
  if (element.matches('summary')) {
    return (
      element.parentElement?.matches('details') === true &&
      element.parentElement.querySelector(':scope > summary') === element
    );
  }
  return editable(element) && !editable(element.parentElement);
}

/** Restores absence as well as an explicit author value, avoiding redundant mutations. */
function writeTabIndex(element: FocusTarget, value: string | null): void {
  if (element.getAttribute('tabindex') === value) return;
  if (value === null) element.removeAttribute('tabindex');
  else element.setAttribute('tabindex', value);
}

/**
 * Keeps one wrapper entry while allowing native DOM-order traversal after entry.
 *
 * Only application content is rewritten. Owned selection inputs receive React
 * props directly. Each mounted consumer node retains its current authored value
 * separately from the temporary zero/minus-one value managed by the grid.
 */
export function useTileGridTabOrder(
  input: TileGridTabOrderInput
): (event: KeyboardEvent<HTMLDivElement>) => boolean {
  const live = useRef(input);
  live.current = input;
  const authors = useRef(new Map<FocusTarget, string | null>());
  const enabled = useRef<FocusTarget[]>([]);
  const observer = useRef<MutationObserver | undefined>(undefined);

  /** Only external tabindex writes reach these records; managed writes are disconnected. */
  const readAuthorChanges = useCallback((records: MutationRecord[]) => {
    for (const record of records) {
      const element = record.target;
      const view = element.ownerDocument?.defaultView;
      if (
        view &&
        record.type === 'attributes' &&
        record.attributeName === 'tabindex' &&
        (element instanceof view.HTMLElement || element instanceof view.SVGElement) &&
        authors.current.has(element)
      ) {
        authors.current.set(element, element.getAttribute('tabindex'));
      }
    }
  }, []);

  const reconcile = useCallback(() => {
    const { rootRef, activeId, entered } = live.current;
    const root = rootRef.current;
    const view = root?.ownerDocument.defaultView;
    if (!root || !view) return;
    // Drain author writes before disconnecting: otherwise a React update made
    // just before this layout effect could be mistaken for our managed value.
    readAuthorChanges(observer.current?.takeRecords() ?? []);
    observer.current?.disconnect();
    const seen = new Set<FocusTarget>();
    const nextEnabled: FocusTarget[] = [];
    for (const scope of root.querySelectorAll('[data-tile-grid-content],[data-tile-grid-empty]')) {
      if (scope.closest('[data-tile-grid-root]') !== root) continue;
      const id = scope.closest('[data-tile-grid-item]')?.getAttribute('data-tile-grid-item');
      const active = entered && (id ?? undefined) === activeId;
      for (const element of scope.querySelectorAll(CONTROL_SELECTOR)) {
        if (
          !(element instanceof view.HTMLElement || element instanceof view.SVGElement) ||
          element.closest('[data-tile-grid-root]') !== root
        )
          continue;
        seen.add(element);
        if (!authors.current.has(element))
          authors.current.set(element, element.getAttribute('tabindex'));
        const author = authors.current.get(element) ?? null;
        // Inactive content needs no style/focusability work or restore-and-write
        // cycle. Only the entered tile's few controls need native inspection.
        if (!active) {
          writeTabIndex(element, '-1');
          continue;
        }
        writeTabIndex(element, author);
        const usable =
          !(author !== null && Number.parseInt(author, 10) < 0) && eligible(element, root, author);
        if (usable) nextEnabled.push(element);
        writeTabIndex(element, usable ? '0' : '-1');
      }
    }
    for (const [element, author] of authors.current) {
      if (!seen.has(element)) {
        writeTabIndex(element, author);
        authors.current.delete(element);
      }
    }
    enabled.current = nextEnabled;
    for (const scope of root.querySelectorAll('[data-tile-grid-content],[data-tile-grid-empty]')) {
      if (scope.closest('[data-tile-grid-root]') === root) {
        observer.current?.observe(scope, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: [
            'tabindex',
            'disabled',
            'hidden',
            'inert',
            'href',
            'contenteditable',
            'style',
            'class',
            'open',
            'type',
            'controls',
          ],
        });
      }
    }
  }, [readAuthorChanges]);

  useIsomorphicLayoutEffect(() => {
    const view = live.current.rootRef.current?.ownerDocument.defaultView;
    if (!view) return;
    const currentObserver = new view.MutationObserver(records => {
      if (observer.current !== currentObserver) return;
      readAuthorChanges(records);
      reconcile();
      live.current.recoverFocus();
    });
    observer.current = currentObserver;
    reconcile();
    return () => {
      readAuthorChanges(currentObserver.takeRecords());
      currentObserver.disconnect();
      observer.current = undefined;
      for (const [element, author] of authors.current) writeTabIndex(element, author);
      authors.current.clear();
      enabled.current = [];
    };
  }, [readAuthorChanges, reconcile]);

  useIsomorphicLayoutEffect(() => {
    reconcile();
  });

  return useCallback((event: KeyboardEvent<HTMLDivElement>): boolean => {
    const root = live.current.rootRef.current;
    const entry = live.current.getEntry();
    const target = event.target;
    const NodeType = root?.ownerDocument.defaultView?.Node;
    if (
      !root ||
      !entry ||
      !NodeType ||
      !(target instanceof NodeType) ||
      !root.contains(target) ||
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return false;
    const owned = entry.querySelector<HTMLInputElement>('[data-tile-grid-selection]');
    const ownedInput = owned?.closest('[data-tile-grid-item]') === entry ? owned : null;
    let next: FocusTarget | null | undefined;
    if (event.key === 'Escape' && target !== entry) next = entry;
    if (event.key === 'Tab') {
      if (!event.shiftKey && target === entry) next = ownedInput ?? enabled.current[0];
      else if (event.shiftKey && target === ownedInput) next = entry;
      else if (event.shiftKey && target === enabled.current[0]) next = ownedInput ?? entry;
    }
    if (!next) return false;
    const before = root.ownerDocument.activeElement;
    next.focus({ preventScroll: true });
    const after = root.ownerDocument.activeElement;
    // Failed native focus must not trap Tab. A consumer may redirect focus to
    // another control; preserve that transfer rather than trying another node.
    if (after !== next && (after === before || after === root.ownerDocument.body)) return false;
    event.preventDefault();
    return true;
  }, []);
}
