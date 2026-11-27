import type { UsageRecipe } from "./usage-types.js";

const packageStyles = (id: string) =>
  ({
    title: "Package styles",
    blocks: [
      {
        kind: "prose",
        text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
      },
      {
        kind: "code",
        id: `${id}-package-styles`,
        language: "css",
        code: '@import "@reuse-sh/carousel/styles.css" layer(components);',
        role: "setup",
      },
    ],
  }) as const;

const cleanupProse =
  "Run this when the view is removed, before mounting another controller on the same element.";

const coverflowCss = `.coverflow {
  --re-carousel-gap: 0px;
  --re-carousel-slide-width: min(14rem, 52%);
  --direction: 1;
  padding-block: 1rem;
}
.coverflow:dir(rtl) { --direction: -1; }
.coverflow > .re-carousel__slide {
  --near: clamp(-1, var(--re-carousel-offset, 0), 1);
  --far: max(var(--re-carousel-offset, 0), -1 * var(--re-carousel-offset, 0));
  position: relative;
  z-index: calc(100 - var(--far) * 10);
  perspective: 50rem;
}
.coverflow img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 10px;
  transform:
    translateX(calc((0.3 * var(--near) - 0.7 * var(--re-carousel-offset, 0)) * 100% * var(--direction)))
    rotateY(calc(var(--near) * -50deg * var(--direction)))
    scale(calc(1 - min(var(--far), 2) * 0.12));
  opacity: clamp(0, 3.5 - var(--far), 1);
}`;

const coverflowUsage =
  "Loop the strip and center the active slide. Every slide carries --re-carousel-offset, its distance from the center in slide widths, negative before it and positive after it, so the CSS turns, shrinks, stacks and fades each cover from that one number. Put the effect on an element inside the slide: the slide keeps its box, so snapping and the loop shift stay where the carousel measured them.";

const coverflowIntegration =
  "The offset is written on every scroll, drag and spring frame, so the covers turn while the strip moves, across the loop seam too. Under reduced motion the strip jumps and the covers take their new angles at once. A click on a side cover brings it to the center, and the arrow keys page when the strip has focus. The strip loops only while its covers span the viewport plus the widest cover, so a wider container needs more covers.";

const marqueeFunction = `function runMarquee(carousel, strip, { speed = 40, hoverSpeed = 10 } = {}) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let driver = null;
  let position = 0;
  let current = 0;
  let target = speed;
  let frame = 0;
  let last = 0;
  let onScreen = true;
  let focused = false;
  let interrupted = false;
  const tick = (now) => {
    frame = requestAnimationFrame(tick);
    const elapsed = last ? Math.min(now - last, 100) : 0;
    last = now;
    current += (target - current) * (1 - Math.exp(-elapsed / 300));
    position += (current * elapsed) / 1000;
    driver?.setPosition(position);
  };
  const update = () => {
    cancelAnimationFrame(frame);
    frame = last = 0;
    if (reducedMotion.matches || focused) {
      driver?.release();
      driver = null;
    }
    if (reducedMotion.matches || focused || interrupted || !onScreen || document.hidden) return;
    if (!driver) {
      driver = carousel.take("marquee", {
        onInterrupt: () => {
          driver = null;
          interrupted = true;
          update();
        },
      });
      position = current = 0;
    }
    frame = requestAnimationFrame(tick);
  };
  const settle = () => {
    driver = null;
    interrupted = false;
    update();
  };
  const wheel = (event) => {
    if (!driver || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    driver.release();
    driver = null;
    interrupted = true;
    update();
  };
  const slow = (event) => {
    if (event.pointerType === "mouse") target = hoverSpeed;
  };
  const resume = () => {
    target = speed;
  };
  const focus = () => {
    focused = strip.matches(":focus-visible");
    update();
  };
  const blur = () => {
    focused = false;
    update();
  };
  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    update();
  });
  observer.observe(strip);
  strip.addEventListener("re-carousel:settle", settle);
  strip.addEventListener("wheel", wheel, { passive: true });
  strip.addEventListener("pointerenter", slow);
  strip.addEventListener("pointerleave", resume);
  strip.addEventListener("focus", focus);
  strip.addEventListener("keyup", focus);
  strip.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  update();
  return () => {
    observer.disconnect();
    strip.removeEventListener("re-carousel:settle", settle);
    strip.removeEventListener("wheel", wheel);
    strip.removeEventListener("pointerenter", slow);
    strip.removeEventListener("pointerleave", resume);
    strip.removeEventListener("focus", focus);
    strip.removeEventListener("keyup", focus);
    strip.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", update);
    reducedMotion.removeEventListener("change", update);
    cancelAnimationFrame(frame);
    driver?.release();
  };
}`;

