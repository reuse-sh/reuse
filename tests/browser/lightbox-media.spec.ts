import { expect, type Page, test } from "@playwright/test";
import { mount, swipe, tap } from "./harness";

type Zoom = { scale: number; x: number; y: number };
type Lightbox = {
  getState(): {
    index: number;
    isOpen: boolean;
    isAnimating: boolean;
    zoom: Zoom;
  };
};
type Window = globalThis.Window & typeof globalThis & { lightbox: Lightbox };

const PADDING = 32;

async function open(
  page: Page,
  sizes: [number, number][],
  { styles = ["lightbox/base.css"], dir = "ltr" } = {},
) {
  await mount(
    page,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    styles,
  );
  await page.evaluate(
    async ([list, dir]) => {
      document.documentElement.dir = dir;
      const sources: string[] = [];
      for (const [w, h] of list) {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const context = canvas.getContext("2d") as CanvasRenderingContext2D;
        const gradient = context.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, "#345");
        gradient.addColorStop(1, "#c96");
        context.fillStyle = gradient;
        context.fillRect(0, 0, w, h);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.8),
        );
        sources.push(URL.createObjectURL(blob as Blob));
      }
      const { createLightbox } = await import("/modules/lightbox/index.js");
      const lightbox = createLightbox({ history: false });
      Object.assign(window, { lightbox });
      lightbox.open(
        list.map(([width, height], index) => ({
          src: sources[index],
          width,
          height,
          caption: `Photo ${index + 1}`,
        })),
        0,
      );
    },
    [sizes, dir] as const,
  );
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  await expect(page.locator(".re-lightbox-frame[data-loading]")).toHaveCount(0);
}

const state = (page: Page) =>
  page.evaluate(() => (window as Window).lightbox.getState());

async function still(page: Page) {
  await expect.poll(async () => (await state(page)).isAnimating).toBe(false);
}

async function photo(page: Page) {
  const box = await page
    .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
    .boundingBox();
  if (!box) throw new Error("Missing photo");
  return box;
}

// A tall photo rests the padding below the lowest toolbar control and ends the padding above the bottom.
async function toolbarBottom(page: Page) {
  return page.evaluate(() =>
    Math.max(
      0,
      ...[
        ...document.querySelectorAll(
          ".re-lightbox-toolbar-start, .re-lightbox-toolbar-end",
        ),
      ]
        .map((group) => group.getBoundingClientRect())
        .filter((rect) => rect.height > 0)
        .map((rect) => rect.bottom),
    ),
  );
}

async function screen(page: Page) {
  const box = await page.locator(".re-lightbox-viewport").boundingBox();
  if (!box) throw new Error("Missing viewport");
  return box;
}

