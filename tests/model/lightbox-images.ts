import { vi } from "vitest";
import {
  createLightbox,
  type Lightbox,
} from "../../packages/lightbox/src/index.js";
import type { World } from "./explore.js";
import { stubBrowser } from "./lightbox-session.js";

const count = 4;

// Every file request is a detached img; a step answers the latest one for the current photo.
export function lightboxImages(): World {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
      "Date",
    ],
  });
  stubBrowser();
  const requests: HTMLImageElement[] = [];
  const source = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "src",
  );
  vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(
    function (this: HTMLImageElement, value: string) {
      source?.set?.call(this, value);
      if (!this.className) requests.push(this);
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const items = Array.from({ length: count }, (_, index) => ({
    src: `https://example.test/full-${index}.jpg`,
    previewSrc:
      index % 2 ? undefined : `https://example.test/tile-${index}.jpg`,
    width: 1600,
    height: 1200,
  }));
  const lightbox: Lightbox = createLightbox({ duration: 280, history: false });
  const current = () => {
    const { index } = lightbox.getState();
    return requests.findLast((image) => image.src === items[index].src);
  };
  const frames = () => [...document.querySelectorAll(".re-lightbox-frame")];
  const settled = () => {
    const { isOpen, isClosing } = lightbox.getState();
    return !isOpen && !isClosing;
  };
  return {
    steps: {
      open: () => lightbox.open(items, 1),
      arrive: () => {
        current()?.dispatchEvent(new Event("load"));
      },
      fail: () => {
        current()?.dispatchEvent(new Event("error"));
      },
      retry: () => {
        document
          .querySelector<HTMLButtonElement>(
            '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-retry',
          )
          ?.click();
      },
      next: () => lightbox.next(),
      close: () => {
        void lightbox.close();
      },
      time: async () => {
        vi.advanceTimersToNextTimer();
        await Promise.resolve();
      },
    },
    checks: {
      "a frame is loading, failed or shown, never two at once": () =>
        frames().every(
          (frame) =>
            Number(frame.hasAttribute("data-loading")) +
              Number(frame.hasAttribute("data-error")) <=
              1 &&
            frame.querySelectorAll(".re-lightbox-error").length ===
              Number(frame.hasAttribute("data-error")),
        ),
      "a spinner shows only on a loading frame, at most one": () =>
        frames().every((frame) => {
          const spinners = frame.querySelectorAll(".re-lightbox-loading");
          return (
            spinners.length === 0 ||
            (spinners.length === 1 && frame.hasAttribute("data-loading"))
          );
        }),
      "a shown frame shows its full file": () =>
        frames().every(
          (frame) =>
            frame.hasAttribute("data-loading") ||
            frame.hasAttribute("data-error") ||
            /full-\d\.jpg$/.test(
              frame.querySelector<HTMLImageElement>(".re-lightbox-image")
                ?.src ?? "",
            ),
        ),
      "once closed no timer or frame is left": () =>
        !settled() || vi.getTimerCount() === 0,
    },
    fingerprint: () => {
      const { isOpen, isClosing, index } = lightbox.getState();
      return [
        isOpen,
        isClosing,
        index,
        requests.length,
        vi.getTimerCount(),
        frames()
          .map(
            (frame) =>
              `${frame.getAttribute("data-loading")}${frame.getAttribute("data-error")}${frame.querySelectorAll(".re-lightbox-loading").length}${frame.querySelector("img")?.getAttribute("src")}`,
          )
          .join(","),
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
