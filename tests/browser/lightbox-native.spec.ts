import { expect, type Page, test } from "@playwright/test";
import { mount, touchDrag } from "./harness";

type Lightbox = {
  getState(): {
    index: number;
    isAnimating: boolean;
    zoom: { scale: number; x: number; y: number };
  };
  zoomTo(scale: number): void;
};
type Records = {
  contextmenu: boolean[];
  dragstart: boolean[];
  keydown: boolean[];
  writes: { types: string[]; png?: { type: string; width: number } }[];
  vibrate: unknown[];
};
type Window = typeof globalThis & { lightbox: Lightbox; records: Records };

async function open(page: Page, options: Record<string, unknown> = {}) {
  await mount(
    page,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    ["lightbox/base.css", "lightbox/theme.css"],
  );
  await page.evaluate(async (options) => {
    const records: Records = {
      contextmenu: [],
      dragstart: [],
      keydown: [],
      writes: [],
      vibrate: [],
    };
    Object.assign(window, { records });
    for (const type of ["contextmenu", "dragstart", "keydown"] as const)
      window.addEventListener(type, (event) => {
        if (type === "keydown" && (event as KeyboardEvent).key !== "c") return;
        records[type].push(event.defaultPrevented);
      });
    const sources: string[] = [];
    for (const color of ["#345", "#c96"]) {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1200;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      context.fillStyle = color;
      context.fillRect(0, 0, 1600, 1200);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8),
      );
      sources.push(URL.createObjectURL(blob as Blob));
    }
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const lightbox = createLightbox({ history: false, ...options });
    Object.assign(window, { lightbox });
    lightbox.open(
      sources.map((src) => ({ src, width: 1600, height: 1200 })),
      0,
    );
  }, options);
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  await expect(page.locator(".re-lightbox-frame[data-loading]")).toHaveCount(0);
}

const records = (page: Page) => page.evaluate(() => (window as Window).records);

const photo = (page: Page) =>
  page.locator(".re-lightbox-slide").first().locator(".re-lightbox-image");

async function center(page: Page) {
  const box = await photo(page).boundingBox();
  if (!box) throw new Error("The photo has no box.");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function mouseDrag(page: Page) {
  const from = await center(page);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let step = 1; step <= 10; step++)
    await page.mouse.move(from.x + step * 20, from.y + step * 4);
  await page.mouse.up();
}

async function zoom(page: Page, scale: number) {
  await page.evaluate(
    (scale) => (window as Window).lightbox.zoomTo(scale),
    scale,
  );
  await expect
    .poll(() =>
      page.evaluate(() => {
        const state = (window as Window).lightbox.getState();
        return !state.isAnimating && state.zoom.scale;
      }),
    )
    .toBe(scale);
}

// Chromium and Firefox start no file drag from a captured pointer, WebKit does and the lightbox prevents it.
// Playwright's WebKit loses the next mousedown after a file drag, so the zoomed drag goes first.
async function zoomedThenFitDrag(page: Page) {
  await zoom(page, 1.4);
  await mouseDrag(page);
  expect((await records(page)).dragstart).not.toContain(false);
  expect(
    await page.evaluate(() => (window as Window).lightbox.getState().zoom.x),
  ).toBeGreaterThan(20);
  expect(
    await photo(page).evaluate((image) => {
      const event = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      image.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(true);
  await zoom(page, 1);
  await mouseDrag(page);
  const { dragstart } = await records(page);
  expect(dragstart.at(-1)).toBe(false);
  expect(dragstart.filter((prevented) => !prevented)).toHaveLength(1);
  expect(
    await page.evaluate(() => (window as Window).lightbox.getState().index),
  ).toBe(0);
}

// The test origin is not a secure context, so the page has neither ClipboardItem nor navigator.clipboard.
function stubClipboard(page: Page) {
  return page.evaluate(() => {
    const { records } = window as Window;
    class Item {
      static supports = (type: string) => type === "image/png";
      readonly types: string[];
      constructor(readonly entries: Record<string, Promise<Blob>>) {
        this.types = Object.keys(entries);
      }
      getType(type: string) {
        return this.entries[type];
      }
    }
    Object.assign(window, { ClipboardItem: Item });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        async write(items: ClipboardItem[]) {
          for (const item of items) {
            const entry: Records["writes"][number] = { types: [...item.types] };
            records.writes.push(entry);
            const blob = await item.getType("image/png");
            entry.png = {
              type: blob.type,
              width: (await createImageBitmap(blob)).width,
            };
          }
        },
      },
    });
  });
}

