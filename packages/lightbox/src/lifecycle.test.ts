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
    matches: reduced,
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
    expect(dialog().querySelector("output")?.value).toBe("3 / 6");
    expect(dialog().querySelector(".re-lightbox-caption")?.textContent).toBe(
      "Caption 2",
    );
    expect(dialog().querySelectorAll(".re-lightbox-image")).toHaveLength(3);
    controller.next();
    expect(controller.getState().index).toBe(3);
    expect(dialog().querySelector("output")?.value).toBe("4 / 6");
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
    expect(dialog().querySelector("output")?.value).toBe("2 / 6");
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
    expect(dialog().querySelector("output")?.value).toBe("6 / 6");
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
    expect(dialog().querySelector("output")?.value).toBe("1 / 6");
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
    expect(dialog().querySelector("output")?.value).toBe("5 / 6");
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

  it("skips WAAPI travel for reduced motion", async () => {
    reduced = true;
    const animate = vi.fn(() => {
      throw new Error("Reduced motion must not animate");
    });
    Object.defineProperty(HTMLElement.prototype, "animate", {
      configurable: true,
      value: animate,
    });
    const controller = create({ duration: 280 });
    controller.open(gallery);
    await controller.close();
    expect(animate).not.toHaveBeenCalled();
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
