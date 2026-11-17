import { expect, type Page, test } from "@playwright/test";
import { mount } from "./harness";

type Lightbox = {
  open(items: unknown[], index?: number): void;
  close(): Promise<void>;
  next(): void;
  goTo(index: number): void;
  zoomTo(scale: number): void;
  getState(): { index: number };
};
type Window = globalThis.Window &
  typeof globalThis & {
    lightbox: Lightbox;
    marks: Record<string, number>;
  };

type Reply = { delay?: number; status?: number };

// Serves /img/<name>-<width>x<height>.jpg as an image of that size, so a test reads which file a
// request asked for and can slow or fail it.
async function serveImages(page: Page, reply: (path: string) => Reply) {
  const requests: string[] = [];
  await page.route("http://reuse.test/img/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    requests.push(pathname);
    const { delay = 0, status = 200 } = reply(pathname);
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    if (status !== 200) {
      await route.fulfill({ status, body: "" });
      return;
    }
    const [, width, height] = /(\d+)x(\d+)/.exec(pathname) ?? [
      "",
      "1200",
      "800",
    ];
    await route.fulfill({
      contentType: "image/svg+xml",
      headers: { "cache-control": "max-age=3600" },
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#5a8"/></svg>`,
    });
  });
  return requests;
}

async function create(page: Page, options: Record<string, unknown> = {}) {
  await page.evaluate(async (extra) => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    Object.assign(window, {
      lightbox: createLightbox({ history: false, ...extra }),
      marks: {},
    });
  }, options);
}

function open(page: Page, items: unknown[], index = 0) {
  return page.evaluate(
    ([list, at]) => {
      (window as Window).marks.open = performance.now();
      (window as Window).lightbox.open(list as unknown[], at as number);
    },
    [items, index] as const,
  );
}

const shown = (page: Page) =>
  page
    .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-image')
    .evaluate((image: HTMLImageElement) =>
      image.src ? new URL(image.currentSrc || image.src).pathname : "",
    );

test.describe("responsive sources on a 390px screen at 3x", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });

  test("loads the candidate that fits, a larger one after a zoom, and keeps it after zooming out", async ({
    page,
  }) => {
    await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
    let slow = 0;
    const requests = await serveImages(page, (path) => ({
      delay: path.includes("3600") ? slow : 0,
    }));
    await create(page);
    await open(page, [
      {
        src: "/img/p-3600x2400.jpg",
        srcset:
          "/img/p-900x600.jpg 900w, /img/p-1800x1200.jpg 1800w, /img/p-3600x2400.jpg 3600w",
        width: 3600,
        height: 2400,
      },
    ]);
    await expect.poll(() => shown(page)).toBe("/img/p-1800x1200.jpg");
    expect(requests).toEqual(["/img/p-1800x1200.jpg"]);

    slow = 1200;
    await page.evaluate(() => (window as Window).lightbox.zoomTo(2));
    await expect.poll(() => requests).toContain("/img/p-3600x2400.jpg");
    expect(await shown(page)).toBe("/img/p-1800x1200.jpg");
    await expect
      .poll(() => shown(page), { timeout: 5000 })
      .toBe("/img/p-3600x2400.jpg");

    await page.evaluate(() => (window as Window).lightbox.zoomTo(1));
    await page.waitForTimeout(500);
    expect(await shown(page)).toBe("/img/p-3600x2400.jpg");
  });
});

test("shows the spinner only after 300ms of loading, and never for a cached file", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await serveImages(page, () => ({ delay: 1000 }));
  await create(page);
  await page.evaluate(() => {
    new MutationObserver(() => {
      const marks = (window as Window).marks;
      if (!marks.spinner && document.querySelector(".re-lightbox-loading"))
        marks.spinner = performance.now();
    }).observe(document.body, { childList: true, subtree: true });
  });
  const item = { src: "/img/slow-1200x800.jpg", width: 1200, height: 800 };
  await open(page, [item]);
  const spinner = page.getByRole("status", { name: "Loading" });
  await expect(spinner).toBeVisible();
  const { open: opened, spinner: appeared } = await page.evaluate(
    () => (window as Window).marks,
  );
  expect(appeared - opened).toBeGreaterThanOrEqual(300);
  expect(appeared - opened).toBeLessThan(700);
  expect(
    await spinner.evaluate((element) =>
      element.getAnimations().map((animation) => ({
        name: (animation as CSSAnimation).animationName,
        duration: animation.effect?.getTiming().duration,
      })),
    ),
  ).toEqual([{ name: "re-lightbox-loading-in", duration: 150 }]);
  expect(
    await page
      .locator(".re-lightbox-frame")
      .evaluate((frame) => getComputedStyle(frame).backgroundColor),
  ).toBe("rgba(255, 255, 255, 0.06)");
  await expect(page.locator(".re-lightbox-loading")).toHaveCount(0, {
    timeout: 3000,
  });
  await expect.poll(() => shown(page)).toBe("/img/slow-1200x800.jpg");

  await page.evaluate(() => (window as Window).lightbox.close());
  await page.evaluate(() => {
    (window as Window).marks.spinner = 0;
  });
  await open(page, [item]);
  await expect.poll(() => shown(page)).toBe("/img/slow-1200x800.jpg");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as Window).marks.spinner)).toBe(0);
});