test.describe("lightbox tall and wide photos", { tag: "@touch" }, () => {
  test("a 1170x8000 photo fills the width from the top, scrolls to its bottom edge, scrolls on a swipe down in the middle and closes on one from the top", async ({
    page,
  }) => {
    await open(page, [
      [1170, 8000],
      [800, 600],
    ]);
    const view = await screen(page);
    expect([view.width, view.height]).toEqual([390, 844]);
    const top = (await toolbarBottom(page)) + PADDING;
    expect(top).toBeGreaterThan(PADDING);
    let box = await photo(page);
    expect(Math.abs(box.width - (view.width - 2 * PADDING))).toBeLessThan(1);
    expect(Math.abs(box.y - top)).toBeLessThan(1);
    const middle = view.x + view.width / 2;
    for (let attempt = 0; attempt < 8; attempt++) {
      box = await photo(page);
      if (box.y + box.height <= view.y + view.height - PADDING + 1) break;
      await swipe(page, { x: middle, y: 700 }, { x: middle, y: 200 });
      await still(page);
    }
    box = await photo(page);
    expect(
      Math.abs(box.y + box.height - (view.y + view.height - PADDING)),
    ).toBeLessThan(1);
    expect(await state(page)).toMatchObject({ isOpen: true, index: 0 });
    const bottom = box.y;
    await swipe(page, { x: middle, y: 300 }, { x: middle, y: 600 });
    await still(page);
    box = await photo(page);
    expect(box.y).toBeGreaterThan(bottom + 250);
    expect(box.y).toBeLessThan(top - 1);
    expect(await state(page)).toMatchObject({ isOpen: true, index: 0 });
    for (let attempt = 0; attempt < 8; attempt++) {
      if ((await photo(page)).y >= top - 0.5) break;
      await swipe(page, { x: middle, y: 200 }, { x: middle, y: 700 });
      await still(page);
    }
    expect(Math.abs((await photo(page)).y - top)).toBeLessThan(1);
    expect((await state(page)).isOpen).toBe(true);
    await swipe(page, { x: middle, y: 300 }, { x: middle, y: 600 });
    await expect.poll(async () => (await state(page)).isOpen).toBe(false);
  });

  test("after a vertical pan on a tall photo the strip pages again", async ({
    page,
  }) => {
    await open(page, [
      [1170, 8000],
      [800, 600],
    ]);
    await swipe(page, { x: 195, y: 700 }, { x: 195, y: 300 });
    await still(page);
    expect((await state(page)).zoom.y).toBeGreaterThan(0);
    await expect(page.locator(".re-lightbox-viewport")).not.toHaveCSS(
      "overflow-x",
      "hidden",
    );
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await state(page)).index).toBe(1);
  });

  test("a dismiss drag on a tall photo shrinks it around the screen center, so its top edge stays near the finger", async ({
    page,
  }) => {
    await open(page, [[1170, 8000]]);
    const view = await screen(page);
    const top = (await photo(page)).y;
    const drag = 200;
    const held = swipe(
      page,
      { x: 195, y: 100 },
      { x: 195, y: 100 + drag },
      { hold: 600 },
    );
    await page.waitForTimeout(450);
    const moved = (await photo(page)).y;
    await held;
    const middle = view.y + view.height / 2;
    const shrink = 1 - (0.25 * drag) / (view.height / 2);
    expect(
      Math.abs(moved - (middle + (top - middle) * shrink + drag)),
    ).toBeLessThan(2);
  });

  test("a double tap shows the whole tall photo and the next one returns to its width", async ({
    page,
  }) => {
    await open(page, [[1170, 8000]]);
    const view = await screen(page);
    const center = {
      x: view.x + view.width / 2,
      y: view.y + view.height / 2,
    };
    const top = (await toolbarBottom(page)) + PADDING;
    await tap(page, center, { count: 2 });
    await still(page);
    let box = await photo(page);
    expect(
      Math.abs(box.height - (view.height - top - PADDING)),
    ).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y - top)).toBeLessThanOrEqual(1);
    expect((await state(page)).zoom.scale).toBeLessThan(1);
    await tap(page, center, { count: 2 });
    await still(page);
    box = await photo(page);
    expect(Math.abs(box.width - (view.width - 2 * PADDING))).toBeLessThan(1);
    expect((await state(page)).zoom.scale).toBe(1);
  });

  test("a double tap on a 6000x1000 photo makes its height the viewport height", async ({
    page,
  }) => {
    await open(page, [[6000, 1000]]);
    const view = await screen(page);
    const before = await photo(page);
    expect(Math.abs(before.width - (view.width - 2 * PADDING))).toBeLessThan(1);
    await tap(
      page,
      { x: view.x + view.width / 2, y: view.y + view.height / 2 },
      { count: 2 },
    );
    await still(page);
    expect(Math.abs((await photo(page)).height - view.height)).toBeLessThan(1);
  });
});

test.describe("lightbox tall photos with keys and the wheel", {
  tag: "@desktop",
}, () => {
  test("ArrowDown and the wheel scroll a tall photo at its width, and ArrowRight still pages", async ({
    page,
  }) => {
    await open(page, [
      [1170, 8000],
      [800, 600],
    ]);
    const view = await screen(page);
    const top = (await photo(page)).y;
    expect(
      Math.abs(top - ((await toolbarBottom(page)) + PADDING)),
    ).toBeLessThan(1);
    await page.keyboard.press("ArrowDown");
    await still(page);
    expect(
      Math.abs((await photo(page)).y - (top - 0.1 * view.height)),
    ).toBeLessThan(1);
    await page.mouse.move(view.x + view.width / 2, view.y + view.height / 2);
    await page.mouse.wheel(0, 300);
    await expect
      .poll(async () => Math.round(top - (await photo(page)).y))
      .toBe(Math.round(0.1 * view.height + 300));
    expect((await state(page)).zoom.scale).toBe(1);
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await state(page)).index).toBe(1);
  });

  test("a tall photo at its width shows the zoom-out cursor, since a click shows it whole, and zoom-in once whole", async ({
    page,
  }) => {
    await open(page, [[1170, 8000]]);
    const frame = page.locator(
      '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
    );
    const view = await screen(page);
    await page.mouse.move(view.x + view.width / 2, view.y + view.height / 2);
    await expect(page.locator("dialog")).toHaveAttribute("data-zoom", "out");
    await expect(frame).toHaveCSS("cursor", "zoom-out");
    await page.mouse.click(view.x + view.width / 2, view.y + view.height / 2);
    await still(page);
    expect((await state(page)).zoom.scale).toBeLessThan(1);
    await expect(page.locator("dialog")).toHaveAttribute("data-zoom", "in");
    await expect(frame).toHaveCSS("cursor", "zoom-in");
  });
});

