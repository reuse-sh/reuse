// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindCarouselControls } from "./controls.js";
import { connectThumbnails, createCarousel, syncCarousels } from "./index.js";

const cleanups: (() => void)[] = [];
let motion: EventTarget & { matches: boolean };

function fixture(widths = [100, 100, 100], width = 100, rtl = false, gap = 0) {
  const viewport = document.createElement("div");
  viewport.style.direction = rtl ? "rtl" : "ltr";
  viewport.style.columnGap = `${gap}px`;
  const sizes = new WeakMap<Element, number>();
  const widthOf = (element: Element) =>
    sizes.get(element) ??
    Number.parseFloat((element as HTMLElement).style.flexBasis) ??
    0;
  for (const [index, size] of widths.entries()) {
    const slide = document.createElement("div");
    slide.dataset.carouselSlide = "";
    slide.id = `synthetic-slide-${index}`;
    sizes.set(slide, size);
    Object.defineProperty(slide, "offsetWidth", { get: () => size });
    Object.defineProperty(slide, "offsetParent", { get: () => viewport });
    Object.defineProperty(slide, "offsetLeft", {
      get() {
        const before = Array.from(viewport.children).slice(
          0,
          Array.from(viewport.children).indexOf(slide),
        );
        const start = before.reduce(
          (sum, child) => sum + widthOf(child) + gap,
          0,
        );
        return rtl ? width - start - size : start;
      },
    });
    viewport.append(slide);
  }
  Object.defineProperty(viewport, "clientWidth", {
    get: () => width,
    configurable: true,
  });
  Object.defineProperty(viewport, "scrollWidth", {
    configurable: true,
    get: () =>
      Array.from(viewport.children).reduce(
        (sum, child, index) => sum + widthOf(child) + (index ? gap : 0),
        0,
      ),
  });
  const scrollTo = vi.fn((options: ScrollToOptions) => {
    viewport.scrollLeft = options.left ?? 0;
  });
  viewport.scrollTo = scrollTo;
  document.body.append(viewport);
  return {
    viewport,
    slides: Array.from(viewport.children) as HTMLElement[],
    scrollTo,
  };
}

