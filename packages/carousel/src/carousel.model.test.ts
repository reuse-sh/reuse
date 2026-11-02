// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { explore, type World } from "../../../tests/model/explore.js";
import { createCarousel } from "./index.js";

const slideWidth = 310;
const viewportWidth = 1000;
const count = 8;

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function strip() {
  const viewport = document.createElement("div");
  for (let index = 0; index < count; index++) {
    const slide = document.createElement("div");
    slide.dataset.carouselSlide = "";
    Object.defineProperty(slide, "offsetWidth", { get: () => slideWidth });
    Object.defineProperty(slide, "offsetParent", { get: () => viewport });
    Object.defineProperty(slide, "offsetLeft", {
      get: () => index * slideWidth,
    });
    viewport.append(slide);
  }
  Object.defineProperty(viewport, "clientWidth", { get: () => viewportWidth });
  Object.defineProperty(viewport, "scrollWidth", {
    get: () => count * slideWidth,
  });
  viewport.scrollTo = ((options: ScrollToOptions) => {
    viewport.scrollLeft = options.left ?? 0;
    viewport.dispatchEvent(new Event("scroll"));
  }) as typeof viewport.scrollTo;
  document.body.append(viewport);
  return viewport;
}

function world(): World {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () =>
    Object.assign(new EventTarget(), { matches: false }),
  );
  const viewport = strip();
  const carousel = createCarousel(viewport);
  let shown: number | undefined;
  const lightbox = (index: number) => () => {
    shown = index;
    carousel.goTo(index);
  };
  return {
    steps: {
      "lightbox shows photo 1": lightbox(0),
      "lightbox shows photo 6": lightbox(5),
      "lightbox shows photo 7": lightbox(6),
      "lightbox shows photo 8": lightbox(7),
      "next arrow": () => {
        shown = undefined;
        carousel.next();
      },
      "time: next timer": () => {
        vi.advanceTimersToNextTimer();
      },
    },
    checks: {
      "the carousel's active slide is the lightbox's photo": () =>
        shown === undefined || carousel.getState().index === shown,
    },
    fingerprint: () =>
      [
        shown,
        carousel.getState().index,
        viewport.scrollLeft,
        vi.getTimerCount(),
      ].join("|"),
    teardown: () => carousel.destroy(),
  };
}

it("agrees with the lightbox under every order of four events", async () => {
  const verdict = await explore(world, 4);
  expect(
    verdict.ok ? "holds" : `${verdict.broke}: ${verdict.path.join(" → ")}`,
  ).toBe("holds");
});
