import { expect, type Locator, type Page, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

const preview = '[data-slot="example-preview"]';

function rightToLeft(page: Page) {
  return page.addInitScript(() => {
    new MutationObserver((_, observer) => {
      const section = document.querySelector('[data-slot="example-preview"]');
      if (!section) return;
      section.setAttribute("dir", "rtl");
      observer.disconnect();
    }).observe(document, { childList: true, subtree: true });
  });
}

function speed(strip: Locator, ms = 1000) {
  return strip.evaluate(
    (element, duration) =>
      new Promise<number>((resolve) => {
        let last = element.scrollLeft;
        let moved = 0;
        const start = performance.now();
        const tick = () => {
          const step = element.scrollLeft - last;
          last = element.scrollLeft;
          if (Math.abs(step) < 30) moved += step;
          if (performance.now() - start >= duration)
            resolve(Math.abs(moved) / (duration / 1000));
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );
}

test.describe("coverflow", () => {
  const strip = (page: Page) => page.locator(`${preview} .re-cf-strip`);
  const covers = (page: Page) =>
    strip(page).evaluate((element) => {
      const box = element.getBoundingClientRect();
      const middle = box.left + box.width / 2;
      return [...element.querySelectorAll<HTMLElement>(".re-cf-slide")].map(
        (slide) => {
          const cover = slide.querySelector(".re-cf-cover") as HTMLElement;
          const matrix = new DOMMatrix(getComputedStyle(cover).transform);
          const rect = cover.getBoundingClientRect();
          return {
            offset: Number(
              slide.style.getPropertyValue("--re-carousel-offset"),
            ),
            turn:
              Math.round(
                (Math.atan2(-matrix.m13, matrix.m11) * 180) / Math.PI,
              ) + 0,
            scale: Math.round(Math.hypot(matrix.m11, matrix.m13) * 100) / 100,
            side: Math.sign(Math.round(rect.left + rect.width / 2 - middle)),
            z: getComputedStyle(slide).zIndex,
          };
        },
      );
    });
  const settle = (page: Page, active = 0) =>
    expect
      .poll(async () => {
        const offsets = (await covers(page)).map((cover) => cover.offset);
        return offsets[active] === 0 && offsets.every(Number.isInteger);
      })
      .toBe(true);

  test("covers take the turn their offset gives and the center one follows next and the seam", async ({
    page,
  }) => {
    await page.goto("/carousel/examples/coverflow");
    await settle(page);
    const first = await covers(page);
    expect(first[0]).toMatchObject({
      offset: 0,
      turn: 0,
      scale: 1,
      side: 0,
      z: "100",
    });
    expect(first[1]).toMatchObject({
      offset: 1,
      turn: -50,
      scale: 0.88,
      side: 1,
      z: "90",
    });
    expect(first[2]).toMatchObject({ offset: 2, turn: -50, scale: 0.76 });
    expect(first[7]).toMatchObject({ offset: -1, turn: 50, side: -1 });
    const caption = page.locator(`${preview} p`);
    await expect(caption).toHaveText("Concrete blocks");

    await strip(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(caption).toHaveText("White grid");
    await settle(page, 1);
    expect((await covers(page))[1]).toMatchObject({ offset: 0, side: 0 });

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(caption).toHaveText("Quiet stair");
    await settle(page, 7);
    const seam = await covers(page);
    expect(seam[7]).toMatchObject({ offset: 0, side: 0, z: "100" });
    expect(seam[0]).toMatchObject({ offset: 1, turn: -50, side: 1 });
    expect(seam[6]).toMatchObject({ offset: -1, turn: 50, side: -1 });
  });

  test("a click on a side cover and a drag bring a cover to the center", async ({
    page,
  }) => {
    await page.goto("/carousel/examples/coverflow");
    await settle(page);
    const caption = page.locator(`${preview} p`);
    await page.locator(`${preview} .re-cf-slide`).nth(1).click();
    await expect(caption).toHaveText("White grid");
    await settle(page, 1);
    const box = await strip(page).boundingBox();
    if (!box) throw new Error("Missing coverflow");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    for (let step = 1; step <= 13; step++) {
      await page.mouse.move(
        box.x + box.width / 2 + step * 20,
        box.y + box.height / 2,
      );
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(200);
    await page.mouse.up();
    await expect(caption).toHaveText("Concrete blocks");
    await settle(page);
    expect((await covers(page))[0]).toMatchObject({ offset: 0, side: 0 });
  });

  test("in right-to-left the next cover turns in from the left", async ({
    page,
  }) => {
    await rightToLeft(page);
    await page.goto("/carousel/examples/coverflow");
    await settle(page);
    const first = await covers(page);
    expect(first[1]).toMatchObject({ offset: 1, turn: 50, side: -1 });
    expect(first[7]).toMatchObject({ offset: -1, turn: -50, side: 1 });
    await strip(page).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator(`${preview} p`)).toHaveText("White grid");
  });

  test("under reduced motion a key still pages, at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/carousel/examples/coverflow");
    await settle(page);
    await strip(page).focus();
    await page.keyboard.press("ArrowRight");
    expect((await covers(page))[1]).toMatchObject({ offset: 0, turn: 0 });
  });
});

test.describe("marquee", () => {
  const strip = (page: Page) => page.locator(`${preview} .re-mq-strip`);

  test("runs at about 40 px a second, eases down on hover and resumes after a drag", async ({
    page,
  }) => {
    await page.goto("/carousel/examples/marquee");
    await page.waitForTimeout(1500);
    expect(await speed(strip(page))).toBeGreaterThan(36);
    expect(await speed(strip(page))).toBeLessThan(44);

    const box = await strip(page).boundingBox();
    if (!box) throw new Error("Missing marquee");
    await page.mouse.move(box.x + 100, box.y + box.height / 2);
    const easing = await speed(strip(page), 300);
    expect(easing).toBeGreaterThan(15);
    expect(easing).toBeLessThan(40);
    await page.waitForTimeout(1000);
    expect(await speed(strip(page))).toBeLessThan(14);

    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.mouse.move(box.x + 100, box.y + 400);
    await page.waitForTimeout(2500);
    expect(await speed(strip(page))).toBeGreaterThan(36);
  });

  test("stops while hidden or off screen, and Pause gives the strip back", async ({
    page,
  }) => {
    await page.goto("/carousel/examples/marquee");
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(await speed(strip(page), 500)).toBe(0);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => false,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(800);
    expect(await speed(strip(page), 500)).toBeGreaterThan(20);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const left = await strip(page).evaluate((element) => element.scrollLeft);
    await page.waitForTimeout(600);
    expect(await strip(page).evaluate((element) => element.scrollLeft)).toBe(
      left,
    );
    await page.evaluate(() => window.scrollTo(0, 0));

    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await expect
      .poll(() =>
        strip(page).evaluate((element) => element.style.scrollSnapType),
      )
      .toBe("");
    await page.waitForTimeout(800);
    expect(await speed(strip(page), 500)).toBe(0);
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.waitForTimeout(800);
    expect(await speed(strip(page), 500)).toBeGreaterThan(20);
  });

  test("keyboard focus lets the arrow keys scroll it", async ({ page }) => {
    await page.goto("/carousel/examples/marquee");
    const pause = page.getByRole("button", { name: "Pause", exact: true });
    await expect(pause).toBeEnabled();
    await pause.focus();
    await page.keyboard.press("Tab");
    await expect(strip(page)).toBeFocused();
    await expect
      .poll(() =>
        strip(page).evaluate((element) => element.style.scrollSnapType),
      )
      .toBe("");
    await page.waitForTimeout(800);
    const before = await strip(page).evaluate((element) => element.scrollLeft);
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => strip(page).evaluate((element) => element.scrollLeft))
      .not.toBe(before);
  });

  test("stays still under reduced motion and still scrolls", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/carousel/examples/marquee");
    await page.waitForTimeout(800);
    expect(await speed(strip(page))).toBe(0);
    await expect(
      page.getByRole("button", { name: "Pause", exact: true }),
    ).toBeHidden();
    await strip(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => strip(page).evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  });

  test("runs toward the start edge in right-to-left", async ({ page }) => {
    await rightToLeft(page);
    await page.goto("/carousel/examples/marquee");
    await page.waitForTimeout(1500);
    expect(await speed(strip(page))).toBeGreaterThan(36);
    expect(
      await strip(page).evaluate((element) => element.scrollLeft),
    ).toBeLessThan(0);
  });
});

test.describe("stories", () => {
  const segments = (page: Page) =>
    page
      .locator(`${preview} .re-st-segment`)
      .evaluateAll((spans) =>
        spans.map(
          (span) =>
            Math.round(
              new DOMMatrix(getComputedStyle(span, "::after").transform).a *
                100,
            ) / 100,
        ),
      );
  const ready = (page: Page) =>
    expect(page.locator(`${preview} .re-st-play`)).toBeEnabled();
  const current = async (page: Page) =>
    (await segments(page)).findIndex((fill) => fill < 1);

  test("segments fill with the autoplay progress and a hold pauses it", async ({
    page,
  }) => {
    await page.goto("/carousel/examples/stories");
    await ready(page);
    await page.waitForTimeout(1200);
    const filling = await segments(page);
    expect(filling[0]).toBeGreaterThan(0.1);
    expect(filling[0]).toBeLessThan(0.5);
    expect(filling.slice(1)).toEqual([0, 0, 0, 0]);

    const next = page.getByRole("button", { name: "Next story" });
    const box = await next.boundingBox();
    if (!box) throw new Error("Missing tap area");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const held = (await segments(page))[0];
    await page.waitForTimeout(1000);
    expect(Math.abs((await segments(page))[0] - held)).toBeLessThan(0.02);
    await page.mouse.up();
    await page.waitForTimeout(600);
    const resumed = await segments(page);
    expect(resumed[0]).toBeGreaterThan(held + 0.05);
    expect(resumed[1]).toBe(0);
  });

  test("a tap pages by side, the keys page, and the last story returns to the first", async ({
    page,
  }) => {
    await page.goto("/carousel/examples/stories");
    await ready(page);
    const next = page.getByRole("button", { name: "Next story" });
    const previous = page.getByRole("button", { name: "Previous story" });
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await next.click();
    await expect.poll(() => current(page)).toBe(1);
    await expect(page.locator(`${preview} figcaption`).nth(1)).toBeInViewport();
    await previous.click();
    await expect.poll(() => current(page)).toBe(0);

    await next.focus();
    for (let step = 0; step < 4; step++) await page.keyboard.press("Enter");
    await expect.poll(() => current(page)).toBe(4);
    expect((await segments(page)).slice(0, 4)).toEqual([1, 1, 1, 1]);
    await expect.poll(() => current(page), { timeout: 8000 }).toBe(0);
    expect((await segments(page)).slice(1)).toEqual([0, 0, 0, 0]);

    await previous.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => current(page)).toBe(0);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect.poll(() => current(page)).toBe(1);
  });

  test("Pause stops the stories and Play continues them", async ({ page }) => {
    await page.goto("/carousel/examples/stories");
    await ready(page);
    await page.getByRole("button", { name: "Pause stories" }).click();
    const paused = (await segments(page))[0];
    await page.waitForTimeout(800);
    expect((await segments(page))[0]).toBe(paused);
    await page.getByRole("button", { name: "Play stories" }).click();
    await page.waitForTimeout(600);
    expect((await segments(page))[0]).toBeGreaterThan(paused);
  });

  test("under reduced motion the stories wait and the taps still page", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/carousel/examples/stories");
    await ready(page);
    await page.waitForTimeout(1200);
    expect(await segments(page)).toEqual([0, 0, 0, 0, 0]);
    await expect(
      page.getByRole("button", { name: "Pause stories" }),
    ).toBeHidden();
    await page.getByRole("button", { name: "Next story" }).click();
    await expect.poll(() => segments(page)).toEqual([1, 0, 0, 0, 0]);
  });

  test("in right-to-left the start third on the right goes back", async ({
    page,
  }) => {
    await rightToLeft(page);
    await page.goto("/carousel/examples/stories");
    await ready(page);
    const frame = await page.locator(`${preview} .re-st`).boundingBox();
    if (!frame) throw new Error("Missing stories");
    const y = frame.y + frame.height / 2;
    await page.mouse.click(frame.x + 40, y);
    await expect.poll(() => current(page)).toBe(1);
    await page.mouse.click(frame.x + frame.width - 40, y);
    await expect.poll(() => current(page)).toBe(0);
    const fill = await page
      .locator(`${preview} .re-st-segment`)
      .first()
      .evaluate((span) => getComputedStyle(span, "::after").transformOrigin);
    expect(Number.parseFloat(fill)).toBeGreaterThan(0);
  });
});

test.describe("at 320 px", () => {
  test.use({ viewport: { width: 320, height: 720 } });
  for (const path of ["coverflow", "marquee", "stories"])
    test(`${path} fits without horizontal overflow`, async ({ page }) => {
      await page.goto(`/carousel/examples/${path}`);
      await page.waitForTimeout(600);
      const sizes = await page.evaluate(() => {
        const section = document.querySelector(
          '[data-slot="example-preview"]',
        ) as HTMLElement;
        const box = section.getBoundingClientRect();
        return {
          page: document.documentElement.scrollWidth,
          left: box.left,
          right: box.right,
        };
      });
      expect(sizes.page).toBeLessThanOrEqual(320);
      expect(sizes.left).toBeGreaterThanOrEqual(0);
      expect(sizes.right).toBeLessThanOrEqual(320);
    });
});