function pointer(target: EventTarget, type: string, x: number, extra = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    clientX: x,
    ...extra,
  });
  Object.defineProperty(event, "timeStamp", { value: performance.now() });
  target.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  const styles = document.createElement("style");
  styles.textContent = ".re-carousel { scroll-snap-type: x mandatory; }";
  document.head.append(styles);
  vi.useFakeTimers();
  motion = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal("matchMedia", (query: string) =>
    query.includes("reduced-motion")
      ? motion
      : Object.assign(new EventTarget(), { matches: true }),
  );
});

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  document.head.replaceChildren();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("native carousel", () => {
  it("uses offset geometry rather than transformed rectangles and maintains boundary controls", () => {
    const { viewport, slides, scrollTo } = fixture();
    slides[1].getBoundingClientRect = () => {
      throw new Error("Transformed geometry must not be read");
    };
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    const first = carousel.getState();
    expect(first).toMatchObject({
      index: 0,
      count: 3,
      canPrev: false,
      canNext: true,
      progress: 0,
    });
    carousel.next();
    expect(scrollTo).not.toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    );
    expect(carousel.getState()).toMatchObject({ index: 1, canPrev: true });
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(100);
    expect(carousel.getState()).toMatchObject({ index: 1, progress: 0.5 });
    carousel.next();
    carousel.next();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(200);
    expect(carousel.getState()).toMatchObject({
      index: 2,
      canNext: false,
      progress: 1,
    });
    const stable = carousel.getState();
    carousel.goTo(100);
    expect(carousel.getState()).toBe(stable);
  });

  it("measures center alignment and page groups with variable widths", () => {
    const { viewport } = fixture([80, 120, 160, 100], 200);
    const carousel = createCarousel(viewport, {
      align: "center",
      group: "page",
    });
    cleanups.push(carousel.destroy);
    carousel.goTo(1, "instant");
    expect(viewport.scrollLeft).toBe(40);
    carousel.next();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(260);
    expect(carousel.getState().canNext).toBe(false);
  });

  it("resolves percentage scroll padding against the scrollport", () => {
    const { viewport } = fixture([100, 100, 100, 100], 200);
    viewport.style.scrollPaddingInlineStart = "25%";
    const layout = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetWidth",
    );
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get(this: HTMLElement) {
        const own = this.style.width;
        const parent = Number.parseFloat(this.parentElement?.style.width ?? "");
        return own.endsWith("%")
          ? (Number.parseFloat(own) / 100) * parent
          : Number.parseFloat(own) || 0;
      },
    });
    cleanups.push(() => {
      if (layout)
        Object.defineProperty(HTMLElement.prototype, "offsetWidth", layout);
    });
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    carousel.goTo(1, "instant");
    expect(viewport.scrollLeft).toBe(50);
    carousel.goTo(2, "instant");
    expect(viewport.scrollLeft).toBe(150);
    expect(viewport.childElementCount).toBe(4);
  });

  it("moves groups without losing rapid presses and handles RTL keys locally", () => {
    const { viewport } = fixture([100, 100, 100, 100, 100], 100, true);
    const carousel = createCarousel(viewport, { group: 2 });
    cleanups.push(carousel.destroy);
    const next = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
      bubbles: true,
      cancelable: true,
    });
    viewport.dispatchEvent(next);
    viewport.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(-400);
    expect(carousel.getState().index).toBe(4);
    expect(next.defaultPrevented).toBe(true);
    const input = document.createElement("input");
    viewport.firstElementChild?.append(input);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(-400);
  });

  it("tracks native scroll and disables movement without resetting the current position", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    viewport.scrollLeft = 100;
    viewport.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(180);
    expect(carousel.getState().index).toBe(1);
    carousel.setEnabled(false);
    carousel.next();
    viewport.scrollLeft = 190;
    viewport.dispatchEvent(new Event("scroll"));
    expect(viewport.scrollLeft).toBe(100);
    expect(viewport.style.overflowX).toBe("hidden");
    expect(carousel.getState()).toMatchObject({
      canPrev: false,
      canNext: false,
    });
    carousel.setEnabled(true);
    carousel.next();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(200);
  });

  it("retains the active element after insertion and remeasures responsive widths", async () => {
    const { viewport, slides } = fixture();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    carousel.goTo(1, "instant");
    vi.advanceTimersByTime(16);
    viewport.prepend(slides[2]);
    await Promise.resolve();
    expect(carousel.getState().index).toBe(2);
    expect(viewport.scrollLeft).toBe(200);
    Object.defineProperty(viewport, "clientWidth", { get: () => 200 });
    window.dispatchEvent(new Event("resize"));
    expect(viewport.scrollLeft).toBe(200);
    vi.advanceTimersByTime(16);
    expect(viewport.scrollLeft).toBe(100);
    expect(carousel.getState().canNext).toBe(false);
  });

  it("drags with a mouse, preserves ordinary clicks, and leaves touch to native scrolling", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    pointer(viewport, "pointerdown", 100, { pointerType: "touch" });
    pointer(window, "pointermove", 0, { pointerType: "touch" });
    expect(viewport.scrollLeft).toBe(0);
    pointer(viewport, "pointerdown", 100);
    pointer(window, "pointermove", 20);
    expect(viewport.scrollLeft).toBe(80);
    expect(carousel.getState().isDragging).toBe(true);
    pointer(window, "pointerup", 20);
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(100);
    const draggedClick = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    viewport.dispatchEvent(draggedClick);
    expect(draggedClick.defaultPrevented).toBe(true);
    pointer(viewport, "pointerdown", 20);
    pointer(window, "pointerup", 20);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    viewport.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
  });

  it("stops a travelling strip under a held mouse and settles only after release", () => {
    const { viewport, scrollTo } = fixture([100, 100, 100, 100]);
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    scrollTo.mockImplementation((options) => {
      if (options.behavior !== "smooth")
        viewport.scrollLeft = options.left ?? 0;
    });
    carousel.next();
    carousel.next();
    viewport.scrollLeft = 130;
    pointer(viewport, "pointerdown", 50);
    expect(scrollTo).toHaveBeenLastCalledWith({
      left: 130,
      behavior: "instant",
    });
    scrollTo.mockClear();
    viewport.dispatchEvent(new Event("scroll"));
    viewport.dispatchEvent(new Event("scrollend"));
    vi.advanceTimersByTime(1000);
    expect(scrollTo).not.toHaveBeenCalled();
    expect(viewport.scrollLeft).toBe(130);
    pointer(window, "pointerup", 50);
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(100);
    expect(carousel.getState().index).toBe(1);
    expect(viewport.style.scrollSnapType).toBe("");
  });

  it("glides a released flick on with its momentum to the snap point nearest where it would stop", () => {
    const { viewport, scrollTo } = fixture([100, 100, 100, 100, 100, 100]);
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    pointer(viewport, "pointerdown", 300);
    vi.advanceTimersByTime(16);
    pointer(window, "pointermove", 290);
    vi.advanceTimersByTime(16);
    pointer(window, "pointermove", 270);
    vi.advanceTimersByTime(16);
    pointer(window, "pointermove", 250);
    scrollTo.mockClear();
    pointer(window, "pointerup", 250);
    expect(viewport.scrollLeft).toBe(50);
    expect(carousel.getState().index).toBe(4);
    vi.advanceTimersByTime(16);
    expect(viewport.scrollLeft).toBeGreaterThan(65);
    expect(viewport.scrollLeft).toBeLessThan(90);
    vi.advanceTimersByTime(2000);
    expect(viewport.scrollLeft).toBe(400);
    expect(viewport.style.scrollSnapType).toBe("");
    expect(scrollTo).not.toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "smooth" }),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stretches a mouse drag past either end and springs back after release", () => {
    const { viewport, slides } = fixture();
    slides[0].style.transform = "rotate(1deg)";
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    const shift = (slide: HTMLElement) =>
      Number.parseFloat(slide.style.translate);
    pointer(viewport, "pointerdown", 100);
    pointer(window, "pointermove", 200);
    expect(viewport.scrollLeft).toBe(0);
    const pulled = shift(slides[1]);
    expect(pulled).toBeGreaterThan(10);
    expect(pulled).toBeLessThan(100);
    expect(slides[0].style.translate).toBe(`${pulled}px`);
    expect(slides[0].style.transform).toBe("rotate(1deg)");
    pointer(window, "pointermove", 300);
    expect(shift(slides[1]) - pulled).toBeLessThan(pulled);
    pointer(window, "pointermove", 5000);
    expect(shift(slides[1])).toBeLessThan(30);
    pointer(window, "pointerup", 300);
    vi.advanceTimersByTime(1000);
    expect(slides[0].style.transform).toBe("rotate(1deg)");
    expect(slides[1].style.translate).toBe("");
    expect(viewport.scrollLeft).toBe(0);
    carousel.goTo(2, "instant");
    vi.advanceTimersByTime(1000);
    pointer(viewport, "pointerdown", 300);
    pointer(window, "pointermove", 200);
    expect(viewport.scrollLeft).toBe(200);
    expect(shift(slides[1])).toBeLessThan(-10);
    pointer(window, "pointerup", 200);
    vi.advanceTimersByTime(1000);
    expect(slides[1].style.translate).toBe("");
    expect(viewport.scrollLeft).toBe(200);
    expect(carousel.getState().index).toBe(2);
  });

  it("brings a stretch back on a spring after any interruption and drops it on teardown", () => {
    const shift = (slide: HTMLElement) =>
      Number.parseFloat(slide.style.translate);
    const pull = (viewport: HTMLElement, to = 200) => {
      pointer(viewport, "pointerdown", 100);
      pointer(window, "pointermove", to);
      pointer(window, "pointerup", to);
    };
    const { viewport, slides } = fixture();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    pull(viewport);
    vi.advanceTimersByTime(16);
    pointer(viewport, "pointerdown", 100);
    const caught = shift(slides[1]);
    expect(caught).toBeGreaterThan(5);
    window.dispatchEvent(new Event("blur"));
    vi.advanceTimersByTime(16);
    expect(shift(slides[1])).toBeGreaterThan(0);
    expect(shift(slides[1])).toBeLessThan(caught);
    vi.advanceTimersByTime(1000);
    expect(slides[1].style.translate).toBe("");
    pull(viewport);
    vi.advanceTimersByTime(16);
    const wheeled = shift(slides[1]);
    for (let frame = 0; frame < 10; frame++) {
      viewport.dispatchEvent(new Event("wheel"));
      vi.advanceTimersByTime(16);
    }
    expect(shift(slides[1])).toBeGreaterThan(0);
    expect(shift(slides[1])).toBeLessThan(wheeled / 2);
    vi.advanceTimersByTime(1000);
    expect(slides[1].style.translate).toBe("");
    pull(viewport);
    vi.advanceTimersByTime(16);
    carousel.destroy();
    expect(slides[1].style.translate).toBe("");
    expect(viewport.style.cursor).toBe("");
    expect(vi.getTimerCount()).toBe(0);

    const native = fixture();
    const glide = createCarousel(native.viewport, { releaseMotion: "native" });
    cleanups.push(glide.destroy);
    pull(native.viewport);
    expect(shift(native.slides[1])).toBeGreaterThan(5);
    vi.advanceTimersByTime(1000);
    expect(native.slides[1].style.translate).toBe("");

    const mirrored = fixture([100, 100, 100], 100, true);
    const rtl = createCarousel(mirrored.viewport);
    cleanups.push(rtl.destroy);
    pointer(mirrored.viewport, "pointerdown", 100);
    pointer(window, "pointermove", 0);
    expect(shift(mirrored.slides[1])).toBeLessThan(-5);
    pointer(window, "pointerup", 0);
    vi.advanceTimersByTime(1000);
    expect(mirrored.slides[1].style.translate).toBe("");

    motion.matches = true;
    const still = fixture();
    const reduced = createCarousel(still.viewport);
    cleanups.push(reduced.destroy);
    pull(still.viewport);
    expect(still.slides[1].style.translate).toBe("");
  });

  it("stops a flick at the first slide on its way that asks for a snap stop", () => {
    for (const [stopping, landing] of [
      [[0, 1, 2, 3, 4, 5], 1],
      [[3], 3],
      [[], 5],
    ] as const) {
      const { viewport, slides } = fixture([100, 100, 100, 100, 100, 100]);
      for (const index of stopping)
        slides[index].style.scrollSnapStop = "always";
      const carousel = createCarousel(viewport);
      cleanups.push(carousel.destroy);
      pointer(viewport, "pointerdown", 300);
      for (const x of [290, 260, 230]) {
        vi.advanceTimersByTime(16);
        pointer(window, "pointermove", x);
      }
      pointer(window, "pointerup", 230);
      vi.advanceTimersByTime(2000);
      expect(carousel.getState().index).toBe(landing);
      expect(viewport.scrollLeft).toBe(landing * 100);
      carousel.destroy();
      viewport.remove();
    }
  });

  it("keeps the click after a programmatic move that leaves the strip still", () => {
    const { viewport, slides } = fixture();
    const button = document.createElement("button");
    slides[0].append(button);
    let clicks = 0;
    button.addEventListener("click", () => clicks++);
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    vi.advanceTimersByTime(200);
    carousel.goTo(0, "instant");
    vi.advanceTimersByTime(50);
    pointer(button, "pointerdown", 20);
    pointer(window, "pointerup", 20);
    button.click();
    expect(clicks).toBe(1);
  });

  it("shows a grab cursor while a mouse drag can move the strip", () => {
    const { viewport } = fixture();
    viewport.style.cursor = "default";
    const carousel = createCarousel(viewport);
    expect(viewport.style.cursor).toBe("default");
    pointer(viewport, "pointermove", 100);
    expect(viewport.style.cursor).toBe("grab");
    pointer(viewport, "pointerdown", 100);
    expect(viewport.style.cursor).toBe("grabbing");
    pointer(window, "pointerup", 100);
    expect(viewport.style.cursor).toBe("grab");
    carousel.setEnabled(false);
    expect(viewport.style.cursor).toBe("default");
    carousel.destroy();
    expect(viewport.style.cursor).toBe("default");
    const fixed = fixture([100], 100);
    const still = createCarousel(fixed.viewport);
    cleanups.push(still.destroy);
    expect(fixed.viewport.style.cursor).toBe("");
    const off = fixture();
    const undraggable = createCarousel(off.viewport, { drag: false });
    cleanups.push(undraggable.destroy);
    expect(off.viewport.style.cursor).toBe("");
  });

  it("cancels a release glide for a new drag or a wheel and redirects it for a programmatic move", () => {
    const { viewport } = fixture([100, 100, 100, 100]);
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    const release = () => {
      carousel.goTo(0, "instant");
      pointer(viewport, "pointerdown", 300);
      vi.advanceTimersByTime(16);
      pointer(window, "pointermove", 240);
      vi.advanceTimersByTime(16);
      pointer(window, "pointermove", 170);
      pointer(window, "pointerup", 170);
      vi.advanceTimersByTime(16);
      return viewport.scrollLeft;
    };
    const held = release();
    expect(held).toBeGreaterThan(150);
    expect(held).toBeLessThan(200);
    pointer(viewport, "pointerdown", 300);
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(held);
    pointer(window, "pointermove", 360);
    expect(viewport.scrollLeft).toBe(held - 60);
    pointer(window, "pointerup", 360);
    vi.advanceTimersByTime(2000);
    expect(viewport.scrollLeft).toBe(100);
    release();
    viewport.dispatchEvent(new Event("wheel"));
    const wheeled = viewport.scrollLeft;
    expect(wheeled).toBeGreaterThan(150);
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(wheeled);
    const before = release();
    carousel.goTo(0);
    vi.advanceTimersByTime(16);
    expect(viewport.scrollLeft).toBeGreaterThan(before);
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(0);
  });

  it("keeps the native smooth release and the reduced motion jump", () => {
    const { viewport, scrollTo } = fixture();
    const carousel = createCarousel(viewport, { releaseMotion: "native" });
    cleanups.push(carousel.destroy);
    pointer(viewport, "pointerdown", 100);
    pointer(window, "pointermove", 20);
    pointer(window, "pointerup", 20);
    expect(scrollTo).toHaveBeenLastCalledWith({
      left: 100,
      behavior: "smooth",
    });
    expect(viewport.scrollLeft).toBe(100);
    const reduced = fixture();
    const still = createCarousel(reduced.viewport);
    cleanups.push(still.destroy);
    motion.matches = true;
    pointer(reduced.viewport, "pointerdown", 100);
    pointer(window, "pointermove", 20);
    pointer(window, "pointerup", 20);
    expect(reduced.scrollTo).toHaveBeenLastCalledWith({
      left: 100,
      behavior: "instant",
    });
    expect(() => createCarousel(viewport, { releaseDuration: 0 })).toThrow(
      RangeError,
    );
  });

  it("recenters a repeated track after a release glide crosses the seam", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport, { loop: true });
    cleanups.push(carousel.destroy);
    expect(viewport.scrollLeft).toBe(300);
    pointer(viewport, "pointerdown", 300);
    vi.advanceTimersByTime(100);
    pointer(window, "pointermove", 330);
    vi.advanceTimersByTime(100);
    pointer(window, "pointermove", 360);
    vi.advanceTimersByTime(100);
    pointer(window, "pointerup", 360);
    vi.advanceTimersByTime(16);
    expect(viewport.scrollLeft).toBeLessThan(240);
    expect(viewport.scrollLeft).toBeGreaterThan(200);
    vi.advanceTimersByTime(2000);
    expect(viewport.scrollLeft).toBe(500);
    expect(carousel.getState().index).toBe(2);
    expect(viewport.style.scrollSnapType).toBe("");
  });

  it("keeps a long glide on a repeated track moving one way across seams", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport, { loop: true });
    cleanups.push(carousel.destroy);
    pointer(viewport, "pointerdown", 300);
    for (const x of [260, 220, 180]) {
      vi.advanceTimersByTime(16);
      pointer(window, "pointermove", x);
    }
    pointer(window, "pointerup", 180);
    let previous = viewport.scrollLeft;
    let travelled = 0;
    for (let frame = 0; frame < 250; frame++) {
      vi.advanceTimersByTime(16);
      let step = viewport.scrollLeft - previous;
      if (step < -150) step += 300;
      expect(step).toBeGreaterThanOrEqual(0);
      travelled += step;
      previous = viewport.scrollLeft;
    }
    expect(travelled).toBeGreaterThan(600);
    expect(viewport.scrollLeft % 100).toBe(0);
    expect(viewport.scrollLeft).toBeGreaterThanOrEqual(300);
    expect(viewport.scrollLeft).toBeLessThan(600);
  });

  it("drags an interactive photo slide without activating it, stops a glide without a click, and preserves the next tap", () => {
    const { viewport, slides } = fixture();
    const button = document.createElement("button");
    const image = document.createElement("img");
    button.append(image);
    slides[0].append(button);
    let clicks = 0;
    button.addEventListener("click", () => clicks++);
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    pointer(image, "pointerdown", 100);
    pointer(window, "pointermove", 20);
    expect(viewport.scrollLeft).toBe(80);
    expect(carousel.getState().isDragging).toBe(true);
    pointer(window, "pointerup", 20);
    button.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(clicks).toBe(0);
    pointer(image, "pointerdown", 20);
    pointer(window, "pointerup", 20);
    button.click();
    expect(clicks).toBe(0);
    vi.advanceTimersByTime(1000);
    pointer(image, "pointerdown", 20);
    pointer(window, "pointerup", 20);
    button.click();
    expect(clicks).toBe(1);
  });

  it("does not jump to the destination when a lightbox mounts content inside an existing slide", async () => {
    const { viewport, slides, scrollTo } = fixture();
    const carousel = createCarousel(viewport, { moveMotion: "native" });
    cleanups.push(carousel.destroy);
    scrollTo.mockImplementation((options) => {
      if (options.behavior !== "smooth")
        viewport.scrollLeft = options.left ?? 0;
    });
    carousel.next();
    viewport.scrollLeft = 40;
    slides[1].append(document.createElement("img"));
    await Promise.resolve();
    expect(viewport.scrollLeft).toBe(40);
    expect(carousel.getState().index).toBe(1);
    viewport.scrollLeft = 100;
    viewport.dispatchEvent(new Event("scrollend"));
    expect(viewport.style.scrollSnapType).toBe("");
  });

  it("retains the latest smooth destination when an interrupted scroll emits scrollend", () => {
    const { viewport, scrollTo } = fixture([100, 100, 100, 100]);
    const carousel = createCarousel(viewport, { moveMotion: "native" });
    cleanups.push(carousel.destroy);
    scrollTo.mockImplementation((options) => {
      if (options.behavior !== "smooth")
        viewport.scrollLeft = options.left ?? 0;
    });
    carousel.next();
    carousel.next();
    viewport.dispatchEvent(new Event("scrollend"));
    carousel.next();
    expect(scrollTo).toHaveBeenLastCalledWith({
      left: 300,
      behavior: "smooth",
    });
    expect(carousel.getState().index).toBe(3);
    expect(viewport.style.scrollSnapType).toBe("none");
    viewport.scrollLeft = 300;
    viewport.dispatchEvent(new Event("scrollend"));
    expect(carousel.getState().index).toBe(3);
    expect(viewport.style.scrollSnapType).toBe("");
  });

  it("keeps independent autoplay holds, explicit pause, visibility and reduced motion", () => {
    const { viewport } = fixture([100, 100, 100, 100]);
    const carousel = createCarousel(viewport, { autoplay: 1000 });
    cleanups.push(carousel.destroy);
    carousel.hold("lightbox", true);
    carousel.hold("editing", true);
    carousel.hold("lightbox", false);
    vi.advanceTimersByTime(2000);
    expect(viewport.scrollLeft).toBe(0);
    carousel.hold("editing", false);
    vi.advanceTimersByTime(1600);
    expect(viewport.scrollLeft).toBe(100);
    carousel.pause();
    viewport.dispatchEvent(new Event("pointerenter"));
    viewport.dispatchEvent(new Event("pointerleave"));
    vi.advanceTimersByTime(2000);
    expect(viewport.scrollLeft).toBe(100);
    carousel.play();
    motion.matches = true;
    motion.dispatchEvent(new Event("change"));
    vi.advanceTimersByTime(2000);
    expect(viewport.scrollLeft).toBe(100);
    carousel.next();
    expect(viewport.scrollLeft).toBe(200);
    expect(carousel.getState().isPlaying).toBe(false);
  });

  it("retains the first centered slide across settling and refresh with spacer gaps", () => {
    const { viewport, slides } = fixture(
      [300, 390, 390, 300, 390, 390],
      1000,
      false,
      12,
    );
    const carousel = createCarousel(viewport, { loop: true, align: "center" });
    cleanups.push(carousel.destroy);
    expect(viewport.scrollLeft).toBe(1882);
    expect(slides[0].offsetLeft).toBe(2232);
    expect(carousel.getState().index).toBe(0);
    viewport.dispatchEvent(new Event("scrollend"));
    expect(viewport.scrollLeft).toBe(1882);
    expect(slides[0].style.transform).toBe("");
    expect(viewport.style.scrollSnapType).toBe("");
    carousel.refresh();
    expect(viewport.scrollLeft).toBe(1882);
    expect(carousel.getState()).toMatchObject({ index: 0, progress: 0 });
    carousel.prev();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(3757);
    expect(carousel.getState().index).toBe(5);
    carousel.next();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(1882);
    expect(carousel.getState().index).toBe(0);
  });

  it("repeats through the native scroll seam with original interactive elements", () => {
    const { viewport, slides } = fixture();
    const button = document.createElement("button");
    let clicks = 0;
    button.onclick = () => clicks++;
    slides[0].append(button);
    slides[1].style.transform = "scale(0.9)";
    const carousel = createCarousel(viewport, { loop: true });
    cleanups.push(carousel.destroy);
    expect(viewport.scrollLeft).toBe(300);
    expect(viewport.querySelectorAll("[data-carousel-spacer]")).toHaveLength(2);
    viewport.scrollLeft = 590;
    viewport.dispatchEvent(new Event("scroll"));
    expect(slides[0].style.transform).toBe("translateX(300px)");
    viewport.scrollLeft = 600;
    viewport.dispatchEvent(new Event("scrollend"));
    expect(viewport.scrollLeft).toBe(300);
    expect(carousel.getState()).toMatchObject({
      index: 0,
      canPrev: true,
      canNext: true,
      isLooping: true,
    });
    expect(viewport.querySelectorAll("#synthetic-slide-0")).toHaveLength(1);
    expect(viewport.querySelector("#synthetic-slide-0")).toBe(slides[0]);
    button.click();
    expect(clicks).toBe(1);
    carousel.prev();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(500);
    expect(carousel.getState().index).toBe(2);
    carousel.next();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(300);
    expect(carousel.getState().index).toBe(0);
    carousel.destroy();
    expect(Array.from(viewport.children)).toEqual(slides);
    expect(slides[0].style.transform).toBe("");
    expect(slides[1].style.transform).toBe("scale(0.9)");
  });

  it("repeats in RTL and recenters continuous mouse movement without reversing it", () => {
    const { viewport } = fixture([100, 100, 100, 100], 100, true);
    const carousel = createCarousel(viewport, { loop: true });
    cleanups.push(carousel.destroy);
    expect(viewport.scrollLeft).toBe(-400);
    carousel.prev();
    expect(carousel.getState().index).toBe(3);
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(-700);
    pointer(viewport, "pointerdown", 100);
    pointer(window, "pointermove", 250);
    expect(viewport.scrollLeft).toBe(-450);
    pointer(window, "pointermove", 300);
    expect(viewport.scrollLeft).toBe(-500);
    expect(carousel.getState().index).toBe(1);
    pointer(window, "pointerup", 300);
    expect(carousel.getState().isDragging).toBe(false);
  });

  it("refreshes a repeated track after removal without observing its own spacers", async () => {
    const { viewport, slides } = fixture([100, 100, 100, 100]);
    const carousel = createCarousel(viewport, { loop: true });
    cleanups.push(carousel.destroy);
    carousel.goTo(1, "instant");
    slides[0].remove();
    await Promise.resolve();
    vi.advanceTimersByTime(16);
    expect(carousel.getState()).toMatchObject({
      count: 3,
      index: 0,
      isLooping: true,
    });
    expect(viewport.scrollLeft).toBe(300);
    expect(viewport.querySelectorAll("[data-carousel-spacer]")).toHaveLength(2);
    expect(viewport.children).toHaveLength(5);
    carousel.refresh();
    carousel.refresh();
    await Promise.resolve();
    expect(viewport.children).toHaveLength(5);
    expect(viewport.scrollLeft).toBe(300);
  });

  it("does not invent repeated interactive content when a full cycle cannot cover the viewport", () => {
    const { viewport } = fixture([100, 100, 100], 250);
    const carousel = createCarousel(viewport, { loop: true });
    cleanups.push(carousel.destroy);
    expect(viewport.querySelectorAll("[data-carousel-spacer]")).toHaveLength(0);
    carousel.next();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(50);
    expect(carousel.getState().canNext).toBe(false);
    expect(carousel.getState().isLooping).toBe(false);
    Object.defineProperty(viewport, "clientWidth", { get: () => 100 });
    carousel.refresh();
    expect(carousel.getState().isLooping).toBe(true);
  });

  it("synchronizes the real controllers and disconnects without feedback loops", () => {
    const first = fixture();
    const second = fixture();
    const a = createCarousel(first.viewport);
    const b = createCarousel(second.viewport);
    cleanups.push(a.destroy, b.destroy);
    const disconnect = syncCarousels(a, b);
    a.next();
    expect(second.viewport.scrollLeft).toBe(100);
    b.next();
    expect(first.viewport.scrollLeft).toBe(200);
    vi.advanceTimersByTime(1000);
    disconnect();
    a.goTo(0);
    expect(second.viewport.scrollLeft).toBe(200);
  });

  it("cancels timers and restores owned styles and listeners on repeated teardown", () => {
    const { viewport, slides } = fixture();
    viewport.tabIndex = 4;
    viewport.style.overflowX = "scroll";
    slides[0].style.scrollSnapAlign = "end";
    const carousel = createCarousel(viewport, { autoplay: 1000 });
    carousel.setEnabled(false);
    carousel.destroy();
    carousel.destroy();
    viewport.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    vi.advanceTimersByTime(10000);
    expect(viewport.scrollLeft).toBe(0);
    expect(viewport.tabIndex).toBe(4);
    expect(viewport.style.overflowX).toBe("scroll");
    expect(slides[0].style.scrollSnapAlign).toBe("end");
    expect(viewport.classList.contains("re-carousel")).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("handles empty and non-overflowing content and rejects invalid timers at the boundary", () => {
    const { viewport } = fixture([], 100);
    const carousel = createCarousel(viewport, { loop: true });
    cleanups.push(carousel.destroy);
    carousel.next();
    carousel.goTo(Number.NaN);
    expect(carousel.getState()).toMatchObject({
      count: 0,
      canPrev: false,
      canNext: false,
      progress: 0,
    });
    expect(() => createCarousel(viewport, { autoplay: 0 })).toThrow(RangeError);
    expect(() => createCarousel(viewport, { group: 1.5 })).toThrow(RangeError);
    expect(() =>
      createCarousel(viewport, { moveMotion: "smooth" as "native" }),
    ).toThrow(RangeError);
    expect(() =>
      createCarousel(viewport, { wheel: "horizontal" as "vertical" }),
    ).toThrow(RangeError);
  });
});

