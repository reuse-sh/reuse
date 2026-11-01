import {
  type Carousel,
  type CarouselOptions,
  type CarouselState,
  createCarousel,
} from "@reuse-sh/carousel";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { photos } from "../../lib/photos";
import { arrowPaths } from "../lucide-arrows";

export const carouselStyles = [
  {
    name: "Dots",
    note: "One filled dot travels over static ones. Each 4 px mark has its own 24 px hit target.",
  },
  {
    name: "Pills",
    note: "The active pill widens and fills over the autoplay interval. Hover or focus holds it, the button pauses it.",
  },
  {
    name: "Stories",
    note: "Thin segments fill one after another. Past slides stay full, so the bar also shows where you are.",
  },
  {
    name: "Counter",
    note: "A zero-padded counter and two arrows beside the caption. The number rolls in the direction you moved.",
  },
  {
    name: "Thumbnails",
    note: "A strip of crops under the slide. The active one keeps itself in view as you page.",
  },
  {
    name: "Arrows",
    note: "Arrows appear at the edges on hover or focus. An edge fades only where more slides wait.",
  },
  {
    name: "Scrubber",
    note: "A line that follows the scroll position, with a tick at every stop. Drag it, click it, or step with the arrow keys.",
  },
  {
    name: "Labels",
    note: "Named stops in a pill, with the moving highlight under the active label.",
  },
] as const;

export type CarouselStyleName = (typeof carouselStyles)[number]["name"];

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const AUTOPLAY = 4000;

const PLAY = `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.2 1.9v8.2c0 .5.5.8.9.5l6.3-4.1a.6.6 0 0 0 0-1L4.1 1.4c-.4-.3-.9 0-.9.5Z" fill="currentColor"/></svg>`;
const PAUSE = `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2.4" y="1.6" width="2.6" height="8.8" rx=".8" fill="currentColor"/><rect x="7" y="1.6" width="2.6" height="8.8" rx=".8" fill="currentColor"/></svg>`;
const arrow = (name: "left" | "right") =>
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${arrowPaths[name][0]}"/></svg>`;

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pad = (value: number) => String(value).padStart(2, "0");
const attr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

type Cleanup = () => void;

