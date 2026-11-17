import { expect, type Page, test } from "@playwright/test";
import {
  countLayoutReads,
  ctrlWheel,
  mount,
  photo,
  safariPinch,
  swipe,
  traceMainThread,
} from "./harness";

const count = 11;
const tiles = Array.from(
  { length: count },
  (_, index) =>
    `<a href="${photo(index)}"><img src="${photo(index)}" alt="Photo ${index + 1}" width="120" height="80"></a>`,
).join("");

async function browseTenPhotos(
  page: Page,
  ready: () => Promise<unknown> = async () => {},
  styles = ["lightbox/base.css", "lightbox/theme.css"],
) {
  await mount(page, `<div id="gallery">${tiles}</div>`, styles);
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
    // A swipe that catches the strip more than 200px short of the photo it is heading to ends
    // its 400px before that photo and lands on it again, so the next one waits until it is closer.
    await page.waitForFunction(
      () => {
        const viewport = document.querySelector(
          ".re-lightbox-viewport",
        ) as HTMLElement;
        const slide = document.querySelector(
          '.re-lightbox-slide[aria-hidden="false"]',
        ) as HTMLElement;
        return Math.abs(viewport.scrollLeft - slide.offsetLeft) < 200;
      },
      undefined,
      { polling: "raf" },
    );
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
      "Main-thread time is traced in Chromium.",
    );
    let tracing: Awaited<ReturnType<typeof traceMainThread>> | undefined;
    const { index, zoomed } = await browseTenPhotos(page, async () => {
      tracing = await traceMainThread(page);
    });
    const tasks = (await tracing?.stop()) ?? [];
    expect(index).toBe(count - 1);
    expect(zoomed).toBeGreaterThan(1);
    expect(tasks.length).toBeGreaterThan(100);
    expect(tasks.filter((time) => time > 20)).toEqual([]);
  });

  test("pages ten photos and zooms with base.css alone", async ({ page }) => {
    const { index, zoomed } = await browseTenPhotos(page, async () => {}, [
      "lightbox/base.css",
    ]);
    expect(index).toBe(count - 1);
    expect(zoomed).toBeGreaterThan(1);
    await expect(page.locator("dialog")).toHaveCount(0);
  });

  test("reads no layout inside a pointer move or scroll listener", async ({
    page,
  }) => {
    const reads = await countLayoutReads(page);
    await browseTenPhotos(page);
    const { insideListener, eventsHandled } = await reads.read();
    expect(eventsHandled.pointermove).toBeGreaterThan(0);
    expect(eventsHandled.scroll).toBeGreaterThan(0);
    expect(insideListener.pointermove ?? 0).toBe(0);
    expect(insideListener.scroll ?? 0).toBe(0);
  });

  test("reads no layout inside a wheel, gesture or zoomed pan listener, and at most once in 100 wheel events", async ({
    page,
  }) => {
    const reads = await countLayoutReads(page);
    await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
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
    await safariPinch(page, middle, { scale: 2 });
    await page.waitForTimeout(300);
    await swipe(page, middle, { x: 520, y: 350 }, { speed: 0.5 });
    const { insideListener, eventsHandled, total } = await reads.read();
    expect(eventsHandled.wheel).toBe(6);
    expect(eventsHandled.gesturechange).toBeGreaterThan(0);
    expect(eventsHandled.pointermove).toBeGreaterThan(0);
    expect(insideListener.wheel ?? 0).toBe(0);
    expect(insideListener.gesturechange ?? 0).toBe(0);
    expect(insideListener.pointermove ?? 0).toBe(0);
    await page.evaluate(() => {
      const viewport = document.querySelector(".re-lightbox-viewport");
      for (let event = 0; event < 100; event++)
        viewport?.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            ctrlKey: event % 2 === 0,
            clientX: 700,
            clientY: 400,
            deltaX: 4,
            deltaY: event % 4 < 2 ? -20 : 20,
          }),
        );
    });
    expect((await reads.read()).total - total).toBeLessThanOrEqual(1);
  });
});