describe("one motion and strip state", () => {
  const wheel = (viewport: HTMLElement, init: WheelEventInit) => {
    const event = new WheelEvent("wheel", { cancelable: true, ...init });
    viewport.dispatchEvent(event);
    return event;
  };

  it("jumps under reduced motion and for an instant goTo instead of starting the spring", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    carousel.goTo(2, "instant");
    expect(viewport.scrollLeft).toBe(200);
    motion.matches = true;
    carousel.prev();
    expect(viewport.scrollLeft).toBe(100);
    expect(vi.getTimerCount()).toBeLessThanOrEqual(2);
  });

  it("moves from code after the strip was scrolled natively", () => {
    const { viewport } = fixture([100, 100, 100, 100]);
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    viewport.scrollLeft = 100;
    viewport.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(200);
    carousel.next();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(200);
    expect(carousel.getState().index).toBe(2);
  });

  it("lets a scroll from outside finish instead of pulling the strip back", () => {
    const { viewport } = fixture([100, 100, 100, 100]);
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    carousel.goTo(3);
    vi.advanceTimersByTime(48);
    viewport.scrollLeft = 120;
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(120);
    expect(viewport.style.scrollSnapType).toBe("");
    expect(carousel.getState().index).toBe(1);
  });

  it("moves one slide per vertical mouse wheel notch and leaves trackpads and the page alone", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport, { wheel: "vertical" });
    cleanups.push(carousel.destroy);
    expect(wheel(viewport, { deltaY: 4 }).defaultPrevented).toBe(false);
    expect(wheel(viewport, { deltaX: 120, deltaY: 60 }).defaultPrevented).toBe(
      false,
    );
    expect(carousel.getState().index).toBe(0);
    expect(wheel(viewport, { deltaY: 100 }).defaultPrevented).toBe(true);
    expect(wheel(viewport, { deltaY: 3, deltaMode: 1 }).defaultPrevented).toBe(
      true,
    );
    expect(carousel.getState().index).toBe(2);
    expect(wheel(viewport, { deltaY: 100 }).defaultPrevented).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(200);
    const outer = fixture();
    const inner = fixture();
    outer.slides[0].append(inner.viewport);
    const outside = createCarousel(outer.viewport, { wheel: "vertical" });
    const nested = createCarousel(inner.viewport, { wheel: "vertical" });
    cleanups.push(outside.destroy, nested.destroy);
    inner.viewport.dispatchEvent(
      new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true }),
    );
    expect([outside.getState().index, nested.getState().index]).toEqual([0, 1]);
    const plain = fixture();
    const native = createCarousel(plain.viewport);
    cleanups.push(native.destroy);
    expect(wheel(plain.viewport, { deltaY: 100 }).defaultPrevented).toBe(false);
    expect(native.getState().index).toBe(0);
  });

  it("marks static, edge and dragging state on the viewport and removes it on destroy", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport);
    const marked = () =>
      viewport
        .getAttributeNames()
        .filter((name) => name.startsWith("data-re-"));
    expect(marked()).toEqual(["data-re-at-start"]);
    pointer(viewport, "pointerdown", 100);
    pointer(window, "pointermove", 97);
    expect(viewport.hasAttribute("data-re-dragging")).toBe(false);
    pointer(window, "pointermove", 0);
    expect(viewport.hasAttribute("data-re-dragging")).toBe(true);
    pointer(window, "pointerup", 0);
    expect(viewport.hasAttribute("data-re-dragging")).toBe(false);
    carousel.goTo(2, "instant");
    expect(marked()).toEqual(["data-re-at-end"]);
    carousel.destroy();
    expect(marked()).toEqual([]);
    const still = fixture([100], 100);
    const one = createCarousel(still.viewport);
    cleanups.push(one.destroy);
    expect(still.viewport.hasAttribute("data-re-static")).toBe(true);
    const repeated = fixture();
    const loop = createCarousel(repeated.viewport, { loop: true });
    cleanups.push(loop.destroy);
    expect(
      repeated.viewport
        .getAttributeNames()
        .filter((name) => name.startsWith("data-re-")),
    ).toEqual([]);
  });

  it("holds hover for a fast user scroll and lets go once it slows or stops", () => {
    const { viewport } = fixture([100, 100, 100, 100, 100, 100]);
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    const scroll = (left: number) => {
      viewport.scrollLeft = left;
      viewport.dispatchEvent(new Event("scroll"));
    };
    scroll(10);
    expect(viewport.hasAttribute("data-re-scrolling")).toBe(false);
    wheel(viewport, { deltaX: 40 });
    scroll(50);
    expect(viewport.hasAttribute("data-re-scrolling")).toBe(true);
    vi.advanceTimersByTime(70);
    scroll(52);
    expect(viewport.hasAttribute("data-re-scrolling")).toBe(false);
    vi.advanceTimersByTime(70);
    scroll(60);
    expect(viewport.hasAttribute("data-re-scrolling")).toBe(false);
    vi.advanceTimersByTime(70);
    scroll(120);
    expect(viewport.hasAttribute("data-re-scrolling")).toBe(true);
    vi.advanceTimersByTime(149);
    expect(viewport.hasAttribute("data-re-scrolling")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(viewport.hasAttribute("data-re-scrolling")).toBe(false);
  });

  it("glides a free strip to rest where its momentum ends and steps from the nearest slide start", () => {
    const { viewport } = fixture([100, 100, 100, 100, 100, 100]);
    viewport.style.scrollSnapType = "none";
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    pointer(viewport, "pointerdown", 300);
    for (const x of [290, 275, 260]) {
      vi.advanceTimersByTime(16);
      pointer(window, "pointermove", x);
    }
    pointer(window, "pointerup", 260);
    vi.advanceTimersByTime(2000);
    const rest = viewport.scrollLeft;
    expect(rest % 100).not.toBe(0);
    expect(rest).toBeGreaterThan(40);
    carousel.next();
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe((Math.round(rest / 100) + 1) * 100);
    carousel.goTo(0, "instant");
    pointer(viewport, "pointerdown", 300);
    for (const x of [290, 275, 260]) {
      vi.advanceTimersByTime(16);
      pointer(window, "pointermove", x);
    }
    pointer(window, "pointerup", 260);
    vi.advanceTimersByTime(48);
    carousel.refresh();
    vi.advanceTimersByTime(2000);
    expect(viewport.scrollLeft).toBe(rest);
  });

  it("keeps a free glide inside the strip when a refresh during it shrinks the scroll range", () => {
    const { viewport, slides } = fixture(Array(10).fill(300), 1000);
    viewport.style.scrollSnapType = "none";
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    carousel.goTo(5, "instant");
    vi.advanceTimersByTime(500);
    pointer(viewport, "pointerdown", 300);
    for (const x of [290, 270, 250]) {
      vi.advanceTimersByTime(16);
      pointer(window, "pointermove", x);
    }
    pointer(window, "pointerup", 250);
    vi.advanceTimersByTime(48);
    Object.defineProperty(viewport, "clientWidth", { get: () => 1150 });
    carousel.refresh();
    vi.advanceTimersByTime(5000);
    expect(slides.map((slide) => slide.style.translate)).toEqual(
      Array(10).fill(""),
    );
    expect(viewport.scrollLeft).toBeLessThanOrEqual(1850);
  });

  it("leaves a mouse drag that starts inside a nested strip with room to scroll to that strip", () => {
    const outer = fixture([100, 100, 100]);
    const inner = document.createElement("div");
    inner.className = "re-carousel";
    let content = 200;
    Object.defineProperty(inner, "scrollWidth", { get: () => content });
    Object.defineProperty(inner, "clientWidth", { get: () => 100 });
    outer.slides[0].append(inner);
    const carousel = createCarousel(outer.viewport);
    cleanups.push(carousel.destroy);
    pointer(inner, "pointerdown", 100);
    pointer(window, "pointermove", 20);
    expect(outer.viewport.scrollLeft).toBe(0);
    pointer(window, "pointerup", 20);
    content = 100;
    pointer(inner, "pointerdown", 100);
    pointer(window, "pointermove", 20);
    expect(outer.viewport.scrollLeft).toBe(80);
  });

  it("refreshes at most once a frame for observer requests and at once when asked", async () => {
    const { viewport, slides } = fixture([100, 100, 100, 100]);
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    const read = vi.spyOn(window, "getComputedStyle");
    const refreshes = () =>
      read.mock.calls.filter(([element]) => element === slides[3]).length;
    vi.advanceTimersByTime(16);
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("resize"));
    viewport.append(document.createElement("div"));
    await Promise.resolve();
    expect(refreshes()).toBe(1);
    vi.advanceTimersByTime(16);
    expect(refreshes()).toBe(2);
    carousel.refresh();
    expect(refreshes()).toBe(3);
    vi.advanceTimersByTime(100);
    expect(refreshes()).toBe(3);
  });

  it("adds no mouse drag listener until a fine pointer moves over an overflowing strip", () => {
    const fine = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal("matchMedia", (query: string) =>
      query.includes("reduced-motion") ? motion : fine,
    );
    const added = vi.spyOn(window, "addEventListener");
    const { viewport } = fixture();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    const dragging = () =>
      added.mock.calls.filter(([type]) => type === "pointermove").length;
    pointer(viewport, "pointermove", 50);
    pointer(viewport, "pointerdown", 50);
    expect(dragging()).toBe(0);
    viewport.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    expect(carousel.getState().index).toBe(2);
    fine.matches = true;
    pointer(viewport, "pointermove", 50);
    pointer(viewport, "pointermove", 60);
    expect(dragging()).toBe(1);
  });
});

