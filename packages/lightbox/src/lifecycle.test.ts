// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindLightboxGallery, createLightbox, type Lightbox } from "./index.js";

const gallery = Array.from({ length: 6 }, (_, i) => ({
  src: `https://example.test/full-${i}.jpg`,
  previewSrc: `https://example.test/preview-${i}.jpg`,
  width: 1600,
  height: 1200,
  alt: `Synthetic image ${i}`,
  caption: `Caption ${i}`,
}));
let controllers: Lightbox[] = [];
let reduced = false;

function create(options: Parameters<typeof createLightbox>[0] = {}) {
  const controller = createLightbox({ duration: 0, ...options });
  controllers.push(controller);
  return controller;
}

function dialog() {
  const element = document.querySelector<HTMLDialogElement>("dialog");
  if (!element) throw new Error("Missing dialog");
  return element;
}

beforeEach(() => {
  reduced = false;
  const styles = document.createElement("style");
  styles.textContent =
    ".re-lightbox-viewport { scroll-snap-type: x mandatory; }";
  document.head.append(styles);
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    },
  });
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: media.includes("reduced-motion") ? reduced : true,
    media,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const index = this.classList.contains("re-lightbox-slide")
        ? [...(this.parentElement?.children ?? [])].indexOf(this)
        : 0;
      return new DOMRect(index * 1024, 0, 1024, 768);
    },
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1024);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(1024);
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.classList.contains("re-lightbox-slide")
        ? [...(this.parentElement?.children ?? [])].indexOf(this) * 1024
        : 0;
    },
  );
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.classList.contains("re-lightbox-viewport")
        ? this.children.length * 1024
        : 1024;
    },
  );
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value(this: HTMLElement, options: ScrollToOptions) {
      this.scrollLeft = options.left ?? this.scrollLeft;
    },
  });
});

