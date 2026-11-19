import type { Carousel, CarouselState } from "./index.js";
import type { CarouselInternals } from "./internal.js";

const internalKey = Symbol.for("@reuse-sh/carousel internals");

function internalsOf(carousel: Carousel) {
  return (carousel as unknown as Record<symbol, CarouselInternals | undefined>)[
    internalKey
  ];
}

const ROLL = 200;
// The engine starts a mouse drag after the same distance.
const DRAG_START = 5;
// The engine settles a released drag at this rate by default, 6 / releaseDuration.
const SETTLE_RATE = 6 / 260;
let generated = 0;

export function bindCarouselControls(
  root: HTMLElement,
  carousel: Carousel,
  options: { dotsWindow?: number } = {},
): () => void {
  const strip = internalsOf(carousel);
  if (!strip)
    throw new TypeError(
      "bindCarouselControls needs a carousel from createCarousel.",
    );
  const { dotsWindow } = options;
  if (
    dotsWindow !== undefined &&
    (!Number.isInteger(dotsWindow) || dotsWindow < 1)
  )
    throw new RangeError("Carousel dotsWindow must be a positive integer.");
  const { viewport, strings } = strip;
  const document = viewport.ownerDocument;
  const cleanup: (() => void)[] = [];
  const renders: ((state: CarouselState) => void)[] = [];
  const hiding: HTMLElement[] = [];

  function listen(target: EventTarget, type: string, listener: EventListener) {
    target.addEventListener(type, listener);
    cleanup.push(() => target.removeEventListener(type, listener));
  }

  function keep(element: Element, ...names: string[]) {
    for (const name of names) {
      const value = element.getAttribute(name);
      cleanup.push(() => {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
      });
    }
  }

  function setAttribute(element: Element, name: string, value: string) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }

  if (!viewport.id) {
    viewport.id = `re-carousel-${++generated}`;
    cleanup.push(() => viewport.removeAttribute("id"));
  }
  const { id } = viewport;
  const scopes: Element[] = [
    root,
    ...Array.from(document.querySelectorAll("[data-carousel-controls]")).filter(
      (element) => element.getAttribute("data-carousel-controls") === id,
    ),
  ];
  function find<T extends HTMLElement>(selector: string) {
    const found = new Set<T>();
    for (const scope of scopes) {
      if (scope.matches(selector)) found.add(scope as T);
      for (const element of scope.querySelectorAll<T>(selector))
        found.add(element);
    }
    return [...found].filter((element) => {
      const owner = element.closest("[data-carousel-controls]");
      return (
        !owner ||
        owner.contains(root) ||
        owner.getAttribute("data-carousel-controls") === id
      );
    });
  }

  function disable(element: HTMLElement, disabled: boolean) {
    if ("disabled" in element)
      (element as HTMLButtonElement).disabled = disabled;
    else setAttribute(element, "aria-disabled", String(disabled));
  }

  function rtl() {
    return document.defaultView?.getComputedStyle(viewport).direction === "rtl";
  }

  function reduced() {
    return Boolean(
      document.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)")
        .matches,
    );
  }

  const goToPage = (page: number) => {
    const { pages } = carousel.getState();
    const target = pages[Math.max(0, Math.min(page, pages.length - 1))];
    if (target !== undefined) strip.goTo(target, "smooth", true);
  };

  for (const [selector, direction] of [
    ["[data-carousel-prev]", -1],
    ["[data-carousel-next]", 1],
  ] as const) {
    for (const button of find(selector)) {
      hiding.push(button);
      keep(
        button,
        "aria-controls",
        "aria-label",
        "disabled",
        "aria-disabled",
        "data-re-static",
      );
      button.setAttribute("aria-controls", id);
      const named =
        !button.hasAttribute("aria-label") && !button.textContent?.trim();
      listen(button, "click", () =>
        direction < 0 ? carousel.prev() : carousel.next(),
      );
      renders.push((state) => {
        disable(button, !(direction < 0 ? state.canPrev : state.canNext));
        if (named)
          setAttribute(
            button,
            "aria-label",
            direction < 0 ? strings.previous : strings.next,
          );
      });
    }
  }

  for (const container of find("[data-carousel-dots]")) {
    hiding.push(container);
    keep(container, "data-re-static");
    const own = Array.from(container.querySelectorAll("button"));
    let dots: HTMLElement[] = own;
    let start = 0;
    for (const dot of own) keep(dot, "aria-current", "hidden", "data-edge");
    if (!own.length)
      cleanup.push(() => {
        for (const dot of dots) dot.remove();
      });
    listen(container, "click", (event) => {
      const page = dots.findIndex((dot) => dot.contains(event.target as Node));
      if (page >= 0) goToPage(page);
    });
    renders.push((state) => {
      if (!own.length && dots.length !== state.pageCount) {
        for (const dot of dots) dot.remove();
        dots = Array.from({ length: state.pageCount }, () => {
          const dot = document.createElement("button");
          dot.type = "button";
          return dot;
        });
        container.append(...dots);
      }
      const shown = Math.min(dotsWindow ?? dots.length, dots.length);
      const active = state.pageIndex;
      const margin = shown >= 3 ? 1 : 0;
      if (active < start + margin) start = active - margin;
      if (active > start + shown - 1 - margin)
        start = active - shown + 1 + margin;
      start = Math.max(0, Math.min(start, dots.length - shown));
      const end = start + shown;
      dots.forEach((dot, page) => {
        if (!own.length)
          setAttribute(dot, "aria-label", strings.goTo(page, dots.length));
        if (page === active) setAttribute(dot, "aria-current", "true");
        else dot.removeAttribute("aria-current");
        if (dotsWindow === undefined) return;
        dot.hidden = page < start || page >= end;
        const edge =
          page === active
            ? null
            : (start > 0 && page === start) ||
                (end < dots.length && page === end - 1)
              ? "far"
              : (start > 0 && page === start + 1) ||
                  (end < dots.length && page === end - 2)
                ? "near"
                : null;
        if (edge) setAttribute(dot, "data-edge", edge);
        else dot.removeAttribute("data-edge");
      });
    });
  }

  for (const counter of find("[data-carousel-counter]")) {
    const original = Array.from(counter.childNodes);
    cleanup.push(() => counter.replaceChildren(...original));
    let shown: { index: number; text: string } | undefined;
    if (!counter.hasAttribute("data-roll")) {
      const text = document.createTextNode("");
      counter.replaceChildren(text);
      renders.push((state) => {
        const next = strings.counter(state.index, state.count);
        if (text.data !== next) text.data = next;
      });
      continue;
    }
    renders.push((state) => {
      const text = strings.counter(state.index, state.count);
      if (shown?.text === text) return;
      const span = document.createElement("span");
      span.textContent = text;
      const previous = shown;
      shown = { index: state.index, text };
      const leaving = counter.lastElementChild as HTMLElement | null;
      if (!previous || !leaving || reduced() || !span.animate) {
        counter.replaceChildren(span);
        return;
      }
      let direction = Math.sign(state.index - previous.index) || 1;
      if (
        state.isLooping &&
        Math.abs(state.index - previous.index) > state.count / 2
      )
        direction = -direction;
      counter.append(span);
      const timing = { duration: ROLL, easing: "ease-out" };
      const remove = () => leaving.remove();
      leaving
        .animate(
          [
            { transform: "none" },
            { transform: `translateY(${-direction * 100}%)` },
          ],
          { ...timing, fill: "forwards" },
        )
        .finished.then(remove, remove);
      span.animate(
        [
          { transform: `translateY(${direction * 100}%)` },
          { transform: "none" },
        ],
        timing,
      );
    });
  }

  for (const button of find("[data-carousel-play]")) {
    keep(button, "aria-label", "aria-pressed");
    const playing = (state: CarouselState) =>
      strip.autoplays() && !state.isPaused;
    const render = (state: CarouselState) => {
      const pressed = playing(state);
      setAttribute(button, "aria-pressed", String(pressed));
      setAttribute(
        button,
        "aria-label",
        pressed ? strings.pause : strings.play,
      );
    };
    listen(button, "click", () => {
      if (playing(carousel.getState())) carousel.pause();
      else carousel.play();
    });
    renders.push(render);
  }

  for (const bar of find("[data-carousel-progress]")) {
    keep(
      bar,
      "role",
      "tabindex",
      "aria-label",
      "aria-controls",
      "aria-valuemin",
      "aria-valuemax",
      "aria-valuenow",
      "aria-valuetext",
      "data-dragging",
    );
    cleanup.push(() => bar.style.removeProperty("--re-carousel-progress"));
    bar.setAttribute("role", "slider");
    if (!bar.hasAttribute("tabindex")) bar.tabIndex = 0;
    const named = !bar.hasAttribute("aria-label");
    bar.setAttribute("aria-controls", id);
    bar.setAttribute("aria-valuemin", "1");
    let dragging: {
      id: number;
      x: number;
      page: number;
      moved: boolean;
    } | null = null;
    // After a drag the handle keeps its offset from the strip and gives it up as the strip travels
    // to its page. When the strip is already there, the offset eases out at the engine's settle rate.
    let gliding = false;
    let from = 0;
    let start = 0;
    let goal = 0;
    let began: number | undefined;
    let frame = 0;
    let shown = 0;
    const view = document.defaultView;
    const show = (fraction: number) => {
      shown = fraction;
      bar.style.setProperty("--re-carousel-progress", String(fraction));
    };
    const stopGlide = () => {
      gliding = false;
      if (frame) view?.cancelAnimationFrame(frame);
      frame = 0;
    };
    cleanup.push(stopGlide);
    const tick = () => {
      place(carousel.getState());
      frame = gliding ? (view?.requestAnimationFrame(tick) ?? 0) : 0;
    };
    const aim = (state: CarouselState) => {
      from = shown;
      start = state.progress;
      goal = strip.pagePositions()[state.pageIndex] ?? start;
      began =
        Math.abs(goal - start) < 0.001 ? view?.performance.now() : undefined;
      if (began !== undefined && !frame)
        frame = view?.requestAnimationFrame(tick) ?? 0;
    };
    const place = (state: CarouselState) => {
      const { progress } = state;
      if (gliding && goal !== strip.pagePositions()[state.pageIndex])
        aim(state);
      let rest = 0;
      if (gliding && began !== undefined) {
        const now = view?.performance.now() ?? began;
        const u = SETTLE_RATE * Math.max(0, now - began);
        rest = (1 + u) * Math.exp(-u);
      } else if (gliding)
        rest = Math.max(0, Math.min(1, (goal - progress) / (goal - start)));
      if (rest < 0.002) stopGlide();
      show(progress + (from - start) * (gliding ? rest : 0));
    };
    const fractionAt = (input: PointerEvent) => {
      const rect = bar.getBoundingClientRect();
      const fraction = rect.width
        ? Math.max(0, Math.min(1, (input.clientX - rect.left) / rect.width))
        : 0;
      return rtl() ? 1 - fraction : fraction;
    };
    const pick = (fraction: number) => {
      if (!dragging) return;
      const positions = strip.pagePositions();
      let page = 0;
      positions.forEach((position, at) => {
        if (
          Math.abs(position - fraction) <
          Math.abs(positions[page] - fraction) - 0.001
        )
          page = at;
      });
      if (page !== dragging.page) {
        dragging.page = page;
        goToPage(page);
      }
    };
    const move = (event: Event) => {
      const input = event as PointerEvent;
      if (!dragging || input.pointerId !== dragging.id) return;
      if (!dragging.moved && Math.abs(input.clientX - dragging.x) < DRAG_START)
        return;
      dragging.moved = true;
      stopGlide();
      const fraction = fractionAt(input);
      show(fraction);
      pick(fraction);
    };
    const end = (event: Event) => {
      if (!dragging || (event as PointerEvent).pointerId !== dragging.id)
        return;
      const { moved } = dragging;
      dragging = null;
      bar.removeAttribute("data-dragging");
      const state = carousel.getState();
      if (moved && !reduced() && view?.requestAnimationFrame) {
        gliding = true;
        aim(state);
      } else if (moved) stopGlide();
      place(state);
    };
    listen(bar, "pointerdown", (event) => {
      const input = event as PointerEvent;
      if (input.button !== 0) return;
      input.preventDefault();
      bar.focus({ preventScroll: true });
      try {
        bar.setPointerCapture?.(input.pointerId);
      } catch {}
      dragging = {
        id: input.pointerId,
        x: input.clientX,
        page: carousel.getState().pageIndex,
        moved: false,
      };
      bar.setAttribute("data-dragging", "");
      pick(fractionAt(input));
    });
    listen(bar, "pointermove", move);
    listen(bar, "pointerup", end);
    listen(bar, "pointercancel", end);
    listen(bar, "lostpointercapture", end);
    listen(bar, "keydown", (event) => {
      const key = (event as KeyboardEvent).key;
      const forward = rtl() ? "ArrowLeft" : "ArrowRight";
      const back = rtl() ? "ArrowRight" : "ArrowLeft";
      if (key === forward || key === "ArrowUp" || key === "PageUp")
        carousel.next();
      else if (key === back || key === "ArrowDown" || key === "PageDown")
        carousel.prev();
      else if (key === "Home") goToPage(0);
      else if (key === "End") goToPage(carousel.getState().pageCount - 1);
      else return;
      event.preventDefault();
    });
    renders.push((state) => {
      if (named) setAttribute(bar, "aria-label", strings.progress);
      setAttribute(bar, "aria-valuemax", String(Math.max(1, state.pageCount)));
      setAttribute(bar, "aria-valuenow", String(state.pageIndex + 1));
      setAttribute(
        bar,
        "aria-valuetext",
        strings.slide(state.index, state.count),
      );
      if (!dragging?.moved) place(state);
    });
  }

  const markStatic = () => {
    const fits = viewport.hasAttribute("data-re-static");
    for (const element of hiding)
      element.toggleAttribute("data-re-static", fits);
  };
  const statics = new MutationObserver(markStatic);
  statics.observe(viewport, { attributeFilter: ["data-re-static"] });
  markStatic();
  const render = (state: CarouselState) => {
    for (const update of renders) update(state);
  };
  const unsubscribe = carousel.subscribe(render);
  const relabel = strip.onOptions(() => render(carousel.getState()));
  render(carousel.getState());
  return () => {
    statics.disconnect();
    unsubscribe();
    relabel();
    for (const undo of cleanup.splice(0).reverse()) undo();
  };
}