describe("one state for every control", () => {
  const eight = () => fixture(Array(8).fill(100), 300);

  it("counts the distinct stops next() reaches as pages", () => {
    for (const [group, pages] of [
      [1, 6],
      [3, 3],
      ["page", 3],
    ] as const) {
      const { viewport } = eight();
      const carousel = createCarousel(viewport, { group });
      cleanups.push(carousel.destroy);
      expect(carousel.getState()).toMatchObject({ count: 8, pageCount: pages });
      carousel.goTo(7, "instant");
      expect(carousel.getState().pageIndex).toBe(pages - 1);
    }
  });

  it("lists the slides at least half in view and publishes the list only when it changes", () => {
    const { viewport } = eight();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    const lists: (readonly number[])[] = [];
    carousel.subscribe((state) => lists.push(state.visible));
    expect(carousel.getState().visible).toEqual([0, 1, 2]);
    carousel.goTo(2);
    vi.advanceTimersByTime(1000);
    expect(carousel.getState().visible).toEqual([2, 3, 4]);
    viewport.scrollLeft = 260;
    viewport.dispatchEvent(new Event("scroll"));
    expect(carousel.getState().visible).toEqual([3, 4, 5]);
    viewport.scrollLeft = 265;
    viewport.dispatchEvent(new Event("scroll"));
    expect(new Set(lists).size).toBe(
      lists.filter((list, at) => list !== lists[at - 1]).length,
    );
  });

  it("keeps the rest of the autoplay wait over a hover and starts it again on a new slide", () => {
    const { viewport } = eight();
    const carousel = createCarousel(viewport, { autoplay: 5000 });
    cleanups.push(carousel.destroy);
    vi.advanceTimersByTime(2000);
    viewport.dispatchEvent(new Event("pointerenter"));
    vi.advanceTimersByTime(2000);
    viewport.dispatchEvent(new Event("pointerleave"));
    vi.advanceTimersByTime(2999);
    expect(carousel.getState().index).toBe(0);
    vi.advanceTimersByTime(1);
    expect(carousel.getState().index).toBe(1);
    vi.advanceTimersByTime(3000);
    carousel.goTo(4, "instant");
    vi.advanceTimersByTime(4999);
    expect(carousel.getState().index).toBe(4);
    vi.advanceTimersByTime(1);
    expect(carousel.getState().index).toBe(5);
  });

  it("returns from the last slide to the first on the spring when the strip does not loop", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport, { autoplay: 1000 });
    cleanups.push(carousel.destroy);
    carousel.goTo(2, "instant");
    expect(carousel.getState().isPlaying).toBe(true);
    vi.advanceTimersByTime(1100);
    expect(carousel.getState().index).toBe(0);
    expect(viewport.scrollLeft).toBeGreaterThan(0);
    expect(viewport.scrollLeft).toBeLessThan(200);
    vi.advanceTimersByTime(600);
    expect(viewport.scrollLeft).toBe(0);
  });

  it("writes the autoplay progress every frame, publishes whole percents and freezes it on a hold", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport, { autoplay: 1000 });
    cleanups.push(carousel.destroy);
    const published: number[] = [];
    carousel.subscribe((state) => published.push(state.autoplayProgress));
    vi.advanceTimersByTime(500);
    const written = Number(
      viewport.style.getPropertyValue("--re-carousel-autoplay-progress"),
    );
    expect(written).toBeGreaterThan(0.45);
    expect(written).toBeLessThanOrEqual(0.5);
    expect(
      published.every(
        (value) => Math.abs(Math.round(value * 100) - value * 100) < 1e-9,
      ),
    ).toBe(true);
    expect(new Set(published).size).toBe(published.length);
    carousel.hold("x", true);
    const frozen = viewport.style.getPropertyValue(
      "--re-carousel-autoplay-progress",
    );
    vi.advanceTimersByTime(2000);
    expect(
      viewport.style.getPropertyValue("--re-carousel-autoplay-progress"),
    ).toBe(frozen);
    expect(carousel.getState().index).toBe(0);
  });

  it("stays paused by the visitor after every hold is released", () => {
    const { viewport } = fixture();
    const carousel = createCarousel(viewport, { autoplay: 1000 });
    cleanups.push(carousel.destroy);
    carousel.pause();
    carousel.hold("x", true);
    carousel.hold("x", false);
    expect(carousel.getState().isPlaying).toBe(false);
    vi.advanceTimersByTime(3000);
    expect(carousel.getState().index).toBe(0);
  });

  it("pauses autoplay while less than half of the strip is in view", () => {
    let report: (ratio: number) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          callback: (entries: { intersectionRatio: number }[]) => void,
        ) {
          report = (ratio) => callback([{ intersectionRatio: ratio }]);
        }
        observe() {}
        disconnect() {}
      },
    );
    const { viewport } = fixture();
    const carousel = createCarousel(viewport, { autoplay: 1000 });
    cleanups.push(carousel.destroy);
    report(0.4);
    expect(carousel.getState().isPlaying).toBe(false);
    report(0.6);
    expect(carousel.getState().isPlaying).toBe(true);
  });

  it("dispatches change, settle, play and pause on the viewport with the state", () => {
    const { viewport } = fixture();
    const events: string[] = [];
    for (const type of ["change", "settle", "play", "pause"])
      document.addEventListener(`re-carousel:${type}`, (event) => {
        const { detail } = event as CustomEvent;
        events.push(`${type} ${detail.index} ${detail.isPlaying}`);
      });
    const carousel = createCarousel(viewport, { autoplay: 5000 });
    cleanups.push(carousel.destroy);
    carousel.next();
    vi.advanceTimersByTime(1000);
    carousel.pause();
    carousel.play();
    viewport.addEventListener("re-carousel:change", () => carousel.pause(), {
      once: true,
    });
    carousel.next();
    const seen: string[] = [];
    carousel.subscribe((state) => {
      if (state.index === 1) carousel.goTo(0, "instant");
    });
    carousel.subscribe((state) => seen.push(`${state.index}`));
    carousel.goTo(1, "instant");
    expect(seen.at(-1)).toBe("0");
    expect(events).toEqual([
      "play 0 true",
      "change 1 true",
      "settle 1 true",
      "pause 1 false",
      "play 1 true",
      "change 2 true",
      "pause 2 false",
      "change 0 false",
    ]);
  });

  it("reports every change in order when a change handler moves the carousel again", () => {
    for (const [react, expected, playing] of [
      [
        (carousel: ReturnType<typeof createCarousel>) => carousel.goTo(0),
        ["change 7 true", "play 7 true", "change 0 true"],
        true,
      ],
      [
        (carousel: ReturnType<typeof createCarousel>) => carousel.pause(),
        ["change 7 true", "play 7 true", "pause 7 false"],
        false,
      ],
    ] as const) {
      const { viewport, slides } = fixture(Array(8).fill(100), 100);
      for (const slide of slides.slice(0, 7)) slide.remove();
      const carousel = createCarousel(viewport, { autoplay: 5000 });
      cleanups.push(carousel.destroy);
      const events: string[] = [];
      for (const type of ["change", "play", "pause"])
        viewport.addEventListener(`re-carousel:${type}`, (event) => {
          const { detail } = event as CustomEvent;
          events.push(`${type} ${detail.index} ${detail.isPlaying}`);
        });
      viewport.addEventListener("re-carousel:change", () => react(carousel), {
        once: true,
      });
      viewport.prepend(...slides.slice(0, 7));
      carousel.refresh();
      expect(events).toEqual(expected);
      expect(carousel.getState().isPlaying).toBe(playing);
    }
  });

  it("keeps a goTo on a hidden strip for the first refresh that finds overflow", () => {
    const { viewport, slides } = eight();
    let hidden = true;
    Object.defineProperty(viewport, "clientWidth", {
      get: () => (hidden ? 0 : 300),
    });
    Object.defineProperty(viewport, "scrollWidth", {
      get: () => (hidden ? 0 : 800),
    });
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    carousel.goTo(2);
    carousel.goTo(5);
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(0);
    hidden = false;
    carousel.refresh();
    expect(carousel.getState().index).toBe(5);
    expect(viewport.scrollLeft).toBe(slides[5].offsetLeft);
  });

  it("turns the loop on without moving the active slide", () => {
    const { viewport, slides } = eight();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    carousel.goTo(2, "instant");
    const shown = slides[2].offsetLeft - viewport.scrollLeft;
    carousel.setOptions({ loop: true });
    expect(carousel.getState()).toMatchObject({ index: 2, isLooping: true });
    expect(slides[2].offsetLeft - viewport.scrollLeft).toBe(shown);
    carousel.setOptions({ group: 3 });
    expect(carousel.getState()).toMatchObject({ index: 2, pageCount: 3 });
    expect(() => carousel.setOptions({ group: 0 })).toThrow(RangeError);
  });

  it("starts, changes and stops autoplay and dragging without a rebuild", () => {
    const { viewport } = eight();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    carousel.setOptions({ autoplay: 1000 });
    expect(carousel.getState().isPlaying).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(carousel.getState().index).toBe(1);
    vi.advanceTimersByTime(400);
    carousel.setOptions({ autoplay: undefined });
    expect(
      viewport.style.getPropertyValue("--re-carousel-autoplay-progress"),
    ).toBe("");
    vi.advanceTimersByTime(3000);
    expect(carousel.getState()).toMatchObject({ index: 1, isPlaying: false });
    carousel.setOptions({ drag: false });
    pointer(viewport, "pointermove", 0, { buttons: 0 });
    expect(viewport.style.cursor).toBe("");
    carousel.setOptions({ drag: true });
    pointer(viewport, "pointermove", 0, { buttons: 0 });
    expect(viewport.style.cursor).toBe("grab");
  });

  it("labels the strip and its slides and announces only moves from buttons and keys", () => {
    const { viewport, slides } = eight();
    slides[7].setAttribute("role", "listitem");
    const carousel = createCarousel(viewport, { autoplay: 1000 });
    cleanups.push(carousel.destroy);
    expect(viewport.getAttribute("role")).toBe("region");
    expect(viewport.getAttribute("aria-roledescription")).toBe("carousel");
    expect(slides[2].getAttribute("aria-label")).toBe("3 of 8");
    expect(slides[2].getAttribute("aria-roledescription")).toBe("slide");
    expect(slides[7].hasAttribute("aria-label")).toBe(false);
    vi.advanceTimersByTime(1100);
    expect(carousel.getState().index).toBe(1);
    const live = viewport.nextElementSibling as HTMLElement;
    expect(live.getAttribute("aria-live")).toBe("polite");
    expect(live.textContent).toBe("");
    carousel.next();
    expect(live.textContent).toBe("3 of 8");
    viewport.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    expect(live.textContent).toBe("8 of 8");
    carousel.goTo(0);
    expect(live.textContent).toBe("8 of 8");
    carousel.destroy();
    expect(viewport.hasAttribute("role")).toBe(false);
    expect(slides[2].hasAttribute("aria-label")).toBe(false);
    expect(slides[7].getAttribute("role")).toBe("listitem");
    expect(viewport.nextElementSibling).toBeNull();
  });

  it("leaves the native roles of a list and of button slides alone", () => {
    const list = document.createElement("ul");
    list.innerHTML = "<li></li><li><button></button></li>";
    const strip = document.createElement("div");
    strip.innerHTML = "<button></button><button></button>";
    document.body.append(list, strip);
    list.scrollTo = strip.scrollTo = () => {};
    const carousels = [createCarousel(list), createCarousel(strip)];
    cleanups.push(...carousels.map((carousel) => carousel.destroy));
    expect(list.hasAttribute("role")).toBe(false);
    expect(strip.getAttribute("role")).toBe("region");
    expect(
      [...list.children, ...strip.children].map((slide) =>
        slide.hasAttribute("role"),
      ),
    ).toEqual([false, false, false, false]);
  });

  it("uses the strings option for slide labels", () => {
    const { viewport, slides } = fixture();
    const carousel = createCarousel(viewport, {
      strings: { slide: (index, count) => `Photo ${index + 1}/${count}` },
    });
    cleanups.push(carousel.destroy);
    expect(slides[0].getAttribute("aria-label")).toBe("Photo 1/3");
  });
});