afterEach(() => {
  for (const controller of controllers) controller.destroy();
  controllers = [];
  document.head.replaceChildren();
  document.body.replaceChildren();
  document.body.removeAttribute("style");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("lightbox lifecycle", () => {
  it("opens at the requested image, renders bounded neighbors and navigates with shared carousel", async () => {
    const controller = create();
    controller.open(gallery, 2);
    expect(controller.getState()).toMatchObject({
      isOpen: true,
      index: 2,
      count: 6,
    });
    expect(dialog().querySelector(".re-lightbox-counter")?.textContent).toBe(
      "3 / 6",
    );
    expect(dialog().querySelector(".re-lightbox-caption")?.textContent).toBe(
      "Caption 2",
    );
    expect(dialog().querySelectorAll(".re-lightbox-image")).toHaveLength(3);
    controller.next();
    expect(controller.getState().index).toBe(3);
    expect(dialog().querySelector(".re-lightbox-counter")?.textContent).toBe(
      "4 / 6",
    );
    expect(
      [
        ...dialog().querySelectorAll<HTMLImageElement>(".re-lightbox-image"),
      ].map((image) => image.alt),
    ).toEqual(["Synthetic image 2", "Synthetic image 3", "Synthetic image 4"]);
    controller.goTo(100);
    expect(controller.getState().index).toBe(5);
    expect(
      dialog().querySelector<HTMLButtonElement>(".re-lightbox-next")?.disabled,
    ).toBe(true);
    await controller.close();
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("pages with mouse drag over an image without turning the drag into zoom", () => {
    vi.useFakeTimers({
      toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"],
    });
    const controller = create();
    controller.open(gallery);
    const viewport = dialog().querySelector<HTMLElement>(
      ".re-lightbox-viewport",
    );
    const image = dialog().querySelector(".re-lightbox-image");
    if (!viewport || !image) throw new Error("Missing image");
    const pointer = (target: EventTarget, type: string, x: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: 384,
        button: 0,
      });
      Object.defineProperties(event, {
        pointerId: { value: 1 },
        pointerType: { value: "mouse" },
      });
      target.dispatchEvent(event);
    };
    pointer(image, "pointerdown", 850);
    pointer(window, "pointermove", 150);
    pointer(window, "pointerup", 150);
    viewport.dispatchEvent(new Event("scrollend"));
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();
    expect(controller.getState()).toMatchObject({
      index: 1,
      zoom: { scale: 1, x: 0, y: 0 },
    });
    expect(viewport.scrollLeft).toBe(1024);
    expect(dialog().querySelector(".re-lightbox-counter")?.textContent).toBe(
      "2 / 6",
    );
  });

  it("jumps directly to distant images without traversing unloaded pages in either direction", () => {
    const controller = create();
    controller.open(gallery);
    const viewport = dialog().querySelector<HTMLElement>(
      ".re-lightbox-viewport",
    );
    if (!viewport) throw new Error("Missing viewport");
    Object.defineProperty(viewport, "scrollTo", {
      value: (options: ScrollToOptions) => {
        if (options.behavior !== "smooth")
          viewport.scrollLeft = options.left ?? 0;
      },
    });
    controller.goTo(5);
    expect(viewport.scrollLeft).toBe(5120);
    expect(dialog().querySelector(".re-lightbox-counter")?.textContent).toBe(
      "6 / 6",
    );
    expect(
      [
        ...dialog().querySelectorAll<HTMLImageElement>(".re-lightbox-image"),
      ].map((image) => image.alt),
    ).toEqual(["Synthetic image 4", "Synthetic image 5"]);
    controller.prev();
    viewport.scrollLeft = 4600;
    controller.goTo(0);
    expect(viewport.scrollLeft).toBe(0);
    expect(controller.getState()).toMatchObject({
      index: 0,
      zoom: { scale: 1, x: 0, y: 0 },
    });
    expect(dialog().querySelector(".re-lightbox-counter")?.textContent).toBe(
      "1 / 6",
    );
  });

  it("finishes paging to the active image before disabling scroll for zoom", () => {
    const controller = create();
    controller.open(gallery);
    const viewport = dialog().querySelector<HTMLElement>(
      ".re-lightbox-viewport",
    );
    if (!viewport) throw new Error("Missing viewport");
    Object.defineProperty(viewport, "scrollTo", {
      value: (options: ScrollToOptions) => {
        if (options.behavior !== "smooth")
          viewport.scrollLeft = options.left ?? 0;
      },
    });
    controller.next();
    viewport.scrollLeft = 300;
    controller.zoomTo(2);
    expect(viewport.scrollLeft).toBe(1024);
    expect(viewport.style.overflowX).toBe("hidden");
    expect(controller.getState()).toMatchObject({
      index: 1,
      zoom: { scale: 2, x: 0, y: 0 },
    });
  });

  it("does not let a prior animated zoom overwrite newer wheel geometry", async () => {
    const finishes: Array<() => void> = [];
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value(this: HTMLElement, values: Keyframe[]) {
        return {
          finished: new Promise<void>((resolve) => finishes.push(resolve)),
          commitStyles: () => {
            const final = values.at(-1)?.transform;
            if (typeof final === "string") this.style.transform = final;
          },
          cancel() {},
        };
      },
    });
    const controller = create({ duration: 280 });
    controller.open(gallery);
    controller.zoomTo(2);
    const viewport = dialog().querySelector<HTMLElement>(
      ".re-lightbox-viewport",
    );
    const frame = dialog().querySelector<HTMLElement>(".re-lightbox-frame");
    if (!viewport || !frame) throw new Error("Missing image");
    viewport.dispatchEvent(
      new WheelEvent("wheel", {
        ctrlKey: true,
        deltaY: -Math.log(1.5) * 100,
        clientX: 512,
        clientY: 384,
        cancelable: true,
      }),
    );
    expect(controller.getState().zoom.scale).toBeCloseTo(3);
    for (const finish of finishes) finish();
    await Promise.resolve();
    expect(frame.style.transform).toBe("translate(0px, 0px) scale(3)");
    controller.destroy();
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
  });

  it("reverses an interrupted opening from the current image transform", async () => {
    const frames: Array<{ node: HTMLElement; frames: Keyframe[] }> = [];
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value(this: HTMLElement, values: Keyframe[]) {
        frames.push({ node: this, frames: values });
        return {
          finished: new Promise<void>(() => {}),
          commitStyles: () => {
            if (this.classList.contains("re-lightbox-frame"))
              this.style.transform = "translate(42px, 30px) scale(0.8)";
          },
          cancel() {},
        };
      },
    });
    const controller = create({ duration: 280 });
    controller.open(gallery);
    const closing = controller.close();
    const imageFrames = frames.filter((value) =>
      value.node.classList.contains("re-lightbox-frame"),
    );
    expect(imageFrames.at(-1)?.frames[0].transform).toBe(
      "translate(42px, 30px) scale(0.8)",
    );
    controller.destroy();
    await closing;
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
  });

  it("tears down fully when the browser closes the dialog during an animation", () => {
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value() {
        return {
          finished: new Promise<void>(() => {}),
          commitStyles() {
            throw new DOMException(
              "Target element is not rendered.",
              "InvalidStateError",
            );
          },
          cancel() {},
        };
      },
    });
    const trigger = document.createElement("button");
    document.body.append(trigger);
    const controller = create({ duration: 280 });
    controller.open([{ ...gallery[0], origin: trigger }]);
    expect(trigger.style.visibility).toBe("hidden");
    dialog().close();
    expect(document.querySelector("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(trigger.style.visibility).toBe("");
    expect(controller.getState().isOpen).toBe(false);
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
  });

  it("locks and restores scroll styles, focus and source visibility", async () => {
    const trigger = document.createElement("button");
    trigger.style.visibility = "visible";
    document.body.append(trigger);
    trigger.focus();
    document.body.style.overflow = "clip";
    document.body.style.paddingRight = "7px";
    const controller = create();
    controller.open([{ ...gallery[0], origin: trigger }]);
    expect(document.body.style.overflow).toBe("hidden");
    expect(trigger.style.visibility).toBe("hidden");
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      "Close gallery",
    );
    await controller.close();
    expect(trigger.style.visibility).toBe("visible");
    expect(document.body.style.overflow).toBe("clip");
    expect(document.body.style.paddingRight).toBe("7px");
    expect(document.activeElement).toBe(trigger);
  });

  it("handles native cancel and repeated destroy without stale DOM", async () => {
    const controller = create();
    controller.open(gallery);
    const event = new Event("cancel", { cancelable: true });
    dialog().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    await controller.close();
    expect(controller.getState().isOpen).toBe(false);
    controller.open(gallery);
    controller.destroy();
    controller.destroy();
    expect(document.querySelector("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(() => controller.open(gallery)).toThrow("destroyed");
  });

  it("does not let an interrupted close remove a newly opened gallery", async () => {
    const controller = create();
    controller.open(gallery);
    const closing = controller.close();
    controller.open(gallery, 4);
    await closing;
    expect(controller.getState()).toMatchObject({
      isOpen: true,
      isClosing: false,
      index: 4,
    });
    expect(dialog().querySelector(".re-lightbox-counter")?.textContent).toBe(
      "5 / 6",
    );
    expect(document.querySelectorAll("dialog")).toHaveLength(1);
  });

  it("uses zooming image clicks by default and explicit Fantasma close semantics", async () => {
    const controller = create();
    controller.open(gallery);
    dialog()
      .querySelector(".re-lightbox-image")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, clientX: 512, clientY: 384 }),
      );
    expect(controller.getState().zoom.scale).toBe(2.5);
    controller.next();
    expect(controller.getState()).toMatchObject({
      index: 1,
      zoom: { scale: 1, x: 0, y: 0 },
    });
    await controller.close();
    const fantasma = create({ imageClick: "close", doubleTapZoom: false });
    fantasma.open(gallery);
    dialog()
      .querySelector(".re-lightbox-image")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await fantasma.close();
    expect(fantasma.getState().isOpen).toBe(false);
  });

  it("supports keyboard controls while leaving editable presenter content alone", () => {
    const controller = create({
      renderContent: ({ container }) => {
        const input = document.createElement("input");
        container.append(input);
      },
    });
    controller.open(gallery);
    dialog().dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(controller.getState().index).toBe(1);
    const input = dialog().querySelectorAll("input")[1];
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    expect(controller.getState().index).toBe(1);
    dialog().dispatchEvent(
      new KeyboardEvent("keydown", { key: "+", bubbles: true }),
    );
    expect(controller.getState().zoom.scale).toBe(1.5);
  });

  it("zooms on ctrl-wheel and pans on an ordinary wheel at zoom", () => {
    const controller = create();
    controller.open(gallery);
    const viewport = dialog().querySelector(".re-lightbox-viewport");
    const wheel = new WheelEvent("wheel", {
      ctrlKey: true,
      deltaY: -100,
      clientX: 512,
      clientY: 384,
      cancelable: true,
    });
    viewport?.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect(controller.getState().zoom.scale).toBeCloseTo(Math.E);
    viewport?.dispatchEvent(
      new WheelEvent("wheel", { deltaY: 60, deltaX: -20, cancelable: true }),
    );
    expect(controller.getState().zoom.x).toBe(20);
    expect(controller.getState().zoom.y).toBe(-60);
  });

  it("cleans presenter resources when slides leave the bounded window", async () => {
    let mounted = 0;
    let cleaned = 0;
    const controller = create({
      renderContent: () => {
        mounted++;
        return () => {
          cleaned++;
        };
      },
    });
    controller.open(gallery);
    expect(mounted).toBe(2);
    controller.goTo(5);
    expect(mounted).toBe(4);
    expect(cleaned).toBe(2);
    await controller.close();
    expect(cleaned).toBe(mounted);
  });

  it("rejects invalid input before replacing the active gallery", () => {
    const controller = create();
    controller.open(gallery, 2);
    expect(() => controller.open([])).toThrow("at least one");
    expect(() => controller.open([{ src: "" }])).toThrow("source");
    expect(() =>
      controller.open([{ src: "image.jpg", width: Number.NaN }]),
    ).toThrow("dimensions");
    expect(controller.getState().index).toBe(2);
  });

  it("fades in place for reduced motion, without moving or scaling the photo", async () => {
    reduced = true;
    const animated: Keyframe[][] = [];
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value(frames: Keyframe[], timing: KeyframeAnimationOptions) {
        animated.push(frames);
        const finished = new Promise<void>((resolve) =>
          setTimeout(resolve, Number(timing.duration)),
        );
        return { finished, cancel() {}, commitStyles() {} };
      },
    });
    const controller = create({ duration: 280 });
    controller.open(gallery);
    await controller.close();
    expect(animated.length).toBeGreaterThan(0);
    expect(
      animated
        .flat()
        .filter((frame) => "transform" in frame || "clipPath" in frame),
    ).toEqual([]);
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
  });

  it("binds a native gallery without URL side effects and detaches on destroy", () => {
    const root = document.createElement("div");
    const image = document.createElement("img");
    image.src = "https://example.test/gallery.jpg";
    root.append(image);
    document.body.append(root);
    const controller = bindLightboxGallery(root, { duration: 0 });
    controllers.push(controller);
    const href = window.location.href;
    image.click();
    expect(controller.getState().count).toBe(1);
    expect(
      dialog().querySelector<HTMLImageElement>(".re-lightbox-image")?.src,
    ).toBe(image.src);
    expect(window.location.href).toBe(href);
    controller.destroy();
    image.click();
    expect(document.querySelector("dialog")).toBeNull();
  });
  it("keeps the preview until the full image has decoded and ignores late decodes after teardown", async () => {
    const loaders: HTMLImageElement[] = [];
    const source = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    );
    vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(
      function (this: HTMLImageElement, value: string) {
        source?.set?.call(this, value);
        if (!this.className) loaders.push(this);
      },
    );
    let resolveDecode: () => void = () => {};
    Object.defineProperty(HTMLImageElement.prototype, "decode", {
      configurable: true,
      value: () =>
        new Promise<void>((resolve) => {
          resolveDecode = resolve;
        }),
    });
    const controller = create({ preload: 0 });
    controller.open(gallery);
    const image =
      dialog().querySelector<HTMLImageElement>(".re-lightbox-image");
    expect(image?.src).toBe(gallery[0].previewSrc);
    loaders[0].dispatchEvent(new Event("load"));
    expect(image?.src).toBe(gallery[0].previewSrc);
    resolveDecode();
    await Promise.resolve();
    expect(image?.src).toBe(gallery[0].src);
    controller.goTo(1);
    loaders[1].dispatchEvent(new Event("load"));
    controller.destroy();
    resolveDecode();
    await Promise.resolve();
    expect(document.querySelector("dialog")).toBeNull();
    expect(image?.hasAttribute("src")).toBe(false);
    delete (HTMLImageElement.prototype as { decode?: unknown }).decode;
  });

  it("shows a load failure instead of silently displaying a missing image", () => {
    const loaders: HTMLImageElement[] = [];
    const source = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    );
    vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(
      function (this: HTMLImageElement, value: string) {
        source?.set?.call(this, value);
        if (!this.className) loaders.push(this);
      },
    );
    const controller = create();
    controller.open([{ src: "https://example.test/missing.jpg" }]);
    loaders[0].dispatchEvent(new Event("error"));
    expect(dialog().querySelector('[role="status"]')?.textContent).toBe(
      "Image could not be loaded.",
    );
  });

  it("handles touch double tap, pinch, cancellation and pull dismissal", async () => {
    const controller = create();
    controller.open(gallery);
    const viewport = dialog().querySelector<HTMLElement>(
      ".re-lightbox-viewport",
    );
    if (!viewport) throw new Error("Missing viewport");
    const pointer = (type: string, id: number, x: number, y: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: x,
        clientY: y,
      });
      Object.defineProperties(event, {
        pointerId: { value: id },
        pointerType: { value: "touch" },
      });
      viewport.dispatchEvent(event);
    };
    pointer("pointerdown", 1, 512, 384);
    pointer("pointerup", 1, 512, 384);
    pointer("pointerdown", 1, 512, 384);
    pointer("pointerup", 1, 512, 384);
    expect(controller.getState().zoom.scale).toBe(2.5);
    controller.zoomTo(1);
    pointer("pointerdown", 1, 400, 384);
    pointer("pointerdown", 2, 600, 384);
    pointer("pointermove", 2, 800, 384);
    expect(controller.getState().zoom.scale).toBe(2);
    pointer("pointercancel", 2, 800, 384);
    pointer("pointercancel", 1, 400, 384);
    expect(controller.getState().isOpen).toBe(true);
    controller.zoomTo(1);
    pointer("pointerdown", 1, 512, 384);
    pointer("pointermove", 1, 512, 550);
    pointer("pointerup", 1, 512, 550);
    await controller.close();
    expect(controller.getState().isOpen).toBe(false);
  });

  it("honors disabled double-tap zoom", () => {
    const controller = create({ imageClick: "none", doubleTapZoom: false });
    controller.open(gallery);
    const viewport = dialog().querySelector(".re-lightbox-viewport");
    for (let tap = 0; tap < 2; tap++) {
      for (const type of ["pointerdown", "pointerup"]) {
        const event = new MouseEvent(type, {
          bubbles: true,
          button: 0,
          clientX: 512,
          clientY: 384,
        });
        Object.defineProperties(event, {
          pointerId: { value: 1 },
          pointerType: { value: "touch" },
        });
        viewport?.dispatchEvent(event);
      }
    }
    expect(controller.getState().zoom.scale).toBe(1);
  });
  it("settles canceled WAAPI transitions before reopening and clears animation deadlines", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let active = 0;
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value() {
        active++;
        let rejectAnimation: (reason: Error) => void = () => {};
        const finished = new Promise<void>((_resolve, reject) => {
          rejectAnimation = reject;
        });
        let canceled = false;
        return {
          finished,
          cancel() {
            if (canceled) return;
            canceled = true;
            active--;
            rejectAnimation(new Error("Canceled"));
          },
        };
      },
    });
    const controller = create({ duration: 280 });
    controller.open(gallery);
    expect(active).toBe(2);
    const closing = controller.close();
    controller.open(gallery, 3);
    await closing;
    expect(controller.getState()).toMatchObject({ isOpen: true, index: 3 });
    controller.destroy();
    await Promise.resolve();
    expect(active).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
    vi.useRealTimers();
  });

  it("restores document styles when native dialog refuses to open", () => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value() {
        throw new DOMException("Not connected");
      },
    });
    const controller = create();
    expect(() => controller.open(gallery)).toThrow("Not connected");
    expect(document.querySelector("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(controller.getState().isOpen).toBe(false);
  });
  it("updates native pan geometry live and notifies observers only when the pointer finishes", () => {
    const changed: Array<{ scale: number; x: number; y: number }> = [];
    const subscribed: Array<{ scale: number; x: number; y: number }> = [];
    const controller = create({
      onChange: (next) => {
        changed.push({ ...next.zoom });
      },
    });
    controller.subscribe((next) => {
      subscribed.push({ ...next.zoom });
    });
    controller.open(gallery);
    controller.zoomTo(2);
    const viewport = dialog().querySelector<HTMLElement>(
      ".re-lightbox-viewport",
    );
    const frame = dialog().querySelector<HTMLElement>(
      '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
    );
    if (!viewport || !frame) throw new Error("Missing native image");
    const pointer = (type: string, x: number, y: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        clientX: x,
        clientY: y,
      });
      Object.defineProperties(event, {
        pointerId: { value: 1 },
        pointerType: { value: "mouse" },
      });
      viewport.dispatchEvent(event);
    };
    const discrete = [
      { scale: 1, x: 0, y: 0 },
      { scale: 2, x: 0, y: 0 },
    ];
    expect(changed).toEqual(discrete);
    expect(subscribed).toEqual(discrete);
    pointer("pointerdown", 512, 384);
    for (const [x, y] of [
      [532, 394],
      [552, 404],
      [572, 414],
    ]) {
      pointer("pointermove", x, y);
      expect(controller.getState().zoom).toEqual({
        scale: 2,
        x: x - 512,
        y: y - 384,
      });
      expect(frame.style.transform).toBe(
        `translate(${x - 512}px, ${y - 384}px) scale(2)`,
      );
      expect(changed).toEqual(discrete);
      expect(subscribed).toEqual(discrete);
    }
    pointer("pointerup", 572, 414);
    const completed = [...discrete, { scale: 2, x: 60, y: 30 }];
    expect(changed).toEqual(completed);
    expect(subscribed).toEqual(completed);
    expect(controller.getState().zoom).toEqual(completed[2]);
    expect(frame.style.transform).toBe("translate(60px, 30px) scale(2)");
  });

  it("keeps wheel zoom and pan native until wheel input settles and cancels its deadline on destroy", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const observed: Array<{ scale: number; x: number; y: number }> = [];
    const controller = create({
      onChange: (next) => {
        observed.push({ ...next.zoom });
      },
    });
    controller.open(gallery);
    controller.zoomTo(2);
    const viewport = dialog().querySelector<HTMLElement>(
      ".re-lightbox-viewport",
    );
    const frame = dialog().querySelector<HTMLElement>(
      '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
    );
    if (!viewport || !frame) throw new Error("Missing native image");
    const discrete = [
      { scale: 1, x: 0, y: 0 },
      { scale: 2, x: 0, y: 0 },
    ];
    for (let sample = 0; sample < 3; sample++) {
      viewport.dispatchEvent(
        new WheelEvent("wheel", { deltaX: -20, deltaY: 10, cancelable: true }),
      );
      vi.advanceTimersByTime(50);
      expect(observed).toEqual(discrete);
    }
    expect(controller.getState().zoom).toEqual({ scale: 2, x: 60, y: -30 });
    expect(frame.style.transform).toBe("translate(60px, -30px) scale(2)");
    vi.advanceTimersByTime(100);
    expect(observed).toEqual([...discrete, { scale: 2, x: 60, y: -30 }]);
    viewport.dispatchEvent(
      new WheelEvent("wheel", {
        ctrlKey: true,
        deltaY: -Math.log(1.5) * 100,
        clientX: 512,
        clientY: 384,
        cancelable: true,
      }),
    );
    expect(controller.getState().zoom.scale).toBeCloseTo(3);
    expect(observed).toHaveLength(3);
    vi.advanceTimersByTime(150);
    expect(observed.at(-1)?.scale).toBeCloseTo(3);
    expect(observed.at(-1)?.x).toBeCloseTo(90);
    expect(observed.at(-1)?.y).toBeCloseTo(-45);
    viewport.dispatchEvent(
      new WheelEvent("wheel", { deltaY: 10, cancelable: true }),
    );
    controller.destroy();
    const completed = observed.map((zoom) => ({ ...zoom }));
    vi.advanceTimersByTime(500);
    expect(observed).toEqual(completed);
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});

