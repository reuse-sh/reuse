import { type BrowserContext, expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 640 },
  { width: 1280, height: 800 },
];
const concurrency = 4;

async function problems(context: BrowserContext, path: string) {
  const page = await context.newPage();
  const found: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") found.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => found.push(`page error: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400)
      found.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  try {
    await page.goto(path, { timeout: 15_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 });
    const layout = await page.evaluate(() => {
      const root = document.scrollingElement ?? document.documentElement;
      return {
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        oldClasses: [...document.querySelectorAll('[class*="reuse-"]')].map(
          (element) => element.getAttribute("class"),
        ),
      };
    });
    if (layout.scrollWidth > layout.clientWidth)
      found.push(
        `horizontal scroll: scrollWidth ${layout.scrollWidth} > clientWidth ${layout.clientWidth}`,
      );
    for (const name of layout.oldClasses) found.push(`old class: ${name}`);
  } catch (error) {
    found.push(`load failed: ${(error as Error).message.split("\n")[0]}`);
  }
  await page.close();
  return found.map((problem) => `${path} ${problem}`);
}

for (const viewport of viewports) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport });

    test("every sitemap page holds", async ({ context, request }) => {
      test.setTimeout(60_000);
      const sitemap = await (await request.get("/sitemap.xml")).text();
      const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
        ([, loc]) => new URL(loc).pathname,
      );
      expect(paths.length).toBeGreaterThan(0);

      const found: string[] = [];
      const queue = [...paths];
      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          for (let path = queue.shift(); path; path = queue.shift())
            found.push(...(await problems(context, path)));
        }),
      );
      expect(found.sort()).toEqual([]);
    });
  });
}