function listen<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): Cleanup {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

function find<T extends HTMLElement = HTMLElement>(
  root: ParentNode,
  selector: string,
) {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
}

function closestIndex(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  const node = target.closest<HTMLElement>("[data-index]");
  return node ? Number(node.dataset.index) : null;
}

/** Scrolls a horizontal scroller so the child sits in its middle, without moving the page. */
function centerChild(
  scroller: HTMLElement,
  child: HTMLElement,
  instant = false,
) {
  if (scroller.scrollWidth <= scroller.clientWidth) return;
  const left =
    child.offsetLeft - (scroller.clientWidth - child.offsetWidth) / 2;
  scroller.scrollTo({
    left: Math.max(0, left),
    behavior: instant || reduced() ? "instant" : "smooth",
  });
}

function slides() {
  return photos
    .map(
      (photo) =>
        `<figure class="cc-slide" data-carousel-slide><img src="${attr(photo.src)}" alt="${attr(photo.alt)}" width="1600" height="1200" draggable="false"></figure>`,
    )
    .join("");
}

function carouselDemo(
  demo: HTMLElement,
  layout: string,
  html: string,
  options: CarouselOptions,
) {
  demo.innerHTML = `<div class="cc-c cc-c-${layout}">${html}</div>`;
  const box = find(demo, ".cc-c");
  const viewport = find(box, "[data-viewport]");
  const carousel = createCarousel(viewport, options);
  return { box, viewport, carousel };
}

function follow(carousel: Carousel, render: (state: CarouselState) => void) {
  const unsubscribe = carousel.subscribe(render);
  render(carousel.getState());
  return unsubscribe;
}

/**
 * Fills the active indicator over the autoplay interval. The carousel restarts its timer
 * once a scroll settles, so the fill starts on scrollend; a hold freezes it.
 */
function autoplayFill(
  carousel: Carousel,
  viewport: HTMLElement,
  box: HTMLElement,
  fills: HTMLElement[],
) {
  let index = -1;
  let playing = false;
  let animation: Animation | null = null;
  let wait: ReturnType<typeof setTimeout> | undefined;
  const start = () => {
    clearTimeout(wait);
    animation?.cancel();
    animation = null;
    const fill = fills[index];
    if (!fill || !playing) return;
    animation = fill.animate(
      [{ transform: "translateX(-100%)" }, { transform: "translateX(0)" }],
      { duration: AUTOPLAY, easing: "linear", fill: "forwards" },
    );
  };
  const unsubscribe = follow(carousel, (state) => {
    box.toggleAttribute("data-playing", state.isPlaying);
    if (state.index !== index) {
      index = state.index;
      playing = state.isPlaying;
      animation?.cancel();
      animation = null;
      clearTimeout(wait);
      if (playing) wait = setTimeout(start, 700);
      return;
    }
    if (state.isPlaying === playing) return;
    playing = state.isPlaying;
    if (playing) start();
    else {
      clearTimeout(wait);
      animation?.pause();
    }
  });
  const offSettle = listen(viewport, "scrollend", () => {
    if (playing) start();
  });
  return () => {
    unsubscribe();
    offSettle();
    clearTimeout(wait);
    animation?.cancel();
  };
}

function playButton(box: HTMLElement, carousel: Carousel, selector: string) {
  const button = find<HTMLButtonElement>(box, selector);
  if (reduced()) {
    button.hidden = true;
    return () => {};
  }
  let paused = false;
  return listen(button, "click", () => {
    paused = !paused;
    if (paused) carousel.pause();
    else carousel.play();
    button.toggleAttribute("data-paused", paused);
    button.setAttribute(
      "aria-label",
      paused ? "Play slideshow" : "Pause slideshow",
    );
  });
}

function rollText(slot: HTMLElement, text: string, direction: number) {
  const current = slot.lastElementChild as HTMLElement | null;
  if (current?.textContent === text && !current.dataset.leaving) return;
  const node = document.createElement("span");
  node.textContent = text;
  if (!current || reduced() || !direction) {
    slot.replaceChildren(node);
    return;
  }
  slot.append(node);
  current.dataset.leaving = "";
  const options = { duration: 380, easing: EASE };
  const remove = () => current.remove();
  current
    .animate(
      [
        { transform: "none", opacity: 1 },
        { transform: `translateY(${-direction * 100}%)`, opacity: 0 },
      ],
      { ...options, fill: "forwards" },
    )
    .finished.then(remove, remove);
  node.animate(
    [
      { transform: `translateY(${direction * 100}%)`, opacity: 0 },
      { transform: "none", opacity: 1 },
    ],
    options,
  );
}

const showLabel = (index: number) =>
  `Show ${attr(photos[index]?.caption ?? "")}`;

const builders: Record<CarouselStyleName, (demo: HTMLElement) => Cleanup> = {
  Dots(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "dots",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-row cc-row-center"><div class="d-dots" role="group" aria-label="Slides">${photos
        .map(
          (_, index) =>
            `<button type="button" data-index="${index}" aria-label="${showLabel(index)}"></button>`,
        )
        .join("")}</div></div>`,
      { loop: true },
    );
    const dots = find(box, ".d-dots");
    const buttons = [...dots.children];
    const unsubscribe = follow(carousel, (state) => {
      dots.style.setProperty("--d-dot", String(state.index));
      buttons.forEach((button, index) => {
        if (index === state.index) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    });
    const off = listen(dots, "click", (event) => {
      const index = closestIndex(event);
      if (index !== null) carousel.goTo(index);
    });
    return () => {
      off();
      unsubscribe();
      carousel.destroy();
    };
  },

  Pills(demo) {
    const { box, viewport, carousel } = carouselDemo(
      demo,
      "pills",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-row cc-row-center">
        <div class="cc-pills" role="group" aria-label="Slides">${photos
          .map(
            (_, index) =>
              `<button type="button" class="cc-pill" data-index="${index}" aria-label="${showLabel(index)}"><span class="cc-pill-mark"><span class="cc-pill-fill"></span></span></button>`,
          )
          .join("")}</div>
        <button type="button" class="cc-round cc-play" aria-label="Pause slideshow"><span class="cc-swap">${PAUSE}${PLAY}</span></button>
      </div>`,
      { loop: true, align: "center", autoplay: AUTOPLAY },
    );
    const pills = [...box.querySelectorAll<HTMLElement>(".cc-pill")];
    const unsubscribe = follow(carousel, (state) => {
      pills.forEach((pill, index) => {
        if (index === state.index) pill.setAttribute("aria-current", "true");
        else pill.removeAttribute("aria-current");
      });
    });
    const offFill = autoplayFill(
      carousel,
      viewport,
      box,
      pills.map((pill) => find(pill, ".cc-pill-fill")),
    );
    const offPlay = playButton(box, carousel, ".cc-play");
    const off = listen(find(box, ".cc-pills"), "click", (event) => {
      const index = closestIndex(event);
      if (index !== null) carousel.goTo(index);
    });
    return () => {
      off();
      offPlay();
      offFill();
      unsubscribe();
      carousel.destroy();
    };
  },

  Stories(demo) {
    const { box, viewport, carousel } = carouselDemo(
      demo,
      "stories",
      `<div class="cc-story">
        <div class="cc-view" data-viewport>${slides()}</div>
        <div class="cc-story-top">
          <div class="cc-segments" aria-hidden="true">${photos.map(() => `<span class="cc-segment"><span class="cc-segment-fill"></span></span>`).join("")}</div>
          <button type="button" class="cc-story-play" aria-label="Pause slideshow"><span class="cc-swap">${PAUSE}${PLAY}</span></button>
        </div>
      </div>
      <p class="sr-only" aria-live="polite"></p>`,
      { loop: true, autoplay: AUTOPLAY },
    );
    const segments = [...box.querySelectorAll<HTMLElement>(".cc-segment")];
    const live = find(box, ".sr-only");
    const unsubscribe = follow(carousel, (state) => {
      segments.forEach((segment, index) => {
        segment.toggleAttribute("data-past", index < state.index);
        if (index === state.index) segment.setAttribute("aria-current", "true");
        else segment.removeAttribute("aria-current");
      });
      live.textContent = `Slide ${state.index + 1} of ${state.count}`;
    });
    const offFill = autoplayFill(
      carousel,
      viewport,
      box,
      segments.map((segment) => find(segment, ".cc-segment-fill")),
    );
    const offPlay = playButton(box, carousel, ".cc-story-play");
    return () => {
      offPlay();
      offFill();
      unsubscribe();
      carousel.destroy();
    };
  },

  Counter(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "counter",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-row cc-row-between">
        <p class="cc-caption"><b data-caption></b><span data-place></span></p>
        <div class="cc-counter-group">
          <span class="cc-counter" aria-hidden="true"><span class="cc-roll" data-roll></span><span class="cc-total">/ ${pad(photos.length)}</span></span>
          <button type="button" class="cc-round" data-prev aria-label="Previous slide">${arrow("left")}</button>
          <button type="button" class="cc-round" data-next aria-label="Next slide">${arrow("right")}</button>
        </div>
      </div>
      <p class="sr-only" aria-live="polite"></p>`,
      { loop: false },
    );
    const roll = find(box, "[data-roll]");
    const caption = find(box, "[data-caption]");
    const place = find(box, "[data-place]");
    const captionBox = find(box, ".cc-caption");
    const prev = find<HTMLButtonElement>(box, "[data-prev]");
    const next = find<HTMLButtonElement>(box, "[data-next]");
    const live = find(box, ".sr-only");
    let shown = -1;
    const unsubscribe = follow(carousel, (state) => {
      prev.disabled = !state.canPrev;
      next.disabled = !state.canNext;
      if (state.index === shown) return;
      const direction = shown < 0 ? 0 : Math.sign(state.index - shown);
      shown = state.index;
      const photo = photos[state.index];
      rollText(roll, pad(state.index + 1), direction);
      caption.textContent = photo.caption;
      place.textContent = photo.alt;
      live.textContent = `Slide ${state.index + 1} of ${state.count}: ${photo.caption}`;
      if (direction && !reduced())
        captionBox.animate(
          [
            { opacity: 0, transform: "translateY(3px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 260, easing: "ease-out" },
        );
    });
    const offPrev = listen(prev, "click", () => carousel.prev());
    const offNext = listen(next, "click", () => carousel.next());
    return () => {
      offPrev();
      offNext();
      unsubscribe();
      carousel.destroy();
    };
  },

  Thumbnails(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "thumbs",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-thumbs" role="group" aria-label="Slides">${photos
        .map(
          (photo, index) =>
            `<button type="button" class="cc-thumb" data-index="${index}" aria-label="${showLabel(index)}"><img src="${attr(photo.src)}" alt="" draggable="false"></button>`,
        )
        .join("")}</div>`,
      { loop: false },
    );
    const strip = find(box, ".cc-thumbs");
    const thumbs = [...strip.children] as HTMLElement[];
    let shown = -1;
    const unsubscribe = follow(carousel, (state) => {
      thumbs.forEach((thumb, index) => {
        if (index === state.index) thumb.setAttribute("aria-current", "true");
        else thumb.removeAttribute("aria-current");
      });
      if (state.index === shown) return;
      centerChild(strip, thumbs[state.index], shown < 0);
      shown = state.index;
    });
    const off = listen(strip, "click", (event) => {
      const index = closestIndex(event);
      if (index !== null) carousel.goTo(index);
    });
    return () => {
      off();
      unsubscribe();
      carousel.destroy();
    };
  },

  Arrows(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "edge",
      `<div class="cc-edge">
        <div class="cc-view" data-viewport>${slides()}</div>
        <button type="button" class="cc-round cc-edge-prev" aria-label="Previous slides">${arrow("left")}</button>
        <button type="button" class="cc-round cc-edge-next" aria-label="Next slides">${arrow("right")}</button>
      </div>`,
      { loop: false, group: "page" },
    );
    const edge = find(box, ".cc-edge");
    const prev = find<HTMLButtonElement>(box, ".cc-edge-prev");
    const next = find<HTMLButtonElement>(box, ".cc-edge-next");
    const unsubscribe = follow(carousel, (state) => {
      prev.disabled = !state.canPrev;
      next.disabled = !state.canNext;
      edge.toggleAttribute("data-more-start", state.progress > 0.002);
      edge.toggleAttribute("data-more-end", state.progress < 0.998);
    });
    const offPrev = listen(prev, "click", () => carousel.prev());
    const offNext = listen(next, "click", () => carousel.next());
    return () => {
      offPrev();
      offNext();
      unsubscribe();
      carousel.destroy();
    };
  },

  Scrubber(demo) {
    const { box, viewport, carousel } = carouselDemo(
      demo,
      "scrub",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-scrub" role="slider" tabindex="0" aria-label="Scroll position" aria-valuemin="1">
        <span class="cc-scrub-rail" aria-hidden="true">
          <span class="cc-scrub-track"><span class="cc-scrub-fill"></span></span>
          <span class="cc-scrub-ticks"></span>
          <span class="cc-scrub-handle"></span>
        </span>
      </div>`,
      { loop: false },
    );
    const scrub = find(box, ".cc-scrub");
    const rail = find(box, ".cc-scrub-rail");
    const ticks = find(box, ".cc-scrub-ticks");
    let stops: { index: number; at: number }[] = [];
    let dragging: { id: number; index: number } | null = null;
    const setPosition = (value: number) =>
      scrub.style.setProperty(
        "--cc-p",
        String(Math.max(0, Math.min(1, value))),
      );
    const stopOf = (index: number) =>
      Math.max(0, stops.filter((stop) => stop.index <= index).length - 1);
    const nearest = (fraction: number) =>
      stops.reduce((best, stop) =>
        Math.abs(stop.at - fraction) < Math.abs(best.at - fraction) - 0.001
          ? stop
          : best,
      ).index;
    const render = (state: CarouselState) => {
      const stop = stopOf(state.index);
      scrub.setAttribute("aria-valuenow", String(stop + 1));
      scrub.setAttribute(
        "aria-valuetext",
        `${photos[state.index].caption}, ${stop + 1} of ${stops.length}`,
      );
      if (!dragging) setPosition(state.progress);
    };
    // One stop per distinct snap point; slides that end the strip share the last one.
    const measure = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      const origin =
        (viewport.firstElementChild as HTMLElement | null)?.offsetLeft ?? 0;
      stops = [];
      [
        ...viewport.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
      ].forEach((slide, index) => {
        const at = max > 0 ? Math.min(1, (slide.offsetLeft - origin) / max) : 0;
        const last = stops.at(-1);
        if (!last || at - last.at > 0.01) stops.push({ index, at });
      });
      ticks.innerHTML = stops
        .map(
          (stop) => `<span style="left:${(stop.at * 100).toFixed(3)}%"></span>`,
        )
        .join("");
      scrub.setAttribute("aria-valuemax", String(stops.length));
      render(carousel.getState());
    };
    const unsubscribe = carousel.subscribe(render);
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    measure();
    const fractionAt = (event: PointerEvent) => {
      const rect = rail.getBoundingClientRect();
      return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    };
    const move = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== dragging.id) return;
      const fraction = fractionAt(event);
      setPosition(fraction);
      const index = nearest(fraction);
      if (index !== dragging.index) {
        dragging.index = index;
        carousel.goTo(index);
      }
    };
    const end = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== dragging.id) return;
      dragging = null;
      scrub.removeAttribute("data-dragging");
      setPosition(carousel.getState().progress);
    };
    const offs = [
      listen(scrub, "pointerdown", (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        scrub.focus({ preventScroll: true });
        scrub.setPointerCapture(event.pointerId);
        dragging = { id: event.pointerId, index: -1 };
        scrub.setAttribute("data-dragging", "");
        move(event);
      }),
      listen(scrub, "pointermove", move),
      listen(scrub, "pointerup", end),
      listen(scrub, "pointercancel", end),
      listen(scrub, "lostpointercapture", end),
      listen(scrub, "keydown", (event) => {
        const count = carousel.getState().count;
        const actions: Record<string, () => void> = {
          ArrowRight: () => carousel.next(),
          ArrowUp: () => carousel.next(),
          PageUp: () => carousel.next(),
          ArrowLeft: () => carousel.prev(),
          ArrowDown: () => carousel.prev(),
          PageDown: () => carousel.prev(),
          Home: () => carousel.goTo(0),
          End: () => carousel.goTo(count - 1),
        };
        const action = actions[event.key];
        if (!action) return;
        event.preventDefault();
        action();
      }),
    ];
    return () => {
      for (const off of offs) off();
      observer.disconnect();
      unsubscribe();
      carousel.destroy();
    };
  },

  Labels(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "labels",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-row cc-row-center"><div class="cc-tabs" role="group" aria-label="Slides">${photos
        .map(
          (photo, index) =>
            `<button type="button" class="cc-tab" data-reuse-row data-index="${index}">${attr(photo.caption)}</button>`,
        )
        .join("")}</div></div>`,
      { loop: true },
    );
    const tabs = find(box, ".cc-tabs");
    const buttons = [...tabs.querySelectorAll<HTMLElement>(".cc-tab")];
    let shown = -1;
    const unsubscribe = follow(carousel, (state) => {
      buttons.forEach((button, index) => {
        const active = index === state.index;
        button.toggleAttribute("data-current", active);
        button.setAttribute("aria-current", String(active));
      });
      if (state.index === shown) return;
      centerChild(tabs, buttons[state.index], shown < 0);
      shown = state.index;
    });
    const highlight = createMovingHighlight(tabs);
    const off = listen(tabs, "click", (event) => {
      const index = closestIndex(event);
      if (index !== null) carousel.goTo(index);
    });
    return () => {
      off();
      highlight.destroy();
      unsubscribe();
      carousel.destroy();
    };
  },
};

/** Mounts one live carousel in the given control style. Returns its cleanup. */
export function mountCarouselStyle(demo: HTMLElement, name: CarouselStyleName) {
  return builders[name](demo);
}
