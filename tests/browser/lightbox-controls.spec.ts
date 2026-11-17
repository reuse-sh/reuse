import { expect, type Page, test } from "@playwright/test";
import { mount } from "./harness";

type Lightbox = {
  open(items: unknown[], index?: number): void;
  next(): void;
  goTo(index: number): void;
  zoomTo(scale: number): void;
  getState(): { index: number; isOpen: boolean; zoom: { scale: number } };
  on(type: string, listener: (event: { index: number }) => void): () => void;
};
type Window = typeof globalThis & { lightbox: Lightbox; changes: number[] };

async function open(
  page: Page,
  options: Record<string, unknown>,
  {
    count = 5,
    index = 0,
    captions = false,
    srcset = false,
    slots = false,
  } = {},
) {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(
    async ([extra, total, start, captioned, widths, slotted]) => {
      const { createLightbox } = await import("/modules/lightbox/index.js");
      const photo = (i: number) =>
        `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="hsl(${i * 47} 60% 55%)"/></svg>`)}`;
      const slots = slotted
        ? {
            toolbarStart: ({ document }: { document: Document }) => {
              const node = document.createElement("span");
              node.className = "start-slot";
              return { node };
            },
            toolbarEnd: ({ document }: { document: Document }) => {
              const node = document.createElement("button");
              node.className = "re-lightbox-button end-slot";
              return { node };
            },
          }
        : undefined;
      const lightbox = createLightbox({ history: false, slots, ...extra });
      const changes: number[] = [];
      lightbox.on("change", () => changes.push(performance.now()));
      Object.assign(window, { lightbox, changes });
      lightbox.open(
        Array.from({ length: total }, (_, i) => ({
          src: photo(i),
          srcset: widths
            ? `${photo(i)} 600w, https://cdn.test/photo-${i}-2400.jpg 2400w, https://cdn.test/photo-${i}-1200.jpg 1200w`
            : undefined,
          previewSrc: photo(i),
          width: 1200,
          height: 800,
          caption: captioned ? `Caption ${i + 1}` : undefined,
        })),
        start,
      );
    },
    [options, count, index, captions, srcset, slots] as const,
  );
  await page.waitForTimeout(500);
}

const lightbox = (page: Page) =>
  page.evaluate(() => (window as Window).lightbox.getState());

const controls = [
  "close",
  "prev",
  "next",
  "counter",
  "zoom",
  "fullscreen",
  "download",
  "slideshow",
];

test("every control turned off is neither in the DOM nor in the tab order", async ({
  page,
}) => {
  await open(page, {
    controls: { close: false, arrows: false, counter: false, zoom: false },
  });
  for (const name of controls)
    await expect(page.locator(`.re-lightbox-${name}`)).toHaveCount(0);
  const reached = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    reached.add(
      await page.evaluate(() => document.activeElement?.className ?? ""),
    );
  }
  expect(
    [...reached]
      .filter(Boolean)
      .every((name) => /re-lightbox-viewport/.test(name)),
  ).toBe(true);
  expect(await lightbox(page)).toMatchObject({ isOpen: true });
});

test("the controls sit in their corners in a fixed order", async ({ page }) => {
  await open(
    page,
    { controls: { fullscreen: true, download: true, slideshow: true } },
    { srcset: true, slots: true },
  );
  const order = await page.evaluate(() => ({
    start: [
      ...(document.querySelector(".re-lightbox-toolbar-start")?.children ?? []),
    ].map((element) => element.className),
    end: [
      ...(document.querySelector(".re-lightbox-toolbar-end")?.children ?? []),
    ].map((element) => element.className.replace("re-lightbox-button ", "")),
  }));
  expect(order).toEqual({
    start: ["re-lightbox-counter", "start-slot"],
    end: [
      "re-lightbox-zoom",
      "re-lightbox-slideshow",
      "re-lightbox-fullscreen",
      "re-lightbox-download",
      "end-slot",
      "re-lightbox-close",
    ],
  });
  await expect(page.locator(".re-lightbox-download")).toHaveAttribute(
    "href",
    "https://cdn.test/photo-0-2400.jpg",
  );
  await page.evaluate(() => (window as Window).lightbox.next());
  await expect(page.locator(".re-lightbox-download")).toHaveAttribute(
    "href",
    "https://cdn.test/photo-1-2400.jpg",
  );
});

