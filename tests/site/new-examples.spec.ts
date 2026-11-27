import { expect, test } from "@playwright/test";
import { ctrlWheel, traceMainThread } from "../browser/harness";

const pages = [
  ["/lightbox/examples/portfolio", "Portfolio grid"],
  ["/lightbox/examples/contact-sheet", "Contact sheet"],
  ["/lightbox/examples/tall-and-wide", "Tall and wide media"],
  ["/lightbox/examples/mixed-media", "Mixed media"],
  ["/carousel/examples/coverflow", "Coverflow"],
  ["/carousel/examples/marquee", "Marquee"],
  ["/carousel/examples/stories", "Stories"],
  ["/carousel/examples/product-gallery", "Product gallery"],
] as const;
const widths = [320, 390, 768, 1440];

test.use({ reducedMotion: "reduce" });

for (const [path, title] of pages)
  for (const width of widths)
    test(`${title} at ${width}px fits the viewport and shows its demo`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route(/youtube|ytimg|googlevideo/, (route) => route.abort());
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(
        `${title} · ${path.startsWith("/lightbox") ? "Lightbox" : "Carousel"} · Reuse`,
      );
      const preview = page.locator('[data-slot="example-preview"]');
      await expect(preview).toBeVisible();
      await page.waitForLoadState("networkidle");
      const layout = await page.evaluate(() => {
        const root = document.scrollingElement ?? document.documentElement;
        const frame = document
          .querySelector('[data-slot="example-preview"]')
          ?.getBoundingClientRect();
        const broken = [
          ...document.querySelectorAll<HTMLImageElement>(
            '[data-slot="example-preview"] img',
          ),
        ]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src);
        return {
          overflow: root.scrollWidth - root.clientWidth,
          frameStart: frame?.left ?? -1,
          frameEnd: (frame?.right ?? Infinity) - root.clientWidth,
          broken,
        };
      });
      expect(layout).toEqual({
        overflow: 0,
        frameStart: expect.any(Number),
        frameEnd: expect.any(Number),
        broken: [],
      });
      expect(layout.frameStart).toBeGreaterThanOrEqual(0);
      expect(layout.frameEnd).toBeLessThanOrEqual(0);
      const capture = testInfo.outputPath(`${width}.png`);
      await page.screenshot({ fullPage: true, path: capture });
      await testInfo.attach(`${title} ${width}`, {
        path: capture,
        contentType: "image/png",
      });
    });

for (const [path, title, tile] of [
  [
    "/lightbox/examples/portfolio",
    "Portfolio grid",
    ".re-portfolio-grid button",
  ],
  [
    "/lightbox/examples/contact-sheet",
    "Contact sheet",
    '[data-slot="example-preview"] button',
  ],
] as const)
  test(`${title} pages ten photos, zooms and closes without a long main-thread task`, {
    tag: "@timing",
  }, async ({ page, browserName }) => {
    test.skip(
      browserName !== "chromium",
      "Main-thread time is traced in Chromium.",
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const first = page.locator(tile).first();
    await first.hover();
    const tracing = await traceMainThread(page);
    await first.click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toHaveCount(1);
    await page.waitForTimeout(500);
    for (let step = 0; step < 10; step++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(450);
    }
    await expect(dialog.getByRole("status")).toContainText("11 of");
    const middle = { x: 720, y: 450 };
    for (let step = 0; step < 5; step++) {
      await ctrlWheel(page, middle, -40);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(300);
    for (let step = 0; step < 5; step++) {
      await ctrlWheel(page, middle, 40);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await page.waitForTimeout(500);
    const tasks = await tracing.stop();
    expect(tasks.length).toBeGreaterThan(100);
    expect(tasks.filter((time) => time > 20)).toEqual([]);
  });
