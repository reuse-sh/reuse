import { expect, type Page, test } from "@playwright/test";
import { mount, photo } from "./harness";

async function open(page: Page, options: Record<string, unknown> = {}) {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(
    async ([sources, extra]) => {
      const { createLightbox } = await import("/modules/lightbox/index.js");
      const lightbox = createLightbox(extra);
      lightbox.open(
        sources.map((src, index) => ({
          src,
          width: 1200,
          height: 800,
          alt: `Photo ${index + 1}`,
        })),
        0,
      );
      Object.assign(window, { lightbox });
    },
    [Array.from({ length: 8 }, (_, index) => photo(index)), options] as const,
  );
  await page.waitForTimeout(400);
}

// Samples, on every frame for `duration` ms, what the visible part of the strip shows.
function sampleStrip(page: Page, duration: number) {
  return page.evaluate(
    (ms) =>
      new Promise<
        { left: number; opacity: number; emptyVisible: number; index: number }[]
      >((resolve) => {
        const viewport = document.querySelector<HTMLElement>(
          ".re-lightbox-viewport",
        ) as HTMLElement;
        const samples: {
          left: number;
          opacity: number;
          emptyVisible: number;
          index: number;
        }[] = [];
        const start = performance.now();
        const tick = () => {
          const box = viewport.getBoundingClientRect();
          const slides = [
            ...viewport.querySelectorAll<HTMLElement>(".re-lightbox-slide"),
          ];
          const emptyVisible = slides.filter((slide) => {
            const rect = slide.getBoundingClientRect();
            const visible =
              rect.right > box.left + 1 && rect.left < box.right - 1;
            return visible && !slide.querySelector(".re-lightbox-frame");
          }).length;
          samples.push({
            left: Math.round(viewport.scrollLeft),
            opacity: Number(getComputedStyle(viewport).opacity),
            emptyVisible,
            index: (
              window as unknown as {
                lightbox: { getState(): { index: number } };
              }
            ).lightbox.getState().index,
          });
          if (performance.now() - start < ms) requestAnimationFrame(tick);
          else resolve(samples);
        };
        requestAnimationFrame(tick);
      }),
    duration,
  );
}

test("rapid paging never leaves an empty page on screen", async ({ page }) => {
  await open(page);
  const samples = sampleStrip(page, 1200);
  for (let step = 0; step < 3; step++) {
    await page.evaluate(() =>
      (window as unknown as { lightbox: { next(): void } }).lightbox.next(),
    );
    await page.waitForTimeout(60);
  }
  const frames = await samples;
  expect(frames.at(-1)?.index).toBe(3);
  expect(frames.filter((frame) => frame.emptyVisible > 0)).toHaveLength(0);
});

// Samples, on every frame for `duration` ms, which photos are on screen and where.
function sampleShown(page: Page, duration: number) {
  return page.evaluate(
    (ms) =>
      new Promise<{ opacity: number; shown: Record<number, number> }[]>(
        (resolve) => {
          const viewport = document.querySelector<HTMLElement>(
            ".re-lightbox-viewport",
          ) as HTMLElement;
          const slides = [
            ...viewport.querySelectorAll<HTMLElement>(".re-lightbox-slide"),
          ];
          const port = viewport.getBoundingClientRect();
          const frames: { opacity: number; shown: Record<number, number> }[] =
            [];
          const start = performance.now();
          const tick = () => {
            const shown: Record<number, number> = {};
            slides.forEach((slide, index) => {
              const rect = slide.getBoundingClientRect();
              if (
                rect.right > port.left + 1 &&
                rect.left < port.right - 1 &&
                getComputedStyle(slide).visibility !== "hidden" &&
                slide.querySelector(".re-lightbox-frame")
              )
                shown[index] = Math.round(rect.left - port.left);
            });
            frames.push({
              opacity: Number(getComputedStyle(viewport).opacity),
              shown,
            });
            if (performance.now() - start < ms) requestAnimationFrame(tick);
            else resolve(frames);
          };
          requestAnimationFrame(tick);
        },
      ),
    duration,
  );
}