test("a failed image offers a retry that loads the same file, while paging goes on", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  let status = 404;
  const requests = await serveImages(page, (path) => ({
    status: path.includes("broken") ? status : 200,
  }));
  await create(page);
  await open(page, [
    { src: "/img/broken-1200x800.jpg", width: 1200, height: 800 },
    { src: "/img/next-1200x800.jpg", width: 1200, height: 800 },
  ]);
  const error = page.locator('.re-lightbox-error[role="status"]');
  await expect(error).toContainText("Image could not be loaded.");
  const retry = error.getByRole("button", { name: "Try again" });
  await expect(retry).toBeVisible();

  await page.evaluate(() => (window as Window).lightbox.next());
  await expect.poll(() => shown(page)).toBe("/img/next-1200x800.jpg");
  await page.keyboard.press("ArrowLeft");
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window).lightbox.getState().index),
    )
    .toBe(0);

  // A press on a strip that still glides, or scrolled in the last 100ms, stops it and is not a click.
  await expect
    .poll(() =>
      page
        .locator(".re-lightbox-viewport")
        .evaluate(
          (viewport: HTMLElement) =>
            viewport.scrollLeft === 0 && !viewport.style.scrollSnapType,
        ),
    )
    .toBe(true);
  await page.waitForTimeout(150);
  status = 200;
  await retry.click();
  await expect(error).toHaveCount(0);
  await expect.poll(() => shown(page)).toBe("/img/broken-1200x800.jpg");
  await expect(page.locator(".re-lightbox-frame[data-error]")).toHaveCount(0);
  expect(requests.filter((path) => path.includes("broken"))).toHaveLength(2);
});

