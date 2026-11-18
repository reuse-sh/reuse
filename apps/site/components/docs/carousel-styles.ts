import {
  type Carousel,
  type CarouselOptions,
  type CarouselState,
  connectThumbnails,
  createCarousel,
} from "@reuse-sh/carousel";
import { bindCarouselControls } from "@reuse-sh/carousel/controls";
import { photos } from "../../lib/photos";
import { arrowPaths } from "../lucide-arrows";
import { createSegmentHighlights } from "../segment-highlight";

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

function find<T extends HTMLElement = HTMLElement>(
  root: ParentNode,
  selector: string,
) {
  const node = root.querySelector<T>(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
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
        `<figure class="cc-slide" data-carousel-slide><img src="${attr(photo.src)}" alt="${attr(photo.alt)}" width="2400" height="1800" draggable="false"></figure>`,
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
 * The fills sit outside the viewport, so the active one takes the carousel's autoplay
 * progress from its state. A slide that is not filling shows full.
 */
function autoplayFill(carousel: Carousel, fills: HTMLElement[]) {
  return follow(carousel, (state) => {
    const filling = state.isPlaying || state.autoplayProgress > 0;
    fills.forEach((fill, index) => {
      if (index === state.index)
        fill.style.setProperty(
          "--cc-fill",
          String(filling ? state.autoplayProgress : 1),
        );
      else fill.style.removeProperty("--cc-fill");
    });
  });
}

function hideUnderReducedMotion(box: HTMLElement, selector: string) {
  if (reduced()) find(box, selector).hidden = true;
}

const showLabel = (index: number) =>
  `Show ${attr(photos[index]?.caption ?? "")}`;

const builders: Record<CarouselStyleName, (demo: HTMLElement) => Cleanup> = {
  Dots(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "dots",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-row cc-row-center"><div class="d-dots" role="group" aria-label="Slides" data-carousel-dots>${photos
        .map(
          (_, index) =>
            `<button type="button" aria-label="${showLabel(index)}"></button>`,
        )
        .join("")}</div></div>`,
      { loop: true },
    );
    const dots = find(box, ".d-dots");
    const unbind = bindCarouselControls(box, carousel);
    const unsubscribe = follow(carousel, (state) => {
      dots.style.setProperty("--d-dot", String(state.pageIndex));
    });
    return () => {
      unsubscribe();
      unbind();
      carousel.destroy();
    };
  },

  Pills(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "pills",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-row cc-row-center">
        <div class="cc-pills" role="group" aria-label="Slides" data-carousel-dots>${photos
          .map(
            (_, index) =>
              `<button type="button" class="cc-pill" aria-label="${showLabel(index)}"><span class="cc-pill-mark"><span class="cc-pill-fill"></span></span></button>`,
          )
          .join("")}</div>
        <button type="button" class="cc-round cc-play" data-carousel-play aria-label="Pause slideshow"><span class="cc-swap">${PAUSE}${PLAY}</span></button>
      </div>`,
      { loop: true, align: "center", autoplay: AUTOPLAY },
    );
    hideUnderReducedMotion(box, ".cc-play");
    const unbind = bindCarouselControls(box, carousel);
    const offFill = autoplayFill(carousel, [
      ...box.querySelectorAll<HTMLElement>(".cc-pill-fill"),
    ]);
    return () => {
      offFill();
      unbind();
      carousel.destroy();
    };
  },

  Stories(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "stories",
      `<div class="cc-story">
        <div class="cc-view" data-viewport>${slides()}</div>
        <div class="cc-story-top">
          <div class="cc-segments" aria-hidden="true">${photos.map(() => `<span class="cc-segment"><span class="cc-segment-fill"></span></span>`).join("")}</div>
          <button type="button" class="cc-story-play" data-carousel-play aria-label="Pause slideshow"><span class="cc-swap">${PAUSE}${PLAY}</span></button>
        </div>
      </div>`,
      { loop: true, autoplay: AUTOPLAY },
    );
    hideUnderReducedMotion(box, ".cc-story-play");
    const segments = [...box.querySelectorAll<HTMLElement>(".cc-segment")];
    const unbind = bindCarouselControls(box, carousel);
    const unsubscribe = follow(carousel, (state) => {
      segments.forEach((segment, index) => {
        segment.toggleAttribute("data-past", index < state.index);
        if (index === state.index) segment.setAttribute("aria-current", "true");
        else segment.removeAttribute("aria-current");
      });
    });
    const offFill = autoplayFill(
      carousel,
      segments.map((segment) => find(segment, ".cc-segment-fill")),
    );
    return () => {
      offFill();
      unsubscribe();
      unbind();
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
          <span class="cc-counter" aria-hidden="true"><span class="cc-roll" data-carousel-counter data-roll></span><span class="cc-total">/ ${pad(photos.length)}</span></span>
          <button type="button" class="cc-round" data-carousel-prev aria-label="Previous slide">${arrow("left")}</button>
          <button type="button" class="cc-round" data-carousel-next aria-label="Next slide">${arrow("right")}</button>
        </div>
      </div>`,
      { loop: false, strings: { counter: (index) => pad(index + 1) } },
    );
    const caption = find(box, "[data-caption]");
    const place = find(box, "[data-place]");
    const captionBox = find(box, ".cc-caption");
    const unbind = bindCarouselControls(box, carousel);
    let shown = -1;
    const unsubscribe = follow(carousel, (state) => {
      if (state.index === shown) return;
      const moved = shown >= 0;
      shown = state.index;
      const photo = photos[state.index];
      caption.textContent = photo.caption;
      place.textContent = photo.alt;
      if (moved && !reduced())
        captionBox.animate(
          [
            { opacity: 0, transform: "translateY(3px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 260, easing: "ease-out" },
        );
    });
    return () => {
      unsubscribe();
      unbind();
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
            `<button type="button" class="cc-thumb" aria-label="${showLabel(index)}"><img src="${attr(photo.src)}" alt="" draggable="false"></button>`,
        )
        .join("")}</div>`,
      { loop: false },
    );
    const thumbnails = createCarousel(find(box, ".cc-thumbs"), {
      slides: ".cc-thumb",
    });
    const disconnect = connectThumbnails(carousel, thumbnails);
    return () => {
      disconnect();
      thumbnails.destroy();
      carousel.destroy();
    };
  },

  Arrows(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "edge",
      `<div class="cc-edge">
        <div class="cc-view" data-viewport>${slides()}</div>
        <button type="button" class="cc-round cc-edge-prev" data-carousel-prev aria-label="Previous slides">${arrow("left")}</button>
        <button type="button" class="cc-round cc-edge-next" data-carousel-next aria-label="Next slides">${arrow("right")}</button>
      </div>`,
      { loop: false, group: "page" },
    );
    const unbind = bindCarouselControls(box, carousel);
    return () => {
      unbind();
      carousel.destroy();
    };
  },

  Scrubber(demo) {
    const { box, viewport, carousel } = carouselDemo(
      demo,
      "scrub",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-scrub" data-carousel-progress>
        <span class="cc-scrub-rail" aria-hidden="true">
          <span class="cc-scrub-track"><span class="cc-scrub-fill"></span></span>
          <span class="cc-scrub-ticks"></span>
          <span class="cc-scrub-handle"></span>
        </span>
      </div>`,
      { loop: false, strings: { progress: "Scroll position" } },
    );
    const ticks = find(box, ".cc-scrub-ticks");
    const unbind = bindCarouselControls(box, carousel);
    // One tick per distinct snap point; slides that end the strip share the last one.
    const measure = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      const origin =
        (viewport.firstElementChild as HTMLElement | null)?.offsetLeft ?? 0;
      const stops: number[] = [];
      for (const slide of viewport.querySelectorAll<HTMLElement>(
        "[data-carousel-slide]",
      )) {
        const at = max > 0 ? Math.min(1, (slide.offsetLeft - origin) / max) : 0;
        const last = stops.at(-1);
        if (last === undefined || at - last > 0.01) stops.push(at);
      }
      ticks.innerHTML = stops
        .map((at) => `<span style="left:${(at * 100).toFixed(3)}%"></span>`)
        .join("");
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    measure();
    return () => {
      observer.disconnect();
      unbind();
      carousel.destroy();
    };
  },

  Labels(demo) {
    const { box, carousel } = carouselDemo(
      demo,
      "labels",
      `<div class="cc-view" data-viewport>${slides()}</div>
      <div class="cc-row cc-row-center"><div class="cc-tabs" role="group" aria-label="Slides" data-carousel-dots>${photos
        .map(
          (photo) =>
            `<button type="button" class="cc-tab" data-re-row>${attr(photo.caption)}</button>`,
        )
        .join("")}</div></div>`,
      { loop: true },
    );
    const tabs = find(box, ".cc-tabs");
    const buttons = [...tabs.querySelectorAll<HTMLElement>(".cc-tab")];
    const unbind = bindCarouselControls(box, carousel);
    let shown = -1;
    const unsubscribe = follow(carousel, (state) => {
      if (state.pageIndex === shown) return;
      centerChild(tabs, buttons[state.pageIndex], shown < 0);
      shown = state.pageIndex;
    });
    const unhighlight = createSegmentHighlights(tabs, '[aria-current="true"]');
    return () => {
      unhighlight();
      unsubscribe();
      unbind();
      carousel.destroy();
    };
  },
};

/** Mounts one live carousel in the given control style. Returns its cleanup. */
export function mountCarouselStyle(demo: HTMLElement, name: CarouselStyleName) {
  return builders[name](demo);
}
