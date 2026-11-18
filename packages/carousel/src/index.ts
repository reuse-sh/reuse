import type { CarouselInternals } from "./internal.js";

export type { CarouselInternals } from "./internal.js";

export interface CarouselStrings {
  previous: string;
  next: string;
  goTo(index: number, count: number): string;
  counter(index: number, count: number): string;
  slide(index: number, count: number): string;
  play: string;
  pause: string;
  progress: string;
  carouselRole: string;
  slideRole: string;
}

export interface CarouselOptions {
  slides?: string;
  align?: "start" | "center";
  loop?: boolean;
  drag?: boolean;
  group?: number | "page";
  autoplay?: number;
  releaseMotion?: "spring" | "native";
  releaseDuration?: number;
  moveMotion?: "spring" | "native";
  wheel?: "vertical";
  strings?: Partial<CarouselStrings>;
  onChange?: (state: CarouselState) => void;
}

export interface CarouselState {
  readonly index: number;
  readonly count: number;
  readonly progress: number;
  readonly canPrev: boolean;
  readonly canNext: boolean;
  readonly isPlaying: boolean;
  readonly isDragging: boolean;
  readonly isLooping: boolean;
  readonly isPaused: boolean;
  readonly pageCount: number;
  readonly pageIndex: number;
  readonly pages: readonly number[];
  readonly visible: readonly number[];
  readonly autoplayProgress: number;
  readonly seamSlides: readonly number[];
}

export interface CarouselHandle {
  setPosition(px: number): void;
  release(): void;
}

export interface Carousel {
  next(): void;
  prev(): void;
  goTo(index: number, behavior?: ScrollBehavior): void;
  getState(): CarouselState;
  subscribe(listener: (state: CarouselState) => void): () => void;
  refresh(): void;
  setEnabled(enabled: boolean): void;
  play(): void;
  pause(): void;
  hold(reason: string, isHeld: boolean): void;
  take(owner: string, options?: { onInterrupt?: () => void }): CarouselHandle;
  setOptions(
    options: Pick<
      CarouselOptions,
      "autoplay" | "loop" | "group" | "align" | "drag"
    >,
  ): void;
  destroy(): void;
}

function offsetLeft(element: HTMLElement): number {
  let position = 0;
  let current: HTMLElement | null = element;
  while (current) {
    position += current.offsetLeft;
    current = current.offsetParent as HTMLElement | null;
  }
  return position;
}

// Computed scroll padding keeps percentages and calc() unresolved, so a probe lays it out against the scrollport width.
function scrollPadding(viewport: HTMLElement, value: string): number {
  if (/^[\d.]+px$/.test(value)) return Number.parseFloat(value);
  if (!/\d/.test(value)) return 0;
  const box = document.createElement("div");
  const probe = document.createElement("div");
  box.style.cssText = `position: absolute; visibility: hidden; width: ${viewport.clientWidth}px; height: 0; overflow: hidden;`;
  probe.style.width = value;
  box.append(probe);
  viewport.append(box);
  const padding = probe.offsetWidth;
  box.remove();
  return padding;
}

function generic(element: HTMLElement) {
  return (
    !element.hasAttribute("role") &&
    (element.localName === "div" || element.localName === "span")
  );
}

function clamp(value: number, max: number): number {
  return Math.max(0, Math.min(value, max));
}

// Scroll speed in px/ms above which a released mouse drag moves on to the next slide.
const FLICK_VELOCITY = 0.4;
// How far ahead in ms a released drag's speed carries it, close to trackpad momentum.
const GLIDE = 260;
// Rubber band constant for a mouse drag past either end.
const STRETCH = 0.55;
// The furthest a strip stretches past an end, in px, close to trackpad overscroll.
const STRETCH_LIMIT = 120;
const RELEASE_SAMPLE_WINDOW = 80;
const MAX_SPRING_STEP = 64;
const REST_DISTANCE = 0.5;
const MOVE_DURATION = 500;
const INPUT_WINDOW = 100;
const SPEED_WINDOW = 64;
const SLOW_SCROLL = 0.1;
const FAST_SCROLL = 0.5;
const SCROLL_QUIET = 150;
const WHEEL_NOTCH = 50;

// Solves (1 + u)e^-u = REST_DISTANCE / distance, so a spring from rest arrives after the duration.
function settleFrequency(distance: number, duration: number) {
  const ratio = Math.log(Math.max(Math.abs(distance) / REST_DISTANCE, 1));
  let u = ratio;
  for (let step = 0; step < 4; step++) u = ratio + Math.log(1 + u);
  return Math.max(u, 1) / duration;
}

// Synthesized pointers, such as WebKit's touch emulation, are not active and cannot be captured.
function capture(element: HTMLElement, id: number) {
  try {
    element.setPointerCapture?.(id);
  } catch {}
}

const stateAttributes = [
  "data-re-dragging",
  "data-re-scrolling",
  "data-re-static",
  "data-re-at-start",
  "data-re-at-end",
];

const internalKey = Symbol.for("@reuse-sh/carousel internals");

function internalsOf(carousel: Carousel) {
  return (carousel as unknown as Record<symbol, CarouselInternals | undefined>)[
    internalKey
  ];
}

const defaultStrings: CarouselStrings = {
  previous: "Previous slide",
  next: "Next slide",
  goTo: (index, count) => `Go to slide ${index + 1} of ${count}`,
  counter: (index, count) => `${index + 1} / ${count}`,
  slide: (index, count) => `${index + 1} of ${count}`,
  play: "Play slideshow",
  pause: "Pause slideshow",
  progress: "Slide position",
  carouselRole: "carousel",
  slideRole: "slide",
};

function validate(options: CarouselOptions) {
  if (
    options.group !== undefined &&
    options.group !== "page" &&
    (!Number.isInteger(options.group) || options.group < 1)
  ) {
    throw new RangeError("Carousel group must be a positive integer or page.");
  }
  if (
    options.autoplay !== undefined &&
    (!Number.isFinite(options.autoplay) || options.autoplay <= 0)
  ) {
    throw new RangeError("Carousel autoplay must be a positive interval.");
  }
}

const liveOptions = ["autoplay", "loop", "group", "align", "drag"] as const;

