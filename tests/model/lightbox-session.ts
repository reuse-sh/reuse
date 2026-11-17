import { vi } from "vitest";
import {
  createLightbox,
  type Lightbox,
} from "../../packages/lightbox/src/index.js";
import type { World } from "./explore.js";

const width = 1024;
const height = 768;
const count = 6;

// jsdom has no dialog methods, no layout and no scrolling, so the world supplies them.
function stubBrowser() {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    },
  });
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false,
    media,
    addEventListener() {},
    removeEventListener() {},
  }));
  const slideIndex = (element: HTMLElement) =>
    element.classList.contains("re-lightbox-slide")
      ? [...(element.parentElement?.children ?? [])].indexOf(element)
      : 0;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return new DOMRect(slideIndex(this) * width, 0, width, height);
    },
  );
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(width);
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(
    function (this: HTMLElement) {
      return slideIndex(this) * width;
    },
  );
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(
    function (this: HTMLElement) {
      return this.classList.contains("re-lightbox-viewport")
        ? this.children.length * width
        : width;
    },
  );
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value(this: HTMLElement, options: ScrollToOptions) {
      this.scrollLeft = options.left ?? this.scrollLeft;
      this.dispatchEvent(new Event("scroll"));
    },
  });
}

export function lightboxSession(): World {
  // jsdom decodes images on setImmediate, so it stays real.
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
      "Date",
    ],
  });
  stubBrowser();
  const tiles = Array.from({ length: count }, (_, index) => {
    const tile = document.createElement("img");
    tile.alt = `Tile ${index}`;
    document.body.append(tile);
    return tile;
  });
  const startHistory = history.length;
  let destroyed = false;
  const lightbox: Lightbox = createLightbox({ duration: 280 });
  const items = tiles.map((tile, index) => ({
    src: `https://example.test/full-${index}.jpg`,
    width: 1600,
    height: 1200,
    alt: tile.alt,
    origin: tile,
  }));
  const viewport = () =>
    document.querySelector<HTMLElement>(".re-lightbox-viewport");
  const settled = () => {
    const { isOpen, isClosing } = lightbox.getState();
    return destroyed || (!isOpen && !isClosing);
  };
  return {
    steps: {
      open: () => {
        if (!destroyed) lightbox.open(items, 2);
      },
      close: () => {
        void lightbox.close();
      },
      swipe: () => {
        const strip = viewport();
        if (!strip) return;
        strip.dispatchEvent(new Event("pointerdown"));
        strip.scrollLeft += width;
        strip.dispatchEvent(new Event("scroll"));
        strip.dispatchEvent(new Event("scrollend"));
      },
      zoom: () => lightbox.toggleZoom(),
      resize: () => {
        window.dispatchEvent(new Event("resize"));
      },
      destroy: () => {
        lightbox.destroy();
        destroyed = true;
      },
      time: async () => {
        vi.advanceTimersToNextTimer();
        await Promise.resolve();
        // jsdom lands history traversals on setImmediate, which stays real.
        await new Promise((resolve) => setImmediate(resolve));
      },
    },
    checks: {
      "at most one dialog is open": () =>
        document.querySelectorAll("dialog").length <= 1,
      "once closed every tile is visible": () =>
        !settled() || tiles.every((tile) => tile.style.visibility === ""),
      "once closed the page scrolls": () =>
        !settled() ||
        (document.body.style.overflow === "" &&
          document.documentElement.style.getPropertyValue(
            "--re-scrollbar-gap",
          ) === ""),
      "once closed no timer or frame is left": () =>
        !settled() || vi.getTimerCount() === 0,
      "history holds at most one lightbox entry": () =>
        history.length - startHistory <= 1,
    },
    fingerprint: () => {
      const { isOpen, isClosing, index, zoom } = lightbox.getState();
      return [
        isOpen,
        isClosing,
        index,
        zoom.scale,
        destroyed,
        document.querySelectorAll("dialog").length,
        vi.getTimerCount(),
        viewport()?.scrollLeft,
      ].join("|");
    },
    teardown: () => {
      lightbox.destroy();
      document.body.replaceChildren();
      document.body.removeAttribute("style");
      document.documentElement.removeAttribute("style");
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    },
  };
}
