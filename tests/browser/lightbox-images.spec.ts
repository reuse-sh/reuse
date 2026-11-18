import { expect, type Page, test } from "@playwright/test";
import { framesUntilIdle, mount } from "./harness";

type Lightbox = {
  open(items: unknown[], index?: number): void;
  close(): Promise<void>;
  next(): void;
  goTo(index: number): void;
  zoomTo(scale: number, focus?: { x: number; y: number }): void;
  getState(): { index: number; isAnimating: boolean; zoom: { scale: number } };
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

test("without a size the frame fits the screen at the tile's proportions, then takes the file's around the same center", async ({
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
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window).lightbox.getState().isAnimating),
    )
    .toBe(false);
  const after = await frame.boundingBox();
  if (!before || !after) throw new Error("Missing frame");
  expect(Math.round(before.width)).toBe(936);
  expect(before.width / before.height).toBeCloseTo(1.5, 2);
  expect(after.width / after.height).toBeCloseTo(2, 2);
  expect(after.x + after.width / 2).toBeCloseTo(before.x + before.width / 2, 0);
  expect(after.y + after.height / 2).toBeCloseTo(
    before.y + before.height / 2,
    0,
  );
});

test("a file without a size that is smaller than the screen shrinks the frame to it on landing instead of snapping", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await serveImages(page, () => ({}));
  await create(page);
  await open(page, [
    {
      src: "/img/small-400x300.jpg",
      previewSrc:
        "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='40'%20height='30'/%3E",
    },
  ]);
  const widths = await framesUntilIdle(
    page,
    "document.querySelector('.re-lightbox-frame')?.offsetWidth ?? 0",
    600,
  );
  expect(widths[0]).toBeGreaterThan(800);
  expect(widths.at(-1)).toBe(400);
  expect(
    widths.filter((width) => width > 410 && width < widths[0] - 10).length,
  ).toBeGreaterThan(2);
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
    const { bindLightboxGallery, createLightbox, lightboxItemFromElement } =
      await import("/modules/lightbox/index.js");
    const lightbox = createLightbox({ history: false });
    bindLightboxGallery(root, lightbox);
    Object.assign(window, {
      lightbox,
      item: lightboxItemFromElement(root.querySelector("a") as HTMLElement),
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

test.describe("sizes from a srcset on a 1440px screen", () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  const responsive = {
    src: "/img/p-3600x2400.jpg",
    srcset:
      "/img/p-900x600.jpg 900w, /img/p-1800x1200.jpg 1800w, /img/p-3600x2400.jpg 3600w",
  };

  test("a srcset photo without a size opened from a small tile fits the screen and skips the tile-sized file", async ({
    page,
  }) => {
    await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
    const requests = await serveImages(page, () => ({}));
    await page.evaluate(async () => {
      const tile = document.createElement("img");
      tile.className = "tile";
      tile.src = "/img/tile-300x200.jpg";
      tile.style.cssText = "display:block;width:150px;height:100px";
      document.body.append(tile);
      await tile.decode();
    });
    await create(page);
    await page.evaluate(
      (item) =>
        (window as Window).lightbox.open([
          { ...item, origin: document.querySelector(".tile") },
        ]),
      responsive,
    );
    const frame = page.locator(".re-lightbox-frame");
    await expect(frame).not.toHaveAttribute("data-loading");
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    const box = await frame.boundingBox();
    expect([Math.round(box?.width ?? 0), Math.round(box?.height ?? 0)]).toEqual(
      [1254, 836],
    );
    expect(requests).not.toContain("/img/p-900x600.jpg");
  });

  test("a srcset photo whose sizes picks a small candidate still takes its size from the widest one", async ({
    page,
  }) => {
    await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
    await serveImages(page, () => ({}));
    await create(page);
    await open(page, [{ ...responsive, sizes: "300px" }]);
    const frame = page.locator(".re-lightbox-frame");
    await expect(frame).not.toHaveAttribute("data-loading");
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    await expect.poll(() => shown(page)).toBe("/img/p-900x600.jpg");
    const box = await frame.boundingBox();
    expect([Math.round(box?.width ?? 0), Math.round(box?.height ?? 0)]).toEqual(
      [1254, 836],
    );
  });
});

test.describe("a responsive tile at 2x", () => {
  test.use({ deviceScaleFactor: 2 });

  test("lightboxItemFromElement reads the shown file's own width, not the tile's CSS size", async ({
    page,
  }) => {
    await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
    await serveImages(page, () => ({}));
    const item = await page.evaluate(async () => {
      const image = document.createElement("img");
      image.srcset = "/img/a-300x200.jpg 300w, /img/a-1200x800.jpg 1200w";
      image.sizes = "300px";
      image.src = "/img/a-300x200.jpg";
      image.style.width = "300px";
      document.body.append(image);
      await image.decode();
      const { lightboxItemFromElement } = await import(
        "/modules/lightbox/index.js"
      );
      const item = lightboxItemFromElement(image);
      if (!item) throw new Error("No item");
      const { src, width, height } = item;
      return { src: new URL(src ?? "").pathname, width, height };
    });
    expect(item).toEqual({
      src: "/img/a-1200x800.jpg",
      width: 1200,
      height: 800,
    });
  });
});

test("a sharper file that decodes during a drag waits for the release before it moves the zoomed photo", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  let release = () => {};
  const arrived = new Promise<void>((resolve) => {
    release = resolve;
  });
  await serveImages(page, () => ({}));
  await page.route("http://reuse.test/img/p-3600x2700.jpg", async (route) => {
    await arrived;
    await route.fallback();
  });
  await create(page);
  await open(page, [
    {
      src: "/img/p-3600x2700.jpg",
      srcset: "/img/p-1200x900.jpg 1200w, /img/p-3600x2700.jpg 3600w",
      width: 3600,
      height: 2700,
    },
  ]);
  await expect.poll(() => shown(page)).toBe("/img/p-1200x900.jpg");
  const asked = page.waitForRequest("http://reuse.test/img/p-3600x2700.jpg");
  await page.evaluate(() =>
    (window as Window).lightbox.zoomTo(2, { x: 5000, y: 0 }),
  );
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window).lightbox.getState().isAnimating),
    )
    .toBe(false);
  await asked;
  const frame = page.locator(".re-lightbox-frame");
  const right = async () => {
    const box = await frame.boundingBox();
    return Math.round((box?.x ?? 0) + (box?.width ?? 0));
  };
  const edge = await right();
  await page.mouse.move(500, 350);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++)
    await page.mouse.move(500 - step * 20, 350);
  const stretched = await right();
  expect(stretched).toBeLessThan(edge);
  const answered = page.waitForResponse(
    "http://reuse.test/img/p-3600x2700.jpg",
  );
  release();
  await answered;
  await page.evaluate(async () => {
    const image = new Image();
    image.src = "/img/p-3600x2700.jpg";
    await image.decode();
    for (let frame = 0; frame < 3; frame++)
      await new Promise(requestAnimationFrame);
  });
  expect(await right()).toBe(stretched);
  await page.mouse.up();
  await expect.poll(() => shown(page)).toBe("/img/p-3600x2700.jpg");
  await expect.poll(right).toBe(edge);
});