const marqueeFunctionTyped = marqueeFunction
  .replace(
    "function runMarquee(carousel, strip, { speed = 40, hoverSpeed = 10 } = {}) {",
    "function runMarquee(\n  carousel: Carousel,\n  strip: HTMLElement,\n  { speed = 40, hoverSpeed = 10 } = {},\n) {",
  )
  .replace(
    "let driver = null;",
    'let driver: ReturnType<Carousel["take"]> | null = null;',
  )
  .replace("const tick = (now) =>", "const tick = (now: number) =>")
  .replace("const slow = (event) =>", "const slow = (event: PointerEvent) =>")
  .replace("const wheel = (event) =>", "const wheel = (event: WheelEvent) =>");

const marqueeCss = `.studios {
  --re-carousel-gap: 3rem;
}
.studios > .re-carousel__slide {
  flex: 0 0 auto;
  white-space: nowrap;
  user-select: none;
}`;

const marqueeUsage =
  "Loop the strip and hand its position to your own driver with take(). The driver adds 40 px a second on every frame and passes the total to setPosition, which wraps through the loop seam. A mouse resting on the strip eases the speed down to 10 px a second and back, so it never jumps.";

const marqueeIntegration =
  "A mouse drag or a touch takes the strip back and calls onInterrupt, and a sideways trackpad scroll releases it to the person scrolling. The run takes it again on the next re-carousel:settle and eases up from rest. It stops while the strip is off screen or the page is hidden, lets go while the strip has keyboard focus so the arrow keys scroll it, and stays still under reduced motion, where the strip scrolls as an ordinary carousel. Pause releases the strip, and it snaps to the nearest logo. The strip loops only while its logos span the viewport plus the widest logo; with fewer, setPosition stops at the end, so repeat the row in a wide container.";

const storiesCss = `.stories {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  color: #fff;
  user-select: none;
  -webkit-touch-callout: none;
}
.stories .re-carousel {
  --re-carousel-gap: 0px;
  height: 100%;
}
.stories figure {
  position: relative;
  margin: 0;
  height: 100%;
}
.stories figcaption {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  padding: 48px 16px 16px;
  background: linear-gradient(transparent, rgb(0 0 0 / 55%));
}
.stories img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.segments {
  position: sticky;
  inset-inline-start: 0;
  z-index: 1;
  flex: 0 0 100%;
  margin-inline-end: -100%;
  align-self: flex-start;
  display: flex;
  gap: 4px;
  padding: 12px 12px 0;
  pointer-events: none;
}
.segments span {
  flex: 1;
  height: 2px;
  background: rgb(255 255 255 / 40%);
  background-image: linear-gradient(#fff, #fff);
  background-repeat: no-repeat;
  background-size: calc(var(--fill, 0) * 100%) 100%;
}
.segments span:dir(rtl) { background-position: right; }
.segments [data-state="past"] { --fill: 1; }
.segments [data-state="current"] { --fill: var(--re-carousel-autoplay-progress, 0); }
.stories .taps {
  position: absolute;
  inset: 0;
  display: flex;
  touch-action: pan-y;
}
.stories .taps button {
  border: 0;
  background: none;
}
.stories [data-story-prev] { flex: 0 0 33%; }
.stories [data-story-next] { flex: 1; }
.stories .play {
  position: absolute;
  top: 20px;
  inset-inline-end: 8px;
}
@media (prefers-reduced-motion: reduce) {
  .stories .play { display: none; }
}`;