// Whatever the hit test finds under a control's center and corners; clip-path hides the photo from it.
async function photoUnder(page: Page) {
  return page.evaluate(() => {
    const image = document.querySelector(
      '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-image',
    );
    if (!image) throw new Error("Missing photo");
    return [
      ...document.querySelectorAll(
        ".re-lightbox-toolbar .re-lightbox-button, .re-lightbox-counter, .re-lightbox-prev, .re-lightbox-next, .re-lightbox-caption",
      ),
    ]
      .filter((control) => {
        const rect = control.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        return [
          [rect.left + rect.width / 2, rect.top + rect.height / 2],
          [rect.left + 1, rect.top + 1],
          [rect.right - 1, rect.bottom - 1],
        ].some(([x, y]) => document.elementsFromPoint(x, y).includes(image));
      })
      .map((control) => control.className);
  });
}

const ring = (page: Page) =>
  page.evaluate(() => {
    const slide = document.querySelector(
      '.re-lightbox-slide[aria-hidden="false"]',
    ) as HTMLElement;
    const after = getComputedStyle(slide, "::after");
    return { shadow: after.boxShadow, opacity: after.opacity };
  });

test.describe("lightbox tall photos in the default theme", {
  tag: "@desktop",
}, () => {
  for (const dir of ["ltr", "rtl"])
    test(`a tall photo scrolls in a ringed window that no control and no caption covers, and zoom opens it to the screen (${dir})`, async ({
      page,
    }) => {
      await open(
        page,
        [
          [2560, 8045],
          [800, 600],
        ],
        { styles: ["lightbox/base.css", "lightbox/theme.css"], dir },
      );
      await expect(page.locator(".re-lightbox-caption")).toHaveText("Photo 1");
      expect(await photoUnder(page)).toEqual([]);
      await expect.poll(async () => (await ring(page)).opacity).toBe("1");
      expect((await ring(page)).shadow).toContain("inset");
      const top = (await state(page)).zoom.y;
      for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowDown");
      await still(page);
      expect((await state(page)).zoom.y).toBeLessThan(top - 100);
      expect(await photoUnder(page)).toEqual([]);
      await page.locator(".re-lightbox-zoom").click();
      await still(page);
      expect((await state(page)).zoom.scale).toBeLessThan(1);
      expect(await photoUnder(page)).toEqual([]);
      await expect.poll(async () => (await ring(page)).opacity).toBe("0");
      await page.locator(".re-lightbox-zoom").click();
      await still(page);
      expect((await state(page)).zoom.scale).toBe(1);
      await expect.poll(async () => (await ring(page)).opacity).toBe("1");
      await page.evaluate(() =>
        (
          window as unknown as {
            lightbox: { zoomTo(scale: number): void };
          }
        ).lightbox.zoomTo(3),
      );
      await still(page);
      await expect(
        page.locator('.re-lightbox-slide[aria-hidden="false"]'),
      ).toHaveCSS("clip-path", "inset(0px)");
      await page.keyboard.press("ArrowRight");
      await expect.poll(async () => (await state(page)).index).toBe(0);
    });

  test("with reduced motion the window and its ring change at once", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, [[2560, 8045]], {
      styles: ["lightbox/base.css", "lightbox/theme.css"],
    });
    const slide = page.locator('.re-lightbox-slide[aria-hidden="false"]');
    await expect(slide).toHaveAttribute("data-framed", "rest");
    await expect(slide).toHaveCSS("transition-duration", "0s");
    expect(
      await slide.evaluate(
        (element) => getComputedStyle(element, "::after").transitionDuration,
      ),
    ).toBe("0s");
  });
});

type Built = { src: string; width?: number; height?: number };

