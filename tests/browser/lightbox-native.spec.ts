import { expect, type Page, test } from "@playwright/test";
import { mount, photo as tile, touchDrag } from "./harness";

type Lightbox = {
  getState(): {
    index: number;
    isAnimating: boolean;
    zoom: { scale: number; x: number; y: number };
  };
  zoomTo(scale: number, focus?: { x: number; y: number }): void;
  on(type: "change", listener: () => void): () => void;
};
type Records = {
  contextmenu: boolean[];
  dragstart: boolean[];
  keydown: boolean[];
  writes: { types: string[]; png?: { type: string; width: number } }[];
  vibrate: unknown[];
};
type Window = typeof globalThis & { lightbox: Lightbox; records: Records };

async function open(
  page: Page,
  options: Record<string, unknown> = {},
  index = 0,
) {
  await mount(
    page,
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    ["lightbox/base.css", "lightbox/theme.css"],
  );
  await page.evaluate(
    async ([options, index]) => {
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
          if (type === "keydown" && (event as KeyboardEvent).key !== "c")
            return;
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
        index,
      );
    },
    [options, index] as const,
  );
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

const current = (page: Page) =>
  page.locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame');

// The image point at the viewport center, as a fraction of the photo's box.
async function centerPoint(page: Page) {
  const box = await current(page).boundingBox();
  const view = await page.locator(".re-lightbox-viewport").boundingBox();
  if (!box || !view) throw new Error("The photo has no box.");
  const x = view.x + view.width / 2;
  const y = view.y + view.height / 2;
  return { box, x, y, u: (x - box.x) / box.width, v: (y - box.y) / box.height };
}

test.describe("lightbox rotation", { tag: "@touch" }, () => {
  test("a rotation keeps the current photo and the zoomed point at the center, and resizes in one frame relayout once", async ({
    page,
  }) => {
    await open(page, { padding: 0 }, 1);
    await page.evaluate(() => {
      const changes: number[] = [];
      Object.assign(window, { changes });
      (window as Window).lightbox.on("change", () => changes.push(1));
    });
    await page.evaluate(() =>
      (window as Window).lightbox.zoomTo(2, { x: -60, y: 0 }),
    );
    await expect
      .poll(() =>
        page.evaluate(() => {
          const state = (window as Window).lightbox.getState();
          return !state.isAnimating && state.zoom;
        }),
      )
      .toEqual({ scale: 2, x: 60, y: 0 });
    const before = await centerPoint(page);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(async () => (await centerPoint(page)).box.width)
      .toBeCloseTo(before.box.width * (390 / 292.5), 0);
    const after = await centerPoint(page);
    expect(
      Math.abs(after.box.x + before.u * after.box.width - after.x),
    ).toBeLessThan(2);
    expect(
      Math.abs(after.box.y + before.v * after.box.height - after.y),
    ).toBeLessThan(2);
    const state = await page.evaluate(() =>
      (window as Window).lightbox.getState(),
    );
    expect(state.index).toBe(1);
    expect(state.zoom.scale).toBe(2);
    const slide = await page
      .locator('.re-lightbox-slide[aria-hidden="false"]')
      .boundingBox();
    expect(Math.abs(slide?.x ?? Number.NaN)).toBeLessThan(1);
    const relayouts = await page.evaluate(async () => {
      const viewport = document.querySelector(
        ".re-lightbox-viewport",
      ) as HTMLElement;
      const read = viewport.getBoundingClientRect;
      let count = 0;
      viewport.getBoundingClientRect = function () {
        count++;
        return read.call(this);
      };
      for (let event = 0; event < 5; event++)
        window.dispatchEvent(new Event("resize"));
      const queued = count;
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      return { queued, count };
    });
    expect(relayouts).toEqual({ queued: 0, count: 1 });
    expect(
      await page.evaluate(
        () => (window as typeof globalThis & { changes: number[] }).changes,
      ),
    ).toEqual([]);
  });
});

