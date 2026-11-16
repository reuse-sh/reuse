import { expect, type Page, test } from "@playwright/test";
import {
  countLayoutReads,
  ctrlWheel,
  mount,
  photo,
  recordFrames,
  swipe,
} from "./harness";

const count = 11;
const tiles = Array.from(
  { length: count },
  (_, index) =>
    `<a href="${photo(index)}"><img src="${photo(index)}" alt="Photo ${index + 1}" width="120" height="80"></a>`,
).join("");

// Opens the lightbox from its first tile, pages through ten photos with mouse drags,
// zooms in and out with Ctrl and the wheel, and closes with Escape.
async function session(
  page: Page,
  ready: () => Promise<unknown> = async () => {},
) {
  await mount(page, `<div id="gallery">${tiles}</div>`, [
    "lightbox/styles.css",
  ]);
  await page.evaluate(async () => {
    const { bindLightboxGallery } = await import("/modules/lightbox/index.js");
    const gallery = bindLightboxGallery(
      document.getElementById("gallery") as HTMLElement,
    );
    Object.assign(window, { gallery });
  });
  await ready();
  await page.locator("#gallery img").first().click();
  await page.waitForTimeout(500);
  const { width, height } = page.viewportSize() ?? { width: 0, height: 0 };
  const middle = { x: width / 2, y: height / 2 };
  for (let photo = 1; photo < count; photo++) {
    await swipe(
      page,
      { x: middle.x + 200, y: middle.y },
      { x: middle.x - 200, y: middle.y },
      { speed: 2 },
    );
    await page.waitForTimeout(400);
  }
  const index = await page.evaluate(
    () =>
      (
        window as unknown as { gallery: { getState(): { index: number } } }
      ).gallery.getState().index,
  );
  for (let step = 0; step < 5; step++) {
    await ctrlWheel(page, middle, -40);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(300);
  const zoomed = await page.evaluate(
    () =>
      (
        window as unknown as {
          gallery: { getState(): { zoom: { scale: number } } };
        }
      ).gallery.getState().zoom.scale,
  );
  for (let step = 0; step < 5; step++) {
    await ctrlWheel(page, middle, 40);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  return { index, zoomed };
}

test.describe("lightbox performance", { tag: "@desktop" }, () => {
  test("pages ten photos, zooms and closes without a long frame or task", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Frame budgets and long tasks are measured in Chromium.",
    );
    let recording: Awaited<ReturnType<typeof recordFrames>> | undefined;
    const { index, zoomed } = await session(page, async () => {
      recording = await recordFrames(page);
    });
    const { frames, longTasks } = (await recording?.stop()) ?? {
      frames: [],
      longTasks: [],
    };
    expect(index).toBe(count - 1);
    expect(zoomed).toBeGreaterThan(1);
    expect(frames.length).toBeGreaterThan(100);
    expect(frames.filter((frame) => frame > 20)).toEqual([]);
    expect(longTasks).toEqual([]);
  });

  test("reads no layout inside a pointer move or scroll listener", async ({
    page,
  }) => {
    const reads = await countLayoutReads(page);
    await session(page);
    const { during, events } = await reads.read();
    expect(events.pointermove).toBeGreaterThan(0);
    expect(events.scroll).toBeGreaterThan(0);
    expect(during.pointermove ?? 0).toBe(0);
    expect(during.scroll ?? 0).toBe(0);
  });

  test("reads no layout inside a wheel listener", async ({ page }) => {
    test.fail(
      true,
      "Ctrl and the wheel zoom around the pointer by reading the viewport rect on every event. The zoom rework removes the read; drop this line then.",
    );
    const reads = await countLayoutReads(page);
    await mount(page, "", ["lightbox/styles.css"]);
    await page.evaluate(async (src) => {
      const { createLightbox } = await import("/modules/lightbox/index.js");
      createLightbox().open([{ src, width: 1200, height: 800 }]);
    }, photo(0));
    await page.waitForTimeout(500);
    const middle = { x: 720, y: 450 };
    for (const delta of [-40, -40, -40, 40, 40, 40]) {
      await ctrlWheel(page, middle, delta);
      await page.waitForTimeout(16);
    }
    const { during, events } = await reads.read();
    expect(events.wheel).toBeGreaterThan(0);
    expect(during.wheel ?? 0).toBe(0);
  });
});