async function openBuilt(page: Page, build: () => Promise<Built[]>) {
  await mount(
    page,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    ["lightbox/base.css", "lightbox/theme.css"],
  );
  const items = await page.evaluate(build);
  await page.evaluate(async (list) => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const lightbox = createLightbox({ history: false });
    Object.assign(window, { lightbox });
    lightbox.open(list, 0);
  }, items);
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  await expect(page.locator(".re-lightbox-frame[data-loading]")).toHaveCount(0);
}

const shownFrame = (page: Page) =>
  page.locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame');

async function next(page: Page) {
  const index = (await state(page)).index;
  await page.evaluate(() =>
    (window as Window & { lightbox: { next(): void } }).lightbox.next(),
  );
  await expect.poll(async () => (await state(page)).index).toBe(index + 1);
  await still(page);
  await expect(shownFrame(page)).not.toHaveAttribute("data-loading");
}

// The color on screen, read from a screenshot of a 2x2 clip around the point.
async function pixel(page: Page, x: number, y: number) {
  const shot = await page.screenshot({
    clip: { x: Math.round(x) - 1, y: Math.round(y) - 1, width: 2, height: 2 },
    scale: "css",
  });
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(
      new Blob([bytes], { type: "image/png" }),
    );
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.drawImage(bitmap, 0, 0);
    return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
  }, shot.toString("base64"));
}

test.describe("lightbox transparent and vector files", {
  tag: "@desktop",
}, () => {
  test("a PNG's transparent area shows --re-lightbox-media-background under the photo only, and a JPEG frame gets none", async ({
    page,
  }) => {
    await openBuilt(page, async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 600;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      context.fillStyle = "#345";
      context.fillRect(0, 0, 400, 600);
      const blob = (type: string) =>
        new Promise<Blob>((resolve) =>
          canvas.toBlob((file) => resolve(file as Blob), type),
        );
      return [
        canvas.toDataURL("image/png"),
        URL.createObjectURL(await blob("image/png")),
        URL.createObjectURL(await blob("image/jpeg")),
      ].map((src) => ({ src, width: 800, height: 600 }));
    });
    const backing = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.background = "var(--re-lightbox-media-background)";
      document.querySelector(".re-lightbox")?.append(probe);
      const [r, g, b] = (
        getComputedStyle(probe).backgroundColor.match(/\d+/g) ?? []
      ).map(Number);
      probe.remove();
      return [r, g, b];
    });
    await expect(shownFrame(page)).toHaveAttribute("data-transparent", "true");
    const box = await photo(page);
    const middle = box.y + box.height / 2;
    expect(await pixel(page, box.x + box.width * 0.75, middle)).toEqual(
      backing,
    );
    expect(await pixel(page, box.x + box.width * 0.25, middle)).toEqual([
      0x33, 0x44, 0x55,
    ]);
    expect(await pixel(page, box.x - 8, middle)).not.toEqual(backing);
    await next(page);
    await expect(shownFrame(page)).toHaveAttribute("data-transparent", "true");
    await next(page);
    await expect(shownFrame(page)).not.toHaveAttribute("data-transparent");
    expect(
      await shownFrame(page).evaluate(
        (frame) => getComputedStyle(frame).backgroundColor,
      ),
    ).toBe("rgba(0, 0, 0, 0)");
  });

  test("an SVG with only a viewBox takes its size from it, 800x400 and a blob: 400x800 (browsers decode 300x150 and 75x150), and the blob: one zooms by the vector rule", async ({
    page,
  }) => {
    await openBuilt(page, async () => {
      const svg = (width: number, height: number) =>
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#c96"/></svg>`;
      return [
        { src: `data:image/svg+xml,${encodeURIComponent(svg(800, 400))}` },
        {
          src: URL.createObjectURL(
            new Blob([svg(400, 800)], { type: "image/svg+xml" }),
          ),
        },
      ];
    });
    let box = await photo(page);
    expect([Math.round(box.width), Math.round(box.height)]).toEqual([800, 400]);
    await expect(shownFrame(page)).toHaveAttribute("data-transparent", "true");
    await next(page);
    box = await photo(page);
    expect([Math.round(box.width), Math.round(box.height)]).toEqual([400, 800]);
    await expect(shownFrame(page)).toHaveAttribute("data-transparent", "true");
    await page.evaluate(() =>
      (
        window as Window & { lightbox: { zoomTo(scale: number): void } }
      ).lightbox.zoomTo(4),
    );
    await still(page);
    expect((await state(page)).zoom.scale).toBe(4);
  });
});