test("an SVG at a URL without an extension takes its viewBox size and zooms like a vector", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.route("http://reuse.test/vector", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><rect width="800" height="400" fill="#5a8"/></svg>',
    }),
  );
  await create(page);
  await open(page, [{ src: "/vector" }]);
  const frame = page.locator(".re-lightbox-frame");
  await expect(frame).not.toHaveAttribute("data-loading");
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  const box = await frame.boundingBox();
  expect([Math.round(box?.width ?? 0), Math.round(box?.height ?? 0)]).toEqual([
    800, 400,
  ]);
  await page.evaluate(() => (window as Window).lightbox.zoomTo(4));
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window).lightbox.getState().zoom.scale),
    )
    .toBe(4);
});

test("a photo at a URL without an extension costs no HEAD request", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  const methods: string[] = [];
  await page.route("http://reuse.test/cdn/photo?w=1200", (route) => {
    methods.push(route.request().method());
    return route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#5a8"/></svg>',
    });
  });
  await create(page);
  await open(page, [
    { src: "/cdn/photo?w=1200", previewSrc: "/cdn/photo?w=1200" },
  ]);
  const frame = page.locator(".re-lightbox-frame");
  await expect(frame).not.toHaveAttribute("data-loading");
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  expect(methods.filter((method) => method === "HEAD")).toEqual([]);
});

test("a raster at a URL without an extension replaces its preview after one GET", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  const png = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
      const context = canvas.getContext("2d");
      if (context) context.fillStyle = "#5a8";
      context?.fillRect(0, 0, 1200, 800);
      return canvas.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  const methods: string[] = [];
  await page.route("http://reuse.test/cdn/raster?w=1200", async (route) => {
    methods.push(route.request().method());
    if (route.request().method() === "HEAD")
      await new Promise((resolve) => setTimeout(resolve, 3000));
    return route.fulfill({ contentType: "image/png", body: png });
  });
  await create(page);
  await open(page, [
    {
      src: "/cdn/raster?w=1200",
      previewSrc:
        "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='120'%20height='80'/%3E",
      width: 1200,
      height: 800,
    },
  ]);
  await expect.poll(() => shown(page), { timeout: 2000 }).toBe("/cdn/raster");
  expect(methods).toEqual(["GET"]);
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
