/**
 * Controllable jsdom replacements for browser APIs the component library
 * needs during tests. The browser test project uses the real APIs; these
 * helpers only install when the API is missing.
 */
export class ResizeObserverStub implements ResizeObserver {
  /** Every live observer, so tests can drive their callbacks synchronously. */
  static readonly instances = new Set<ResizeObserverStub>();

  private readonly callback: ResizeObserverCallback;
  private readonly targets = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverStub.instances.add(this);
  }

  /** Starts observing one element. */
  observe(target: Element): void {
    this.targets.add(target);
  }

  /** Stops observing one element. */
  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  /** Stops observing every element and drops the observer instance. */
  disconnect(): void {
    this.targets.clear();
    ResizeObserverStub.instances.delete(this);
  }

  /** Invokes the observer callback for an observed target at a fixed size. */
  notify(target: Element, width: number, height: number): void {
    if (!this.targets.has(target)) {
      return;
    }

    const contentRect = new DOMRectReadOnly(0, 0, width, height);
    const size = [{ blockSize: height, inlineSize: width }];
    const entry: ResizeObserverEntry = {
      target,
      contentRect,
      borderBoxSize: size,
      contentBoxSize: size,
      devicePixelContentBoxSize: size,
    };

    this.callback([entry], this);
  }
}

/**
 * Defines the element's client size and notifies every observer watching it.
 * Component tests call this inside `act` when a render depends on measurement.
 */
export function setElementSize(element: Element, width: number, height: number): void {
  if (globalThis.ResizeObserver !== ResizeObserverStub) {
    throw new Error('setElementSize requires the installed jsdom ResizeObserver stub.');
  }

  Object.defineProperty(element, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: height });

  for (const observer of ResizeObserverStub.instances) {
    observer.notify(element, width, height);
  }
}

/** Clears observer instances between tests. */
export function resetJsdomStubs(): void {
  ResizeObserverStub.instances.clear();
}

/** Installs missing browser APIs for the jsdom test environment. */
export function installJsdomStubs(): void {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: ResizeObserverStub,
    });
  }

  if (typeof Element === 'undefined') {
    return;
  }

  if (!Element.prototype.setPointerCapture) {
    Object.defineProperty(Element.prototype, 'setPointerCapture', {
      configurable: true,
      writable: true,
      value: function setPointerCapture(_pointerId: number): void {},
    });
  }

  if (!Element.prototype.releasePointerCapture) {
    Object.defineProperty(Element.prototype, 'releasePointerCapture', {
      configurable: true,
      writable: true,
      value: function releasePointerCapture(_pointerId: number): void {},
    });
  }

  if (!Element.prototype.hasPointerCapture) {
    Object.defineProperty(Element.prototype, 'hasPointerCapture', {
      configurable: true,
      writable: true,
      value: function hasPointerCapture(_pointerId: number): boolean {
        return false;
      },
    });
  }
}
