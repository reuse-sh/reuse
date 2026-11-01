import { expect, type Page, test } from "@playwright/test";
import { mount, photo } from "./harness";

async function open(page: Page, options: Record<string, unknown> = {}) {
  await mount(page, "", ["lightbox/styles.css"]);
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
          ".reuse-lightbox-viewport",
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
            ...viewport.querySelectorAll<HTMLElement>(".reuse-lightbox-slide"),
          ];
          const emptyVisible = slides.filter((slide) => {
            const rect = slide.getBoundingClientRect();
            const visible =
              rect.right > box.left + 1 && rect.left < box.right - 1;
            return visible && !slide.querySelector(".reuse-lightbox-frame");
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

test("a distant thumbnail jump fades instead of scrolling past the photos between", async ({
  page,
}) => {
  await open(page, { thumbnails: true });
  const width = await page.evaluate(
    () =>
      document.querySelector<HTMLElement>(".reuse-lightbox-viewport")
        ?.clientWidth ?? 0,
  );
  const samples = sampleStrip(page, 900);
  // A busy page delays the first animation frame after the click.
  await page.evaluate(() => {
    document
      .querySelector<HTMLButtonElement>('[aria-label="Show image 7"]')
      ?.click();
    const start = performance.now();
    while (performance.now() - start < 200) {}
  });
  const frames = await samples;
  expect(frames.at(-1)?.left).toBe(width * 6);
  expect(
    frames.every((frame) => frame.left === 0 || frame.left === width * 6),
  ).toBe(true);
  expect(Math.min(...frames.map((frame) => frame.opacity))).toBeLessThan(0.3);
  const arrival = frames.find((frame) => frame.left === width * 6);
  expect(arrival?.opacity).toBeLessThan(0.3);
  expect(frames.at(-1)?.opacity).toBe(1);
});

test("a distant jump under reduced motion lands at once without fading", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { thumbnails: true });
  const samples = sampleStrip(page, 300);
  await page.getByRole("button", { name: "Show image 7" }).click();
  const frames = await samples;
  expect(frames.every((frame) => frame.opacity === 1)).toBe(true);
  expect(frames.at(-1)?.index).toBe(6);
});
