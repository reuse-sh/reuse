import { expect, type Page, test } from "@playwright/test";
import { framesUntilIdle, mount, photo } from "./harness";

// Headless Chromium hides scrollbars unless this flag goes, and WebKit draws a classic one only
// for a styled scrollbar. A launch option must sit at the top of a file.
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

type Box = { x: number; y: number; width: number; height: number };
type Lightbox = {
  open(items: unknown[], index?: number): void;
  close(): Promise<void>;
  getState(): { index: number; isAnimating: boolean };
  on(type: string, listener: () => void): () => void;
};
type Window = globalThis.Window &
  typeof globalThis & {
    lightbox: Lightbox;
    items: unknown[];
    tiles: HTMLImageElement[];
    closing?: Promise<void>;
  };

async function gridPage(page: Page, { wide = false } = {}) {
  await mount(
    page,
    `<style>html::-webkit-scrollbar{width:15px;background:#ddd}html::-webkit-scrollbar-thumb{background:#999}</style>${wide ? '<div style="width:3000px;height:1px"></div>' : ""}<div style="display:flex;flex-wrap:wrap;width:800px;padding:16px 32px">${Array.from(
      { length: 6 },
      (_, index) =>
        `<img class="tile" src="${photo(index)}" alt="Photo ${index + 1}" style="display:block;width:240px;height:160px;object-fit:cover;border-radius:12px;margin:8px">`,
    ).join("")}</div><div style="height:2000px"></div>`,
    ["lightbox/base.css", "lightbox/theme.css"],
  );
  await page.evaluate(async () => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const tiles = [...document.querySelectorAll<HTMLImageElement>(".tile")];
    const lightbox = createLightbox({ history: false, autoHide: false });
    const items = tiles.map((image) => ({
      src: image.src,
      width: 1200,
      height: 800,
      alt: image.alt,
      origin: () => image,
    }));
    Object.assign(window, { lightbox, items, tiles });
    await new Promise<void>((resolve) => {
      const stop = lightbox.on("opened", () => {
        stop();
        resolve();
      });
      lightbox.open(items, 1);
    });
  });
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window).lightbox.getState().isAnimating),
    )
    .toBe(false);
}

const current = '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame';

// Starts the close and reads the photo on its first and last frames.
function closeFrames(page: Page) {
  return page.evaluate((selector) => {
    const win = window as Window;
    const box = (element: Element | null): Box | null => {
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const before = box(document.querySelector(selector));
    win.closing = win.lightbox.close();
    const seek = (end: boolean) => {
      for (const animation of document.getAnimations()) {
        animation.pause();
        animation.currentTime = end
          ? Number(animation.effect?.getComputedTiming().endTime ?? 0)
          : 0;
      }
    };
    seek(false);
    const first = box(document.querySelector(selector));
    seek(true);
    return {
      before,
      first,
      last: box(document.querySelector(selector)),
      copy: box(document.querySelector(".re-lightbox-landing")),
      tile: box(win.tiles[win.lightbox.getState().index]),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  }, current);
}

function expectOn(actual: Box | null, expected: Box | null) {
  expect(actual).not.toBeNull();
  expect(expected).not.toBeNull();
  for (const key of ["x", "y", "width", "height"] as const)
    expect(
      Math.abs((actual as Box)[key] - (expected as Box)[key]),
      key,
    ).toBeLessThanOrEqual(1);
}

test.describe("a page with a classic scrollbar", { tag: "@desktop" }, () => {
  test("the close starts where the photo rests and lands on its tile", async ({
    page,
  }) => {
    await gridPage(page);
    const frames = await closeFrames(page);
    expectOn(frames.first, frames.before);
    expectOn(frames.last, frames.tile);
    expectOn(frames.copy, frames.tile);
    expect(frames.scrollWidth).toBe(frames.clientWidth);
  });

  test("with a horizontal scrollbar too, the closing viewer keeps its open height", async ({
    page,
  }) => {
    await gridPage(page, { wide: true });
    const sizes = await page.evaluate(() => {
      const dialog = document.querySelector("dialog") as HTMLElement;
      const open = dialog.getBoundingClientRect().height;
      void (window as Window).lightbox.close();
      return {
        open,
        closing: dialog.getBoundingClientRect().height,
        page: document.documentElement.clientHeight,
      };
    });
    test.skip(
      sizes.page === sizes.open,
      "The browser draws overlay scrollbars",
    );
    expect(sizes.closing).toBe(sizes.open);
  });

  test("after a mouse drag to the next photo, the close flies to that photo's tile", async ({
    page,
  }) => {
    await gridPage(page);
    const frame = await page.locator(current).boundingBox();
    if (!frame) throw new Error("Missing photo");
    const from = {
      x: frame.x + frame.width / 2,
      y: frame.y + frame.height / 2,
    };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let step = 1; step <= 10; step++) {
      await page.mouse.move(from.x - step * 40, from.y);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const { index, isAnimating } = (window as Window).lightbox.getState();
          return { index, isAnimating };
        }),
      )
      .toEqual({ index: 2, isAnimating: false });
    await framesUntilIdle(
      page,
      'document.querySelector(".re-lightbox-viewport").scrollLeft',
    );
    const frames = await closeFrames(page);
    expectOn(frames.last, frames.tile);
    expectOn(frames.copy, frames.tile);
  });
});
