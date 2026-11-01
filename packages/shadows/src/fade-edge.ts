export const FADE_CURVES = ["smooth", "linear"] as const;
export const FADE_MODES = ["scroll", "fixed"] as const;

export type FadeCurve = (typeof FADE_CURVES)[number];
export type FadeMode = (typeof FADE_MODES)[number];

export interface FadeEdgeOptions {
  size?: number;
  curve?: FadeCurve;
  mode?: FadeMode;
}

export interface FadeEdge {
  update(options?: FadeEdgeOptions): void;
  destroy(): void;
}

const STOPS = 12;
const THRESHOLD = 0.5;
const easeInOutSine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;
const round = (value: number) => Math.round(value * 1e4) / 1e4;

function ramp(curve: FadeCurve): Array<[number, number]> {
  if (curve === "linear") {
    return [
      [0, 0],
      [1, 1],
    ];
  }
  return Array.from({ length: STOPS }, (_, index) => {
    const t = index / (STOPS - 1);
    return [t, easeInOutSine(t)];
  });
}

export function buildFadeGradient(curve: FadeCurve, rtl = false): string {
  const points = ramp(curve);
  const color = (alpha: number) => `rgb(0 0 0 / ${round(alpha)})`;
  const start = points.map(
    ([t, alpha]) =>
      `${color(alpha)} calc(var(--reuse-fade-start) * ${round(t)})`,
  );
  const end = points
    .slice()
    .reverse()
    .map(
      ([t, alpha]) =>
        `${color(alpha)} calc(100% - var(--reuse-fade-end) * ${round(t)})`,
    );
  return `linear-gradient(to ${rtl ? "left" : "right"}, ${[...start, ...end].join(", ")})`;
}

function check(options: Required<FadeEdgeOptions>) {
  if (!FADE_CURVES.includes(options.curve)) {
    throw new RangeError(`Unknown fade curve: ${options.curve}.`);
  }
  if (!FADE_MODES.includes(options.mode)) {
    throw new RangeError(`Unknown fade mode: ${options.mode}.`);
  }
  if (!Number.isFinite(options.size) || options.size < 0) {
    throw new RangeError("Fade size must be a non-negative number.");
  }
}

export function createFadeEdge(
  scroller: HTMLElement,
  { size = 64, curve = "smooth", mode = "scroll" }: FadeEdgeOptions = {},
): FadeEdge {
  const options: Required<FadeEdgeOptions> = { size, curve, mode };
  const style = scroller.style;
  const originalStyle = scroller.getAttribute("style");
  let rtl = false;
  let frame = 0;
  let destroyed = false;
  let written = { start: "", end: "" };

  function applyMask() {
    const value = buildFadeGradient(options.curve, rtl);
    style.setProperty("mask-image", value);
    style.setProperty("-webkit-mask-image", value);
  }

  function edge(distance: number) {
    if (distance < THRESHOLD) return 0;
    return options.mode === "fixed"
      ? options.size
      : Math.min(options.size, distance);
  }

  function measure() {
    frame = 0;
    if (destroyed) return;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const scrolled = Math.min(
      Math.max(Math.abs(scroller.scrollLeft), 0),
      Math.max(max, 0),
    );
    const start = max < THRESHOLD ? 0 : edge(scrolled);
    const end = max < THRESHOLD ? 0 : edge(max - scrolled);
    const next = { start: `${round(start)}px`, end: `${round(end)}px` };
    if (next.start !== written.start)
      style.setProperty("--reuse-fade-start", next.start);
    if (next.end !== written.end)
      style.setProperty("--reuse-fade-end", next.end);
    written = next;
  }

  function schedule() {
    if (!frame && !destroyed) frame = requestAnimationFrame(measure);
  }

  function readDirection() {
    const next = getComputedStyle(scroller).direction === "rtl";
    if (next === rtl) return;
    rtl = next;
    applyMask();
  }

  check(options);
  rtl = getComputedStyle(scroller).direction === "rtl";
  applyMask();
  measure();

  scroller.addEventListener("scroll", schedule, { passive: true });
  const observer = new ResizeObserver(() => {
    readDirection();
    schedule();
  });
  observer.observe(scroller);
  for (const child of scroller.children) observer.observe(child);
  const children = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes)
        if (node.nodeType === 1) observer.observe(node as Element);
      for (const node of record.removedNodes)
        if (node.nodeType === 1) observer.unobserve(node as Element);
    }
    schedule();
  });
  children.observe(scroller, { childList: true });

  return {
    update(partial = {}) {
      if (destroyed) return;
      const next = { ...options, ...partial };
      check(next);
      const curveChanged = next.curve !== options.curve;
      Object.assign(options, next);
      if (curveChanged) applyMask();
      cancelAnimationFrame(frame);
      measure();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frame);
      frame = 0;
      observer.disconnect();
      children.disconnect();
      scroller.removeEventListener("scroll", schedule);
      if (originalStyle === null) scroller.removeAttribute("style");
      else scroller.setAttribute("style", originalStyle);
    },
  };
}
