// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCarousel, syncCarousels } from "./index.js";

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
  vi.useFakeTimers();
  motion = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal("matchMedia", () => motion);
});

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
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
    expect(scrollTo).toHaveBeenLastCalledWith({
      left: 100,
      behavior: "smooth",
    });
    expect(carousel.getState()).toMatchObject({
      index: 1,
      progress: 0.5,
      canPrev: true,
    });
    carousel.next();
    carousel.next();
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
    expect(viewport.scrollLeft).toBe(-400);
    expect(carousel.getState().index).toBe(4);
    expect(next.defaultPrevented).toBe(true);
    const input = document.createElement("input");
    viewport.firstElementChild?.append(input);
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    expect(viewport.scrollLeft).toBe(-400);
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
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
    expect(viewport.scrollLeft).toBe(200);
  });

  it("retains the active element after insertion and remeasures responsive widths", async () => {
    const { viewport, slides } = fixture();
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    carousel.goTo(1, "instant");
    viewport.prepend(slides[2]);
    await Promise.resolve();
    expect(carousel.getState().index).toBe(2);
    expect(viewport.scrollLeft).toBe(200);
    Object.defineProperty(viewport, "clientWidth", { get: () => 200 });
    window.dispatchEvent(new Event("resize"));
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
    viewport.dispatchEvent(new Event("wheel"));
    expect(shift(slides[1])).toBe(wheeled);
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

  it("stops a flick at the next slide when the slides ask for a snap stop", () => {
    const { viewport, slides } = fixture([100, 100, 100, 100, 100, 100]);
    for (const slide of slides) slide.style.scrollSnapStop = "always";
    const carousel = createCarousel(viewport);
    cleanups.push(carousel.destroy);
    pointer(viewport, "pointerdown", 300);
    for (const x of [280, 250, 220]) {
      vi.advanceTimersByTime(16);
      pointer(window, "pointermove", x);
    }
    pointer(window, "pointerup", 220);
    vi.advanceTimersByTime(2000);
    expect(viewport.scrollLeft).toBe(100);
    expect(carousel.getState().index).toBe(1);
  });

  it("shows a grab cursor while a mouse drag can move the strip", () => {
    const { viewport } = fixture();
    viewport.style.cursor = "default";
    const carousel = createCarousel(viewport);
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

  it("cancels a release glide for a new drag, a wheel, or a programmatic move", () => {
    const { viewport, scrollTo } = fixture([100, 100, 100, 100]);
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
    release();
    scrollTo.mockImplementation((options) => {
      if (options.behavior !== "smooth")
        viewport.scrollLeft = options.left ?? 0;
    });
    carousel.goTo(0);
    const moved = viewport.scrollLeft;
    expect(moved).toBeGreaterThan(150);
    vi.advanceTimersByTime(1000);
    expect(viewport.scrollLeft).toBe(moved);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "smooth" });
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
    const carousel = createCarousel(viewport);
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
    const carousel = createCarousel(viewport);
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
    vi.advanceTimersByTime(1000);
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
    expect(viewport.scrollLeft).toBe(1525);
    viewport.dispatchEvent(new Event("scrollend"));
    expect(viewport.scrollLeft).toBe(3757);
    expect(carousel.getState().index).toBe(5);
    carousel.next();
    viewport.dispatchEvent(new Event("scrollend"));
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
    expect(viewport.scrollLeft).toBe(200);
    expect(carousel.getState().index).toBe(2);
    carousel.next();
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
    expect(viewport.scrollLeft).toBe(-300);
    expect(carousel.getState().index).toBe(3);
    viewport.dispatchEvent(new Event("scrollend"));
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
    await Promise.resolve();
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
  });
});
