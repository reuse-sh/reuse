const observers = new Set<FakeResizeObserver>();

/** A ResizeObserver jsdom lacks: tests report a size change with `resized`. */
export class FakeResizeObserver {
  readonly targets = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {
    observers.add(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
    observers.delete(this);
  }
}

/** Report a size change of `target`, then wait for the frame the controllers lay out in. */
export async function resized(target: Element) {
  for (const observer of [...observers]) {
    if (observer.targets.has(target)) {
      observer.callback([], observer as unknown as ResizeObserver);
    }
  }
  await new Promise((resolve) => requestAnimationFrame(resolve));
}
