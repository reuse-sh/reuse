import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createThinkingDots, figureConfig } from "./index.js";
import { ThinkingDots } from "./react.js";

describe("native loader lifecycle", () => {
  it("paints actual figure points, pauses the clock, and restores the canvas", () => {
    const dom = new JSDOM(
      '<canvas width="80" height="60" style="color: rgb(20, 20, 20)"></canvas>',
      { pretendToBeVisual: true },
    );
    const win = dom.window;
    const canvas = win.document.querySelector("canvas");
    if (!canvas) throw new Error("Missing fixture");
    const frames = new Map<number, FrameRequestCallback>();
    let next = 0;
    win.requestAnimationFrame = (callback) => {
      frames.set(++next, callback);
      return next;
    };
    win.cancelAnimationFrame = (id) => {
      frames.delete(id);
    };
    Object.defineProperty(win, "matchMedia", {
      value: () => ({
        matches: false,
        addEventListener() {},
        removeEventListener() {},
      }),
    });
    const arcs: number[][] = [];
    const context = {
      setTransform() {},
      clearRect() {},
      beginPath() {},
      fill() {},
      arc(...args: number[]) {
        arcs.push(args);
      },
      fillStyle: "",
      globalAlpha: 1,
    };
    Object.defineProperty(canvas, "getContext", { value: () => context });
    const originalStyle = canvas.getAttribute("style");
    const controller = createThinkingDots(canvas, {
      size: 32,
      config: {
        ...figureConfig("triangle-turn"),
        trail: { count: 0, gap: 0.02 },
      },
    });
    expect(arcs).toHaveLength(3);
    expect(
      arcs.every(
        ([x, y, radius]) =>
          Number.isFinite(x) && Number.isFinite(y) && radius > 0,
      ),
    ).toBe(true);
    expect(canvas.width).toBe(32);
    expect(frames.size).toBe(1);
    controller.pause();
    expect(frames.size).toBe(0);
    controller.play();
    expect(frames.size).toBe(1);
    controller.destroy();
    controller.destroy();
    expect(frames.size).toBe(0);
    expect(canvas.width).toBe(80);
    expect(canvas.height).toBe(60);
    expect(canvas.getAttribute("style")).toBe(originalStyle);
  });
  it("renders a static figure without scheduling motion when reduced motion is active", () => {
    const dom = new JSDOM("<canvas></canvas>", { pretendToBeVisual: true });
    const canvas = dom.window.document.querySelector("canvas");
    if (!canvas) throw new Error("Missing fixture");
    let requested = 0;
    dom.window.requestAnimationFrame = () => ++requested;
    Object.defineProperty(dom.window, "matchMedia", {
      value: () => ({
        matches: true,
        addEventListener() {},
        removeEventListener() {},
      }),
    });
    const arcs: number[][] = [];
    Object.defineProperty(canvas, "getContext", {
      value: () => ({
        setTransform() {},
        clearRect() {},
        beginPath() {},
        fill() {},
        arc(...args: number[]) {
          arcs.push(args);
        },
        fillStyle: "",
        globalAlpha: 1,
      }),
    });
    const controller = createThinkingDots(canvas);
    expect(arcs.length).toBeGreaterThan(0);
    expect(requested).toBe(0);
    controller.destroy();
  });
});

describe("React loader fallback", () => {
  it("renders visible status dots before canvas enhancement", () => {
    const markup = renderToStaticMarkup(
      createElement(ThinkingDots, { size: 48, label: "Writing a reply" }),
    );
    const dom = new JSDOM(markup);
    const status = dom.window.document.querySelector('[role="status"]');
    const fallback = dom.window.document.querySelector<HTMLElement>(
      ".re-thinking-dots__fallback",
    );
    const canvas = dom.window.document.querySelector("canvas");
    expect(status?.getAttribute("aria-label")).toBe("Writing a reply");
    expect(fallback?.hidden).toBe(false);
    expect(fallback?.children).toHaveLength(3);
    expect(fallback?.style.width).toBe("48px");
    expect(fallback?.style.height).toBe("48px");
    expect(canvas?.hidden).toBe(true);
  });
});

it("replaces fallback dots only after painting and cancels animation on unmount", async () => {
  const dom = new JSDOM('<div id="root"></div>', { pretendToBeVisual: true });
  const frames = new Set<number>();
  let frame = 0;
  let paints = 0;
  dom.window.requestAnimationFrame = () => {
    frames.add(++frame);
    return frame;
  };
  dom.window.cancelAnimationFrame = (id) => {
    frames.delete(id);
  };
  Object.defineProperty(dom.window, "matchMedia", {
    value: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, "getContext", {
    value: () => ({
      setTransform() {},
      clearRect() {},
      beginPath() {},
      fill() {},
      arc() {
        paints++;
      },
      fillStyle: "",
      globalAlpha: 1,
    }),
  });
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const host = dom.window.document.getElementById("root");
  if (!host) throw new Error("Missing fixture");
  const root = createRoot(host);
  try {
    await act(() =>
      root.render(createElement(ThinkingDots, { label: "Loading" })),
    );
    expect(paints).toBeGreaterThan(0);
    expect(host.querySelector("canvas")?.hidden).toBe(false);
    expect(
      host.querySelector<HTMLElement>(".re-thinking-dots__fallback")?.hidden,
    ).toBe(true);
    expect(frames.size).toBe(1);
  } finally {
    await act(() => root.unmount());
    vi.unstubAllGlobals();
    dom.window.close();
  }
  expect(frames.size).toBe(0);
});
