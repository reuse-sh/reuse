export interface CarouselOptions {
  slides?: string;
  align?: "start" | "center";
  loop?: boolean;
  drag?: boolean;
  group?: number | "page";
  autoplay?: number;
  releaseMotion?: "spring" | "native";
  releaseDuration?: number;
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

export function createCarousel(
  viewport: HTMLElement,
  options: CarouselOptions = {},
): Carousel {
  const document = viewport.ownerDocument;
  const browserWindow = document.defaultView;
  if (!browserWindow) throw new Error("Carousel requires a browser document.");
  const window = browserWindow;
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
  if (
    options.releaseMotion !== undefined &&
    options.releaseMotion !== "spring" &&
    options.releaseMotion !== "native"
  ) {
    throw new RangeError("Carousel releaseMotion must be spring or native.");
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
    { transform: string; translate: string; snap: string }
  >();
  const spacers: HTMLElement[] = [];
  const observedSlides = new Set<HTMLElement>();
  let span = 0;
  let starts: number[] = [];
  let stops: boolean[] = [];
  const listeners = new Set<(state: CarouselState) => void>();
  const holds = new Set<string>();
  const internalHolds = new Set<string>();
  const cleanup: (() => void)[] = [];
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
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
  let pointer: {
    id: number;
    x: number;
    position: number;
    moved: boolean;
    caught: boolean;
    samples: { time: number; position: number }[];
  } | null = null;
  let grabbedTouch: number | undefined;
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
  } | null = null;
  let scrolling = false;
  let suppressClick = false;
  let state: CarouselState = Object.freeze({
    index: 0,
    count: 0,
    progress: 0,
    canPrev: false,
    canNext: false,
    isPlaying: false,
    isDragging: false,
    isLooping: false,
  });

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

  function renderLoop() {
    if (!span) return;
    const middle = position() + viewport.clientWidth / 2;
    slides.forEach((slide, index) => {
      const center = starts[index] + slide.offsetWidth / 2;
      const cycles = Math.round((middle - center) / span);
      const distance = cycles * span * (rtl ? -1 : 1);
      const original = slideStyles.get(slide)?.transform ?? "";
      slide.style.transform = distance
        ? `translateX(${distance}px) ${original}`.trim()
        : original;
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
      enabled && options.drag !== false && max > 0 && !destroyed
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
    const snap = viewport.style.scrollSnapType;
    viewport.style.scrollSnapType = "none";
    scrollTo(target, "instant");
    renderLoop();
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
      targets.some((target) => target > 0) &&
      (span > 0 || position() < max - 1)
    );
  }

  function publish(index = state.index) {
    if (destroyed) return;
    const current = position();
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
  }

  function schedule() {
    clearTimeout(timer);
    timer = undefined;
    publish();
    if (!destroyed && isPlaying()) {
      timer = setTimeout(() => controller.next(), options.autoplay);
    }
  }

  function nearestIndex(current = position()) {
    let nearest = 0;
    for (let index = 1; index < targets.length; index++) {
      if (
        Math.abs(targetAt(index, current) - current) <
        Math.abs(targetAt(nearest, current) - current) - 0.5
      ) {
        nearest = index;
      }
    }
    return nearest;
  }

  function indexAhead(direction: 1 | -1) {
    const current = position();
    let best = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    targets.forEach((_target, index) => {
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
      if (!stops[index]) return;
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

  function dragVelocity(samples: { time: number; position: number }[]) {
    const last = samples.at(-1);
    if (!last || window.performance.now() - last.time > 80) return 0;
    const first = samples.find((sample) => sample.time >= last.time - 100);
    if (!first || last.time - first.time < 1) return 0;
    return (last.position - first.position) / (last.time - first.time);
  }

  function releaseVelocity(samples: { time: number; position: number }[]) {
    const now = window.performance.now();
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
    const dt = Math.min(Math.max(now - spring.time, 0), MAX_SPRING_STEP);
    const { frequency } = spring;
    const offset = spring.value - spring.target;
    const slope = spring.velocity + frequency * offset;
    const decay = Math.exp(-frequency * dt);
    spring.value = spring.target + (offset + slope * dt) * decay;
    spring.velocity = (spring.velocity - frequency * slope * dt) * decay;
    spring.time = now;
    if (
      Math.abs(spring.target - spring.value) < 0.5 &&
      Math.abs(spring.velocity) < 0.02
    ) {
      const { target } = spring;
      spring = null;
      moveTo(target);
      renderLoop();
      settle();
      return;
    }
    moveTo(spring.value);
    recenterLoop();
    renderLoop();
    spring.frame = window.requestAnimationFrame(springFrame);
  }

  function startSpring(target: number, velocity: number, flick: boolean) {
    const value = position() + stretch;
    const distance = target - value;
    const speed = Math.abs(distance) < 0.5 ? 0 : velocity;
    const floor = flick ? 2 / GLIDE : 6 / releaseDuration;
    spring = {
      frame: window.requestAnimationFrame(springFrame),
      value,
      velocity: speed,
      target,
      time: window.performance.now(),
      frequency:
        speed * distance > 0
          ? Math.max(floor, Math.abs((2 * speed) / distance))
          : 6 / releaseDuration,
    };
  }

  function settle() {
    if (pointer || spring || grabbedTouch !== undefined) return;
    if (
      pendingPosition !== undefined &&
      Math.abs(position() - pendingPosition) > 1
    )
      return;
    clearTimeout(settleTimer);
    pendingIndex = undefined;
    pendingPosition = undefined;
    const index = nearestIndex();
    if (stretch && enabled) {
      goTo(index, "smooth", undefined, 0);
      return;
    }
    // Restoring mandatory snap away from a snap point makes the browser jump there
    // in one frame, so travel to the point first.
    if (
      enabled &&
      viewport.style.scrollSnapType === "none" &&
      previousSnap !== "none" &&
      Math.abs(position() - targetAt(index)) > 1
    ) {
      goTo(index, "smooth", undefined, 0);
      return;
    }
    scrolling = false;
    if (span && enabled) {
      const current = position();
      const centered = loopPosition(current);
      if (Math.abs(current - centered) > 0.5) jumpLoop(centered);
    }
    viewport.style.scrollSnapType = previousSnap;
    publish(index);
    schedule();
  }

  function interrupt(restoreSnap = true) {
    stopSpring();
    clearTimeout(settleTimer);
    pendingIndex = undefined;
    pendingPosition = undefined;
    if (!restoreSnap) viewport.style.scrollSnapType = "none";
    scrollTo(position(), "instant");
    if (restoreSnap) viewport.style.scrollSnapType = previousSnap;
    if (stretch) settleTimer = setTimeout(settle, 180);
    publish(nearestIndex());
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
    if (destroyed || !enabled || !slides.length || !Number.isFinite(index))
      return;
    stopSpring();
    const rounded = Math.round(index);
    const next =
      span > 0
        ? ((rounded % slides.length) + slides.length) % slides.length
        : clamp(rounded, slides.length - 1);
    let target = targetAt(next, reference);
    if (span && direction === 1 && target <= reference + 0.5) target += span;
    if (span && direction === -1 && target >= reference - 0.5) target -= span;
    pendingPosition = target;
    pendingIndex =
      span > 0
        ? next
        : targets.findIndex((value) => Math.abs(value - target) < 0.5);
    const glide =
      !reducedMotion?.matches &&
      behavior === "smooth" &&
      (stretch !== 0 ||
        (releaseSpeed !== undefined && options.releaseMotion !== "native"));
    if (span && !glide && (target < 0 || target > max)) {
      target = loopPosition(target);
      pendingPosition = target;
    }
    viewport.style.scrollSnapType = "none";
    if (glide) startSpring(target, releaseSpeed ?? 0, flick);
    else {
      setStretch(0);
      scrollTo(target, behavior);
    }
    renderLoop();
    publish(pendingIndex);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
    schedule();
  }

  function step(direction: 1 | -1) {
    if (!enabled || destroyed || !slides.length || max === 0) return;
    const current = state.index;
    const at = targets[current] ?? 0;
    if (span && options.group === "page") {
      let count = 1;
      let distance = 0;
      while (count < slides.length) {
        const index =
          (current + direction * count + slides.length) % slides.length;
        const previous = (index - direction + slides.length) % slides.length;
        distance +=
          direction === 1
            ? slides[previous].offsetWidth
            : slides[index].offsetWidth;
        if (distance >= viewport.clientWidth) break;
        count++;
      }
      goTo(current + direction * count, "smooth", direction);
      return;
    }
    if (options.group === "page") {
      const distance = clamp(at + direction * viewport.clientWidth, max);
      let target = current;
      if (direction === 1) {
        target = targets.findIndex((value) => value >= distance - 1);
        if (target < 0) target = slides.length - 1;
      } else {
        for (let index = 0; index < targets.length; index++) {
          if (targets[index] <= distance + 1) target = index;
        }
      }
      goTo(target);
      return;
    }
    goTo(current + direction * (options.group ?? 1), "smooth", direction);
  }

  function readSlides() {
    const selected = Array.from(
      viewport.querySelectorAll<HTMLElement>(
        options.slides ?? "[data-carousel-slide]",
      ),
    );
    if (options.slides || selected.length)
      return selected.filter((slide) => !spacers.includes(slide));
    return Array.from(viewport.children).filter(
      (child): child is HTMLElement =>
        child instanceof window.HTMLElement && !spacers.includes(child),
    );
  }

  function refresh() {
    if (destroyed) return;
    const active = slides[state.index];
    const before = position();
    const offset = active ? before - targetAt(state.index, before) : 0;
    const goal = pendingIndex === undefined ? undefined : slides[pendingIndex];
    const snap = viewport.style.scrollSnapType;
    viewport.style.scrollSnapType = "none";
    const viewportWidth = viewport.clientWidth;
    mutation?.disconnect();
    for (const spacer of spacers) spacer.remove();
    spacers.length = 0;
    for (const [slide, original] of slideStyles) {
      slide.style.transform = original.transform;
      slide.style.translate = original.translate;
    }
    stretch = 0;
    span = 0;
    slides = readSlides();
    rtl = window.getComputedStyle(viewport).direction === "rtl";
    max = Math.max(0, viewport.scrollWidth - viewportWidth);
    const origin = offsetLeft(viewport) + viewport.clientLeft;
    const styles = window.getComputedStyle(viewport);
    const padding = scrollPadding(viewport, styles.scrollPaddingInlineStart);
    targets = slides.map((slide) => {
      if (!slide.classList.contains("re-carousel__slide")) {
        slide.classList.add("re-carousel__slide");
        ownedSlides.add(slide);
      }
      if (!slideStyles.has(slide))
        slideStyles.set(slide, {
          transform: slide.style.transform,
          translate: slide.style.translate,
          snap: slide.style.scrollSnapAlign,
        });
      slide.style.scrollSnapAlign = options.align ?? "start";
      const left = offsetLeft(slide) - origin;
      const start = rtl ? viewportWidth - left - slide.offsetWidth : left;
      const target =
        options.align === "center"
          ? start - (viewportWidth - slide.offsetWidth) / 2
          : start - padding;
      return clamp(target, max);
    });
    stops = slides.map(
      (slide) => window.getComputedStyle(slide).scrollSnapStop === "always",
    );
    starts = slides.map((slide) => {
      const left = offsetLeft(slide) - origin;
      return rtl ? viewportWidth - left - slide.offsetWidth : left;
    });
    const gap = Number.parseFloat(styles.columnGap) || 0;
    const cycle = slides.length
      ? starts[slides.length - 1] -
        starts[0] +
        slides[slides.length - 1].offsetWidth +
        gap
      : 0;
    const largest = Math.max(0, ...slides.map((slide) => slide.offsetWidth));
    if (options.loop && max > 0 && cycle >= viewportWidth + largest) {
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
      targets = starts.map(
        (start, index) =>
          span +
          start -
          (options.align === "center"
            ? (viewportWidth - slides[index].offsetWidth) / 2
            : padding),
      );
      starts = starts.map((start) => start + span);
      max = Math.max(
        viewport.scrollWidth - viewportWidth,
        span * 3 - viewportWidth - gap,
      );
    }
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
    const moving = goalIndex >= 0 || Boolean(pointer?.moved) || scrolling;
    clearTimeout(settleTimer);
    pendingIndex = undefined;
    pendingPosition = undefined;
    if (enabled)
      scrollTo((targets[retained] ?? 0) + (moving ? offset : 0), "instant");
    else disabledPosition = clamp(disabledPosition, max);
    renderLoop();
    shiftPointer(position() - before);
    viewport.style.scrollSnapType = snap;
    updateCursor();
    publish(retained);
    schedule();
    mutation?.observe(viewport, { childList: true, subtree: true });
    if (goalIndex >= 0 && enabled) goTo(goalIndex);
    else if (moving) {
      settleTimer = setTimeout(settle, 180);
    }
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

  function endDrag(snap: boolean) {
    if (!pointer) return;
    const { id, moved, caught, samples } = pointer;
    const velocity = moved && snap ? dragVelocity(samples) : 0;
    const speed = moved && snap ? releaseVelocity(samples) : 0;
    pointer = null;
    if (viewport.hasPointerCapture?.(id)) viewport.releasePointerCapture(id);
    viewport.style.userSelect = previousUserSelect;
    updateCursor();
    suppressClick = (moved || caught) && snap;
    internalHold("pointer", false);
    const current = position() + stretch;
    const stop = current + speed * GLIDE;
    const projected = nearestIndex(stop);
    const direction = velocity > 0 ? 1 : -1;
    if (moved && snap && Math.abs(velocity) >= FLICK_VELOCITY) {
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
    else viewport.style.scrollSnapType = previousSnap;
    publish();
  }

  const controller: Carousel = {
    next: () => step(1),
    prev: () => step(-1),
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
    destroy() {
      if (destroyed) return;
      endDrag(false);
      destroyed = true;
      clearTimeout(timer);
      clearTimeout(settleTimer);
      window.cancelAnimationFrame(instantFrame);
      stopSpring();
      observer?.disconnect();
      mutation?.disconnect();
      intersection?.disconnect();
      for (const remove of cleanup) remove();
      listeners.clear();
      if (!hadClass) viewport.classList.remove("re-carousel");
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
        slide.style.transform = original.transform;
        slide.style.translate = original.translate;
        slide.style.scrollSnapAlign = original.snap;
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
    ? new window.ResizeObserver(refresh)
    : undefined;
  const mutation = window.MutationObserver
    ? new window.MutationObserver(() => {
        const next = readSlides();
        if (
          next.length === slides.length &&
          next.every((slide, index) => slide === slides[index])
        )
          return;
        refresh();
      })
    : undefined;
  const intersection = window.IntersectionObserver
    ? new window.IntersectionObserver(
        ([entry]) => internalHold("offscreen", !entry.isIntersecting),
        { threshold: 0 },
      )
    : undefined;

  viewport.classList.add("re-carousel");
  if (initialTabIndex === null) viewport.tabIndex = 0;
  listen(viewport, "scroll", () => {
    if (!enabled) {
      if (Math.abs(position() - disabledPosition) > 0.5) {
        scrollTo(disabledPosition, "instant");
      }
      return;
    }
    if (pointer?.moved) recenterLoop();
    scrolling = true;
    lastScroll = window.performance.now();
    renderLoop();
    publish(pendingIndex ?? nearestIndex());
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  });
  listen(viewport, "scrollend", settle);
  listen(
    viewport,
    "wheel",
    () => {
      if (pendingIndex !== undefined && !stretch) interrupt();
    },
    { passive: true },
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
    if (key.key === "Home") goTo(0);
    else if (key.key === "End") goTo(slides.length - 1);
    else if (key.key === (rtl ? "ArrowLeft" : "ArrowRight")) step(1);
    else if (key.key === (rtl ? "ArrowRight" : "ArrowLeft")) step(-1);
    else return;
    key.preventDefault();
  });
  listen(viewport, "pointerenter", () => internalHold("hover", true));
  listen(viewport, "pointerleave", () => internalHold("hover", false));
  listen(viewport, "focusin", () => internalHold("focus", true));
  listen(viewport, "focusout", (event) => {
    const next = (event as FocusEvent).relatedTarget as Node | null;
    if (!next || !viewport.contains(next)) internalHold("focus", false);
  });
  listen(document, "visibilitychange", schedule);
  if (reducedMotion) listen(reducedMotion, "change", schedule);
  listen(window, "resize", refresh);
  listen(viewport, "pointerdown", (event) => {
    const input = event as PointerEvent;
    if (
      !enabled ||
      options.drag === false ||
      input.button !== 0 ||
      (input.target as HTMLElement).closest(
        "input, select, textarea, [contenteditable], [role=slider], [data-carousel-no-drag]",
      )
    ) {
      return;
    }
    if (input.pointerType !== "mouse") {
      // A touch on a moving strip stops it; release continues to a snap point.
      if (pendingIndex === undefined) return;
      interrupt(false);
      grabbedTouch = input.pointerId;
      return;
    }
    const caught =
      spring !== null || window.performance.now() - lastScroll < 100;
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
  listen(window, "pointermove", (event) => {
    const input = event as PointerEvent;
    if (!pointer || input.pointerId !== pointer.id) return;
    const delta = input.clientX - pointer.x;
    if (!pointer.moved && Math.abs(delta) < 5) return;
    if (!pointer.moved) {
      pointer.moved = true;
      viewport.setPointerCapture?.(pointer.id);
      viewport.style.scrollSnapType = "none";
      viewport.style.userSelect = "none";
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
    renderLoop();
    publish(nearestIndex());
  });
  listen(viewport, "lostpointercapture", () => endDrag(true));
  listen(window, "blur", () => endDrag(false));
  const releaseTouch = (event: Event) => {
    if ((event as PointerEvent).pointerId !== grabbedTouch) return;
    grabbedTouch = undefined;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 180);
  };
  listen(window, "pointerup", (event) => {
    if ((event as PointerEvent).pointerId === pointer?.id) endDrag(true);
    releaseTouch(event);
  });
  listen(window, "pointercancel", (event) => {
    if ((event as PointerEvent).pointerId === pointer?.id) endDrag(false);
    releaseTouch(event);
  });
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
  observer?.observe(viewport);
  refresh();
  mutation?.observe(viewport, { childList: true, subtree: true });
  intersection?.observe(viewport);
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