test("a distant thumbnail jump pages in like the next photo, showing only the two photos", {
  tag: "@desktop",
}, async ({ page }) => {
  await open(page, { thumbnails: "bottom" });
  const width = await page.evaluate(
    () =>
      document.querySelector<HTMLElement>(".re-lightbox-viewport")
        ?.clientWidth ?? 0,
  );
  const samples = sampleShown(page, 1200);
  await page.getByRole("button", { name: "Show image 7" }).click();
  const frames = await samples;
  expect(frames.every((frame) => frame.opacity === 1)).toBe(true);
  const indices = new Set(
    frames.flatMap((frame) => Object.keys(frame.shown).map(Number)),
  );
  expect([...indices].sort()).toEqual([0, 6]);
  const both = frames.filter((frame) => 0 in frame.shown && 6 in frame.shown);
  expect(both.length).toBeGreaterThan(0);
  for (const frame of both)
    expect(Math.abs(frame.shown[6] - frame.shown[0] - width)).toBeLessThan(2);
  expect(frames.at(-1)?.shown).toEqual({ 6: 0 });
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as { lightbox: { getState(): { index: number } } }
        ).lightbox.getState().index,
    ),
  ).toBe(6);
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".re-lightbox-slide")].map(
        (slide) => slide.style.transform + slide.style.visibility,
      ),
    ),
  ).toEqual(Array(8).fill(""));
});

test("a jump back during a distant jump keeps the arriving photo in place and brings the new one from its side", {
  tag: "@desktop",
}, async ({ page }) => {
  await open(page, { thumbnails: "bottom" });
  const width = await page.evaluate(
    () =>
      document.querySelector<HTMLElement>(".re-lightbox-viewport")
        ?.clientWidth ?? 0,
  );
  const samples = sampleShown(page, 2200);
  await page.getByRole("button", { name: "Show image 7" }).click();
  await page.waitForTimeout(120);
  await page.getByRole("button", { name: "Show image 3" }).click();
  const frames = await samples;
  const indices = new Set(
    frames.flatMap((frame) => Object.keys(frame.shown).map(Number)),
  );
  expect([...indices].sort()).toEqual([0, 2, 6]);
  for (const frame of frames.filter(
    (frame) => 2 in frame.shown && 6 in frame.shown,
  ))
    expect(Math.abs(frame.shown[6] - frame.shown[2] - width)).toBeLessThan(2);
  expect(frames.at(-1)?.shown).toEqual({ 2: 0 });
});

test("a distant jump from a zoomed photo pages to the new photo", {
  tag: "@desktop",
}, async ({ page }) => {
  await open(page, { thumbnails: "bottom" });
  await page.evaluate(() =>
    (
      window as unknown as { lightbox: { toggleZoom(): void } }
    ).lightbox.toggleZoom(),
  );
  await page.waitForTimeout(500);
  const samples = sampleShown(page, 1500);
  await page.evaluate(() =>
    (
      window as unknown as { lightbox: { goTo(index: number): void } }
    ).lightbox.goTo(5),
  );
  const frames = await samples;
  expect(frames.at(-1)?.shown).toEqual({ 5: 0 });
});

test("a step back during a distant jump ends on the photo before the target", {
  tag: "@desktop",
}, async ({ page }) => {
  await open(page, { thumbnails: "bottom" });
  const samples = sampleShown(page, 2000);
  await page.getByRole("button", { name: "Show image 7" }).click();
  await page.waitForTimeout(120);
  await page.evaluate(() =>
    (window as unknown as { lightbox: { prev(): void } }).lightbox.prev(),
  );
  const frames = await samples;
  const indices = new Set(
    frames.flatMap((frame) => Object.keys(frame.shown).map(Number)),
  );
  expect([...indices].sort()).toEqual([0, 5, 6]);
  expect(frames.at(-1)?.shown).toEqual({ 5: 0 });
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as { lightbox: { getState(): { index: number } } }
        ).lightbox.getState().index,
    ),
  ).toBe(5);
});

test("a distant jump under reduced motion lands at once without fading", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { thumbnails: "bottom" });
  const samples = sampleStrip(page, 300);
  await page.getByRole("button", { name: "Show image 7" }).click();
  const frames = await samples;
  expect(frames.every((frame) => frame.opacity === 1)).toBe(true);
  expect(frames.at(-1)?.index).toBe(6);
});

test("a resize during the opening flight still ends with an opaque photo and backdrop", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(async (src) => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    createLightbox({ duration: 1000 }).open([
      { src, width: 1200, height: 800, alt: "Photo" },
    ]);
  }, photo(0));
  await page.waitForTimeout(300);
  await page.setViewportSize({ width: 800, height: 600 });
  await page.waitForTimeout(1200);
  const opacity = await page.evaluate(() =>
    [".re-lightbox-frame", ".re-lightbox-backdrop"].map(
      (selector) =>
        getComputedStyle(document.querySelector(selector) as Element).opacity,
    ),
  );
  expect(opacity).toEqual(["1", "1"]);
});
