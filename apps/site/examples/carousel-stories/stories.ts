import type { Carousel } from "@reuse-sh/carousel";

const tapTime = 300;
const tapSlop = 10;
const swipeDistance = 40;

export function bindStoryTaps(
  root: HTMLElement,
  carousel: Carousel,
): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  let press: { id: number; x: number; y: number; time: number } | null = null;

  const page = (forward: boolean) => {
    if (!forward) carousel.prev();
    else if (carousel.getState().canNext) carousel.next();
    else carousel.goTo(0);
  };
  const end = () => {
    press = null;
    carousel.hold("press", false);
  };

  for (const button of root.querySelectorAll<HTMLElement>(
    "[data-story-prev], [data-story-next]",
  )) {
    const forward = button.hasAttribute("data-story-next");
    button.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0 || press) return;
        press = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          time: event.timeStamp,
        };
        button.setPointerCapture(event.pointerId);
        carousel.hold("press", true);
      },
      { signal },
    );
    button.addEventListener(
      "pointerup",
      (event) => {
        if (!press || event.pointerId !== press.id) return;
        const dx = event.clientX - press.x;
        const dy = event.clientY - press.y;
        const short = event.timeStamp - press.time < tapTime;
        end();
        if (Math.abs(dx) > swipeDistance && Math.abs(dx) > Math.abs(dy)) {
          const rtl = getComputedStyle(root).direction === "rtl";
          page(rtl ? dx > 0 : dx < 0);
        } else if (short && Math.hypot(dx, dy) < tapSlop) page(forward);
      },
      { signal },
    );
    button.addEventListener(
      "pointercancel",
      (event) => {
        if (press && event.pointerId === press.id) end();
      },
      { signal },
    );
    button.addEventListener(
      "click",
      (event) => {
        if (event.detail === 0) page(forward);
      },
      { signal },
    );
    button.addEventListener("contextmenu", (event) => event.preventDefault(), {
      signal,
    });
  }
  return () => {
    controller.abort();
    if (press) end();
  };
}
