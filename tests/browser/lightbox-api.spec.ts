import { expect, type Page, test } from "@playwright/test";
import { mount, photo } from "./harness";

type Window = globalThis.Window &
  typeof globalThis & {
    lightbox: {
      open(items: unknown[], index?: number): void;
      close(): Promise<void>;
      next(): void;
      append(items: unknown[]): void;
      setOptions(options: { loop?: boolean }): void;
      getState(): { index: number; count: number; isOpen: boolean };
    };
    destroyed: number;
  };

async function open(
  page: Page,
  count: number,
  index: number,
  options: Record<string, unknown> = {},
) {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(
    async ([total, start, extra]) => {
      const { createLightbox } = await import("/modules/lightbox/index.js");
      const photo = (i: number) =>
        `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="hsl(${i * 47} 60% 55%)"/></svg>`)}`;
      const items = (from: number, length: number) =>
        Array.from({ length }, (_, i) => ({
          src: photo(from + i),
          width: 1200,
          height: 800,
          alt: `Photo ${from + i + 1}`,
        }));
      const lightbox = createLightbox(extra);
      Object.assign(window, { lightbox, items });
      lightbox.open(items(0, total), start);
    },
    [count, index, options] as const,
  );
  await page.waitForTimeout(400);
}

const current = (page: Page) =>
  page.locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame');

test("loop pages from the last photo to the first, and turning it off disables next", async ({
  page,
}) => {
  await open(page, 3, 2, { loop: true });
  await page.evaluate(() => (window as Window).lightbox.next());
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window).lightbox.getState().index),
    )
    .toBe(0);
  await page.waitForTimeout(700);
  const box = await current(page).boundingBox();
  expect(box && box.x > 0 && box.x + box.width < 1000).toBe(true);
  await expect(page.getByRole("button", { name: "Next image" })).toBeEnabled();
  await page.evaluate(() => (window as Window).lightbox.next());
  await page.evaluate(() => (window as Window).lightbox.next());
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window).lightbox.getState().index),
    )
    .toBe(2);
  await page.evaluate(() =>
    (window as Window).lightbox.setOptions({ loop: false }),
  );
  await expect(page.getByRole("button", { name: "Next image" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Previous image" }),
  ).toBeEnabled();
});

test("append keeps the current photo where it is and counts the new ones", async ({
  page,
}) => {
  await open(page, 10, 4);
  const before = await current(page).boundingBox();
  await page.evaluate(() => {
    const { lightbox, items } = window as Window & {
      items: (from: number, length: number) => unknown[];
    };
    lightbox.append(items(10, 10));
  });
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(() => (window as Window).lightbox.getState()),
  ).toMatchObject({ index: 4, count: 20 });
  await expect(page.locator(".re-lightbox-counter")).toHaveText("5 / 20");
  expect(await current(page).boundingBox()).toEqual(before);
});

test("a toolbarEnd slot button shows, takes focus by Tab, hides with the controls and is destroyed once", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(async (src) => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    Object.assign(window, { destroyed: 0 });
    const lightbox = createLightbox({
      history: false,
      slots: {
        toolbarEnd: ({ document }) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "re-lightbox-button";
          button.textContent = "S";
          button.setAttribute("aria-label", "Share");
          return {
            node: button,
            destroy: () => {
              (window as Window).destroyed++;
            },
          };
        },
      },
    });
    Object.assign(window, { lightbox });
    lightbox.open([{ src, width: 1200, height: 800 }]);
  }, photo(1));
  const share = page.getByRole("button", { name: "Share" });
  await expect(share).toBeVisible();
  await page.getByRole("button", { name: "Zoom in" }).focus();
  await page.keyboard.press("Tab");
  await expect(share).toBeFocused();
  await page.locator("dialog").evaluate((dialog) => {
    dialog.dataset.chrome = "hidden";
  });
  expect(
    await share.evaluate((button) =>
      button.checkVisibility({ opacityProperty: true }),
    ),
  ).toBe(false);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toHaveCount(0);
  await page.evaluate(() => (window as Window).lightbox.open([{ src: "x" }]));
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => (window as Window).destroyed)).toBe(2);
});

test("Back closes the lightbox without leaving the page, and a close removes the entry", async ({
  page,
}) => {
  await open(page, 3, 0);
  await page.evaluate(() => Object.assign(window, { marker: true }));
  const length = await page.evaluate(() => history.length);
  const url = page.url();
  await page.goBack();
  await expect(page.locator("dialog")).toHaveCount(0);
  expect(page.url()).toBe(url);
  await page.evaluate(() =>
    (
      window as Window & { items: (from: number, length: number) => unknown[] }
    ).lightbox.open(
      (
        window as Window & {
          items: (from: number, length: number) => unknown[];
        }
      ).items(0, 3),
    ),
  );
  await expect(page.locator("dialog[open]")).toHaveCount(1);
  await page.getByRole("button", { name: "Close gallery" }).click();
  await expect(page.locator("dialog")).toHaveCount(0);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => history.length)).toBe(length);
  expect(page.url()).toBe(url);
  expect(
    await page.evaluate(
      () => "marker" in window && !history.state?.reuseLightbox,
    ),
  ).toBe(true);
});

test("close resolves after its history entry is gone, so a navigation right after it stays", async ({
  page,
}) => {
  await open(page, 3, 0);
  await page.evaluate(async () => {
    await (window as Window).lightbox.close();
    history.pushState(null, "", "/next");
  });
  await page.waitForTimeout(500);
  expect(new URL(page.url()).pathname).toBe("/next");
});

test("a viewer opened during another's close flight leaves no history entry behind", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(async (src) => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const items = [0, 1].map(() => ({ src, width: 1200, height: 800 }));
    const a = createLightbox();
    const b = createLightbox();
    await new Promise<void>((resolve) => {
      const stop = a.on("opened", () => {
        stop();
        resolve();
      });
      a.open(items, 0);
    });
    const closing = a.close();
    b.open(items, 0);
    await closing;
    await b.close();
  }, photo(1));
  expect(
    await page.evaluate(() => JSON.stringify(history.state)),
  ).not.toContain("reuseLightbox");
});

test("a viewer destroyed under another one leaves no history entry behind", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(async (src) => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const items = [0, 1].map(() => ({ src, width: 1200, height: 800 }));
    const a = createLightbox();
    const b = createLightbox();
    a.open(items, 0);
    b.open(items, 0);
    a.destroy();
    await b.close();
  }, photo(1));
  expect(
    await page.evaluate(() => JSON.stringify(history.state)),
  ).not.toContain("reuseLightbox");
});

test("with two photos in a loop, previous moves the strip backward", async ({
  page,
}) => {
  await open(page, 2, 0, { loop: true });
  await page.waitForTimeout(300);
  const start = await page.evaluate(
    () => document.querySelector(".re-lightbox-viewport")?.scrollLeft ?? 0,
  );
  await page.evaluate(() =>
    (window as Window & { lightbox: { prev(): void } }).lightbox.prev(),
  );
  await page.waitForTimeout(100);
  const moving = await page.evaluate(
    () => document.querySelector(".re-lightbox-viewport")?.scrollLeft ?? 0,
  );
  expect(moving).toBeLessThan(start);
});

test("in RTL an aside keeps the arrow and the footer beside it, and the active thumbnail is centered", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(() =>
    document.documentElement.setAttribute("dir", "rtl"),
  );
  await page.evaluate(async (src) => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const lightbox = createLightbox({
      history: false,
      thumbnails: "bottom",
      slots: {
        aside: ({ document }) => ({ node: document.createElement("p") }),
      },
    });
    lightbox.open(
      Array.from({ length: 40 }, () => ({
        src,
        previewSrc: src,
        width: 1200,
        height: 800,
      })),
      25,
    );
  }, photo(3));
  await page.waitForTimeout(400);
  const aside = await page.locator(".re-lightbox-aside").boundingBox();
  const next = await page.locator(".re-lightbox-next").boundingBox();
  const footer = await page.locator(".re-lightbox-footer").boundingBox();
  const strip = await page.locator(".re-lightbox-thumbnails").boundingBox();
  const thumb = await page
    .locator('.re-lightbox-thumbnails [aria-current="true"]')
    .boundingBox();
  if (!aside || !next || !footer || !strip || !thumb)
    throw new Error("Missing part");
  const outside = (box: { x: number; width: number }) =>
    box.x + box.width <= aside.x || box.x >= aside.x + aside.width;
  expect(next.x - (aside.x + aside.width)).toBeCloseTo(16, 0);
  expect(outside(footer)).toBe(true);
  expect(
    Math.abs(thumb.x + thumb.width / 2 - (strip.x + strip.width / 2)),
  ).toBeLessThan(2);
});

test("inside a frame the lightbox leaves the page's history alone unless history is set", async ({
  page,
}) => {
  await mount(page, '<iframe srcdoc="<body></body>"></iframe>');
  const frame = page.frames()[1];
  const result = await frame.evaluate(async (src) => {
    const { createLightbox } = await import(
      "http://reuse.test/modules/lightbox/browser/lightbox.js"
    );
    const length = history.length;
    const lightbox = createLightbox({ duration: 0 });
    lightbox.open([{ src, width: 1200, height: 800 }]);
    const opened = history.length;
    await lightbox.close();
    return { length, opened };
  }, photo(1));
  expect(result.opened).toBe(result.length);
});
