export interface LayoutObserver {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

/**
 * Lays out in the frame the browser resizes the window, since its resize event
 * runs before that frame's layout and paint. A resize event that page code
 * dispatches can come from inside a resize observer, so it waits like every
 * other size change for the next frame: a layout inside an observer changes
 * the heights of the container's ancestors, which other observers on the page
 * report as a loop.
 */
export function observeLayout(
  view: Window & typeof globalThis,
  container: HTMLElement,
  width: () => number,
  layout: () => void,
  schedule: () => void,
): LayoutObserver {
  let seen = width();
  const onResize = (event: Event) => {
    if (!event.isTrusted) return;
    const next = width();
    if (next === seen) return;
    seen = next;
    layout();
  };
  const observer =
    typeof view.ResizeObserver === "function"
      ? new view.ResizeObserver(() => {
          seen = width();
          schedule();
        })
      : undefined;
  observer?.observe(container);
  view.addEventListener("resize", onResize);
  return {
    observe: (target) => observer?.observe(target),
    unobserve: (target) => observer?.unobserve(target),
    disconnect() {
      view.removeEventListener("resize", onResize);
      observer?.disconnect();
    },
  };
}