test("the open flight shows the tile's pixels on every frame when the item has no preview", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await serveImages(page, (path) => ({
    delay: path.includes("full") ? 1500 : 0,
  }));
  await page.evaluate(async () => {
    const tile = document.createElement("img");
    tile.className = "tile";
    tile.src = "/img/tile-300x200.jpg";
    tile.style.cssText =
      "display:block;width:300px;height:200px;margin:40px;object-fit:cover";
    document.body.append(tile);
    await tile.decode();
  });
  await create(page);
  const frames = page.evaluate(
    () =>
      new Promise<{ pixels: boolean; tile: boolean }[]>((resolve) => {
        const samples: { pixels: boolean; tile: boolean }[] = [];
        const tile = document.querySelector<HTMLImageElement>(".tile");
        const tick = () => {
          const image =
            document.querySelector<HTMLImageElement>(".re-lightbox-image");
          if (image)
            samples.push({
              pixels: image.complete && image.naturalWidth > 0,
              tile: image.currentSrc === tile?.currentSrc,
            });
          if (document.querySelector("dialog")?.dataset.phase === "open")
            resolve(samples);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  await page.evaluate(() =>
    (window as Window).lightbox.open([
      {
        src: "/img/full-1200x800.jpg",
        width: 1200,
        height: 800,
        origin: document.querySelector(".tile"),
      },
    ]),
  );
  const samples = await frames;
  expect(samples.length).toBeGreaterThan(5);
  expect(samples.filter((sample) => !sample.pixels || !sample.tile)).toEqual(
    [],
  );
});

test("without a size the frame takes the tile's proportions, then the file's around the same center", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  let release = () => {};
  const arrived = new Promise<void>((resolve) => {
    release = resolve;
  });
  await serveImages(page, () => ({}));
  await page.route("http://reuse.test/img/wide-1200x600.jpg", async (route) => {
    await arrived;
    await route.fallback();
  });
  await page.evaluate(async () => {
    const tile = document.createElement("img");
    tile.className = "tile";
    tile.src = "/img/tile-300x200.jpg";
    tile.style.cssText =
      "display:block;width:150px;height:150px;object-fit:cover";
    document.body.append(tile);
    await tile.decode();
  });
  await create(page);
  await page.evaluate(() =>
    (window as Window).lightbox.open([
      {
        src: "/img/wide-1200x600.jpg",
        origin: document.querySelector(".tile"),
      },
    ]),
  );
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  const frame = page.locator(".re-lightbox-frame");
  const before = await frame.boundingBox();
  release();
  await expect(frame).not.toHaveAttribute("data-loading");
  const after = await frame.boundingBox();
  if (!before || !after) throw new Error("Missing frame");
  expect(before.width / before.height).toBeCloseTo(1.5, 2);
  expect(after.width / after.height).toBeCloseTo(2, 2);
  expect(after.x + after.width / 2).toBeCloseTo(before.x + before.width / 2, 0);
  expect(after.y + after.height / 2).toBeCloseTo(
    before.y + before.height / 2,
    0,
  );
});

test("bindLightboxGallery opens the file a link points to", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  const requests = await serveImages(page, () => ({}));
  await page.evaluate(async () => {
    const root = document.createElement("div");
    root.innerHTML = `<a href="/img/large-1200x800.jpg"><img src="/img/small-300x200.jpg" alt="Small" style="width:300px"></a>`;
    document.body.append(root);
    await root.querySelector("img")?.decode();
    const { bindLightboxGallery, lightboxItemFromImage } = await import(
      "/modules/lightbox/index.js"
    );
    Object.assign(window, {
      lightbox: bindLightboxGallery(root, { history: false }),
      item: lightboxItemFromImage(
        root.querySelector("img") as HTMLImageElement,
      ),
    });
  });
  expect(
    await page.evaluate(
      () => (window as unknown as { item: { src: string } }).item.src,
    ),
  ).toBe("/img/large-1200x800.jpg");
  await page.getByRole("img", { name: "Small" }).click();
  await expect.poll(() => shown(page)).toBe("/img/large-1200x800.jpg");
  expect(requests).toContain("/img/large-1200x800.jpg");
});

const photos = Array.from({ length: 8 }, (_, index) => ({
  src: `/img/photo-${index + 1}-1200x800.jpg`,
  width: 1200,
  height: 800,
}));

test("neighbors load only after the current photo has decoded", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  const requests = await serveImages(page, (path) => ({
    delay: path.includes("photo-5") ? 600 : 0,
  }));
  await create(page);
  await open(page, photos, 4);
  await page.waitForTimeout(400);
  expect(requests).toEqual(["/img/photo-5-1200x800.jpg"]);
  await expect
    .poll(() => [...requests].sort())
    .toEqual([
      "/img/photo-4-1200x800.jpg",
      "/img/photo-5-1200x800.jpg",
      "/img/photo-6-1200x800.jpg",
    ]);
});

test("neighbors load nearest first in the direction of the last move", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  const requests = await serveImages(page, () => ({}));
  await create(page, { preload: 2 });
  const gallery = Array.from({ length: 30 }, (_, index) => ({
    src: `/img/photo-${index + 1}-1200x800.jpg`,
    width: 1200,
    height: 800,
  }));
  const loaded = async (total: number) => {
    await expect.poll(() => requests.length).toBe(total);
    return requests
      .slice(total - 5)
      .map((path) => Number(/photo-(\d+)-/.exec(path)?.[1]));
  };
  await open(page, gallery, 10);
  expect(await loaded(5)).toEqual([11, 12, 10, 13, 9]);
  await page.evaluate(() => (window as Window).lightbox.goTo(20));
  expect(await loaded(10)).toEqual([21, 22, 20, 23, 19]);
  await page.evaluate(() => (window as Window).lightbox.goTo(5));
  expect(await loaded(15)).toEqual([6, 5, 7, 4, 8]);
  await page.waitForTimeout(300);
  expect(requests).toHaveLength(15);
});

test("Save-Data loads only the current photo", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(Navigator.prototype, "connection", {
      configurable: true,
      get: () => ({ saveData: true }),
    }),
  );
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  const requests = await serveImages(page, () => ({}));
  await create(page);
  await open(page, photos, 4);
  await expect.poll(() => shown(page)).toBe("/img/photo-5-1200x800.jpg");
  await page.waitForTimeout(500);
  expect(requests).toEqual(["/img/photo-5-1200x800.jpg"]);
  await page.evaluate(() => (window as Window).lightbox.next());
  await expect.poll(() => shown(page)).toBe("/img/photo-6-1200x800.jpg");
  expect(requests).toEqual([
    "/img/photo-5-1200x800.jpg",
    "/img/photo-6-1200x800.jpg",
  ]);
});
