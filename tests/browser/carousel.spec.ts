import { expect, type Page, test } from "@playwright/test";
import { framesUntilIdle, mount } from "./harness";

const slides = Array.from(
  { length: 6 },
  (_, index) =>
    `<div data-carousel-slide style="flex:0 0 300px;height:200px;background:hsl(${index * 50} 60% 60%)">${index}</div>`,
).join("");

async function setup(page: Page) {
  await mount(
    page,
    `<div id="strip" style="width:600px;--reuse-carousel-gap:0px">${slides}</div>`,
    ["carousel/styles.css"],
  );
  await page.evaluate(async () => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const strip = document.getElementById("strip") as HTMLElement;
    Object.assign(window, { carousel: createCarousel(strip) });
  });
}

const scrollLeft = "document.getElementById('strip').scrollLeft";

test("a drag release never restores snapping between snap points", async ({
  page,
}) => {
  // Some Chrome builds jump to the snap point in one frame when snapping returns early.
  await setup(page);
  await page.mouse.move(400, 100);
  await page.mouse.down();
  await page.mouse.move(200, 100, { steps: 20 });
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    const strip = document.getElementById("strip") as HTMLElement;
    const restored: number[] = [];
    new MutationObserver((records) => {
      const values = records.map((record) => record.oldValue ?? "");
      values.push(strip.getAttribute("style") ?? "");
      for (const value of values.slice(1))
        if (!value.includes("scroll-snap-type"))
          restored.push(strip.scrollLeft);
    }).observe(strip, { attributeFilter: ["style"], attributeOldValue: true });
    Object.assign(window, { restored });
  });
  const frames = framesUntilIdle(page, scrollLeft);
  await page.mouse.up();
  const values = await frames;
  expect(values.at(-1)).toBe(300);
  expect(values.length).toBeGreaterThan(4);
  const restored = await page.evaluate(
    () => (window as unknown as { restored: number[] }).restored,
  );
  expect(restored.every((position) => position % 300 === 0)).toBe(true);
});

test("a short fast flick moves on to the next slide", async ({ page }) => {
  await setup(page);
  await page.mouse.move(400, 100);
  await page.mouse.down();
  await page.mouse.move(340, 100, { steps: 3 });
  await page.mouse.up();
  const values = await framesUntilIdle(page, scrollLeft);
  expect(values.at(-1)).toBe(300);
});

test("a slide resizing during a smooth scroll does not cut the travel short", async ({
  page,
}) => {
  await setup(page);
  const frames = framesUntilIdle(page, scrollLeft);
  await page.evaluate(() => {
    (
      window as unknown as { carousel: { goTo(i: number): void } }
    ).carousel.goTo(3);
    setTimeout(() => {
      const slide = document.querySelector<HTMLElement>(
        "[data-carousel-slide]",
      );
      if (slide) slide.style.height = "260px";
    }, 60);
  });
  const values = await frames;
  expect(values.at(-1)).toBe(900);
  const steps = values.slice(1).map((value, index) => value - values[index]);
  expect(Math.max(...steps)).toBeLessThan(300);
});

test("a click during a smooth scroll travels on to a snap point instead of stopping or jumping", async ({
  page,
}) => {
  await setup(page);
  await page.mouse.move(300, 100);
  await page.evaluate(() =>
    (
      window as unknown as { carousel: { goTo(i: number): void } }
    ).carousel.goTo(4),
  );
  await page.waitForTimeout(60);
  const frames = framesUntilIdle(page, scrollLeft);
  await page.mouse.down();
  await page.waitForTimeout(30);
  await page.mouse.up();
  const values = await frames;
  expect(values[0] % 300).not.toBe(0);
  expect((values.at(-1) ?? 1) % 300).toBe(0);
  const steps = values.slice(1).map((value, index) => value - values[index]);
  expect(Math.max(...steps.map(Math.abs))).toBeLessThan(150);
  expect(
    await page.evaluate(
      () => document.getElementById("strip")?.style.scrollSnapType,
    ),
  ).toBe("");
});