test("the fullscreen button toggles the viewer's stage, and leaving fullscreen keeps it open", async ({
  page,
}) => {
  await open(page, { controls: { fullscreen: true } });
  const button = page.locator(".re-lightbox-fullscreen");
  await expect(button).toHaveAttribute("aria-label", "Enter full screen");
  await button.click();
  await expect
    .poll(() =>
      page.evaluate(() => document.fullscreenElement?.className ?? ""),
    )
    .toBe("re-lightbox-stage");
  await expect(button).toHaveAttribute("aria-label", "Exit full screen");
  await page.evaluate(() => document.exitFullscreen());
  await expect(button).toHaveAttribute("aria-label", "Enter full screen");
  expect(await lightbox(page)).toMatchObject({ isOpen: true });
});

test("without the Fullscreen API there is no fullscreen button", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(Document.prototype, "fullscreenEnabled", {
      get: () => false,
    }),
  );
  await open(page, { controls: { fullscreen: true } });
  await expect(page.locator(".re-lightbox-fullscreen")).toHaveCount(0);
});

test("a side column sits at the end edge, left in RTL, and turns into the bottom strip at 700px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(() =>
    document.documentElement.setAttribute("dir", "rtl"),
  );
  await page.evaluate(async () => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const lightbox = createLightbox({ history: false, thumbnails: "side" });
    lightbox.open(
      Array.from({ length: 12 }, () => ({
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'/%3E",
        width: 1200,
        height: 800,
      })),
    );
  });
  await page.waitForTimeout(400);
  const strip = page.locator(".re-lightbox-thumbnails");
  const column = await strip.boundingBox();
  if (!column) throw new Error("No strip");
  expect(column.x).toBeLessThan(100);
  expect(column.height).toBeGreaterThan(column.width * 4);
  await page.setViewportSize({ width: 700, height: 700 });
  await expect(
    page.locator(".re-lightbox-footer .re-lightbox-thumbnails"),
  ).toHaveCount(1);
  const row = await strip.boundingBox();
  if (!row) throw new Error("No strip");
  expect(row.width).toBeGreaterThan(row.height * 4);
  expect(row.y).toBeGreaterThan(500);
});

const offCenter = (page: Page) =>
  page.evaluate(() => {
    const strip = document.querySelector(".re-lightbox-thumbnails");
    const thumb = strip?.querySelector('[aria-current="true"]');
    if (!strip || !thumb) return Number.NaN;
    const a = strip.getBoundingClientRect();
    const b = thumb.getBoundingClientRect();
    return Math.abs(b.left + b.width / 2 - (a.left + a.width / 2));
  });

test("the active thumbnail stays centered from the first photo to the fortieth", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { thumbnails: "bottom" }, { count: 40 });
  for (let index = 0; index < 40; index++) {
    if (index) await page.evaluate(() => (window as Window).lightbox.next());
    await expect.poll(() => offCenter(page)).toBeLessThanOrEqual(2);
  }
});

test("a click on thumbnail 38 fades there and the strip ends with 38 centered", async ({
  page,
}) => {
  await open(page, { thumbnails: "bottom" }, { count: 40 });
  const opacities = page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const viewport = document.querySelector(".re-lightbox-viewport");
        const seen: number[] = [];
        const start = performance.now();
        const tick = () => {
          if (viewport) seen.push(Number(getComputedStyle(viewport).opacity));
          if (performance.now() - start < 800) requestAnimationFrame(tick);
          else resolve(seen);
        };
        requestAnimationFrame(tick);
      }),
  );
  await page.getByRole("button", { name: "Show image 38" }).click();
  expect(Math.min(...(await opacities))).toBeLessThan(0.5);
  expect((await lightbox(page)).index).toBe(37);
  await expect.poll(() => offCenter(page)).toBeLessThanOrEqual(2);
});

