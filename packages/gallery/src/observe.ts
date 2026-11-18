export interface LayoutObserver {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

/**
 * Lays out in the frame the window resizes, since its resize event runs before
 * that frame's layout and paint, so a window resize never shows the previous
 * width's layout. Any other size change waits for the next frame: a layout
 * inside a resize observer changes the heights of the container's ancestors,
 * which every other observer on the page would report as a loop.
 */
export function observeLayout(
  view: Window & typeof globalThis,
  container: HTMLElement,
  width: () => number,
  layout: () => void,
  schedule: () => void,
): LayoutObserver {
  let seen = width();
  const onResize = () => {
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