test.describe("lightbox documents", () => {
  test("two galleries on a scrolled page each keep the scroll and return focus to their own tile", async ({
    page,
  }) => {
    const tiles = (name: string) =>
      `<div class="${name}">${[0, 1]
        .map(
          (index) =>
            `<button type="button"><img src="${tile(index)}" alt="${name} ${index}" width="240" height="160"></button>`,
        )
        .join("")}</div>`;
    await mount(
      page,
      `<div style="height:1500px"></div>${tiles("first")}<div style="height:1500px"></div>${tiles("second")}<div style="height:1500px"></div>`,
      ["lightbox/base.css", "lightbox/theme.css"],
    );
    await page.evaluate(async () => {
      const { bindLightboxGallery } = await import(
        "/modules/lightbox/index.js"
      );
      for (const name of ["first", "second"])
        bindLightboxGallery(document.querySelector(`.${name}`) as HTMLElement, {
          history: false,
        });
    });
    for (const [name, index] of [
      ["first", 1],
      ["second", 0],
    ] as const) {
      const trigger = page.locator(`.${name} button`).nth(index);
      await trigger.scrollIntoViewIfNeeded();
      const scroll = await page.evaluate(() => window.scrollY);
      expect(scroll).toBeGreaterThan(1000);
      await trigger.click();
      await expect(page.locator("dialog")).toHaveCount(1);
      await expect(page.locator("dialog")).toHaveAttribute(
        "data-phase",
        "open",
      );
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog")).toHaveCount(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
      expect(
        await trigger.evaluate((button) => document.activeElement === button),
      ).toBe(true);
    }
  });

  const frameGallery = `<iframe style="width:640px;height:480px;border:0" srcdoc="${[
    0, 1,
  ]
    .map(
      (index) =>
        `<button type='button'><img src='${tile(index)}' alt='Frame ${index}' width='240' height='160'></button>`,
    )
    .join("")
    .replaceAll('"', "&quot;")}"></iframe>`;

  for (const from of ["frame", "parent bind", "parent container"] as const)
    test(`a lightbox in a frame, made from the ${from}, locks only the frame's scroll and returns focus there`, async ({
      page,
    }) => {
      await mount(page, frameGallery, [
        "lightbox/base.css",
        "lightbox/theme.css",
      ]);
      const frame = page.frameLocator("iframe");
      await expect(frame.locator("button")).toHaveCount(2);
      const content = page.frames()[1];
      if (from === "frame")
        await content.evaluate(async () => {
          const { bindLightboxGallery } = await import(
            "http://reuse.test/modules/lightbox/browser/lightbox.js"
          );
          bindLightboxGallery(document.body, { history: false });
        });
      else
        await page.evaluate(async (from) => {
          const { bindLightboxGallery, createLightbox, lightboxItemFromImage } =
            await import("/modules/lightbox/index.js");
          const doc = (document.querySelector("iframe") as HTMLIFrameElement)
            .contentDocument as Document;
          if (from === "parent bind") {
            bindLightboxGallery(doc.body);
            return;
          }
          const lightbox = createLightbox({ container: doc.body });
          const images = [...doc.querySelectorAll("img")];
          for (const [index, image] of images.entries())
            image.addEventListener("click", () =>
              lightbox.open(
                images.map((image) => lightboxItemFromImage(image)),
                index,
              ),
            );
        }, from);
      const page_ = () =>
        page.evaluate(() => ({
          overflow: document.body.style.overflow,
          gap: document.documentElement.style.getPropertyValue(
            "--re-scrollbar-gap",
          ),
        }));
      const inFrame = () =>
        content.evaluate(() => document.body.style.overflow);
      await frame.locator("button").nth(1).click();
      await expect(frame.locator("dialog")).toHaveAttribute(
        "data-phase",
        "open",
      );
      await expect(page.locator("dialog")).toHaveCount(0);
      expect(await page_()).toEqual({ overflow: "", gap: "" });
      expect(await inFrame()).toBe("hidden");
      await page.keyboard.press("Escape");
      await expect(frame.locator("dialog")).toHaveCount(0);
      expect(await page_()).toEqual({ overflow: "", gap: "" });
      expect(await inFrame()).toBe("");
      expect(
        await content.evaluate(
          () =>
            document.activeElement === document.querySelectorAll("button")[1],
        ),
      ).toBe(true);
    });
});
