import { vi } from "vitest";
import { createCarousel } from "../../packages/carousel/src/index.js";
import type { World } from "./explore.js";

const slideWidth = 310;
const viewportWidth = 1000;
const count = 8;
const max = count * slideWidth - viewportWidth;
const snaps = [
  ...new Set(
    Array.from({ length: count }, (_, index) =>
      Math.min(index * slideWidth, max),
    ),
  ),
];
const nearest = (position: number) =>
  snaps.reduce((best, snap) =>
    Math.abs(snap - position) < Math.abs(best - position) ? snap : best,
  );

function pointer(target: EventTarget, type: string, x: number, kind: string) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    pointerId: kind === "touch" ? 2 : 1,
    pointerType: kind,
    button: 0,
    clientX: x,
  });
  Object.defineProperty(event, "timeStamp", { value: performance.now() });
  target.dispatchEvent(event);
}

export function carouselMotion(): World {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", (query: string) =>
    Object.assign(new EventTarget(), { matches: query.includes("fine") }),
  );
  const snapping = document.createElement("style");
  snapping.textContent = ".re-carousel { scroll-snap-type: x mandatory; }";
  document.head.append(snapping);
  const viewport = document.createElement("div");
  for (let index = 0; index < count; index++) {
    const slide = document.createElement("div");
    slide.dataset.carouselSlide = "";
    slide.style.translate = index === 3 ? "4px 0" : "";
    Object.defineProperty(slide, "offsetWidth", { get: () => slideWidth });
    Object.defineProperty(slide, "offsetParent", { get: () => viewport });
    Object.defineProperty(slide, "offsetLeft", {
      get: () => index * slideWidth,
    });
    viewport.append(slide);
  }
  Object.defineProperty(viewport, "clientWidth", { get: () => viewportWidth });
  Object.defineProperty(viewport, "scrollWidth", {
    get: () => count * slideWidth,
  });
  const scrollTo = (left: number) => {
    viewport.scrollLeft = Math.max(0, Math.min(left, max));
    viewport.dispatchEvent(new Event("scroll"));
  };
  viewport.scrollTo = ((options: ScrollToOptions) =>
    scrollTo(options.left ?? 0)) as typeof viewport.scrollTo;
  document.body.append(viewport);
  const styles = () =>
    [viewport, ...viewport.children].map(
      (element) => element.getAttribute("style") ?? "",
    );
  const original = styles();
  const carousel = createCarousel(viewport);
  let held: number | undefined;
  let destroyed = false;
  const snapOn = () => viewport.style.scrollSnapType !== "none";
  // jsdom has no scroll snapping, so a resting strip is moved to the nearest snap point here.
  const settle = () => {
    if (destroyed || held !== undefined || !snapOn()) return;
    if (viewport.scrollLeft === nearest(viewport.scrollLeft)) return;
    scrollTo(nearest(viewport.scrollLeft));
    viewport.dispatchEvent(new Event("scrollend"));
  };
  const step = (action: () => void) => () => {
    action();
    settle();
  };
  return {
    steps: {
      drag: step(() => {
        if (held === undefined) {
          held = 600;
          pointer(viewport, "pointerdown", held, "mouse");
          vi.advanceTimersByTime(16);
        }
        held -= 150;
        pointer(window, "pointermove", held, "mouse");
      }),
      release: step(() => {
        if (held === undefined) return;
        pointer(window, "pointerup", held, "mouse");
        held = undefined;
      }),
      next: step(() => carousel.next()),
      "goTo 5": step(() => carousel.goTo(5)),
      wheel: step(() => {
        viewport.dispatchEvent(new Event("wheel"));
        scrollTo(viewport.scrollLeft + 80);
        viewport.dispatchEvent(new Event("scrollend"));
      }),
      touch: step(() => {
        pointer(viewport, "pointerdown", 500, "touch");
        scrollTo(viewport.scrollLeft + 120);
        pointer(viewport, "pointerup", 380, "touch");
        viewport.dispatchEvent(new Event("scrollend"));
      }),
      refresh: step(() => carousel.refresh()),
      destroy: step(() => {
        carousel.destroy();
        destroyed = true;
        held = undefined;
      }),
      time: step(() => {
        vi.advanceTimersToNextTimer();
      }),
    },
    checks: {
      "the index is a slide": () => {
        const { index } = carousel.getState();
        return Number.isInteger(index) && index >= 0 && index < count;
      },
      "after destroy no timer or frame is left": () =>
        !destroyed || vi.getTimerCount() === 0,
      "after destroy every style is back": () =>
        !destroyed || styles().join("|") === original.join("|"),
      "after destroy no state attribute is left": () =>
        !destroyed ||
        viewport
          .getAttributeNames()
          .every((name) => !name.startsWith("data-re-")),
      "every control reads the page and slides the strip shows": () => {
        if (destroyed) return true;
        const state = carousel.getState();
        const left = viewport.scrollLeft;
        const shown = Array.from({ length: count }, (_, index) => index).filter(
          (index) =>
            Math.min((index + 1) * slideWidth - left, viewportWidth) -
              Math.max(index * slideWidth - left, 0) >=
            slideWidth / 2 - 0.5,
        );
        const at = Math.min(state.index * slideWidth, max);
        return (
          state.pageCount === snaps.length &&
          state.pageIndex ===
            snaps.filter((snap) => snap <= at + 1).length - 1 &&
          state.visible.join() === shown.join()
        );
      },
      "the strip shows dragging only while a mouse is held": () =>
        held !== undefined || !viewport.hasAttribute("data-re-dragging"),
      "a strip at rest sits on a snap point": () =>
        destroyed ||
        held !== undefined ||
        vi.getTimerCount() > 0 ||
        snaps.includes(viewport.scrollLeft),
    },
    fingerprint: () =>
      [
        carousel.getState().index,
        viewport.scrollLeft,
        vi.getTimerCount(),
        held,
        destroyed,
        viewport.getAttribute("style"),
      ].join("|"),
    teardown: () => {
      carousel.destroy();
      document.head.replaceChildren();
      document.body.replaceChildren();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    },
  };
}
