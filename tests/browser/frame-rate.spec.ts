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

function waitForRest(page: Page, start: "next()" | "pointerup") {
  return page.evaluate(
    ([from, quiet]) =>
      new Promise<{ index: number; time: number }>((resolve) => {
        const strip = document.getElementById("strip") as HTMLElement;
        // WebKit rounds scrollLeft, so the last pixel of the spring's tail lands at either end of
        // its final 1px; the strip counts as arrived once it stays within 1px of where it rests.
        const watch = (begin: number) => {
          const trail = [{ time: begin, left: strip.scrollLeft }];
          let moved = begin;
          const poll = () => {
            const now = performance.now();
            if (strip.scrollLeft !== trail.at(-1)?.left) {
              trail.push({ time: now, left: strip.scrollLeft });
              moved = now;
            }
            if (now - moved > quiet) {
              const rest = strip.scrollLeft;
              const arrived = trail.findLastIndex(
                (sample) => Math.abs(sample.left - rest) > 1,
              );
              resolve({
                index: (
                  window as unknown as {
                    carousel: { getState(): { index: number } };
                  }
                ).carousel.getState().index,
                time: (trail[arrived + 1]?.time ?? begin) - begin,
              });
            } else setTimeout(poll, 4);
          };
          poll();
        };
        if (from === "next()") {
          watch(performance.now());
          (window as unknown as { carousel: { next(): void } }).carousel.next();
        } else
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
  // Scripted with exact timestamps, so both frame rates release at the same speed and place.
  "a release while moving": async (page: Page) => {
    const settled = waitForRest(page, "pointerup");
    await page.evaluate(() => {
      const strip = document.getElementById("strip") as HTMLElement;
      const end = performance.now();
      const fire = (type: string, x: number, time?: number) => {
        const event = new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: "mouse",
          buttons: type === "pointerup" ? 0 : 1,
          clientX: x,
          clientY: 100,
        });
        if (time !== undefined)
          Object.defineProperty(event, "timeStamp", { value: time });
        strip.dispatchEvent(event);
      };
      fire("pointermove", 500);
      fire("pointerdown", 500);
      for (let step = 1; step <= 20; step++)
        fire("pointermove", 500 - step * 10, end - 320 + step * 16);
      fire("pointerup", 300);
    });
    return settled;
  },
  "next()": (page: Page) => waitForRest(page, "next()"),
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
