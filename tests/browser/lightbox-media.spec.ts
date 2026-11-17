import { expect, type Page, test } from "@playwright/test";
import { mount, swipe, tap } from "./harness";

type Zoom = { scale: number; x: number; y: number };
type Lightbox = {
  getState(): {
    index: number;
    isOpen: boolean;
    isAnimating: boolean;
    zoom: Zoom;
  };
};
type Window = typeof globalThis & { lightbox: Lightbox };

const PADDING = 32;

async function open(page: Page, sizes: [number, number][]) {
  await mount(
    page,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    ["lightbox/base.css", "lightbox/theme.css"],
  );
  await page.evaluate(async (list) => {
    const sources: string[] = [];
    for (const [w, h] of list) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      const gradient = context.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#345");
      gradient.addColorStop(1, "#c96");
      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8),
      );
      sources.push(URL.createObjectURL(blob as Blob));
    }
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const lightbox = createLightbox({ history: false });
    Object.assign(window, { lightbox });
    lightbox.open(
      list.map(([width, height], index) => ({
        src: sources[index],
        width,
        height,
      })),
      0,
    );
  }, sizes);
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  await expect(page.locator(".re-lightbox-frame[data-loading]")).toHaveCount(0);
}

const state = (page: Page) =>
  page.evaluate(() => (window as Window).lightbox.getState());

async function still(page: Page) {
  await expect.poll(async () => (await state(page)).isAnimating).toBe(false);
}

async function photo(page: Page) {
  const box = await page
    .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
    .boundingBox();
  if (!box) throw new Error("Missing photo");
  return box;
}

async function screen(page: Page) {
  const box = await page.locator(".re-lightbox-viewport").boundingBox();
  if (!box) throw new Error("Missing viewport");
  return box;
}

test.describe("lightbox tall and wide photos", { tag: "@touch" }, () => {
  test("a 1170x8000 photo fills the width from the top, scrolls to its bottom edge, scrolls on a swipe down in the middle and closes on one from the top", async ({
    page,
  }) => {
    await open(page, [
      [1170, 8000],
      [800, 600],
    ]);
    const view = await screen(page);
    expect([view.width, view.height]).toEqual([390, 844]);
    let box = await photo(page);
    expect(Math.abs(box.width - (view.width - 2 * PADDING))).toBeLessThan(1);
    expect(Math.abs(box.y - view.y)).toBeLessThan(1);
    const middle = view.x + view.width / 2;
    for (let attempt = 0; attempt < 8; attempt++) {
      box = await photo(page);
      if (box.y + box.height <= view.y + view.height + 1) break;
      await swipe(page, { x: middle, y: 700 }, { x: middle, y: 200 });
      await still(page);
    }
    box = await photo(page);
    expect(Math.abs(box.y + box.height - (view.y + view.height))).toBeLessThan(
      1,
    );
    expect(await state(page)).toMatchObject({ isOpen: true, index: 0 });
    const bottom = box.y;
    await swipe(page, { x: middle, y: 300 }, { x: middle, y: 600 });
    await still(page);
    box = await photo(page);
    expect(box.y).toBeGreaterThan(bottom + 250);
    expect(box.y).toBeLessThan(view.y - 1);
    expect(await state(page)).toMatchObject({ isOpen: true, index: 0 });
    for (let attempt = 0; attempt < 8; attempt++) {
      if ((await photo(page)).y >= view.y - 0.5) break;
      await swipe(page, { x: middle, y: 200 }, { x: middle, y: 700 });
      await still(page);
    }
    expect(Math.abs((await photo(page)).y - view.y)).toBeLessThan(1);
    expect((await state(page)).isOpen).toBe(true);
    await swipe(page, { x: middle, y: 300 }, { x: middle, y: 600 });
    await expect.poll(async () => (await state(page)).isOpen).toBe(false);
  });

  test("a double tap shows the whole tall photo and the next one returns to its width", async ({
    page,
  }) => {
    await open(page, [[1170, 8000]]);
    const view = await screen(page);
    const center = {
      x: view.x + view.width / 2,
      y: view.y + view.height / 2,
    };
    await tap(page, center, { count: 2 });
    await still(page);
    let box = await photo(page);
    expect(
      Math.abs(box.height - (view.height - 2 * PADDING)),
    ).toBeLessThanOrEqual(1);
    expect((await state(page)).zoom.scale).toBeLessThan(1);
    await tap(page, center, { count: 2 });
    await still(page);
    box = await photo(page);
    expect(Math.abs(box.width - (view.width - 2 * PADDING))).toBeLessThan(1);
    expect((await state(page)).zoom.scale).toBe(1);
  });

  test("a double tap on a 6000x1000 photo makes its height the viewport height", async ({
    page,
  }) => {
    await open(page, [[6000, 1000]]);
    const view = await screen(page);
    const before = await photo(page);
    expect(Math.abs(before.width - (view.width - 2 * PADDING))).toBeLessThan(1);
    await tap(
      page,
      { x: view.x + view.width / 2, y: view.y + view.height / 2 },
      { count: 2 },
    );
    await still(page);
    expect(Math.abs((await photo(page)).height - view.height)).toBeLessThan(1);
  });
});

test.describe("lightbox tall photos with keys and the wheel", {
  tag: "@desktop",
}, () => {
  test("ArrowDown and the wheel scroll a tall photo at its width, and ArrowRight still pages", async ({
    page,
  }) => {
    await open(page, [
      [1170, 8000],
      [800, 600],
    ]);
    const view = await screen(page);
    const top = (await photo(page)).y;
    expect(Math.abs(top - view.y)).toBeLessThan(1);
    await page.keyboard.press("ArrowDown");
    await still(page);
    expect(
      Math.abs((await photo(page)).y - (top - 0.1 * view.height)),
    ).toBeLessThan(1);
    await page.mouse.move(view.x + view.width / 2, view.y + view.height / 2);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(async () => Math.round(top - (await photo(page)).y))
      .toBe(Math.round(0.1 * view.height + 300));
    expect((await state(page)).zoom.scale).toBe(1);
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await state(page)).index).toBe(1);
  });
});