export function createCarousel(
  viewport: HTMLElement,
  initialOptions: CarouselOptions = {},
): Carousel {
  const document = viewport.ownerDocument;
  const browserWindow = document.defaultView;
  if (!browserWindow) throw new Error("Carousel requires a browser document.");
  const window = browserWindow;
  const options = { ...initialOptions };
  validate(options);
  const strings = { ...defaultStrings, ...options.strings };
  if (
    options.releaseMotion !== undefined &&
    options.releaseMotion !== "spring" &&
    options.releaseMotion !== "native"
  ) {
    throw new RangeError("Carousel releaseMotion must be spring or native.");
  }
  if (
    options.moveMotion !== undefined &&
    options.moveMotion !== "spring" &&
    options.moveMotion !== "native"
  ) {
    throw new RangeError("Carousel moveMotion must be spring or native.");
  }
  if (options.wheel !== undefined && options.wheel !== "vertical") {
    throw new RangeError("Carousel wheel must be vertical.");
  }
  const releaseDuration = options.releaseDuration ?? 260;
  if (!Number.isFinite(releaseDuration) || releaseDuration <= 0) {
    throw new RangeError("Carousel releaseDuration must be a positive time.");
  }

  const initialTabIndex = viewport.getAttribute("tabindex");
  const hadClass = viewport.classList.contains("re-carousel");
  const previousOverflow = viewport.style.overflowX;
  const previousSnap = viewport.style.scrollSnapType;
  const previousUserSelect = viewport.style.userSelect;
  const previousCursor = viewport.style.cursor;
  const ownedSlides = new Set<HTMLElement>();
  const slideStyles = new Map<
    HTMLElement,
    { translate: string; snap: string }
  >();
  const rendered = new Map<HTMLElement, string>();
  const laps = new Map<HTMLElement, number>();
  const spacers: HTMLElement[] = [];
  const observedSlides = new Set<HTMLElement>();
  const measured = new Map<Element, string | number>();
  let span = 0;
  let starts: number[] = [];
  let aligned: number[] = [];
  let anchor = 0;
  let seam: readonly number[] = Object.freeze([]);
  let taken: {
    owner: string;
    base: number;
    px: number;
    onInterrupt?: () => void;
  } | null = null;
  let stops: boolean[] = [];
  const listeners = new Set<(state: CarouselState) => void>();
  const holds = new Set<string>();
  const internalHolds = new Set<string>();
  const cleanup: (() => void)[] = [];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)");
  let slides: HTMLElement[] = [];
  let targets: number[] = [];
  let max = 0;
  let rtl = false;
  let destroyed = false;
  let enabled = true;
  let requestedPlaying = options.autoplay !== undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingIndex: number | undefined;
  let pendingPosition: number | undefined;
  let disabledPosition = 0;
  let stretch = 0;
  let lastScroll = Number.NEGATIVE_INFINITY;
  let lastInput = Number.NEGATIVE_INFINITY;
  let userScroll: { time: number; position: number } | null = null;
  let quietTimer: ReturnType<typeof setTimeout> | undefined;
  let written = 0;
  let snapMode: "mandatory" | "proximity" | "none" = "mandatory";
  let snapport = 0;
  let dragReady = false;
  let refreshFrame = 0;
  let refreshQueued = false;
  let pointer: {
    id: number;
    x: number;
    position: number;
    moved: boolean;
    caught: boolean;
    samples: { time: number; position: number }[];
  } | null = null;
  let grabbedTouch: number | undefined;
  let fingers = 0;
  let instantFrame = 0;
  let deferredSmooth: number | undefined;
  let smoothTarget: number | undefined;
  let spring: {
    frame: number;
    value: number;
    velocity: number;
    target: number;
    time: number;
    frequency: number;
    fresh: boolean;
  } | null = null;
  let scrolling = false;
  let suppressClick = false;
  let widths: number[] = [];
  let width = 0;
  let pages: readonly number[] = Object.freeze([]);
  let waited = 0;
  let runningSince: number | undefined;
  let clockFrame = 0;
  let unsettled = false;
  let stopping = false;
  // Screen readers announce changes to a live region already in the page, not one inserted with its text.
  let silent = false;
  let catchesClicks = true;
  const live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");
  live.style.cssText =
    "position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap;";
  const ownsRole = generic(viewport);
  const roled = new Map<HTMLElement, boolean>();
  let state: CarouselState = Object.freeze({
    index: 0,
    count: 0,
    progress: 0,
    canPrev: false,
    canNext: false,
    isPlaying: false,
    isDragging: false,
    isLooping: false,
    isPaused: !requestedPlaying,
    pageCount: 0,
    pageIndex: 0,
    pages,
    visible: Object.freeze([]),
    autoplayProgress: 0,
    seamSlides: seam,
  });
  let emitted = state;
  const events: [string, CarouselState][] = [];
  let dispatching = false;

  function listen(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) {
    target.addEventListener(type, listener, options);
    cleanup.push(() => target.removeEventListener(type, listener, options));
  }

  function position() {
    return clamp(rtl ? -viewport.scrollLeft : viewport.scrollLeft, max);
  }

  function lapOf(index: number, current: number) {
    return span
      ? Math.round(
          (current + width / 2 - starts[index] - (widths[index] ?? 0) / 2) /
            span,
        )
      : 0;
  }

  function render() {
    const current = position() + stretch;
    slides.forEach((slide, index) => {
      const size = widths[index] ?? 0;
      const cycle = laps.get(slide) ?? lapOf(index, current);
      const offset = size
        ? Math.round(
            ((aligned[index] + cycle * span - current) / size) * 1000,
          ) / 1000
        : 0;
      const key = `${cycle}|${offset}`;
      if (rendered.get(slide) === key) return;
      rendered.set(slide, key);
      if (span) {
        slide.style.setProperty(
          "--re-carousel-shift",
          `${cycle * span * (rtl ? -1 : 1)}px`,
        );
        slide.setAttribute("data-re-cycle", String(cycle));
      }
      slide.style.setProperty("--re-carousel-offset", String(offset));
    });
  }

  function setStretch(value: number) {
    if (value === stretch) return;
    stretch = value;
    for (const slide of slides) {
      slide.style.translate = value
        ? `${rtl ? value : -value}px`
        : (slideStyles.get(slide)?.translate ?? "");
    }
    render();
  }

  function moveTo(virtual: number) {
    if (span || max <= 0) {
      scrollTo(virtual, "instant");
      return;
    }
    const edge = clamp(virtual, max);
    scrollTo(edge, "instant");
    setStretch(virtual - edge);
  }

  function stretchLimit() {
    return Math.min(STRETCH_LIMIT, viewport.clientWidth * 0.3) || 1;
  }

  function rubberBand(overflow: number) {
    const limit = stretchLimit();
    const damped =
      (1 - 1 / ((Math.abs(overflow) * STRETCH) / limit + 1)) * limit;
    return Math.sign(overflow) * damped;
  }

  function undoRubberBand(shown: number) {
    const limit = stretchLimit();
    const size = Math.min(Math.abs(shown), limit * 0.95);
    return (Math.sign(shown) * size * limit) / ((limit - size) * STRETCH);
  }

  function updateCursor() {
    viewport.style.cursor =
      enabled && dragReady && options.drag !== false && max > 0 && !destroyed
        ? pointer
          ? "grabbing"
          : "grab"
        : previousCursor;
  }

  function loopPosition(current: number) {
    const origin = targets[0] ?? span;
    return origin + ((((current - origin) % span) + span) % span);
  }

  function jumpLoop(target: number) {
    const turns = Math.round((target - position()) / span);
    for (const [slide, lap] of laps) laps.set(slide, lap + turns);
    const snap = viewport.style.scrollSnapType;
    viewport.style.scrollSnapType = "none";
    scrollTo(target, "instant");
    render();
    position();
    viewport.style.scrollSnapType = snap;
  }

  function recenterLoop() {
    if (!span || !enabled) return;
    const current = position();
    if (current >= span / 2 && current <= span * 2) return;
    const centered = loopPosition(current);
    const shift = centered - current;
    jumpLoop(centered);
    shiftPointer(shift);
    if (pendingPosition !== undefined) pendingPosition += shift;
    if (spring) {
      spring.value += shift;
      spring.target += shift;
    }
  }

  function shiftPointer(shift: number) {
    if (!pointer || !shift) return;
    pointer.position += shift;
    for (const sample of pointer.samples) sample.position += shift;
  }

  function targetAt(index: number, reference = position()) {
    const target = targets[index] ?? 0;
    if (!span) return target;
    return target + Math.round((reference - target) / span) * span;
  }

  function isPlaying() {
    return (
      requestedPlaying &&
      options.autoplay !== undefined &&
      !reducedMotion?.matches &&
      !document.hidden &&
      enabled &&
      !holds.size &&
      !internalHolds.size &&
      targets.some((target) => target > 0)
    );
  }

  function autoplayFraction() {
    if (options.autoplay === undefined) return 0;
    const running =
      runningSince === undefined ? 0 : window.performance.now() - runningSince;
    return Math.min(1, (waited + running) / options.autoplay);
  }

  function pageOf(index: number) {
    let page = 0;
    pages.forEach((start, at) => {
      if ((targets[start] ?? 0) <= (targets[index] ?? 0) + 1) page = at;
    });
    return page;
  }

  function visibleSlides(current: number) {
    const shown: number[] = [];
    slides.forEach((_slide, index) => {
      const size = widths[index] ?? 0;
      let left = (starts[index] ?? 0) - current;
      if (span) left += Math.round((width / 2 - left - size / 2) / span) * span;
      const overlap = Math.min(left + size, width) - Math.max(left, 0);
      if (size > 0 && overlap >= size / 2 - 0.5) shown.push(index);
    });
    return shown;
  }

  function emit(type: string, detail: CarouselState) {
    viewport.dispatchEvent(
      new window.CustomEvent(`re-carousel:${type}`, {
        bubbles: true,
        detail,
      }),
    );
  }

  function restartWait() {
    waited = 0;
    if (runningSince !== undefined) runningSince = window.performance.now();
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = setTimeout(advance, options.autoplay);
    }
    if (options.autoplay !== undefined)
      viewport.style.setProperty("--re-carousel-autoplay-progress", "0");
  }

  function publish(index = state.index) {
    if (destroyed) return;
    if (index !== state.index) restartWait();
    const current = position();
    viewport.toggleAttribute("data-re-static", max <= 0);
    viewport.toggleAttribute("data-re-at-start", !span && current < 1);
    viewport.toggleAttribute("data-re-at-end", !span && current > max - 1);
    const visible = visibleSlides(current);
    const next: CarouselState = {
      index,
      count: slides.length,
      progress:
        span > 0
          ? (loopPosition(current) - (targets[0] ?? span)) / span
          : max > 0
            ? current / max
            : 0,
      canPrev: enabled && max > 0 && (span > 0 || (targets[index] ?? 0) > 0),
      canNext:
        enabled && max > 0 && (span > 0 || (targets[index] ?? 0) < max - 1),
      isPlaying: isPlaying(),
      isDragging: pointer?.moved ?? false,
      isLooping: span > 0,
      isPaused: !requestedPlaying || options.autoplay === undefined,
      pageCount: pages.length,
      pageIndex: pageOf(index),
      pages,
      visible:
        visible.length === state.visible.length &&
        visible.every((slide, at) => slide === state.visible[at])
          ? state.visible
          : Object.freeze(visible),
      autoplayProgress: Math.floor(autoplayFraction() * 100) / 100,
      seamSlides: seam,
    };
    if (
      (Object.keys(next) as (keyof CarouselState)[]).every(
        (key) => next[key] === state[key],
      )
    ) {
      return;
    }
    state = Object.freeze(next);
    options.onChange?.(state);
    for (const listener of listeners) listener(state);
    const from = emitted;
    const to = state;
    emitted = to;
    if (to.index !== from.index) events.push(["change", to]);
    if (to.isPlaying !== from.isPlaying)
      events.push([to.isPlaying ? "play" : "pause", to]);
    if (dispatching) return;
    dispatching = true;
    for (let event = events.shift(); event; event = events.shift())
      emit(...event);
    dispatching = false;
  }

  function tick() {
    clockFrame = window.requestAnimationFrame(tick);
    const fraction = autoplayFraction();
    viewport.style.setProperty(
      "--re-carousel-autoplay-progress",
      String(fraction),
    );
    if (Math.floor(fraction * 100) / 100 !== state.autoplayProgress) publish();
  }

  function advance() {
    timer = undefined;
    waited = 0;
    runningSince = undefined;
    if (span || state.canNext) step(1);
    else goTo(0);
    schedule();
  }

  function schedule() {
    const playing = !destroyed && isPlaying();
    const now = window.performance.now();
    if (runningSince !== undefined) waited += now - runningSince;
    runningSince = playing ? now : undefined;
    clearTimeout(timer);
    timer = undefined;
    window.cancelAnimationFrame(clockFrame);
    clockFrame = 0;
    if (playing) {
      timer = setTimeout(
        advance,
        Math.max(0, (options.autoplay ?? 0) - waited),
      );
      clockFrame = window.requestAnimationFrame(tick);
    }
    publish();
  }

  function snaps(index: number) {
    return (
      (options.group ?? 1) === 1 || index === anchor || pages.includes(index)
    );
  }

  function alignSnap(index: number) {
    const slide = slides[index];
    if (slide)
      slide.style.scrollSnapAlign = snaps(index)
        ? (options.align ?? "start")
        : "none";
  }

  function setAnchor(index: number) {
    if (index === anchor) return;
    const previous = anchor;
    anchor = index;
    alignSnap(previous);
    alignSnap(index);
  }

  function nearestIndex(current = position()) {
    const distance = (index: number) =>
      Math.abs(targetAt(index, current) - current);
    let nearest = 0;
    for (let index = 1; index < targets.length; index++) {
      if (snaps(index) && distance(index) < distance(nearest) - 0.5)
        nearest = index;
    }
    const shown = state.index;
    return shown < targets.length &&
      snaps(shown) &&
      distance(shown) <= distance(nearest) + 0.5
      ? shown
      : nearest;
  }

  function indexAhead(direction: 1 | -1) {
    const current = position();
    let best = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    targets.forEach((_target, index) => {
      if (!snaps(index)) return;
      const base = targetAt(index, current);
      for (const candidate of span
        ? [base - span, base, base + span]
        : [base]) {
        const distance = (candidate - current) * direction;
        if (distance > 1 && distance < bestDistance) {
          best = index;
          bestDistance = distance;
        }
      }
    });
    return best < 0 ? nearestIndex() : best;
  }

  function firstStop(from: number, to: number, direction: 1 | -1) {
    let first = -1;
    let nearest = Number.POSITIVE_INFINITY;
    targets.forEach((_target, index) => {
      if (!stops[index] || !snaps(index)) return;
      const base = targetAt(index, from);
      for (const candidate of span
        ? [base - span, base, base + span]
        : [base]) {
        const distance = (candidate - from) * direction;
        if (
          distance > 1 &&
          distance < nearest &&
          (candidate - to) * direction < 0.5
        ) {
          first = index;
          nearest = distance;
        }
      }
    });
    return first;
  }

  function dragVelocity(
    samples: { time: number; position: number }[],
    now: number,
  ) {
    const last = samples.at(-1);
    if (!last || now - last.time > 80) return 0;
    const first = samples.find((sample) => sample.time >= last.time - 100);
    if (!first || last.time - first.time < 1) return 0;
    return (last.position - first.position) / (last.time - first.time);
  }

  function releaseVelocity(
    samples: { time: number; position: number }[],
    now: number,
  ) {
    const recent = samples.filter(
      (sample) => sample.time >= now - RELEASE_SAMPLE_WINDOW,
    );
    const first = recent[0];
    const last = recent.at(-1);
    if (!first || !last || last.time - first.time < 1) return 0;
    return (last.position - first.position) / (last.time - first.time);
  }

  function stopSpring() {
    if (!spring) return;
    window.cancelAnimationFrame(spring.frame);
    spring = null;
  }

  function springFrame(now: number) {
    if (!spring) return;
    // A native scroll can still run when a spring starts; the spring's first write ends it.
    if (spring.fresh) {
      spring.value = position() + stretch;
      spring.fresh = false;
    } else if (Math.abs(position() - written) > 1) {
      yieldToScroll();
      return;
    }
    const dt = Math.min(Math.max(now - spring.time, 0), MAX_SPRING_STEP);
    const { frequency } = spring;
    const offset = spring.value - spring.target;
    const slope = spring.velocity + frequency * offset;
    const decay = Math.exp(-frequency * dt);
    spring.value = spring.target + (offset + slope * dt) * decay;
    spring.velocity = (spring.velocity - frequency * slope * dt) * decay;
    spring.time = now;
    if (
      Math.abs(spring.target - spring.value) < REST_DISTANCE &&
      Math.abs(spring.velocity) < 0.02
    ) {
      const { target } = spring;
      spring = null;
      moveTo(target);
      render();
      settle();
      return;
    }
    moveTo(spring.value);
    recenterLoop();
    render();
    spring.frame = window.requestAnimationFrame(springFrame);
  }

  function startSpring(
    target: number,
    velocity: number,
    floor: number,
    rest: number,
    moving: typeof spring = null,
  ) {
    const value = moving?.value ?? position() + stretch;
    const distance = target - value;
    const speed = Math.abs(distance) < REST_DISTANCE ? 0 : velocity;
    spring = {
      frame: moving?.frame ?? window.requestAnimationFrame(springFrame),
      value,
      velocity: speed,
      target,
      time: moving?.time ?? window.performance.now(),
      fresh: moving?.fresh ?? true,
      frequency:
        speed * distance > 0
          ? Math.max(floor, Math.abs((2 * speed) / distance))
          : rest,
    };
  }

  function yieldToScroll() {
    stopSpring();
    clearTimeout(settleTimer);
    pendingIndex = undefined;
    pendingPosition = undefined;
    viewport.style.scrollSnapType = previousSnap;
    settleTimer = setTimeout(settle, 180);
    publish(nearestIndex());
  }

  function viewportBox(styles: CSSStyleDeclaration) {
    return `${viewport.clientWidth} ${styles.paddingLeft} ${styles.paddingRight}`;
  }

  function settle() {
    stopping = false;
    if (pointer || spring || taken || fingers || grabbedTouch !== undefined)
      return;
    if (
      pendingPosition !== undefined &&
      Math.abs(position() - pendingPosition) > 1
    )
      return;
    clearTimeout(settleTimer);
    pendingIndex = undefined;
    pendingPosition = undefined;
    const index = enabled ? nearestIndex() : state.index;
    if (stretch && enabled) {
      goTo(index, "smooth", undefined, 0);
      return;
    }
    // Restoring mandatory snap away from a snap point makes the browser jump there
    // in one frame, so travel to the point first.
    if (
      enabled &&
      snapMode === "mandatory" &&
      viewport.style.scrollSnapType === "none" &&
      previousSnap !== "none" &&
      Math.abs(position() - targetAt(index)) > 1
    ) {
      goTo(index, "smooth", undefined, 0);
      return;
    }
    // Snap areas follow transforms, so snapping waits for a pressed slide to scale back.
    if (
      slides[index]
        ?.getAnimations?.()
        .some(
          (animation) =>
            (animation as CSSTransition).transitionProperty === "scale",
        )
    ) {
      settleTimer = setTimeout(settle, 50);
      return;
    }
    scrolling = false;
    setAnchor(index);
    if (span && enabled) {
      const current = position();
      const centered = loopPosition(current);
      if (Math.abs(current - centered) > 0.5) jumpLoop(centered);
    }
    viewport.style.scrollSnapType = previousSnap;
    publish(index);
    schedule();
    if (unsettled) {
      unsettled = false;
      emit("settle", state);
    }
  }

  function interrupt(restoreSnap = true) {
    stopSpring();
    clearTimeout(settleTimer);
    pendingIndex = undefined;
    pendingPosition = undefined;
    if (!restoreSnap) viewport.style.scrollSnapType = "none";
    scrollTo(position(), "instant");
    if (restoreSnap && !taken) viewport.style.scrollSnapType = previousSnap;
    if (stretch) settleTimer = setTimeout(settle, 180);
    publish(nearestIndex());
  }

  function stopMove() {
    interrupt(false);
    stopping = true;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  }

  function scrollTo(target: number, behavior: ScrollBehavior) {
    const resolved = reducedMotion?.matches ? "instant" : behavior;
    if (resolved === "smooth" && instantFrame) {
      deferredSmooth = target;
      return;
    }
    const interrupted =
      resolved !== "smooth" &&
      smoothTarget !== undefined &&
      Math.abs(position() - smoothTarget) > 1;
    viewport.scrollTo({ left: rtl ? -target : target, behavior: resolved });
    if (resolved === "smooth") {
      smoothTarget = target;
      return;
    }
    smoothTarget = undefined;
    deferredSmooth = undefined;
    written = position();
    // Chrome drops a smooth scroll that starts in the same frame as an instant
    // scroll which interrupted another smooth scroll, so it waits a frame.
    if (interrupted && !instantFrame && window.requestAnimationFrame) {
      instantFrame = window.requestAnimationFrame(() => {
        instantFrame = 0;
        if (deferredSmooth === undefined || destroyed) return;
        const left = deferredSmooth;
        deferredSmooth = undefined;
        viewport.scrollTo({ left: rtl ? -left : left, behavior: "smooth" });
        smoothTarget = left;
      });
    }
  }

  function goTo(
    index: number,
    behavior: ScrollBehavior = "smooth",
    direction?: 1 | -1,
    releaseSpeed?: number,
    reference = pendingPosition ?? position(),
    flick = false,
  ) {
    if (
      destroyed ||
      !enabled ||
      taken ||
      !slides.length ||
      !Number.isFinite(index)
    )
      return;
    const rounded = Math.round(index);
    const next =
      span > 0
        ? ((rounded % slides.length) + slides.length) % slides.length
        : clamp(rounded, slides.length - 1);
    if (max <= 0) {
      publish(next);
      return;
    }
    let target = targetAt(next, reference);
    if (span && direction === 1 && target <= reference + 0.5) target += span;
    if (span && direction === -1 && target >= reference - 0.5) target -= span;
    travel(next, target, behavior, releaseSpeed, flick);
  }

  function travel(
    index: number,
    destination: number,
    behavior: ScrollBehavior,
    releaseSpeed?: number,
    flick = false,
  ) {
    const motion =
      releaseSpeed === undefined ? options.moveMotion : options.releaseMotion;
    const glide =
      !reducedMotion?.matches &&
      behavior === "smooth" &&
      (stretch !== 0 || motion !== "native");
    const moving = glide && releaseSpeed === undefined ? spring : null;
    if (!moving) stopSpring();
    unsettled = true;
    stopping = false;
    setAnchor(index);
    let target = destination;
    pendingPosition = target;
    pendingIndex = index;
    if (span && !glide && (target < 0 || target > max)) {
      target = loopPosition(target);
      pendingPosition = target;
    }
    viewport.style.scrollSnapType = "none";
    if (glide && releaseSpeed === undefined) {
      const value = moving?.value ?? position() + stretch;
      const frequency = settleFrequency(target - value, MOVE_DURATION);
      startSpring(target, moving?.velocity ?? 0, frequency, frequency, moving);
    } else if (glide)
      startSpring(
        target,
        releaseSpeed ?? 0,
        flick ? 2 / GLIDE : 6 / releaseDuration,
        6 / releaseDuration,
      );
    else {
      setStretch(0);
      scrollTo(target, behavior);
    }
    render();
    publish(pendingIndex);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
    schedule();
  }

  function stepIndex(current: number, direction: 1 | -1) {
    const at = targets[current] ?? 0;
    if (span && options.group === "page") {
      let count = 1;
      let distance = 0;
      while (count < slides.length) {
        const index =
          (current + direction * count + slides.length) % slides.length;
        const previous = (index - direction + slides.length) % slides.length;
        distance += direction === 1 ? widths[previous] : widths[index];
        if (distance >= width) break;
        count++;
      }
      return current + direction * count;
    }
    if (options.group === "page") {
      const distance = clamp(at + direction * width, max);
      let target = current;
      if (direction === 1) {
        target = targets.findIndex((value) => value >= distance - 1);
        if (target < 0) target = slides.length - 1;
      } else {
        for (let index = 0; index < targets.length; index++) {
          if (targets[index] <= distance + 1) target = index;
        }
      }
      return target;
    }
    return current + direction * (options.group ?? 1);
  }

  function measurePages() {
    if (!slides.length) return [];
    const found = [0];
    if (max <= 0) return found;
    for (let index = 0; ; ) {
      const next = span
        ? stepIndex(index, 1)
        : Math.min(stepIndex(index, 1), slides.length - 1);
      if (span ? next >= slides.length : next <= index) break;
      index = next;
      if (span || targets[index] > targets[found[found.length - 1]] + 1)
        found.push(index);
    }
    return found;
  }

  function step(direction: 1 | -1) {
    if (!enabled || destroyed || !slides.length || max === 0) return;
    goTo(
      span && (options.group ?? 1) !== 1
        ? pageAhead(state.index, direction)
        : stepIndex(state.index, direction),
      "smooth",
      direction,
    );
  }

  function pageAhead(current: number, direction: 1 | -1) {
    const ahead =
      direction === 1
        ? pages.find((start) => start > current)
        : [...pages].reverse().find((start) => start < current);
    return ahead ?? (direction === 1 ? pages[0] : (pages.at(-1) ?? 0));
  }

  function say(text: string) {
    if (silent) return;
    if (!live.isConnected) viewport.after(live);
    live.textContent = text;
  }

  function announced(move: () => void) {
    const before = state.index;
    move();
    if (state.index !== before) say(strings.slide(state.index, state.count));
  }

  function readSlides() {
    const selector = options.slides ?? "[data-carousel-slide]";
    const selected = Array.from(
      viewport.querySelectorAll<HTMLElement>(selector),
    ).filter((slide) => {
      const outer = slide.parentElement?.closest(selector);
      return !outer || !viewport.contains(outer);
    });
    if (options.slides || selected.length)
      return selected.filter((slide) => !spacers.includes(slide));
    return Array.from(viewport.children).filter(
      (child): child is HTMLElement =>
        child instanceof window.HTMLElement && !spacers.includes(child),
    );
  }

  function requestRefresh() {
    if (refreshFrame) refreshQueued = true;
    else refresh();
  }

  function refresh() {
    if (destroyed) return;
    refreshQueued = false;
    if (!refreshFrame)
      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = 0;
        if (refreshQueued) refresh();
      });
    const active = slides[state.index];
    const before = position();
    const offset = active ? before - targetAt(state.index, before) : 0;
    const goal = pendingIndex === undefined ? undefined : slides[pendingIndex];
    const glidingFree =
      spring !== null &&
      pendingIndex !== undefined &&
      Math.abs(spring.target - targetAt(pendingIndex, spring.target)) > 1;
    const snap = viewport.style.scrollSnapType;
    if (snap === previousSnap) {
      const snapType = window.getComputedStyle(viewport).scrollSnapType;
      snapMode =
        snapType === "none"
          ? "none"
          : !snapType || snapType.includes("mandatory")
            ? "mandatory"
            : "proximity";
    }
    viewport.style.scrollSnapType = "none";
    const viewportWidth = viewport.clientWidth;
    mutation?.disconnect();
    for (const spacer of spacers) spacer.remove();
    spacers.length = 0;
    for (const [slide, original] of slideStyles) {
      slide.style.translate = original.translate;
      slide.style.removeProperty("--re-carousel-shift");
      slide.style.removeProperty("--re-carousel-offset");
      slide.removeAttribute("data-re-cycle");
    }
    rendered.clear();
    laps.clear();
    stretch = 0;
    span = 0;
    slides = readSlides();
    for (const slide of slides) {
      if (!slide.classList.contains("re-carousel__slide")) {
        slide.classList.add("re-carousel__slide");
        ownedSlides.add(slide);
      }
      if (!slideStyles.has(slide))
        slideStyles.set(slide, {
          translate: slide.style.translate,
          snap: slide.style.scrollSnapAlign,
        });
    }
    rtl = window.getComputedStyle(viewport).direction === "rtl";
    max = Math.max(0, viewport.scrollWidth - viewportWidth);
    const origin = offsetLeft(viewport) + viewport.clientLeft;
    const styles = window.getComputedStyle(viewport);
    const padding = scrollPadding(viewport, styles.scrollPaddingInlineStart);
    snapport =
      viewportWidth -
      padding -
      scrollPadding(viewport, styles.scrollPaddingInlineEnd);
    widths = slides.map((slide) => slide.offsetWidth);
    stops = slides.map(
      (slide) => window.getComputedStyle(slide).scrollSnapStop === "always",
    );
    starts = slides.map((slide, index) => {
      const left = offsetLeft(slide) - origin;
      return rtl ? viewportWidth - left - widths[index] : left;
    });
    aligned = starts.map(
      (start, index) =>
        start -
        (options.align === "center"
          ? (viewportWidth - widths[index]) / 2
          : padding),
    );
    targets = aligned.map((target) => clamp(target, max));
    const gap = Number.parseFloat(styles.columnGap) || 0;
    const cycle = slides.length
      ? (starts.at(-1) ?? 0) - starts[0] + (widths.at(-1) ?? 0) + gap
      : 0;
    if (
      options.loop &&
      max > 0 &&
      !widths.includes(0) &&
      cycle >= viewportWidth + Math.max(0, ...widths)
    ) {
      span = cycle;
      for (let index = 0; index < 2; index++) {
        const spacer = document.createElement("span");
        spacer.setAttribute("aria-hidden", "true");
        spacer.dataset.carouselSpacer = "";
        spacer.style.cssText = `flex: 0 0 ${span - gap}px; pointer-events: none; scroll-snap-align: none;`;
        spacers.push(spacer);
      }
      viewport.prepend(spacers[0]);
      viewport.append(spacers[1]);
      starts = starts.map((start) => start + span);
      aligned = aligned.map((target) => target + span);
      targets = aligned;
      max = Math.max(
        viewport.scrollWidth - viewportWidth,
        span * 3 - viewportWidth - gap,
      );
    }
    width = viewportWidth;
    measured.clear();
    measured.set(viewport, viewportBox(styles));
    slides.forEach((slide, index) => {
      measured.set(slide, widths[index]);
    });
    const measuredPages = measurePages();
    if (measuredPages.join() !== pages.join())
      pages = Object.freeze(measuredPages);
    const seen = span
      ? slides
          .map((_slide, index) => index)
          .filter(
            (index) =>
              starts[index] - starts[0] < width ||
              starts[index] + widths[index] - starts[0] > span - gap - width,
          )
      : [];
    if (seen.join() !== seam.join()) seam = Object.freeze(seen);
    label();
    for (const slide of observedSlides) {
      if (!slides.includes(slide)) {
        observer?.unobserve(slide);
        observedSlides.delete(slide);
      }
    }
    for (const slide of slides) {
      if (observedSlides.has(slide)) continue;
      observer?.observe(slide);
      observedSlides.add(slide);
    }
    const index = active ? slides.indexOf(active) : -1;
    const retained = index < 0 ? clamp(state.index, slides.length - 1) : index;
    const goalIndex = goal ? slides.indexOf(goal) : -1;
    const moving =
      goalIndex >= 0 || Boolean(pointer?.moved) || scrolling || taken !== null;
    clearTimeout(settleTimer);
    pendingIndex = undefined;
    pendingPosition = undefined;
    anchor = retained;
    for (let at = 0; at < slides.length; at++) alignSnap(at);
    if (enabled)
      scrollTo((targets[retained] ?? 0) + (moving ? offset : 0), "instant");
    else disabledPosition = clamp(disabledPosition, max);
    if (taken) taken.base = position() - taken.px;
    render();
    shiftPointer(position() - before);
    viewport.style.scrollSnapType = snap;
    updateCursor();
    publish(retained);
    schedule();
    mutation?.observe(viewport, { childList: true, subtree: true });
    if (goalIndex >= 0 && enabled && spring) {
      const shift = position() - before;
      spring.value += shift;
      spring.target = !glidingFree
        ? targetAt(goalIndex, spring.target + shift)
        : span
          ? spring.target + shift
          : clamp(spring.target + shift, max);
      pendingIndex = goalIndex;
      pendingPosition = spring.target;
      publish(goalIndex);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 180);
    } else if (goalIndex >= 0 && enabled) goTo(goalIndex);
    else if (moving) {
      stopSpring();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 180);
    }
  }

  function label() {
    for (const [slide, ownsLabel] of roled) {
      if (slides.includes(slide)) continue;
      unlabel(slide, ownsLabel);
      roled.delete(slide);
    }
    slides.forEach((slide, index) => {
      if (!roled.has(slide)) {
        if (!generic(slide)) return;
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", strings.slideRole);
        roled.set(slide, !slide.hasAttribute("aria-label"));
      }
      if (roled.get(slide))
        slide.setAttribute("aria-label", strings.slide(index, slides.length));
    });
  }

  function unlabel(slide: HTMLElement, ownsLabel: boolean) {
    slide.removeAttribute("role");
    slide.removeAttribute("aria-roledescription");
    if (ownsLabel) slide.removeAttribute("aria-label");
  }

  function hold(reason: string, isHeld: boolean) {
    if (destroyed) return;
    if (isHeld) holds.add(reason);
    else holds.delete(reason);
    schedule();
  }

  function internalHold(reason: string, isHeld: boolean) {
    if (destroyed) return;
    if (isHeld) internalHolds.add(reason);
    else internalHolds.delete(reason);
    schedule();
  }

  function untake() {
    taken = null;
    internalHold("take", false);
  }

  function interruptTake() {
    const hand = taken;
    if (!hand) return;
    untake();
    unsettled = true;
    hand.onInterrupt?.();
  }

  function endDrag(snap: boolean, time = window.performance.now()) {
    if (!pointer) return;
    const { id, moved, caught, samples } = pointer;
    const velocity = moved && snap ? dragVelocity(samples, time) : 0;
    const speed = moved && snap ? releaseVelocity(samples, time) : 0;
    pointer = null;
    viewport.removeAttribute("data-re-dragging");
    if (viewport.hasPointerCapture?.(id)) viewport.releasePointerCapture(id);
    viewport.style.userSelect = previousUserSelect;
    updateCursor();
    suppressClick = (moved || caught) && snap;
    internalHold("pointer", false);
    const current = position() + stretch;
    const stop = current + speed * GLIDE;
    const projected = nearestIndex(stop);
    const direction = velocity > 0 ? 1 : -1;
    if (
      moved &&
      snap &&
      (snapMode === "none" ||
        (snapMode === "proximity" &&
          Math.abs(targetAt(projected, stop) - stop) > snapport / 3))
    ) {
      const end = span ? stop : clamp(stop, max);
      travel(nearestIndex(end), end, "smooth", speed, true);
    } else if (moved && snap && Math.abs(velocity) >= FLICK_VELOCITY) {
      const end = targetAt(projected, stop);
      const blocked = firstStop(current, end, direction);
      if (blocked >= 0)
        goTo(blocked, "smooth", direction, speed, current, true);
      else if ((end - current) * direction > 1)
        goTo(projected, "smooth", undefined, speed, stop, true);
      else
        goTo(indexAhead(direction), "smooth", direction, speed, current, true);
    } else if (moved && snap)
      goTo(nearestIndex(current), "smooth", undefined, speed, current);
    else if (moved || snap || stretch) settle();
    else if (!taken) viewport.style.scrollSnapType = previousSnap;
    publish();
  }

  const controller: Carousel = {
    next: () => announced(() => step(1)),
    prev: () => announced(() => step(-1)),
    goTo: (index, behavior) => goTo(index, behavior),
    getState: () => state,
    subscribe(listener) {
      if (destroyed) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh,
    setEnabled(value) {
      if (destroyed || value === enabled) return;
      endDrag(false);
      if (!value) {
        setStretch(0);
        interrupt();
      }
      enabled = value;
      disabledPosition = position();
      viewport.style.overflowX = value ? previousOverflow : "hidden";
      if (!value) scrollTo(disabledPosition, "instant");
      updateCursor();
      schedule();
    },
    play() {
      if (destroyed) return;
      requestedPlaying = true;
      schedule();
    },
    pause() {
      if (destroyed) return;
      requestedPlaying = false;
      schedule();
    },
    hold,
    take(owner, { onInterrupt } = {}) {
      const inert = { setPosition() {}, release() {} };
      if (destroyed || reducedMotion?.matches) return inert;
      if (pointer || fingers || grabbedTouch !== undefined) {
        unsettled = true;
        return inert;
      }
      const previous = taken;
      stopSpring();
      setStretch(0);
      clearTimeout(settleTimer);
      pendingIndex = undefined;
      pendingPosition = undefined;
      const hand = { owner, base: position(), px: 0, onInterrupt };
      taken = hand;
      viewport.style.scrollSnapType = "none";
      internalHold("take", true);
      if (previous && previous.owner !== owner) previous.onInterrupt?.();
      return {
        setPosition(px) {
          if (taken !== hand || !enabled || reducedMotion?.matches) return;
          if (!Number.isFinite(px)) return;
          hand.px = px;
          const goal = hand.base + px;
          scrollTo(span ? loopPosition(goal) : clamp(goal, max), "instant");
          render();
          publish(nearestIndex());
        },
        release() {
          if (taken !== hand) return;
          untake();
          if (snapMode !== "none" && enabled && max > 0 && slides.length)
            goTo(nearestIndex(), "smooth");
          else viewport.style.scrollSnapType = previousSnap;
        },
      };
    },
    setOptions(next) {
      if (destroyed) return;
      validate(next);
      const changed = liveOptions.filter(
        (name) => Object.hasOwn(next, name) && next[name] !== options[name],
      );
      if (!changed.length) return;
      const hadAutoplay = options.autoplay !== undefined;
      for (const name of changed)
        Object.assign(options, { [name]: next[name] });
      if (changed.includes("autoplay")) {
        if (options.autoplay === undefined) {
          requestedPlaying = false;
          viewport.style.removeProperty("--re-carousel-autoplay-progress");
        } else if (!hadAutoplay) requestedPlaying = true;
        waited = 0;
        runningSince = undefined;
      }
      if (options.drag === false) endDrag(false);
      if (changed.some((name) => name !== "autoplay" && name !== "drag"))
        refresh();
      updateCursor();
      schedule();
    },
    destroy() {
      if (destroyed) return;
      endDrag(false);
      destroyed = true;
      taken = null;
      clearTimeout(timer);
      clearTimeout(settleTimer);
      clearTimeout(quietTimer);
      window.cancelAnimationFrame(clockFrame);
      window.cancelAnimationFrame(instantFrame);
      window.cancelAnimationFrame(refreshFrame);
      stopSpring();
      observer?.disconnect();
      mutation?.disconnect();
      intersection?.disconnect();
      for (const remove of cleanup) remove();
      listeners.clear();
      if (!hadClass) viewport.classList.remove("re-carousel");
      for (const name of stateAttributes) viewport.removeAttribute(name);
      viewport.style.removeProperty("--re-carousel-autoplay-progress");
      if (ownsRole) {
        viewport.removeAttribute("role");
        viewport.removeAttribute("aria-roledescription");
      }
      for (const [slide, ownsLabel] of roled) unlabel(slide, ownsLabel);
      live.remove();
      const restoredPosition = span
        ? (targets[state.index] ?? span) - span
        : position();
      for (const spacer of spacers) spacer.remove();
      if (span) {
        scrollTo(
          clamp(restoredPosition, viewport.scrollWidth - viewport.clientWidth),
          "instant",
        );
      }
      for (const [slide, original] of slideStyles) {
        slide.style.translate = original.translate;
        slide.style.scrollSnapAlign = original.snap;
        slide.style.removeProperty("--re-carousel-shift");
        slide.style.removeProperty("--re-carousel-offset");
        slide.removeAttribute("data-re-cycle");
      }
      for (const slide of ownedSlides) {
        slide.classList.remove("re-carousel__slide");
      }
      if (initialTabIndex === null) viewport.removeAttribute("tabindex");
      else viewport.setAttribute("tabindex", initialTabIndex);
      viewport.style.overflowX = previousOverflow;
      viewport.style.scrollSnapType = previousSnap;
      viewport.style.userSelect = previousUserSelect;
      viewport.style.cursor = previousCursor;
    },
  };

  const observer = window.ResizeObserver
    ? new window.ResizeObserver((entries) => {
        if (
          entries.some(
            ({ target }) =>
              measured.get(target) !==
              (target === viewport
                ? viewportBox(window.getComputedStyle(viewport))
                : (target as HTMLElement).offsetWidth),
          )
        )
          requestRefresh();
      })
    : undefined;
  const mutation = window.MutationObserver
    ? new window.MutationObserver(() => {
        const next = readSlides();
        if (
          next.length === slides.length &&
          next.every((slide, index) => slide === slides[index])
        )
          return;
        requestRefresh();
      })
    : undefined;
  const intersection = window.IntersectionObserver
    ? new window.IntersectionObserver(
        ([entry]) => internalHold("offscreen", entry.intersectionRatio < 0.5),
        { threshold: 0.5 },
      )
    : undefined;

  function setScrolling(value: boolean) {
    viewport.toggleAttribute("data-re-scrolling", value);
  }

  function trackScroll() {
    const now = window.performance.now();
    const current = position();
    if (!userScroll) {
      if (now - lastInput > INPUT_WINDOW) return;
      userScroll = { time: now, position: current };
      setScrolling(true);
    } else if (now - userScroll.time >= SPEED_WINDOW) {
      const speed =
        Math.abs(current - userScroll.position) / (now - userScroll.time);
      if (speed < SLOW_SCROLL) setScrolling(false);
      else if (speed > FAST_SCROLL) setScrolling(true);
      userScroll = { time: now, position: current };
    }
    clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      userScroll = null;
      setScrolling(false);
    }, SCROLL_QUIET);
  }

  function moveDrag(event: Event) {
    const input = event as PointerEvent;
    if (!pointer || input.pointerId !== pointer.id) return;
    const delta = input.clientX - pointer.x;
    if (!pointer.moved && Math.abs(delta) < 5) return;
    if (!pointer.moved) {
      if (taken) {
        interruptTake();
        if (!pointer) return;
        pointer.position = position() + (rtl ? -delta : delta);
      }
      pointer.moved = true;
      capture(viewport, pointer.id);
      viewport.style.scrollSnapType = "none";
      viewport.style.userSelect = "none";
      viewport.setAttribute("data-re-dragging", "");
    }
    input.preventDefault();
    const goal = pointer.position + (rtl ? delta : -delta);
    const edge = clamp(goal, max);
    scrollTo(edge, "instant");
    if (!span && max > 0) setStretch(rubberBand(goal - edge));
    pointer.samples.push({
      time: input.timeStamp,
      position: position() + stretch,
    });
    if (pointer.samples.length > 8) pointer.samples.shift();
    recenterLoop();
    render();
    publish(nearestIndex());
  }

  function readyDrag() {
    if (
      dragReady ||
      options.drag === false ||
      max <= 0 ||
      (finePointer && !finePointer.matches)
    )
      return;
    dragReady = true;
    listen(window, "pointermove", moveDrag);
    listen(window, "pointerup", (event) => {
      if ((event as PointerEvent).pointerId === pointer?.id)
        endDrag(true, event.timeStamp);
    });
    listen(window, "pointercancel", (event) => {
      if ((event as PointerEvent).pointerId === pointer?.id) endDrag(false);
    });
    listen(window, "blur", () => endDrag(false));
    listen(viewport, "lostpointercapture", () => endDrag(true));
    listen(viewport, "dragstart", (event) => {
      if (pointer) event.preventDefault();
    });
    listen(
      viewport,
      "click",
      (event) => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
      },
      true,
    );
    updateCursor();
  }

  viewport.classList.add("re-carousel");
  if (initialTabIndex === null) viewport.tabIndex = 0;
  if (ownsRole) {
    viewport.setAttribute("role", "region");
    viewport.setAttribute("aria-roledescription", strings.carouselRole);
  }
  viewport.after(live);
  listen(viewport, "scroll", () => {
    if (!enabled) {
      if (Math.abs(position() - disabledPosition) > 0.5) {
        scrollTo(disabledPosition, "instant");
      }
      return;
    }
    if (taken) {
      render();
      publish(nearestIndex());
      return;
    }
    if (pointer?.moved) recenterLoop();
    scrolling = true;
    unsettled = true;
    lastScroll = window.performance.now();
    trackScroll();
    render();
    publish(pendingIndex ?? nearestIndex());
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  });
  listen(viewport, "scrollend", () => {
    if (!stopping) settle();
  });
  listen(
    viewport,
    "wheel",
    (event) => {
      const wheel = event as WheelEvent;
      lastInput = window.performance.now();
      if (wheel.defaultPrevented) return;
      if (
        options.wheel === "vertical" &&
        enabled &&
        !wheel.ctrlKey &&
        !wheel.shiftKey &&
        Math.abs(wheel.deltaY) > Math.abs(wheel.deltaX) &&
        (wheel.deltaMode !== 0 || Math.abs(wheel.deltaY) >= WHEEL_NOTCH)
      ) {
        const direction = wheel.deltaY > 0 ? 1 : -1;
        if (direction === 1 ? !state.canNext : !state.canPrev) return;
        wheel.preventDefault();
        step(direction);
        return;
      }
      if (pendingIndex !== undefined && !stretch) stopMove();
    },
    { passive: options.wheel !== "vertical" },
  );
  listen(viewport, "keydown", (event) => {
    const key = event as KeyboardEvent;
    const target = key.target as HTMLElement;
    if (
      !enabled ||
      key.defaultPrevented ||
      key.altKey ||
      key.ctrlKey ||
      key.metaKey ||
      target.closest(
        "input, textarea, select, [contenteditable], [role=slider]",
      )
    ) {
      return;
    }
    if (key.key === "Home") announced(() => goTo(0));
    else if (key.key === "End") announced(() => goTo(slides.length - 1));
    else if (key.key === (rtl ? "ArrowLeft" : "ArrowRight"))
      announced(() => step(1));
    else if (key.key === (rtl ? "ArrowRight" : "ArrowLeft"))
      announced(() => step(-1));
    else return;
    key.preventDefault();
  });
  listen(viewport, "pointerenter", () => internalHold("hover", true));
  listen(viewport, "pointerleave", () => internalHold("hover", false));
  const holdFocus = (event: Event) => {
    const focused = event.composedPath()[0] as Element;
    internalHold("focus", focused.matches(":focus-visible"));
  };
  listen(viewport, "focusin", holdFocus);
  listen(viewport, "keyup", holdFocus);
  listen(viewport, "focusout", (event) => {
    const next = (event as FocusEvent).relatedTarget as Node | null;
    if (!next || !viewport.contains(next)) internalHold("focus", false);
  });
  listen(document, "visibilitychange", schedule);
  if (reducedMotion) listen(reducedMotion, "change", schedule);
  if (!observer) listen(window, "resize", requestRefresh);
  listen(
    viewport,
    "pointermove",
    (event) => {
      if ((event as PointerEvent).buttons) lastInput = window.performance.now();
      readyDrag();
    },
    { passive: true },
  );
  listen(viewport, "pointerdown", (event) => {
    const input = event as PointerEvent;
    const target = input.target as HTMLElement;
    if (taken && input.pointerType !== "mouse") {
      grabbedTouch = input.pointerId;
      interrupt(false);
      interruptTake();
      return;
    }
    if (!enabled || input.button !== 0) return;
    if (input.pointerType !== "mouse") {
      // A touch on a moving strip stops it; release continues to a snap point.
      if (pendingIndex === undefined) return;
      interrupt(false);
      grabbedTouch = input.pointerId;
      return;
    }
    const inner = target.closest(".re-carousel");
    if (inner && inner !== viewport && inner.scrollWidth > inner.clientWidth)
      return;
    const draggable =
      options.drag !== false &&
      !target.closest(
        "input, select, textarea, [contenteditable], [role=slider], [data-carousel-no-drag]",
      );
    if (draggable) readyDrag();
    if (!draggable || !dragReady) {
      if (pendingIndex !== undefined) stopMove();
      return;
    }
    const caught =
      catchesClicks &&
      (spring !== null || window.performance.now() - lastScroll < 100);
    interrupt(false);
    suppressClick = false;
    pointer = {
      id: input.pointerId,
      x: input.clientX,
      position: position() + (stretch && undoRubberBand(stretch)),
      moved: false,
      caught,
      samples: [],
    };
    updateCursor();
    internalHold("pointer", true);
  });
  // Touch pointers are captured by the element they pressed, so their release reaches the viewport.
  const releaseTouch = (event: Event) => {
    if ((event as PointerEvent).pointerId !== grabbedTouch) return;
    grabbedTouch = undefined;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  };
  listen(viewport, "pointerup", releaseTouch);
  listen(viewport, "pointercancel", releaseTouch);
  // A native pan cancels its pointer while the finger stays down, so fingers are counted from touch events.
  const countFingers = (event: Event) => {
    const before = fingers;
    fingers = Array.from((event as TouchEvent).touches).filter((touch) =>
      viewport.contains(touch.target as Node),
    ).length;
    if (fingers || !before || !unsettled) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  };
  listen(viewport, "touchstart", countFingers, { passive: true });
  for (const type of ["touchend", "touchcancel"])
    listen(window, type, countFingers, { passive: true });
  observer?.observe(viewport);
  refresh();
  mutation?.observe(viewport, { childList: true, subtree: true });
  intersection?.observe(viewport);
  const reach: CarouselInternals = {
    viewport,
    strings,
    slides: () => slides,
    pagePositions: () =>
      pages.map((index) =>
        span
          ? ((targets[index] ?? 0) - (targets[0] ?? 0)) / span
          : max > 0
            ? (targets[index] ?? 0) / max
            : 0,
      ),
    align: () => options.align,
    goTo: (index, behavior, announce) =>
      announce ? announced(() => goTo(index, behavior)) : goTo(index, behavior),
    silence: () => {
      silent = true;
      live.remove();
    },
    passClicks: () => {
      catchesClicks = false;
      return () => {
        catchesClicks = true;
      };
    },
    keepLaps: (kept) => {
      laps.clear();
      const current = position() + stretch;
      for (const slide of kept) {
        const index = slides.indexOf(slide);
        if (span && index >= 0) laps.set(slide, lapOf(index, current));
      }
      render();
    },
  };
  Object.defineProperty(controller, internalKey, { value: reach });
  return controller;
}