test.describe("lightbox native photo handling", () => {
  test("the photo is a draggable img with its source whose context menu stays the browser's", async ({
    page,
  }) => {
    await open(page);
    await expect(photo(page)).toHaveAttribute("src", /^blob:/);
    expect(
      await photo(page).evaluate((image: HTMLImageElement) => image.draggable),
    ).toBe(true);
    const point = await center(page);
    await page.mouse.click(point.x, point.y, { button: "right" });
    expect((await records(page)).contextmenu).toEqual([false]);
  });

  test("protect turns off the context menu, the drag and the copy key", async ({
    page,
  }) => {
    await open(page, { protect: true });
    await expect(page.locator("dialog")).toHaveAttribute("data-protect", "");
    expect(
      await photo(page).evaluate((image: HTMLImageElement) => image.draggable),
    ).toBe(false);
    const point = await center(page);
    await page.mouse.click(point.x, point.y, { button: "right" });
    await stubClipboard(page);
    await page.keyboard.press("Control+c");
    await mouseDrag(page);
    const dispatched = await photo(page).evaluate((image) => {
      const event = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      image.dispatchEvent(event);
      return event.defaultPrevented;
    });
    const seen = await records(page);
    expect(seen.contextmenu).toEqual([true]);
    expect(seen.keydown.at(-1)).toBe(false);
    expect(seen.writes).toEqual([]);
    expect(dispatched).toBe(true);
    expect(seen.dragstart.filter((prevented) => !prevented)).toEqual([]);
  });

  test("a zoomed mouse drag on the photo pans, and one at fit starts the browser's file drag and does not page", async ({
    page,
  }) => {
    await open(page);
    await zoomedThenFitDrag(page);
  });

  test("Ctrl+C writes the shown photo to the clipboard as an image/png at its natural size", async ({
    page,
  }) => {
    await open(page);
    await stubClipboard(page);
    await page.keyboard.press("Control+c");
    await expect
      .poll(async () => (await records(page)).writes)
      .toEqual([
        { types: ["image/png"], png: { type: "image/png", width: 1600 } },
      ]);
    expect((await records(page)).keydown).toEqual([true]);
  });

  test("Ctrl+C is left to the browser without ClipboardItem", async ({
    page,
  }) => {
    await open(page);
    await stubClipboard(page);
    await page.evaluate(() => {
      Reflect.deleteProperty(window, "ClipboardItem");
    });
    await page.keyboard.press("Control+c");
    const seen = await records(page);
    expect(seen.keydown).toEqual([false]);
    expect(seen.writes).toEqual([]);
  });
});

test.describe("lightbox native drag across engines", {
  tag: "@desktop",
}, () => {
  test("a zoomed mouse drag on the photo pans with no file drag, and one at fit starts the file drag", async ({
    page,
  }) => {
    await open(page);
    await zoomedThenFitDrag(page);
  });
});

test.describe("lightbox dismiss vibration", { tag: "@touch" }, () => {
  test("a dismiss drag vibrates once when it first passes 120px, also when it goes back and passes again", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => {
      const { records } = window as Window;
      Object.defineProperty(navigator, "vibrate", {
        configurable: true,
        value: (pattern: unknown) => {
          records.vibrate.push(pattern);
          return true;
        },
      });
    });
    const { x, y } = await center(page);
    await touchDrag(
      page,
      [
        { x, y: y - 150 },
        { x, y: y + 10 },
        { x, y: y - 100 },
        { x, y: y + 30 },
        { x, y: y - 140 },
      ],
      2500,
    );
    expect((await records(page)).vibrate).toEqual([10]);
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  });
});
