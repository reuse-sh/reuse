import { expect, type Page, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

const preview = '[data-slot="example-preview"]';
const tallAndWide = "/lightbox/examples/tall-and-wide";
const mixedMedia = "/lightbox/examples/mixed-media";
const youtube =
  /^https:\/\/(?:[\w-]+\.)?(?:youtube(?:-nocookie)?\.com|ytimg\.com|googlevideo\.com)\//;

// The YouTube player is never fetched: a stub page stands in for it, or the request fails.
async function stubYouTube(page: Page, mode: "stub" | "block" = "stub") {
  const reached: string[] = [];
  await page.route(youtube, (route) => {
    reached.push(route.request().url());
    return mode === "block"
      ? route.abort("blockedbyclient")
      : route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><title>Player</title>",
        });
  });
  return reached;
}

const dialog = (page: Page) => page.locator("dialog.re-lightbox[open]");
const current = (page: Page) =>
  dialog(page).locator('.re-lightbox-slide[aria-hidden="false"]');

async function open(page: Page, path: string, tile: number) {
  await expect(async () => {
    // A click before hydration follows the link instead of opening the viewer.
    if (!page.url().endsWith(path)) await page.goto(path);
    await page.locator(`${preview} a`).nth(tile).click();
    await expect(dialog(page)).toHaveAttribute("data-phase", "open", {
      timeout: 1500,
    });
  }).toPass();
}

async function shown(page: Page) {
  const box = await current(page).locator(".re-lightbox-image").boundingBox();
  if (!box) throw new Error("No image on the current slide");
  return box;
}

for (const reducedMotion of ["no-preference", "reduce"] as const)
  test(`the tall screenshot opens at the screen's width, scrolls, and the zoom button shows it whole (${reducedMotion} motion)`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto(tallAndWide);
    await open(page, tallAndWide, 0);
    await expect(current(page)).toHaveAttribute("aria-label", "Image 1 of 4");
    const rest = await shown(page);
    const bar = await dialog(page)
      .locator(".re-lightbox-toolbar-end")
      .boundingBox();
    if (!bar) throw new Error("No toolbar");
    expect(Math.abs(rest.y - (bar.y + bar.height + 24))).toBeLessThan(1);
    expect(rest.height).toBeGreaterThan(800 * 2);
    expect(rest.width).toBeGreaterThan(1280 * 0.85);
    await page.keyboard.press("ArrowDown");
    await expect
      .poll(async () => (await shown(page)).y)
      .toBeLessThan(rest.y - 40);
    await dialog(page).locator(".re-lightbox-zoom").click();
    await expect
      .poll(async () => (await shown(page)).height)
      .toBeLessThanOrEqual(800);
    const whole = await shown(page);
    expect(whole.y).toBeGreaterThanOrEqual(0);
    expect(whole.width / whole.height).toBeCloseTo(2560 / 8045, 2);
    await page.keyboard.press("ArrowRight");
    await expect(current(page)).toHaveAttribute("aria-label", "Image 2 of 4");
  });

test("the panorama opens whole at the screen's width and its zoom stops at the widest file's own pixels", async ({
  page,
}) => {
  await page.goto(tallAndWide);
  await open(page, tallAndWide, 3);
  await expect(current(page)).toHaveAttribute("aria-label", "Image 4 of 4");
  const rest = await shown(page);
  expect(rest.x).toBeGreaterThanOrEqual(0);
  expect(rest.x + rest.width).toBeLessThanOrEqual(1280);
  expect(rest.width).toBeGreaterThan(1280 * 0.85);
  expect(rest.width / rest.height).toBeCloseTo(2560 / 600, 1);
  await dialog(page).locator(".re-lightbox-zoom").click();
  await expect(dialog(page)).toHaveAttribute("data-zoomed", "true");
  await expect.poll(async () => (await shown(page)).width).toBeCloseTo(2560, 0);
  expect((await shown(page)).height).toBeCloseTo(600, 0);
  await expect(current(page).locator(".re-lightbox-image")).toHaveAttribute(
    "src",
    /horizon-2560\.jpg$/,
  );
});