export function syncCarousels(...carousels: Carousel[]): () => void {
  let syncing = false;
  const unsubscribes = carousels.map((source) => {
    let index = source.getState().index;
    return source.subscribe((state) => {
      if (state.index === index) return;
      index = state.index;
      if (syncing) return;
      syncing = true;
      try {
        for (const target of carousels) {
          if (target !== source) target.goTo(state.index, "instant");
        }
      } finally {
        syncing = false;
      }
    });
  });
  return () => {
    for (const unsubscribe of unsubscribes) unsubscribe();
  };
}

export function connectThumbnails(
  main: Carousel,
  thumbnails: Carousel,
): () => void {
  const strip = internalsOf(thumbnails);
  if (!strip) throw new TypeError("connectThumbnails needs two carousels.");
  const align = strip.align();
  thumbnails.setOptions({ align: "center" });
  const catchClicks = strip.passClicks();
  let shown = -1;
  let count = -1;
  const mark = () => {
    strip.slides().forEach((slide, index) => {
      if (index === shown) slide.setAttribute("aria-current", "true");
      else slide.removeAttribute("aria-current");
    });
  };
  const follow = (state: CarouselState) => {
    if (state.index === shown) return;
    strip.goTo(state.index, shown < 0 ? "instant" : "smooth");
    shown = state.index;
    mark();
  };
  const unsubscribe = main.subscribe(follow);
  const recount = thumbnails.subscribe((state) => {
    if (state.count === count) return;
    count = state.count;
    mark();
  });
  follow(main.getState());
  const choose = (event: Event) => {
    const index = strip
      .slides()
      .findIndex((slide) => slide.contains(event.target as Node));
    if (index >= 0) internalsOf(main)?.goTo(index, "smooth", true);
  };
  strip.viewport.addEventListener("click", choose);
  return () => {
    unsubscribe();
    recount();
    strip.viewport.removeEventListener("click", choose);
    catchClicks();
    shown = -1;
    mark();
    thumbnails.setOptions({ align });
  };
}
