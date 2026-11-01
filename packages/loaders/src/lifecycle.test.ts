import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { createThinkingDots, figureConfig } from "./index.js";

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