test("the strip is one tab stop: Tab reaches the active thumbnail, arrows move focus, Enter opens", async ({
  page,
}) => {
  await open(page, { thumbnails: "bottom" }, { count: 8, index: 2 });
  const focused = () =>
    page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  for (let i = 0; i < 8 && (await focused()) !== "Show image 3"; i++)
    await page.keyboard.press("Tab");
  expect(await focused()).toBe("Show image 3");
  await page.keyboard.press("ArrowRight");
  expect(await focused()).toBe("Show image 4");
  expect((await lightbox(page)).index).toBe(2);
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await lightbox(page)).index).toBe(3);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  expect(await focused()).toBe("Show image 4");
});

test("a side caption panel at 1280px never covers the photo", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, { caption: "side" }, { captions: true });
  const aside = await page.locator(".re-lightbox-aside").boundingBox();
  const photo = await page
    .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
    .boundingBox();
  if (!aside || !photo) throw new Error("Missing part");
  expect(photo.x + photo.width).toBeLessThanOrEqual(aside.x);
  // The panel exists from the first frame, so the open flight runs to its end.
  expect(
    await page.evaluate(() =>
      [
        ".re-lightbox-backdrop",
        '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
      ].map(
        (selector) =>
          getComputedStyle(document.querySelector(selector) as Element).opacity,
      ),
    ),
  ).toEqual(["1", "1"]);
  await expect(
    page.locator(".re-lightbox-aside .re-lightbox-caption"),
  ).toHaveText("Caption 1");
});

test("a 1000ms slideshow stops for a zoom at 500ms and moves on 500ms after the zoom ends", async ({
  page,
}) => {
  await open(page, {
    controls: { slideshow: true },
    slideshow: { interval: 1000 },
  });
  const button = page.locator(".re-lightbox-slideshow");
  await button.evaluate((element: HTMLElement) => element.click());
  await expect(button).toHaveAttribute("aria-label", "Stop slideshow");
  await page.waitForTimeout(500);
  await page.evaluate(() => (window as Window).lightbox.zoomTo(2));
  await page.waitForTimeout(1200);
  expect((await lightbox(page)).index).toBe(0);
  const resumed = await page.evaluate(() => {
    (window as Window).lightbox.zoomTo(1);
    return performance.now();
  });
  await expect.poll(async () => (await lightbox(page)).index).toBe(1);
  const changed = await page.evaluate(() => (window as Window).changes[0]);
  expect(changed - resumed).toBeGreaterThan(380);
  expect(changed - resumed).toBeLessThan(700);
});

test("the slideshow waits while the mouse is over the controls", async ({
  page,
}) => {
  await open(page, {
    controls: { slideshow: true },
    slideshow: { interval: 600 },
  });
  await page.locator(".re-lightbox-slideshow").click();
  await page.waitForTimeout(1000);
  expect((await lightbox(page)).index).toBe(0);
  await page.mouse.move(500, 350);
  await expect.poll(async () => (await lightbox(page)).index).toBe(1);
});

test("the last photo without loop goes back to the first, at once under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(
    page,
    { controls: { slideshow: true }, slideshow: { interval: 300 } },
    { count: 3, index: 2 },
  );
  await page
    .locator(".re-lightbox-slideshow")
    .evaluate((element: HTMLElement) => element.click());
  await expect.poll(async () => (await lightbox(page)).index).toBe(0);
  expect(
    await page.evaluate(() =>
      document
        .querySelector<HTMLElement>(".re-lightbox-slideshow")
        ?.style.getPropertyValue("--re-lightbox-slideshow-progress"),
    ),
  ).toBe("0");
});
