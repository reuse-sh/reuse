import { type BrowserContext, expect, test } from "@playwright/test";
import { serveExampleImages } from "./images";

const viewports = [
  { width: 320, height: 640 },
  { width: 1280, height: 800 },
];
const concurrency = 4;

async function problems(context: BrowserContext, path: string) {
  const page = await context.newPage();
  await page.route("https://cdn.visitors.now/v.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await page.route("https://cloud.umami.is/script.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  await serveExampleImages(page);
  const found: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") found.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => found.push(`page error: ${error.message}`));
  // The blurred marble SVGs repaint on every frame a photo moves; pages show the WebP renders.
  page.on("request", (request) => {
    if (/\/images\/marble-[^/]*\.svg$/.test(new URL(request.url()).pathname))
      found.push(`vector photo: ${request.url()}`);
  });
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

test("unavailable analytics does not prevent page navigation", async ({
  page,
}) => {
  await page.route("https://cdn.visitors.now/v.js", (route) => route.abort());
  await page.route("https://cloud.umami.is/script.js", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.getByRole("link", { name: "Start with Lightbox" }).click();
  await expect(page).toHaveURL("/lightbox");
  await expect(
    page.getByRole("heading", { name: "Lightbox", exact: true }),
  ).toBeVisible();
});

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

test("the toolbar preview's counter rolls its digit in the paging direction", async ({
  page,
}) => {
  await page.goto("/lightbox/controls/toolbar");
  await page.locator('main a[href^="/images/marble"]').nth(1).click();
  const counter = page.locator(
    ".re-lightbox-style-toolbar .re-lightbox-counter",
  );
  await expect(counter).toHaveText("2 / 8");
  const roll = (key: string) =>
    counter.evaluate((element, key) => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );
      return element
        .getAnimations({ subtree: true })
        .map((animation) =>
          (animation.effect as KeyframeEffect)
            .getKeyframes()
            .map((frame) => frame.translate)
            .join(" > "),
        )
        .sort();
    }, key);
  expect(await roll("ArrowRight")).toEqual([
    "0px 100% > 0px",
    "0px > 0px -100%",
  ]);
  await expect(counter).toHaveText("3 / 8");
  await expect
    .poll(() =>
      counter.evaluate(
        (element) => element.getAnimations({ subtree: true }).length,
      ),
    )
    .toBe(0);
  expect(await roll("ArrowLeft")).toEqual([
    "0px -100% > 0px",
    "0px > 0px 100%",
  ]);
  await expect(counter).toHaveText("2 / 8");
});

test("the classic preview's corner counter reads 1 / 8 on one line", async ({
  page,
}) => {
  await page.goto("/lightbox/controls/classic");
  await page.locator('main a[href^="/images/marble"]').first().click();
  const counter = page.locator(".re-lightbox-counter");
  await expect(counter).toHaveText("1 / 8");
  const parts = await counter.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return [...element.children].map((child) => {
      const { top, left, right } = child.getBoundingClientRect();
      return {
        top: Math.round(top),
        leftInset: left - bounds.left,
        rightInset: bounds.right - right,
      };
    });
  });
  expect(parts).toHaveLength(3);
  expect(new Set(parts.map(({ top }) => top)).size).toBe(1);
  const box = await counter.boundingBox();
  expect(box?.height).toBe(40);
  expect([parts[0].leftInset, parts[2].rightInset]).toEqual([14, 14]);
});