describe("thumbnails", () => {
  it("centers the active thumbnail, marks it and moves the main strip on a click", () => {
    const main = fixture(Array(8).fill(100), 100);
    const strip = fixture(Array(8).fill(100), 300);
    const carousel = createCarousel(main.viewport);
    const thumbnails = createCarousel(strip.viewport);
    cleanups.push(carousel.destroy, thumbnails.destroy);
    carousel.goTo(4, "instant");
    const disconnect = connectThumbnails(carousel, thumbnails);
    expect(strip.viewport.scrollLeft).toBe(300);
    expect(strip.slides[4].getAttribute("aria-current")).toBe("true");
    strip.slides[7].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(carousel.getState().index).toBe(7);
    vi.advanceTimersByTime(1000);
    expect(main.viewport.scrollLeft).toBe(700);
    expect(strip.viewport.scrollLeft).toBe(500);
    main.viewport.scrollLeft = 200;
    main.viewport.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(1000);
    expect(carousel.getState().index).toBe(2);
    expect(strip.slides[2].getAttribute("aria-current")).toBe("true");
    expect(strip.slides[7].hasAttribute("aria-current")).toBe(false);
    expect(strip.viewport.scrollLeft).toBe(100);
    disconnect();
    expect(strip.slides[2].hasAttribute("aria-current")).toBe(false);
    strip.slides[5].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(carousel.getState().index).toBe(2);
  });
});

