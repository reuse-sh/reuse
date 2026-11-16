import { type Browser, expect, type Page, test } from "@playwright/test";
import { frameInterval, mount, swipe } from "./harness";

const slides = Array.from(
  { length: 6 },
  (_, index) =>
    `<div data-carousel-slide style="flex:0 0 300px;height:200px;background:hsl(${index * 50} 60% 60%)">${index}</div>`,
).join("");

async function setup(browser: Browser, interval: number) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await frameInterval(page, interval);
  await mount(
    page,
    `<div id="strip" style="width:600px;--re-carousel-gap:0px">${slides}</div>`,
    ["carousel/styles.css"],
  );
  await page.evaluate(async () => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const strip = document.getElementById("strip") as HTMLElement;
    Object.assign(window, { carousel: createCarousel(strip) });
  });
  return page;
}

const stillFor = 200;

function waitForRest(page: Page, start: "now" | "pointerup") {
  return page.evaluate(
    ([from, quiet]) =>
      new Promise<{ index: number; time: number }>((resolve) => {
        const strip = document.getElementById("strip") as HTMLElement;
        const watch = (begin: number) => {
          let position = strip.scrollLeft;
          let moved = begin;
          const poll = () => {
            const now = performance.now();
            if (strip.scrollLeft !== position) {
              position = strip.scrollLeft;
              moved = now;
            }
            if (now - moved > quiet)
              resolve({
                index: (
                  window as unknown as {
                    carousel: { getState(): { index: number } };
                  }
                ).carousel.getState().index,
                time: moved - begin,
              });
            else setTimeout(poll, 4);
          };
          poll();
        };
        if (from === "now") watch(performance.now());
        else
          addEventListener("pointerup", (event) => watch(event.timeStamp), {
            once: true,
          });
      }),
    [start, stillFor] as const,
  );
}

const stillBeforeRelease = 150;

const motions = {
  "a released drag": async (page: Page) => {
    const settled = waitForRest(page, "pointerup");
    await swipe(
      page,
      { x: 500, y: 100 },
      { x: 300, y: 100 },
      { hold: stillBeforeRelease },
    );
    return settled;
  },
  "next()": async (page: Page) => {
    const settled = waitForRest(page, "now");
    await page.evaluate(() =>
      (window as unknown as { carousel: { next(): void } }).carousel.next(),
    );
    return settled;
  },
};

test.describe("carousel motion", { tag: "@desktop" }, () => {
  for (const [name, move] of Object.entries(motions)) {
    test(`${name} lands on the same slide at the same time at 60 and 120 frames a second`, async ({
      browser,
    }) => {
      const results = [];
      for (const interval of [16.7, 8.3]) {
        const page = await setup(browser, interval);
        results.push(await move(page));
        await page.close();
      }
      const [slow, fast] = results;
      expect(slow.index).toBe(1);
      expect(fast.index).toBe(slow.index);
      expect(Math.abs(fast.time - slow.time)).toBeLessThanOrEqual(30);
    });
  }
});