const storiesUsage =
  "Run autoplay on a strip of stories and keep the segment bar inside the strip, so it inherits --re-carousel-autoplay-progress, the part of the wait that has passed. Past segments are full, the current one fills with the progress, and later ones stay empty. The bar is sticky and takes no room in the row, so it stays put while the stories move under it.";

const storiesIntegration =
  "The tap buttons cover the strip, so hovering the stories does not pause them. A press holds autoplay with carousel.hold() until release, and the rest of the wait resumes. A short tap on the start third goes back, anywhere else goes forward, and a sideways swipe pages in the reading direction. After the last story the strip returns to the first. Under reduced motion autoplay stays paused, the pause button hides, and the taps and keys still page.";

const storiesTaps = `function bindStoryTaps(root, carousel) {
  const controller = new AbortController();
  const { signal } = controller;
  let press = null;
  const page = (forward) => {
    if (!forward) carousel.prev();
    else if (carousel.getState().canNext) carousel.next();
    else carousel.goTo(0);
  };
  const end = () => {
    press = null;
    carousel.hold("press", false);
  };
  for (const button of root.querySelectorAll("[data-story-prev], [data-story-next]")) {
    const forward = button.hasAttribute("data-story-next");
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || press) return;
      press = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
      button.setPointerCapture(event.pointerId);
      carousel.hold("press", true);
    }, { signal });
    button.addEventListener("pointerup", (event) => {
      if (!press || event.pointerId !== press.id) return;
      const dx = event.clientX - press.x;
      const dy = event.clientY - press.y;
      const short = event.timeStamp - press.time < 300;
      end();
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        const rtl = getComputedStyle(root).direction === "rtl";
        page(rtl ? dx > 0 : dx < 0);
      } else if (short && Math.hypot(dx, dy) < 10) page(forward);
    }, { signal });
    button.addEventListener("pointercancel", (event) => {
      if (press && event.pointerId === press.id) end();
    }, { signal });
    button.addEventListener("click", (event) => {
      if (event.detail === 0) page(forward);
    }, { signal });
    button.addEventListener("contextmenu", (event) => event.preventDefault(), { signal });
  }
  return () => {
    controller.abort();
    if (press) end();
  };
}`;

const storiesTapsTyped = storiesTaps
  .replace(
    "function bindStoryTaps(root, carousel) {",
    "function bindStoryTaps(root: HTMLElement, carousel: Carousel) {",
  )
  .replace(
    "let press = null;",
    "let press: { id: number; x: number; y: number; time: number } | null = null;",
  )
  .replace("const page = (forward) =>", "const page = (forward: boolean) =>")
  .replace(
    'root.querySelectorAll("[data-story-prev], [data-story-next]")',
    'root.querySelectorAll<HTMLElement>("[data-story-prev], [data-story-next]")',
  );

