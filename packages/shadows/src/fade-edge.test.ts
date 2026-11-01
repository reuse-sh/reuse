// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildFadeGradient, createFadeEdge } from "./index.js";

class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let scroller: HTMLElement;

function layout(scrollWidth: number, clientWidth: number, scrollLeft: number) {
  Object.defineProperty(scroller, "scrollWidth", {
    value: scrollWidth,
    configurable: true,
  });
  Object.defineProperty(scroller, "clientWidth", {
    value: clientWidth,
    configurable: true,
  });
  scroller.scrollLeft = scrollLeft;
}

const fade = (name: "--reuse-fade-start" | "--reuse-fade-end") =>
  scroller.style.getPropertyValue(name);

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  scroller = document.createElement("div");
  document.body.append(scroller);
});

afterEach(() => {
  vi.unstubAllGlobals();
  scroller.remove();
});

describe("createFadeEdge", () => {
  it("scroll mode keeps the start sharp and fades the end at scrollLeft 0", () => {
    layout(1000, 400, 0);
    const controller = createFadeEdge(scroller);
    expect(fade("--reuse-fade-start")).toBe("0px");
    expect(fade("--reuse-fade-end")).toBe("64px");
    controller.destroy();
  });

  it("fades the end once added content starts to overflow", async () => {
    layout(400, 400, 0);
    const controller = createFadeEdge(scroller);
    expect(fade("--reuse-fade-end")).toBe("0px");
    layout(800, 400, 0);
    scroller.append(document.createElement("img"));
    await Promise.resolve();
    expect(fade("--reuse-fade-end")).toBe("64px");
    controller.destroy();
  });

  it("scroll mode fades both edges after scrolling to the middle", () => {
    layout(1000, 400, 0);
    const controller = createFadeEdge(scroller);
    layout(1000, 400, 300);
    scroller.dispatchEvent(new Event("scroll"));
    expect(fade("--reuse-fade-start")).toBe("64px");
    expect(fade("--reuse-fade-end")).toBe("64px");
    controller.destroy();
  });

  it("scroll mode grows the start fade with the distance scrolled", () => {
    layout(1000, 400, 20);
    const controller = createFadeEdge(scroller);
    expect(fade("--reuse-fade-start")).toBe("20px");
    controller.destroy();
  });

  it("fixed mode fades both edges at the start and the end", () => {
    layout(1000, 400, 0);
    const controller = createFadeEdge(scroller, { mode: "fixed", size: 40 });
    expect(fade("--reuse-fade-start")).toBe("0px");
    layout(1000, 400, 1);
    controller.update();
    expect(fade("--reuse-fade-start")).toBe("40px");
    expect(fade("--reuse-fade-end")).toBe("40px");
    controller.destroy();
  });

  it("does not fade when the content fits", () => {
    layout(400, 400, 0);
    const controller = createFadeEdge(scroller, { mode: "fixed" });
    expect(fade("--reuse-fade-start")).toBe("0px");
    expect(fade("--reuse-fade-end")).toBe("0px");
    controller.destroy();
  });

  it("rejects an unknown curve", () => {
    expect(() => createFadeEdge(scroller, { curve: "bad" as never })).toThrow(
      RangeError,
    );
  });

  it("stops reacting to scroll after destroy", () => {
    layout(1000, 400, 0);
    const controller = createFadeEdge(scroller);
    controller.destroy();
    const before = scroller.style.cssText;
    layout(1000, 400, 300);
    scroller.dispatchEvent(new Event("scroll"));
    expect(scroller.style.cssText).toBe(before);
  });

  it("destroy restores a pre-existing inline style string exactly", () => {
    layout(1000, 400, 0);
    scroller.setAttribute(
      "style",
      "color: red; --reuse-fade-end: 7px; overflow-x: auto",
    );
    const original = scroller.getAttribute("style");
    const controller = createFadeEdge(scroller);
    expect(scroller.style.getPropertyValue("--reuse-fade-end")).toBe("64px");
    controller.destroy();
    expect(scroller.getAttribute("style")).toBe(original);
  });
});

describe("buildFadeGradient", () => {
  const stops = (value: string) => value.match(/rgb\(/g)?.length ?? 0;

  it("smooth uses 12 stops per edge", () => {
    expect(stops(buildFadeGradient("smooth"))).toBe(24);
  });

  it("linear uses 2 stops per edge", () => {
    expect(stops(buildFadeGradient("linear"))).toBe(4);
  });

  it("flips direction for rtl", () => {
    expect(buildFadeGradient("linear", true)).toMatch(
      /^linear-gradient\(to left,/,
    );
  });
});