test("the transparent PNG gets its backing and the SVG opens without a srcset", async ({
  page,
}) => {
  await page.goto(tallAndWide);
  await open(page, tallAndWide, 1);
  const png = current(page).locator(".re-lightbox-frame");
  await expect(png).toHaveAttribute("data-transparent", "true");
  await expect(png).not.toHaveAttribute("data-loading");
  await page.keyboard.press("ArrowRight");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 3 of 4");
  const svg = current(page).locator(".re-lightbox-image");
  await expect(svg).toHaveAttribute("src", /quiet-hills\.svg$/);
  await expect
    .poll(() => svg.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await expect(current(page).locator(".re-lightbox-frame")).not.toHaveAttribute(
    "data-error",
  );
  const box = await shown(page);
  expect(box.width / box.height).toBeCloseTo(1500 / 1000, 1);
});

test("paging off a playing video pauses it, and the keyboard pages across every kind of slide", async ({
  page,
}) => {
  const reached = await stubYouTube(page);
  await page.goto(mixedMedia);
  await open(page, mixedMedia, 1);
  const video = current(page).locator("video");
  await expect(current(page).locator(".re-lightbox-frame")).toHaveAttribute(
    "data-media",
    "video",
  );
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => !element.paused))
    .toBe(true);
  await page.keyboard.press("ArrowRight");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 3 of 6");
  const left = dialog(page).locator("video");
  await expect
    .poll(() => left.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 5 of 6");
  const frame = current(page).locator("iframe");
  await expect(current(page).locator(".re-lightbox-frame")).toHaveAttribute(
    "data-media",
    "embed",
  );
  await expect(frame).toHaveAttribute(
    "src",
    /^https:\/\/www\.youtube-nocookie\.com\/embed\/KBPavXDw8lw\?/,
  );
  await expect(frame).toHaveAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups",
  );
  await page.keyboard.press("ArrowRight");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 6 of 6");
  await page.keyboard.press("Home");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 1 of 6");
  await page.keyboard.press("End");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 6 of 6");
  expect(reached.length).toBeGreaterThan(0);
  expect(
    reached.every((url) => url.startsWith("https://www.youtube-nocookie.com/")),
  ).toBe(true);
});

test("a blocked YouTube player leaves the rest of the set working", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://cdn.visitors.now/v.js", (route) => route.abort());
  await stubYouTube(page, "block");
  await page.goto(mixedMedia);
  await open(page, mixedMedia, 4);
  await expect(current(page)).toHaveAttribute("aria-label", "Image 5 of 6");
  await expect(current(page).locator("iframe")).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 6 of 6");
  await expect(current(page).locator(".re-lightbox-image")).toBeVisible();
  for (const _ of [5, 4, 3, 2]) await page.keyboard.press("ArrowLeft");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 2 of 6");
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await expect(page.locator(`${preview} a`).nth(1)).toBeFocused();
  expect(errors).toEqual([]);
});

test("on a right-to-left page ArrowLeft pages forward through the media", async ({
  page,
}) => {
  await stubYouTube(page);
  await page.goto(mixedMedia);
  // The site's CSS build turns :dir(rtl) into :lang() of right-to-left languages.
  await page.evaluate(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "he";
  });
  await open(page, mixedMedia, 0);
  await page.keyboard.press("ArrowLeft");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 2 of 6");
  await expect(current(page).locator(".re-lightbox-frame")).toHaveAttribute(
    "data-media",
    "video",
  );
  await page.keyboard.press("ArrowRight");
  await expect(current(page)).toHaveAttribute("aria-label", "Image 1 of 6");
  const next = await dialog(page).locator(".re-lightbox-next").boundingBox();
  expect(next?.x ?? 1280).toBeLessThan(640);
});

for (const path of [tallAndWide, mixedMedia])
  test(`${path} fits 320px without overflow and its tiles stay inside the frame`, async ({
    page,
  }) => {
    await stubYouTube(page);
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(path);
    const example = page.locator(preview);
    await expect(example.locator("a").first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
    const frame = await example.boundingBox();
    if (!frame) throw new Error("No example frame");
    for (const box of await example
      .locator("a")
      .evaluateAll((links) =>
        links.map((link) => link.getBoundingClientRect().toJSON()),
      )) {
      expect(box.left).toBeGreaterThanOrEqual(frame.x);
      expect(box.right).toBeLessThanOrEqual(frame.x + frame.width);
      expect(box.width).toBeGreaterThan(100);
    }
  });