export const carouselEffectsUsage: Readonly<Record<string, UsageRecipe>> = {
  "carousel/examples/coverflow": {
    react: [
      packageStyles("carousel-examples-coverflow"),
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: coverflowUsage },
          {
            kind: "code",
            id: "carousel-examples-coverflow-css",
            language: "css",
            code: coverflowCss,
            role: "usage",
          },
          {
            kind: "code",
            id: "carousel-examples-coverflow-react",
            language: "tsx",
            code: `"use client";

import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";

const covers = [
  { src: "/photos/blocks.jpg", alt: "Stacked concrete blocks", title: "Blocks" },
  { src: "/photos/fern.jpg", alt: "A fern leaf in a glass vase", title: "Fern" },
  { src: "/photos/stair.jpg", alt: "Plaster steps rise to a landing", title: "Stair" },
  { src: "/photos/bloom.jpg", alt: "A yellow bloom in a glass vase", title: "Bloom" },
  { src: "/photos/grid.jpg", alt: "White tiled facades", title: "Grid" },
  { src: "/photos/shadow.jpg", alt: "A white wall half in shadow", title: "Shadow" },
];

export function Coverflow() {
  const { ref, carousel } = useCarousel({ loop: true, align: "center" });
  const index = useCarouselState(carousel, (state) => state.index);
  return <div>
    <div ref={ref} className="re-carousel coverflow" tabIndex={0} aria-label="Covers">
      {covers.map((cover, at) => (
        <div key={cover.src} className="re-carousel__slide" onClick={() => carousel?.goTo(at)}>
          <img src={cover.src} alt={cover.alt} width="640" height="640" draggable={false} />
        </div>
      ))}
    </div>
    <p aria-hidden="true">{covers[index]?.title}</p>
  </div>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [{ kind: "prose", text: coverflowIntegration }],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: coverflowUsage },
          {
            kind: "code",
            id: "carousel-examples-coverflow-markup",
            language: "html",
            code: `<div id="covers" class="re-carousel coverflow" tabindex="0" aria-label="Covers">
  <div class="re-carousel__slide"><img src="/photos/blocks.jpg" alt="Stacked concrete blocks" width="640" height="640" draggable="false" /></div>
  <div class="re-carousel__slide"><img src="/photos/fern.jpg" alt="A fern leaf in a glass vase" width="640" height="640" draggable="false" /></div>
  <div class="re-carousel__slide"><img src="/photos/stair.jpg" alt="Plaster steps rise to a landing" width="640" height="640" draggable="false" /></div>
  <div class="re-carousel__slide"><img src="/photos/bloom.jpg" alt="A yellow bloom in a glass vase" width="640" height="640" draggable="false" /></div>
  <div class="re-carousel__slide"><img src="/photos/grid.jpg" alt="White tiled facades" width="640" height="640" draggable="false" /></div>
  <div class="re-carousel__slide"><img src="/photos/shadow.jpg" alt="A white wall half in shadow" width="640" height="640" draggable="false" /></div>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once, then draw the covers from each slide's offset.",
          },
          {
            kind: "code",
            id: "carousel-examples-coverflow-styles",
            language: "css",
            code: `@import "@reuse-sh/carousel/styles.css";

${coverflowCss}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. A click on a side cover brings it to the center.",
          },
          {
            kind: "code",
            id: "carousel-examples-coverflow-initialize",
            language: "javascript",
            code: `import { createCarousel } from "@reuse-sh/carousel";

const strip = document.querySelector("#covers");
const carousel = createCarousel(strip, { loop: true, align: "center" });
const slides = [...strip.querySelectorAll(".re-carousel__slide")];
const center = (event) => {
  const at = slides.indexOf(event.target.closest(".re-carousel__slide"));
  if (at >= 0) carousel.goTo(at);
};
strip.addEventListener("click", center);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [{ kind: "prose", text: coverflowIntegration }],
      },
      {
        title: "Cleanup",
        blocks: [
          { kind: "prose", text: cleanupProse },
          {
            kind: "code",
            id: "carousel-examples-coverflow-cleanup",
            language: "javascript",
            code: `strip.removeEventListener("click", center);
carousel.destroy();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "carousel/examples/marquee": {
    react: [
      packageStyles("carousel-examples-marquee"),
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: marqueeUsage },
          {
            kind: "code",
            id: "carousel-examples-marquee-css",
            language: "css",
            code: marqueeCss,
            role: "usage",
          },
          {
            kind: "code",
            id: "carousel-examples-marquee-react",
            language: "tsx",
            code: `"use client";

import type { Carousel } from "@reuse-sh/carousel";
import { useCarousel } from "@reuse-sh/carousel/react";
import { useCallback, useEffect, useRef, useState } from "react";

${marqueeFunctionTyped}

const studios = ["Velmora", "Quillon", "Ardentis", "Lumeway", "Teskard", "Oorvik", "Pinnacrest", "Solvane"];

export function Studios() {
  const { ref, carousel } = useCarousel({ loop: true });
  const strip = useRef<HTMLDivElement | null>(null);
  const setStrip = useCallback((element: HTMLDivElement | null) => {
    strip.current = element;
    ref(element);
  }, [ref]);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (carousel && strip.current && !paused) return runMarquee(carousel, strip.current);
  }, [carousel, paused]);
  return <section aria-label="Studios we print for">
    <button type="button" onClick={() => setPaused(!paused)}>{paused ? "Play" : "Pause"}</button>
    <div ref={setStrip} className="re-carousel studios" tabIndex={0} aria-label="Studios">
      {studios.map((name) => <span key={name} className="re-carousel__slide">{name}</span>)}
    </div>
  </section>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [{ kind: "prose", text: marqueeIntegration }],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: marqueeUsage },
          {
            kind: "code",
            id: "carousel-examples-marquee-markup",
            language: "html",
            code: `<section aria-label="Studios we print for">
  <button id="pause" type="button">Pause</button>
  <div id="studios" class="re-carousel studios" tabindex="0" aria-label="Studios">
    <span class="re-carousel__slide">Velmora</span>
    <span class="re-carousel__slide">Quillon</span>
    <span class="re-carousel__slide">Ardentis</span>
    <span class="re-carousel__slide">Lumeway</span>
    <span class="re-carousel__slide">Teskard</span>
    <span class="re-carousel__slide">Oorvik</span>
    <span class="re-carousel__slide">Pinnacrest</span>
    <span class="re-carousel__slide">Solvane</span>
  </div>
</section>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Logos keep their own width.",
          },
          {
            kind: "code",
            id: "carousel-examples-marquee-styles",
            language: "css",
            code: `@import "@reuse-sh/carousel/styles.css";

${marqueeCss}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. runMarquee returns the function that stops the run and gives the strip back.",
          },
          {
            kind: "code",
            id: "carousel-examples-marquee-initialize",
            language: "javascript",
            code: `import { createCarousel } from "@reuse-sh/carousel";

${marqueeFunction}

const strip = document.querySelector("#studios");
const pause = document.querySelector("#pause");
const carousel = createCarousel(strip, { loop: true });
let stop = runMarquee(carousel, strip);
const toggle = () => {
  if (stop) {
    stop();
    stop = null;
  } else stop = runMarquee(carousel, strip);
  pause.textContent = stop ? "Pause" : "Play";
};
pause.addEventListener("click", toggle);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [{ kind: "prose", text: marqueeIntegration }],
      },
      {
        title: "Cleanup",
        blocks: [
          { kind: "prose", text: cleanupProse },
          {
            kind: "code",
            id: "carousel-examples-marquee-cleanup",
            language: "javascript",
            code: `pause.removeEventListener("click", toggle);
stop?.();
carousel.destroy();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "carousel/examples/stories": {
    react: [
      packageStyles("carousel-examples-stories"),
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: storiesUsage },
          {
            kind: "code",
            id: "carousel-examples-stories-css",
            language: "css",
            code: storiesCss,
            role: "usage",
          },
          {
            kind: "code",
            id: "carousel-examples-stories-react",
            language: "tsx",
            code: `"use client";

import type { Carousel } from "@reuse-sh/carousel";
import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";
import { useEffect, useRef } from "react";

${storiesTapsTyped}

const stories = [
  { src: "/photos/palm.jpg", alt: "A lone palm leans over a pale beach", caption: "Palm and sand" },
  { src: "/photos/sea.jpg", alt: "A wide sky over a teal sea", caption: "Sea and sky" },
  { src: "/photos/stair.jpg", alt: "White walls and an outdoor stair", caption: "Courtyard stair" },
];

export function Stories() {
  const { ref, carousel } = useCarousel({ autoplay: 5000 });
  const index = useCarouselState(carousel, (state) => state.index);
  const paused = useCarouselState(carousel, (state) => state.isPaused);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (carousel && root.current) return bindStoryTaps(root.current, carousel);
  }, [carousel]);
  return <div ref={root} className="stories">
    <div ref={ref} className="re-carousel" aria-label="Stories">
      <div className="segments" aria-hidden="true">
        {stories.map((story, at) => (
          <span key={story.src} data-state={at < index ? "past" : at === index ? "current" : "future"} />
        ))}
      </div>
      {stories.map((story) => (
        <figure key={story.src} className="re-carousel__slide" data-carousel-slide>
          <img src={story.src} alt={story.alt} width="640" height="800" draggable={false} />
          <figcaption>{story.caption}</figcaption>
        </figure>
      ))}
    </div>
    <div className="taps">
      <button type="button" data-story-prev aria-label="Previous story" />
      <button type="button" data-story-next aria-label="Next story" />
    </div>
    <button type="button" className="play" onClick={() => (paused ? carousel?.play() : carousel?.pause())}>
      {paused ? "Play" : "Pause"}
    </button>
  </div>;
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [{ kind: "prose", text: storiesIntegration }],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: storiesUsage },
          {
            kind: "code",
            id: "carousel-examples-stories-markup",
            language: "html",
            code: `<div id="stories" class="stories">
  <div class="re-carousel" aria-label="Stories">
    <div class="segments" aria-hidden="true"><span></span><span></span><span></span></div>
    <figure class="re-carousel__slide" data-carousel-slide>
      <img src="/photos/palm.jpg" alt="A lone palm leans over a pale beach" width="640" height="800" draggable="false" />
      <figcaption>Palm and sand</figcaption>
    </figure>
    <figure class="re-carousel__slide" data-carousel-slide>
      <img src="/photos/sea.jpg" alt="A wide sky over a teal sea" width="640" height="800" draggable="false" />
      <figcaption>Sea and sky</figcaption>
    </figure>
    <figure class="re-carousel__slide" data-carousel-slide>
      <img src="/photos/stair.jpg" alt="White walls and an outdoor stair" width="640" height="800" draggable="false" />
      <figcaption>Courtyard stair</figcaption>
    </figure>
  </div>
  <div class="taps">
    <button type="button" data-story-prev aria-label="Previous story"></button>
    <button type="button" data-story-next aria-label="Next story"></button>
  </div>
  <button type="button" class="play">Pause</button>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. The segment bar sits inside the strip, so it reads the strip's autoplay progress.",
          },
          {
            kind: "code",
            id: "carousel-examples-stories-styles",
            language: "css",
            code: `@import "@reuse-sh/carousel/styles.css";

${storiesCss}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. The subscription marks each segment past, current or future and names the pause button.",
          },
          {
            kind: "code",
            id: "carousel-examples-stories-initialize",
            language: "javascript",
            code: `import { createCarousel } from "@reuse-sh/carousel";

${storiesTaps}

const root = document.querySelector("#stories");
const carousel = createCarousel(root.querySelector(".re-carousel"), { autoplay: 5000 });
const segments = [...root.querySelectorAll(".segments span")];
const play = root.querySelector(".play");
const render = ({ index, isPaused }) => {
  segments.forEach((segment, at) => {
    segment.dataset.state = at < index ? "past" : at === index ? "current" : "future";
  });
  play.textContent = isPaused ? "Play" : "Pause";
};
const toggle = () => (carousel.getState().isPaused ? carousel.play() : carousel.pause());
const stopRender = carousel.subscribe(render);
render(carousel.getState());
const unbind = bindStoryTaps(root, carousel);
play.addEventListener("click", toggle);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [{ kind: "prose", text: storiesIntegration }],
      },
      {
        title: "Cleanup",
        blocks: [
          { kind: "prose", text: cleanupProse },
          {
            kind: "code",
            id: "carousel-examples-stories-cleanup",
            language: "javascript",
            code: `play.removeEventListener("click", toggle);
unbind();
stopRender();
carousel.destroy();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
};
