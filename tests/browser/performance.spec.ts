import { expect, type Page, test } from "@playwright/test";
import {
  countGeometryReads,
  countLayoutReads,
  ctrlWheel,
  mount,
  photo,
  recordFrames,
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
  // The swipe runs in the band above the 800px tall photo, where the next photo never passes
  // while the strip settles.
  const above = { x: middle.x, y: (height - 800) / 4 };
  for (let photo = 1; photo < count; photo++) {
    await swipe(
      page,
      { x: above.x + 200, y: above.y },
      { x: above.x - 200, y: above.y },
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

  test("opens 1000 photos within 100ms, keeps at most 7 slide images and pages ten without a long frame or reading each slide", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Frame budgets are measured in Chromium.",
    );
    const reads = await countGeometryReads(page, ".re-lightbox-slide");
    await mount(
      page,
      `<img id="tile" src="${photo(0)}" alt="" width="120" height="80">`,
      ["lightbox/base.css", "lightbox/theme.css"],
    );
    const opened = await page.evaluate(
      async (sources) => {
        const { createLightbox } = await import("/modules/lightbox/index.js");
        const lightbox = createLightbox({ history: false, preload: 2 });
        const origin = document.getElementById("tile");
        const items = sources.map((src, index) => ({
          src,
          width: 1200,
          height: 800,
          origin: index === 0 ? origin : null,
        }));
        const images = document.getElementsByClassName("re-lightbox-image");
        const record = { most: 0, on: true };
        const count = () => {
          record.most = Math.max(record.most, images.length);
          if (record.on) requestAnimationFrame(count);
        };
        Object.assign(window, { lightbox, record });
        const start = performance.now();
        const frame = new Promise<{ elapsed: number; flying: boolean }>(
          (resolve) =>
            requestAnimationFrame(() =>
              resolve({
                elapsed: performance.now() - start,
                flying: document.getAnimations().length > 0,
              }),
            ),
        );
        lightbox.open(items, 0);
        count();
        return frame;
      },
      Array.from({ length: 1000 }, (_, index) => photo(index)),
    );
    expect(opened.flying).toBe(true);
    expect(opened.elapsed).toBeLessThan(100);
    const { width, height } = page.viewportSize() ?? { width: 0, height: 0 };
    const above = { x: width / 2, y: (height - 800) / 4 };
    // Chromium spends a 33-50ms frame on the first mouse move into a page, with 11 photos as with 1000.
    await page.mouse.move(above.x + 200, above.y);
    await page.waitForTimeout(600);
    const recording = await recordFrames(page);
    await reads.start();
    for (let step = 0; step < 10; step++) {
      await swipe(
        page,
        { x: above.x + 200, y: above.y },
        { x: above.x - 200, y: above.y },
        { speed: 2 },
      );
      await page.waitForTimeout(400);
    }
    const { frames } = await recording.stop();
    const slidesRead = await reads.read();
    const { index, most } = await page.evaluate(() => {
      const scope = window as unknown as {
        lightbox: { getState(): { index: number } };
        record: { most: number; on: boolean };
      };
      scope.record.on = false;
      return {
        index: scope.lightbox.getState().index,
        most: scope.record.most,
      };
    });
    expect(index).toBe(10);
    expect(most).toBeLessThanOrEqual(7);
    expect(slidesRead.elements).toBeLessThanOrEqual(1);
    expect(frames.length).toBeGreaterThan(100);
    expect(frames.filter((frame) => frame > 20)).toEqual([]);
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