describe("controls binder", () => {
  function bound(markup: string, widths = Array(8).fill(100), width = 300) {
    const strip = fixture(widths, width);
    strip.viewport.id = "photos";
    const root = document.createElement("div");
    root.innerHTML = markup;
    strip.viewport.before(root);
    root.prepend(strip.viewport);
    const carousel = createCarousel(strip.viewport, { autoplay: 5000 });
    cleanups.push(carousel.destroy);
    return { ...strip, root, carousel };
  }
  const click = (element: Element | null | undefined) =>
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

  it("creates one dot per page and drives the strip from the dots and arrows", () => {
    const { root, carousel, viewport } = bound(
      "<button data-carousel-prev></button><div data-carousel-dots></div><button data-carousel-next>Next</button>",
    );
    const unbind = bindCarouselControls(root, carousel);
    const dots = root.querySelectorAll("[data-carousel-dots] button");
    const prev = root.querySelector<HTMLButtonElement>("[data-carousel-prev]");
    const next = root.querySelector<HTMLButtonElement>("[data-carousel-next]");
    expect(dots).toHaveLength(6);
    expect(dots[2].getAttribute("aria-label")).toBe("Go to slide 3 of 6");
    expect(dots[0].getAttribute("aria-current")).toBe("true");
    expect(prev?.disabled).toBe(true);
    expect(prev?.getAttribute("aria-label")).toBe("Previous slide");
    expect(next?.hasAttribute("aria-label")).toBe(false);
    expect(next?.getAttribute("aria-controls")).toBe("photos");
    click(dots[5]);
    expect(carousel.getState()).toMatchObject({ index: 5, pageIndex: 5 });
    expect(viewport.nextElementSibling?.textContent).toBe("6 of 8");
    expect(dots[5].getAttribute("aria-current")).toBe("true");
    expect(dots[0].hasAttribute("aria-current")).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(next?.disabled).toBe(true);
    click(prev);
    expect(carousel.getState().index).toBe(4);
    unbind();
    expect(root.querySelectorAll("[data-carousel-dots] button")).toHaveLength(
      0,
    );
    expect(prev?.hasAttribute("aria-label")).toBe(false);
    expect(prev?.hasAttribute("aria-controls")).toBe(false);
  });

  it("leaves no listener on the root or a control after unbinding", () => {
    const counts = new Map<EventTarget, number>();
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(
      function (this: EventTarget, ...args) {
        counts.set(this, (counts.get(this) ?? 0) + 1);
        return add.apply(this, args);
      },
    );
    vi.spyOn(EventTarget.prototype, "removeEventListener").mockImplementation(
      function (this: EventTarget, ...args) {
        counts.set(this, (counts.get(this) ?? 0) - 1);
        return remove.apply(this, args);
      },
    );
    const { root, carousel } = bound(
      `<button data-carousel-prev></button><button data-carousel-next></button><div data-carousel-dots></div>
      <span data-carousel-counter></span><button data-carousel-play></button><div data-carousel-progress></div>`,
    );
    const controls = [
      root,
      ...root.querySelectorAll(
        "[data-carousel-prev], [data-carousel-next], [data-carousel-dots], [data-carousel-counter], [data-carousel-play], [data-carousel-progress]",
      ),
    ];
    const unbind = bindCarouselControls(root, carousel);
    expect(controls.some((control) => (counts.get(control) ?? 0) > 0)).toBe(
      true,
    );
    unbind();
    vi.restoreAllMocks();
    expect(controls.map((control) => counts.get(control) ?? 0)).toEqual(
      controls.map(() => 0),
    );
  });

  it("writes the counter only when its text changes and rolls it the way the strip moved", () => {
    const { root, carousel, viewport } = bound(
      "<span data-carousel-counter></span><span data-carousel-counter data-roll></span>",
    );
    const [plain, rolling] = root.querySelectorAll<HTMLElement>(
      "[data-carousel-counter]",
    );
    const frames: string[] = [];
    Element.prototype.animate = vi.fn(function (
      this: Element,
      keyframes: Keyframe[],
      timing: KeyframeAnimationOptions,
    ) {
      frames.push(`${keyframes[0].transform} ${timing.duration}`);
      return { finished: Promise.resolve() } as unknown as Animation;
    }) as unknown as Element["animate"];
    cleanups.push(() => {
      Reflect.deleteProperty(Element.prototype, "animate");
    });
    const unbind = bindCarouselControls(root, carousel);
    const text = plain.firstChild;
    expect(plain.textContent).toBe("1 / 8");
    const changes: MutationRecord[] = [];
    const observer = new MutationObserver((records) =>
      changes.push(...records),
    );
    observer.observe(plain, {
      characterData: true,
      subtree: true,
      childList: true,
    });
    viewport.scrollLeft = 20;
    viewport.dispatchEvent(new Event("scroll"));
    carousel.next();
    carousel.prev();
    changes.push(...observer.takeRecords());
    expect(plain.firstChild).toBe(text);
    expect(changes.map((record) => record.type)).toEqual([
      "characterData",
      "characterData",
    ]);
    expect(rolling.textContent).toContain("1 / 8");
    expect(frames).toEqual([
      "none 200",
      "translateY(100%) 200",
      "none 200",
      "translateY(-100%) 200",
    ]);
    motion.matches = true;
    carousel.next();
    expect(frames).toHaveLength(4);
    expect(rolling.children).toHaveLength(1);
    unbind();
    expect(plain.childNodes).toHaveLength(0);
  });

  it("toggles play and pause with its label and pressed state", () => {
    const { root, carousel } = bound("<button data-carousel-play></button>");
    const unbind = bindCarouselControls(root, carousel);
    const play = root.querySelector("[data-carousel-play]");
    expect(play?.getAttribute("aria-pressed")).toBe("true");
    expect(play?.getAttribute("aria-label")).toBe("Pause slideshow");
    click(play);
    expect(carousel.getState().isPlaying).toBe(false);
    expect(play?.getAttribute("aria-pressed")).toBe("false");
    expect(play?.getAttribute("aria-label")).toBe("Play slideshow");
    carousel.hold("x", true);
    carousel.hold("x", false);
    expect(carousel.getState().isPlaying).toBe(false);
    click(play);
    expect(carousel.getState().isPlaying).toBe(true);
    unbind();
    expect(play?.hasAttribute("aria-pressed")).toBe(false);
  });

  it("makes the progress bar a slider for the pointer and the keys", () => {
    const { root, carousel } = bound("<div data-carousel-progress></div>");
    const unbind = bindCarouselControls(root, carousel, {
      strings: { progress: "Position" },
    });
    const bar = root.querySelector<HTMLElement>("[data-carousel-progress]");
    if (!bar) throw new Error("No bar");
    bar.getBoundingClientRect = () => ({ left: 0, width: 100 }) as DOMRect;
    const key = (name: string) =>
      bar.dispatchEvent(
        new KeyboardEvent("keydown", { key: name, bubbles: true }),
      );
    expect(bar.getAttribute("role")).toBe("slider");
    expect(bar.getAttribute("aria-label")).toBe("Position");
    expect(bar.getAttribute("aria-valuemax")).toBe("6");
    key("ArrowRight");
    expect(carousel.getState().index).toBe(1);
    expect(bar.getAttribute("aria-valuenow")).toBe("2");
    key("End");
    expect(carousel.getState().index).toBe(5);
    key("ArrowDown");
    expect(carousel.getState().index).toBe(4);
    key("ArrowUp");
    expect(carousel.getState().index).toBe(5);
    key("PageDown");
    expect(carousel.getState().index).toBe(4);
    key("Home");
    expect(carousel.getState().index).toBe(0);
    pointer(bar, "pointerdown", 61);
    expect(carousel.getState().index).toBe(3);
    pointer(bar, "pointermove", 100);
    expect(carousel.getState().index).toBe(5);
    expect(bar.style.getPropertyValue("--re-carousel-progress")).toBe("1");
    pointer(bar, "pointerup", 100);
    unbind();
    expect(bar.hasAttribute("role")).toBe(false);
    expect(bar.style.getPropertyValue("--re-carousel-progress")).toBe("");
  });

  it("finds controls outside the root by the viewport id and windows the dots", () => {
    const { root, carousel } = bound(
      '<div data-carousel-controls="thumbs"><button data-carousel-next></button></div>',
      Array(8).fill(100),
      100,
    );
    const wrapper = document.createElement("div");
    wrapper.dataset.carouselControls = "thumbs";
    root.before(wrapper);
    wrapper.append(root);
    root.insertAdjacentHTML(
      "beforeend",
      "<button data-carousel-prev></button>",
    );
    const outside = document.createElement("div");
    outside.dataset.carouselControls = "photos";
    outside.innerHTML = "<div data-carousel-dots></div>";
    document.body.append(outside);
    const unbind = bindCarouselControls(root, carousel, { dotsWindow: 5 });
    const dots = [...outside.querySelectorAll("button")];
    const shown = () =>
      dots
        .map((dot, page) =>
          dot.hidden ? "" : `${page}${dot.dataset.edge?.[0] ?? ""}`,
        )
        .filter(Boolean)
        .join(" ");
    expect(dots).toHaveLength(8);
    expect(shown()).toBe("0 1 2 3n 4f");
    click(root.querySelector("[data-carousel-next]"));
    expect(carousel.getState().index).toBe(0);
    expect(
      root.querySelector<HTMLButtonElement>("[data-carousel-prev]")?.disabled,
    ).toBe(true);
    carousel.goTo(3, "instant");
    expect(shown()).toBe("0 1 2 3 4f");
    carousel.goTo(4, "instant");
    expect(shown()).toBe("1f 2n 3 4 5f");
    carousel.goTo(7, "instant");
    expect(shown()).toBe("3f 4n 5 6 7");
    unbind();
    for (const [size, expected] of [
      [1, "7"],
      [3, "5f 6n 7"],
    ] as const) {
      const again = bindCarouselControls(root, carousel, { dotsWindow: size });
      dots.splice(0, dots.length, ...outside.querySelectorAll("button"));
      expect(shown()).toBe(expected);
      carousel.goTo(0, "instant");
      expect(shown()).toBe(size === 1 ? "0" : "0 1n 2f");
      carousel.goTo(7, "instant");
      again();
    }
    expect(outside.querySelectorAll("button")).toHaveLength(0);
  });
});