describe("lightbox public API", () => {
  const german = {
    dialog: "Bildergalerie",
    slide: (index: number, count: number) => `Bild ${index + 1} von ${count}`,
    counter: (index: number, count: number) => `${index + 1} von ${count}`,
    close: "Schließen",
    previous: "Vorheriges Bild",
    next: "Nächstes Bild",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    fullscreenEnter: "Vollbild",
    fullscreenExit: "Vollbild beenden",
    download: "Herunterladen",
    thumbnails: "Bild wählen",
    thumbnail: (index: number) => `Bild ${index + 1} zeigen`,
    slideshowStart: "Diashow starten",
    slideshowStop: "Diashow beenden",
    loading: "Wird geladen",
    error: "Das Bild konnte nicht geladen werden.",
    retry: "Erneut versuchen",
  };

  it("names and labels everything from strings, the failed image included", () => {
    const loaders: HTMLImageElement[] = [];
    const source = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    );
    vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(
      function (this: HTMLImageElement, value: string) {
        source?.set?.call(this, value);
        if (value.endsWith("missing.jpg")) loaders.push(this);
      },
    );
    const controller = create({ strings: german, thumbnails: true });
    controller.open(
      [{ src: "https://example.test/missing.jpg" }, ...gallery.slice(1, 3)],
      0,
    );
    loaders[0].dispatchEvent(new Event("error"));
    controller.zoomTo(2);
    const texts = [
      ...dialog().querySelectorAll<HTMLElement>("*"),
      dialog(),
    ].flatMap((element) => [
      element.getAttribute("aria-label") ?? "",
      element.children.length ? "" : (element.textContent ?? ""),
    ]);
    expect(
      texts.filter((text) =>
        /image|gallery|close|previous|next|zoom|show|choose|could not/i.test(
          text,
        ),
      ),
    ).toEqual([]);
    expect(dialog().getAttribute("aria-label")).toBe("Bildergalerie");
    expect(dialog().querySelector(".re-lightbox-counter")?.textContent).toBe(
      "1 von 3",
    );
    expect(dialog().querySelector('[role="status"]')?.textContent).toBe(
      "Das Bild konnte nicht geladen werden.",
    );
    expect(
      dialog().querySelector(".re-lightbox-zoom")?.getAttribute("aria-label"),
    ).toBe("Verkleinern");
  });

  it("reports open, change, beforeclose and closed in order and lets beforeclose keep the dialog", async () => {
    const controller = create({ history: false });
    const events: string[] = [];
    for (const type of [
      "open",
      "opened",
      "change",
      "beforeclose",
      "closed",
    ] as const)
      controller.on(type, (event) =>
        events.push(`${event.type} ${event.index}`),
      );
    const stop = controller.on("beforeclose", (event) =>
      event.preventDefault(),
    );
    controller.open(gallery, 1);
    await Promise.resolve();
    await Promise.resolve();
    controller.next();
    await controller.close();
    expect(dialog().open).toBe(true);
    expect(controller.getState().isOpen).toBe(true);
    stop();
    await controller.close();
    expect(document.querySelector("dialog")).toBeNull();
    expect(events).toEqual([
      "open 1",
      "opened 1",
      "change 2",
      "beforeclose 2",
      "beforeclose 2",
      "closed 2",
    ]);
  });

  it("closes once when beforeclose calls close, and reports closed when open replaces a viewer", async () => {
    const controller = create({ history: false });
    const events: string[] = [];
    for (const type of ["open", "beforeclose", "closed"] as const)
      controller.on(type, (event) => events.push(event.type));
    controller.on("beforeclose", () => {
      void controller.close();
    });
    controller.open(gallery, 0);
    controller.open(gallery, 1);
    await controller.close();
    expect(document.querySelector("dialog")).toBeNull();
    expect(events).toEqual(["open", "closed", "open", "beforeclose", "closed"]);
  });

  it("puts a pulled photo back when beforeclose keeps the dialog", () => {
    const controller = create({ history: false });
    controller.on("beforeclose", (event) => event.preventDefault());
    controller.open(gallery);
    const viewport = dialog().querySelector<HTMLElement>(
      ".re-lightbox-viewport",
    );
    if (!viewport) throw new Error("Missing viewport");
    const pointer = (type: string, y: number) => {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: 512,
        clientY: y,
      });
      Object.defineProperties(event, {
        pointerId: { value: 1 },
        pointerType: { value: "touch" },
      });
      viewport.dispatchEvent(event);
    };
    pointer("pointerdown", 300);
    pointer("pointermove", 500);
    pointer("pointerup", 500);
    expect(controller.getState()).toMatchObject({
      isOpen: true,
      isClosing: false,
      zoom: { scale: 1, x: 0, y: 0 },
    });
  });

  it("drops the zoom when setItems moves the current image", () => {
    const controller = create({ history: false });
    const items = gallery.slice(0, 5);
    controller.open(items, 2);
    controller.zoomTo(2);
    controller.setItems([gallery[5], ...items]);
    expect(controller.getState()).toMatchObject({
      index: 3,
      zoom: { scale: 1 },
    });
    expect(dialog().dataset.zoomed).toBe("false");
    controller.setOptions({ loop: true });
    controller.zoomTo(2);
    controller.append(gallery.slice(0, 1));
    expect(controller.getState()).toMatchObject({
      index: 3,
      count: 7,
      zoom: { scale: 1 },
    });
  });

  it("mounts slots in their places, updates them with the state and destroys them once", async () => {
    const updates: number[] = [];
    let destroyed = 0;
    const controller = create({
      history: false,
      slots: {
        toolbarEnd: ({ document: doc }) => {
          const share = doc.createElement("button");
          share.className = "re-lightbox-button";
          share.textContent = "Share";
          return {
            node: share,
            update: (state) => updates.push(state.index),
            destroy: () => {
              destroyed++;
            },
          };
        },
        footer: ({ document: doc }) => ({ node: doc.createElement("nav") }),
        aside: ({ document: doc }) => ({ node: doc.createElement("aside") }),
      },
    });
    controller.open(gallery, 0);
    const share =
      dialog().querySelector(".re-lightbox-close")?.previousElementSibling;
    expect(share?.textContent).toBe("Share");
    expect(share?.parentElement?.className).toBe("re-lightbox-toolbar-end");
    expect(dialog().querySelector(".re-lightbox-caption + nav")).not.toBeNull();
    expect(dialog().querySelector(".re-lightbox-aside > aside")).not.toBeNull();
    controller.next();
    expect(updates.slice(0, 1)).toEqual([0]);
    expect(updates).toContain(1);
    await controller.close();
    controller.destroy();
    expect(destroyed).toBe(1);
  });

  it("keeps the current image when the list grows or changes around it", () => {
    const controller = create({ history: false });
    const items = gallery.slice(0, 5);
    controller.open(items, 4);
    const current = controller.getSlide(4);
    controller.append(gallery.slice(5));
    expect(controller.getState()).toMatchObject({ index: 4, count: 6 });
    expect(controller.getSlide(4)).toBe(current);
    expect(dialog().querySelector(".re-lightbox-counter")?.textContent).toBe(
      "5 / 6",
    );
    expect(
      dialog().querySelector<HTMLButtonElement>(".re-lightbox-next")?.disabled,
    ).toBe(false);
    const extra = { src: "https://example.test/extra.jpg" };
    controller.setItems([extra, ...items, gallery[5]]);
    expect(controller.getState()).toMatchObject({ index: 5, count: 7 });
    expect(controller.getSlide(5)).toBe(current);
    expect(current?.isConnected).toBe(true);
  });

  it("shows index, or else the nearest image left, when the current one is removed", () => {
    const controller = create({ history: false });
    controller.open(gallery, 3);
    controller.setItems([...gallery.slice(0, 3), ...gallery.slice(4)]);
    expect(controller.getState()).toMatchObject({ index: 3, count: 5 });
    expect(controller.getSlide(3)?.getAttribute("aria-label")).toBe(
      "Image 4 of 5",
    );
    controller.setItems(gallery.slice(0, 2), 0);
    expect(controller.getState()).toMatchObject({ index: 0, count: 2 });
    expect(dialog().querySelectorAll(".re-lightbox-slide")).toHaveLength(2);
  });

  it("opens only the images of the clicked group", () => {
    const root = document.createElement("div");
    root.innerHTML = ["a", "b", "a", "b", "b"]
      .map(
        (group, index) =>
          `<a data-lightbox-group="${group}"><img src="https://example.test/${index}.jpg" alt="${group}${index}"></a>`,
      )
      .join("");
    document.body.append(root);
    const controller = bindLightboxGallery(root, {
      duration: 0,
      history: false,
    });
    controllers.push(controller);
    root.querySelectorAll("img")[3].click();
    expect(controller.getState()).toMatchObject({ count: 3, index: 1 });
    expect(
      [
        ...dialog().querySelectorAll<HTMLImageElement>(".re-lightbox-image"),
      ].map((image) => image.alt),
    ).toEqual(["b1", "b3", "b4"]);
  });

  it("opens the list items(root) returns at the clicked image", () => {
    const root = document.createElement("div");
    root.innerHTML = `<img src="https://example.test/0.jpg"><img src="https://example.test/1.jpg">`;
    document.body.append(root);
    const [first, second] = root.querySelectorAll("img");
    const controller = bindLightboxGallery(root, {
      duration: 0,
      history: false,
      items: () => [
        { src: "https://example.test/hidden.jpg" },
        { src: "https://example.test/1-large.jpg", origin: second },
        { src: "https://example.test/0-large.jpg", origin: first },
      ],
    });
    controllers.push(controller);
    second.click();
    expect(controller.getState()).toMatchObject({ count: 3, index: 1 });
  });

  it("adds one history entry, closes on Back and goes back after another close", async () => {
    // Earlier tests' destroy() sent backs that land on a later task.
    await new Promise((resolve) => setTimeout(resolve, 10));
    const controller = create();
    controller.open(gallery, 0);
    const opened = history.length;
    const entry = (history.state as Record<string, unknown>).reuseLightbox;
    expect(entry).toEqual(expect.any(String));
    controller.open(gallery, 2);
    expect(history.length).toBe(opened);
    history.back();
    await vi.waitFor(() => expect(document.querySelector("dialog")).toBeNull());
    controller.open(gallery, 1);
    expect(history.length).toBe(opened);
    expect((history.state as Record<string, unknown>).reuseLightbox).toBe(
      entry,
    );
    const popped = new Promise((resolve) =>
      addEventListener("popstate", resolve, { once: true }),
    );
    await controller.close();
    await popped;
    expect(history.length).toBe(opened);
    expect(
      (history.state as Record<string, unknown> | null)?.reuseLightbox,
    ).not.toBe(entry);
  });

  it("reports closed once the back lands, or before a new open, and stops when a closed listener destroys", async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    const controller = create();
    const events: string[] = [];
    for (const type of ["open", "closed"] as const)
      controller.on(type, (event) => events.push(event.type));
    controller.open(gallery, 0);
    void controller.close();
    for (let tick = 0; tick < 5; tick++) await Promise.resolve();
    expect(controller.getState().isOpen).toBe(false);
    expect(events).toEqual(["open"]);
    controller.open(gallery, 1);
    expect(events).toEqual(["open", "closed", "open"]);
    dialog().close();
    expect(events).toEqual(["open", "closed", "open"]);
    await vi.waitFor(() =>
      expect(events).toEqual(["open", "closed", "open", "closed"]),
    );
    const destroying = create({ history: false });
    destroying.on("closed", () => destroying.destroy());
    destroying.open(gallery, 0);
    destroying.open(gallery, 1);
    expect(document.querySelector("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("waits for a back on its way instead of closing the next lightbox or going back twice", async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    const first = create();
    const second = create();
    first.open(gallery, 0);
    const opened = history.length;
    const pops: unknown[] = [];
    const count = (event: Event) => pops.push(event);
    addEventListener("popstate", count);
    first.destroy();
    second.open(gallery, 1);
    await second.close();
    second.open(gallery, 2);
    await new Promise((resolve) => setTimeout(resolve, 10));
    removeEventListener("popstate", count);
    expect(pops).toHaveLength(1);
    expect(second.getState().isOpen).toBe(true);
    expect(history.length).toBe(opened);
    expect((history.state as Record<string, unknown>).reuseLightbox).toEqual(
      expect.any(String),
    );
  });
});

