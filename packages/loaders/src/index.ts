import { THINKING_DOTS, type ThinkingDotsConfig } from "./config.js";
import { createTimeline, drawFrame } from "./engine.js";
import { FIGURES, type FigureName } from "./figures.js";

export {
  THINKING_DOTS,
  type ThinkingDotsConfig,
  type Timing,
} from "./config.js";
export {
  createTimeline,
  type DotSample,
  drawFrame,
  sampleDot,
  type Timeline,
} from "./engine.js";
export { FIGURES, type FigureName, type Point } from "./figures.js";

export const figureNames = Object.keys(FIGURES) as FigureName[];

export function figureConfig(name: FigureName): ThinkingDotsConfig {
  const figure = THINKING_DOTS.figures.find((entry) => entry.name === name);
  if (!figure) throw new TypeError(`Unknown loader figure: ${name}`);
  return { ...THINKING_DOTS, figures: [figure] };
}

export interface ThinkingDotsOptions {
  size?: number;
  config?: ThinkingDotsConfig;
  seed?: number;
}

export function createThinkingDots(
  canvas: HTMLCanvasElement,
  options: ThinkingDotsOptions = {},
) {
  const win = canvas.ownerDocument.defaultView;
  if (!win)
    throw new TypeError("The canvas must belong to a browser document.");
  const size = options.size ?? 24;
  if (!Number.isFinite(size) || size <= 0)
    throw new RangeError("Loader size must be positive.");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A 2D canvas context is required.");
  let timeline = createTimeline(
    options.config ?? THINKING_DOTS,
    options.seed ?? 7,
  );
  let frame = 0;
  let previous: number | null = null;
  let elapsed = 0;
  let isVisible = true;
  let isPlaying = true;
  let isDestroyed = false;
  const original = {
    width: canvas.getAttribute("width"),
    height: canvas.getAttribute("height"),
    style: canvas.getAttribute("style"),
  };
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
  const setSize = () => {
    const dpr = Math.min(3, win.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const paint = () =>
    drawFrame(
      context,
      timeline,
      reduced.matches ? 0 : elapsed,
      size,
      win.getComputedStyle(canvas).color,
    );
  const shouldRun = () =>
    !isDestroyed &&
    isPlaying &&
    isVisible &&
    !canvas.ownerDocument.hidden &&
    !reduced.matches;
  const tick = (now: number) => {
    if (!shouldRun()) return;
    if (previous !== null) elapsed += (now - previous) / 1000;
    previous = now;
    paint();
    frame = win.requestAnimationFrame(tick);
  };
  const sync = () => {
    win.cancelAnimationFrame(frame);
    previous = null;
    if (isDestroyed) return;
    paint();
    if (shouldRun()) frame = win.requestAnimationFrame(tick);
  };
  const observer =
    typeof win.IntersectionObserver === "function"
      ? new win.IntersectionObserver(([entry]) => {
          const next = Boolean(entry?.isIntersecting);
          if (next === isVisible) return;
          isVisible = next;
          sync();
        })
      : null;
  const onResize = () => {
    setSize();
    sync();
  };
  setSize();
  observer?.observe(canvas);
  reduced.addEventListener("change", sync);
  canvas.ownerDocument.addEventListener("visibilitychange", sync);
  win.addEventListener("resize", onResize);
  sync();
  return {
    play() {
      if (isDestroyed) return;
      isPlaying = true;
      sync();
    },
    pause() {
      if (isDestroyed) return;
      isPlaying = false;
      sync();
    },
    setConfig(config: ThinkingDotsConfig) {
      if (isDestroyed) return;
      const next = createTimeline(config, options.seed ?? 7);
      timeline = next;
      elapsed = 0;
      sync();
    },
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      win.cancelAnimationFrame(frame);
      observer?.disconnect();
      reduced.removeEventListener("change", sync);
      canvas.ownerDocument.removeEventListener("visibilitychange", sync);
      win.removeEventListener("resize", onResize);
      for (const [name, value] of Object.entries(original)) {
        if (value === null) canvas.removeAttribute(name);
        else canvas.setAttribute(name, value);
      }
    },
  };
}
