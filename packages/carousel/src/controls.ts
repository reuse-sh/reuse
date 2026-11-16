import type { Carousel, CarouselState, CarouselStrings } from "./index.js";
import type { CarouselInternals } from "./internal.js";

const internalKey = Symbol.for("@reuse-sh/carousel internals");

function internalsOf(carousel: Carousel) {
  return (carousel as unknown as Record<symbol, CarouselInternals | undefined>)[
    internalKey
  ];
}

const ROLL = 200;
let generated = 0;

export function bindCarouselControls(
  root: HTMLElement,
  carousel: Carousel,
  options: { strings?: Partial<CarouselStrings>; dotsWindow?: number } = {},
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
  const strings = { ...strip.strings, ...options.strings };
  const { viewport } = strip;
  const document = viewport.ownerDocument;
  const cleanup: (() => void)[] = [];
  const renders: ((state: CarouselState) => void)[] = [];

  function listen(target: EventTarget, type: string, listener: EventListener) {
    target.addEventListener(type, listener);
    cleanup.push(() => target.removeEventListener(type, listener));
  }

  // Every attribute the binder writes is put back as it was.
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
    return [...found];
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

  function goToPage(page: number) {
    const pages = strip?.pages() ?? [];
    const target = pages[Math.max(0, Math.min(page, pages.length - 1))];
    if (target) strip?.goTo(target.index, "smooth", true);
  }

  for (const [selector, direction] of [
    ["[data-carousel-prev]", -1],
    ["[data-carousel-next]", 1],
  ] as const) {
    for (const button of find(selector)) {
      keep(button, "aria-controls", "aria-label", "disabled", "aria-disabled");
      button.setAttribute("aria-controls", id);
      if (!button.hasAttribute("aria-label") && !button.textContent?.trim())
        button.setAttribute(
          "aria-label",
          direction < 0 ? strings.previous : strings.next,
        );
      listen(button, "click", () =>
        direction < 0 ? carousel.prev() : carousel.next(),
      );
      renders.push((state) =>
        disable(button, !(direction < 0 ? state.canPrev : state.canNext)),
      );
    }
  }

  for (const container of find("[data-carousel-dots]")) {
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
        dots = Array.from({ length: state.pageCount }, (_, page) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.setAttribute("aria-label", strings.goTo(page, state.pageCount));
          return dot;
        });
        container.append(...dots);
      }
      const shown = Math.min(dotsWindow ?? dots.length, dots.length);
      const active = state.pageIndex;
      if (active < start + 1) start = active - 1;
      if (active > start + shown - 2) start = active - shown + 2;
      start = Math.max(0, Math.min(start, dots.length - shown));
      const end = start + shown;
      dots.forEach((dot, page) => {
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
    const render = () => {
      const playing = strip.requested();
      setAttribute(button, "aria-pressed", String(playing));
      setAttribute(
        button,
        "aria-label",
        playing ? strings.pause : strings.play,
      );
    };
    listen(button, "click", () => {
      if (strip.requested()) carousel.pause();
      else carousel.play();
      render();
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
    if (!bar.hasAttribute("aria-label"))
      bar.setAttribute("aria-label", strings.progress);
    bar.setAttribute("aria-controls", id);
    bar.setAttribute("aria-valuemin", "1");
    let dragging: { id: number; page: number } | null = null;
    const show = (fraction: number) =>
      bar.style.setProperty("--re-carousel-progress", String(fraction));
    const move = (event: Event) => {
      const input = event as PointerEvent;
      if (!dragging || input.pointerId !== dragging.id) return;
      const rect = bar.getBoundingClientRect();
      let fraction = rect.width
        ? Math.max(0, Math.min(1, (input.clientX - rect.left) / rect.width))
        : 0;
      if (rtl()) fraction = 1 - fraction;
      show(fraction);
      const pages = strip.pages();
      let page = 0;
      pages.forEach((candidate, at) => {
        if (
          Math.abs(candidate.at - fraction) <
          Math.abs(pages[page].at - fraction) - 0.001
        )
          page = at;
      });
      if (page !== dragging.page) {
        dragging.page = page;
        goToPage(page);
      }
    };
    const end = (event: Event) => {
      if (!dragging || (event as PointerEvent).pointerId !== dragging.id)
        return;
      dragging = null;
      bar.removeAttribute("data-dragging");
      show(carousel.getState().progress);
    };
    listen(bar, "pointerdown", (event) => {
      const input = event as PointerEvent;
      if (input.button !== 0) return;
      input.preventDefault();
      bar.focus({ preventScroll: true });
      try {
        bar.setPointerCapture?.(input.pointerId);
      } catch {}
      dragging = { id: input.pointerId, page: carousel.getState().pageIndex };
      bar.setAttribute("data-dragging", "");
      move(event);
    });
    listen(bar, "pointermove", move);
    listen(bar, "pointerup", end);
    listen(bar, "pointercancel", end);
    listen(bar, "lostpointercapture", end);
    listen(bar, "keydown", (event) => {
      const key = (event as KeyboardEvent).key;
      const forward = rtl() ? "ArrowLeft" : "ArrowRight";
      const back = rtl() ? "ArrowRight" : "ArrowLeft";
      if (key === forward || key === "PageUp") carousel.next();
      else if (key === back || key === "PageDown") carousel.prev();
      else if (key === "Home") goToPage(0);
      else if (key === "End") goToPage(carousel.getState().pageCount - 1);
      else return;
      event.preventDefault();
    });
    renders.push((state) => {
      setAttribute(bar, "aria-valuemax", String(Math.max(1, state.pageCount)));
      setAttribute(bar, "aria-valuenow", String(state.pageIndex + 1));
      setAttribute(
        bar,
        "aria-valuetext",
        strings.slide(state.index, state.count),
      );
      if (!dragging) show(state.progress);
    });
  }

  const render = (state: CarouselState) => {
    for (const update of renders) update(state);
  };
  const unsubscribe = carousel.subscribe(render);
  render(carousel.getState());
  return () => {
    unsubscribe();
    for (const undo of cleanup.splice(0).reverse()) undo();
  };
}