describe("lightbox chrome, taps and keys", () => {
  const touch = (type: string, x = 512, y = 384, target?: Element) => {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: x,
      clientY: y,
    });
    Object.defineProperties(event, {
      pointerId: { value: 1 },
      pointerType: { value: "touch" },
    });
    (target ?? dialog().querySelector(".re-lightbox-viewport"))?.dispatchEvent(
      event,
    );
  };
  const tap = (x = 512, y = 384) => {
    touch("pointerdown", x, y);
    touch("pointerup", x, y);
  };
  const key = (init: KeyboardEventInit) =>
    dialog().dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ...init,
      }),
    );

  it("toggles the controls 300ms after a single tap, and a second tap brings them back", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const controller = create();
    controller.open(gallery);
    tap();
    vi.advanceTimersByTime(299);
    expect(dialog().dataset.chrome).toBe("shown");
    vi.advanceTimersByTime(1);
    expect(dialog().dataset.chrome).toBe("hidden");
    expect(controller.getState().chrome).toBe("hidden");
    vi.advanceTimersByTime(500);
    tap();
    vi.advanceTimersByTime(300);
    expect(controller.getState().chrome).toBe("shown");
  });

  it("zooms on a double tap without the single tap's toggle", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    const controller = create();
    controller.open(gallery);
    tap();
    vi.advanceTimersByTime(120);
    tap();
    expect(controller.getState().zoom.scale).toBe(2.5);
    expect(controller.getState().chrome).toBe("hidden");
    vi.advanceTimersByTime(1000);
    expect(controller.getState().chrome).toBe("hidden");
    tap();
    vi.advanceTimersByTime(100);
    tap();
    expect(controller.getState()).toMatchObject({
      zoom: { scale: 1 },
      chrome: "shown",
    });
    vi.advanceTimersByTime(1000);
    expect(controller.getState().chrome).toBe("shown");
  });

  it("closes on a tap beside the photo, and on any tap with imageClick close", async () => {
    const controller = create({ history: false });
    controller.open(gallery);
    const frame = dialog().querySelector<HTMLElement>(
      '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
    );
    if (!frame) throw new Error("Missing frame");
    frame.getBoundingClientRect = () => new DOMRect(212, 159, 600, 450);
    tap(512, 100);
    expect(controller.getState().isClosing).toBe(true);
    await controller.close();
    const closer = create({ imageClick: "close", history: false });
    closer.open(gallery);
    tap();
    expect(closer.getState()).toMatchObject({
      isClosing: true,
      zoom: { scale: 1 },
    });
  });

  it("hides a still mouse's controls after autoHide and never with autoHide false", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const controller = create();
    controller.open(gallery);
    vi.advanceTimersByTime(2499);
    expect(dialog().dataset.chrome).toBe("shown");
    vi.advanceTimersByTime(1);
    expect(dialog().dataset.chrome).toBe("hidden");
    controller.destroy();
    expect(vi.getTimerCount()).toBe(0);
    const pinned = create({ autoHide: false });
    pinned.open(gallery);
    vi.advanceTimersByTime(10_000);
    expect(dialog().dataset.chrome).toBe("shown");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("shows hidden controls on any key and pages with Home and End", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const controller = create();
    controller.open(gallery, 2);
    vi.advanceTimersByTime(2500);
    expect(dialog().dataset.chrome).toBe("hidden");
    key({ key: "Shift" });
    expect(dialog().dataset.chrome).toBe("shown");
    key({ key: "End" });
    expect(controller.getState().index).toBe(5);
    key({ key: "Home" });
    expect(controller.getState().index).toBe(0);
  });

  it("closes on Escape while zoomed", () => {
    const controller = create({ history: false });
    controller.open(gallery);
    controller.zoomTo(2);
    dialog().dispatchEvent(new Event("cancel", { cancelable: true }));
    expect(controller.getState().isClosing).toBe(true);
  });

  it("leaves keys with Alt, Ctrl or Meta to the browser", () => {
    const controller = create();
    controller.open(gallery, 2);
    for (const modifier of ["altKey", "ctrlKey", "metaKey"]) {
      key({ key: "ArrowRight", [modifier]: true });
      key({ key: "=", [modifier]: true });
    }
    expect(controller.getState()).toMatchObject({
      index: 2,
      zoom: { scale: 1 },
    });
  });

  it("shows one photo without arrows, counter or paging", () => {
    const controller = create();
    controller.open(gallery.slice(0, 1));
    for (const selector of [
      ".re-lightbox-prev",
      ".re-lightbox-next",
      ".re-lightbox-counter",
    ])
      expect(dialog().querySelector<HTMLElement>(selector)?.hidden).toBe(true);
    controller.append(gallery.slice(1, 2));
    expect(
      dialog().querySelector<HTMLElement>(".re-lightbox-next")?.hidden,
    ).toBe(false);
  });

  it("rewrites only the counter characters that change and announces the slide once in its own region", () => {
    const controller = create();
    controller.open(
      Array.from({ length: 12 }, (_, i) => ({ ...gallery[0], src: `${i}` })),
      8,
    );
    const counter = dialog().querySelector(".re-lightbox-counter");
    const status = dialog().querySelector('[role="status"]');
    expect(counter?.getAttribute("aria-hidden")).toBe("true");
    expect(counter?.textContent).toBe("9 / 12");
    const tail = [...(counter?.children ?? [])].slice(1);
    controller.next();
    expect(counter?.textContent).toBe("10 / 12");
    expect([...(counter?.children ?? [])].slice(2)).toEqual(tail);
    expect(status?.textContent).toBe("Image 10 of 12");
    const nodes = [...(counter?.querySelectorAll("span") ?? [])].map(
      (cell) => cell.firstChild,
    );
    controller.setOptions({ loop: true });
    expect(
      [...(counter?.querySelectorAll("span") ?? [])].map(
        (cell) => cell.firstChild,
      ),
    ).toEqual(nodes);
    expect(
      dialog().querySelectorAll("[aria-live], [role=status]"),
    ).toHaveLength(1);
  });
});
