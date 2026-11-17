import { expect, type Page, test } from "@playwright/test";
import { mount, photo } from "./harness";

type Box = { x: number; y: number; width: number; height: number };
type Landing = {
  frame: Box;
  frameOpacity: number;
  copy: Box | null;
  copyClip: string | null;
};
type Lightbox = {
  open(items: unknown[], index?: number): void;
  close(): Promise<void>;
  next(): void;
  goTo(index: number): void;
  getState(): { index: number; isOpen: boolean };
  on(type: string, listener: () => void): () => void;
};
type Carousel = {
  getState(): { index: number; isPlaying: boolean };
  pause(): void;
};
type Window = typeof globalThis & {
  lightbox: Lightbox;
  carousel: Carousel;
  tiles: HTMLElement[];
  closing?: Promise<void>;
};

const styles = [
  "lightbox/base.css",
  "lightbox/theme.css",
  "carousel/styles.css",
];
const tiles = (count: number) =>
  Array.from(
    { length: count },
    (_, index) =>
      `<a class="tile" href="${photo(index)}" data-carousel-slide style="flex:0 0 300px"><img src="${photo(index)}" alt="Photo ${index + 1}" style="display:block;width:300px;height:200px"></a>`,
  ).join("");

async function stripPage(page: Page, carousel: Record<string, unknown> = {}) {
  await mount(
    page,
    `<div id="strip" style="width:300px;margin:100px 0 0 100px;--re-carousel-gap:0px">${tiles(6)}</div>`,
    styles,
  );
  await page.evaluate(async (options) => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const { connectCarousel } = await import("/modules/lightbox/carousel.js");
    const strip = document.getElementById("strip") as HTMLElement;
    const images = [...strip.querySelectorAll("img")];
    const carousel = createCarousel(strip, options);
    const lightbox = createLightbox({ history: false, autoHide: false });
    connectCarousel(lightbox, carousel);
    Object.assign(window, { carousel, lightbox, tiles: images });
    Object.assign(window, {
      items: images.map((image) => ({
        src: image.src,
        width: 1200,
        height: 800,
        alt: image.alt,
        origin: () => image,
      })),
    });
  }, carousel);
}

async function openAt(page: Page, index: number) {
  await page.evaluate(
    (start) =>
      new Promise<void>((resolve) => {
        const { lightbox, items } = window as Window & { items: unknown[] };
        const stop = lightbox.on("opened", () => {
          stop();
          resolve();
        });
        lightbox.open(items, start);
      }),
    index,
  );
}

async function closeAtLastFrame(page: Page): Promise<Landing> {
  return page.evaluate(() => {
    const win = window as Window;
    win.closing = win.lightbox.close();
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = Number(
        animation.effect?.getComputedTiming().endTime ?? 0,
      );
    }
    const box = (element: Element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    const frame = document.querySelector(
      '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
    ) as HTMLElement;
    const copy = document.querySelector(".re-lightbox-landing");
    return {
      frame: box(frame),
      frameOpacity: Number(getComputedStyle(frame).opacity),
      copy: copy && box(copy),
      copyClip: copy && getComputedStyle(copy).clipPath,
    };
  });
}

async function finishClose(page: Page) {
  await page.evaluate(async () => {
    for (const animation of document.getAnimations()) animation.play();
    await (window as Window).closing;
  });
}

const tileBox = (page: Page, index: number) =>
  page.evaluate((at) => {
    const { x, y, width, height } = (window as Window).tiles[
      at
    ].getBoundingClientRect();
    return { x, y, width, height };
  }, index);

function expectOn(actual: Box | null, expected: Box) {
  expect(actual).not.toBeNull();
  for (const key of ["x", "y", "width", "height"] as const)
    expect(Math.abs((actual as Box)[key] - expected[key])).toBeLessThanOrEqual(
      1,
    );
}

test("after paging to photo 3, close brings the strip to slide 3 and lands on its tile", async ({
  page,
}) => {
  await stripPage(page);
  await openAt(page, 0);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const { lightbox } = window as Window;
        const stop = lightbox.on("settle", () => {
          stop();
          resolve();
        });
        lightbox.goTo(3);
      }),
  );
  expect(
    await page.evaluate(() => (window as Window).carousel.getState().index),
  ).toBe(3);
  expect(
    await page.evaluate(() => (window as Window).tiles[3].style.visibility),
  ).toBe("hidden");
  expect(
    await page.evaluate(() => (window as Window).tiles[0].style.visibility),
  ).toBe("");
  const tile = await tileBox(page, 3);
  const landing = await closeAtLastFrame(page);
  expectOn(landing.frame, tile);
  expectOn(landing.copy, tile);
  expect(landing.frameOpacity).toBe(0);
  await finishClose(page);
  expect(
    await page.evaluate(() => ({
      visibility: (window as Window).tiles[3].style.visibility,
      copies: document.querySelectorAll(".re-lightbox-landing").length,
      dialogs: document.querySelectorAll("dialog").length,
    })),
  ).toEqual({ visibility: "", copies: 0, dialogs: 0 });
});

test("a close during the open flight turns back from where the photo is, with one copy", async ({
  page,
}) => {
  await stripPage(page);
  const flight = await page.evaluate(async () => {
    const win = window as Window & { items: unknown[] };
    win.lightbox.open(win.items, 0);
    await new Promise((resolve) => setTimeout(resolve, 150));
    const frame = document.querySelector(
      '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
    ) as HTMLElement;
    const before = frame.getBoundingClientRect().width;
    void win.lightbox.close();
    return {
      before,
      after: frame.getBoundingClientRect().width,
      copies: document.querySelectorAll(".re-lightbox-landing").length,
    };
  });
  expect(flight.copies).toBe(0);
  expect(Math.abs(flight.after - flight.before)).toBeLessThan(2);
});

test("closing at 4x zoom panned to a corner unwinds into the tile", async ({
  page,
}) => {
  await stripPage(page);
  await openAt(page, 0);
  await page.evaluate(() =>
    (
      window as Window & {
        lightbox: { zoomTo(scale: number, focus: object): void };
      }
    ).lightbox.zoomTo(4, { x: 400, y: 300 }),
  );
  await page.waitForTimeout(400);
  const tile = await tileBox(page, 0);
  const landing = await closeAtLastFrame(page);
  expectOn(landing.frame, tile);
  expectOn(landing.copy, tile);
});

test("closing during a held dismiss drag carries the photo from the finger into the tile", async ({
  page,
}) => {
  await stripPage(page);
  await openAt(page, 0);
  await page.evaluate(() => {
    const viewport = document.querySelector(
      ".re-lightbox-viewport",
    ) as HTMLElement;
    // A synthesized pointer is not active, so capturing it throws.
    viewport.setPointerCapture = () => {};
    const send = (type: string, y: number) =>
      viewport.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 7,
          pointerType: "touch",
          isPrimary: true,
          clientX: 500,
          clientY: y,
          buttons: 1,
        }),
      );
    send("pointerdown", 350);
    for (let y = 360; y <= 450; y += 10) send("pointermove", y);
  });
  expect(await page.locator("dialog").getAttribute("data-phase")).toBe(
    "dragging",
  );
  const tile = await tileBox(page, 0);
  const landing = await closeAtLastFrame(page);
  expectOn(landing.frame, tile);
  expectOn(landing.copy, tile);
});

test("closing while a mouse drag holds the strip between two photos fades in place", async ({
  page,
}) => {
  await stripPage(page);
  await openAt(page, 1);
  await page.mouse.move(500, 350);
  await page.mouse.down();
  for (let x = 480; x >= 300; x -= 20) await page.mouse.move(x, 350);
  const landing = await closeAtLastFrame(page);
  await page.mouse.up();
  expect(landing.copy).toBeNull();
  expect(landing.frame.width).toBeGreaterThan(600);
  expect(landing.frameOpacity).toBe(0);
});

test("a tile under display: none fades in place", async ({ page }) => {
  await stripPage(page);
  await openAt(page, 0);
  await page.evaluate(() => {
    (document.getElementById("strip") as HTMLElement).style.display = "none";
  });
  const landing = await closeAtLastFrame(page);
  expect(landing.copy).toBeNull();
  expect(landing.frame.width).toBeGreaterThan(600);
  expect(landing.frameOpacity).toBe(0);
});

test("a photo behind the +3 tile of a seven-photo album lands in that tile with its radius", async ({
  page,
}) => {
  await mount(
    page,
    `<div id="album" style="display:grid;grid-template-columns:repeat(4,150px);gap:8px;margin:100px">${[
      0, 1, 2,
    ]
      .map(
        (index) =>
          `<img src="${photo(index)}" alt="Photo ${index + 1}" style="display:block;width:150px;height:100px">`,
      )
      .join(
        "",
      )}<button id="more" style="width:150px;height:100px;padding:0;border:0;border-radius:12px;background:url('${photo(3)}') center/cover;color:white">+3</button></div>`,
    styles,
  );
  await page.evaluate(async () => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const album = document.getElementById("album") as HTMLElement;
    const shown = [...album.querySelectorAll("img")];
    const more = document.getElementById("more") as HTMLElement;
    const sources = [...shown.map((image) => image.src)];
    const lightbox = createLightbox({
      history: false,
      autoHide: false,
      getOrigin: (index) => shown[index] ?? more,
    });
    const items = Array.from({ length: 7 }, (_, index) => ({
      src:
        sources[index] ??
        `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="hsl(${index * 47} 60% 55%)"/></svg>`)}`,
      width: 1200,
      height: 800,
    }));
    Object.assign(window, { lightbox, items, tiles: [more] });
  });
  await openAt(page, 6);
  expect(
    await page.evaluate(() => (window as Window).tiles[0].style.visibility),
  ).toBe("hidden");
  const tile = await tileBox(page, 0);
  const landing = await closeAtLastFrame(page);
  expectOn(landing.frame, tile);
  expectOn(landing.copy, tile);
  expect(landing.copyClip).toMatch(/round [1-9]/);
  await finishClose(page);
  expect(
    await page.evaluate(() => (window as Window).tiles[0].style.visibility),
  ).toBe("");
});

// The page behind a modal dialog is inert and cannot be hit-tested, so read the screen.
async function pixel(page: Page, x: number, y: number) {
  const shot = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
  return page.evaluate(async (data) => {
    const response = await fetch(`data:image/png;base64,${data}`);
    const image = await createImageBitmap(await response.blob());
    const canvas = new OffscreenCanvas(1, 1);
    const context = canvas.getContext(
      "2d",
    ) as OffscreenCanvasRenderingContext2D;
    context.drawImage(image, 0, 0);
    return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  }, shot.toString("base64"));
}

// A 5s close keeps the flight's own deadline away while the screen is read.
async function stickyPage(page: Page) {
  await mount(
    page,
    `<style>.re-lightbox{--re-lightbox-close-duration:5s}</style><header id="header" style="position:sticky;top:0;z-index:1;height:64px;background:#111"></header><div style="height:200px"></div><img id="tile" src="${photo(0)}" alt="Photo 1" style="display:block;width:300px;height:200px;margin-left:100px"><div style="height:2000px"></div>`,
    styles,
  );
  await page.evaluate(async () => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const tile = document.getElementById("tile") as HTMLImageElement;
    const lightbox = createLightbox({ history: false, autoHide: false });
    window.scrollTo(0, 232);
    Object.assign(window, {
      lightbox,
      tiles: [tile],
      items: [{ src: tile.src, width: 1200, height: 800, origin: tile }],
    });
  });
}

test("the landing photo passes under a 64px sticky header and over its own tile", async ({
  page,
}) => {
  await stickyPage(page);
  await openAt(page, 0);
  const tile = await tileBox(page, 0);
  expect(tile.y).toBe(32);
  const landing = await closeAtLastFrame(page);
  expect(landing.frameOpacity).toBe(0);
  expectOn(landing.copy, tile);
  const x = tile.x + tile.width / 2;
  expect(await pixel(page, x, 48)).toEqual([17, 17, 17]);
  const below = await pixel(page, x, tile.y + tile.height - 20);
  for (const [channel, value] of [209, 71, 71].entries())
    expect(Math.abs(below[channel] - value)).toBeLessThanOrEqual(3);
});

test("a page that scrolls during the close flight keeps the photo on its tile", async ({
  page,
}) => {
  await stickyPage(page);
  await openAt(page, 0);
  const landing = await page.evaluate(() => {
    const win = window as Window;
    win.closing = win.lightbox.close();
    window.scrollBy(0, 100);
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = Number(
        animation.effect?.getComputedTiming().endTime ?? 0,
      );
    }
    const { x, y, width, height } = (
      document.querySelector(
        '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
      ) as HTMLElement
    ).getBoundingClientRect();
    return { x, y, width, height };
  });
  const tile = await tileBox(page, 0);
  expect(tile.y).toBe(-68);
  expectOn(landing, tile);
  await finishClose(page);
  expect(
    await page.evaluate(() => document.querySelectorAll("dialog").length),
  ).toBe(0);
});

test("the page carousel's autoplay waits while the lightbox is open and a visitor's pause stays", async ({
  page,
}) => {
  await stripPage(page, { autoplay: 300 });
  const index = () =>
    page.evaluate(() => (window as Window).carousel.getState().index);
  await expect.poll(index).toBeGreaterThan(0);
  const shown = await index();
  await openAt(page, shown);
  await page.waitForTimeout(1000);
  expect(await index()).toBe(shown);
  await page.evaluate(() => (window as Window).lightbox.close());
  expect(
    await page.evaluate(
      () =>
        document.activeElement ===
        document.querySelectorAll(".tile")[
          (window as Window).carousel.getState().index
        ],
    ),
  ).toBe(true);
  // Focus on the tile holds autoplay by the carousel's own rule until it leaves the strip.
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await expect.poll(index).not.toBe(shown);

  await page.evaluate(() => (window as Window).carousel.pause());
  const paused = await index();
  await openAt(page, paused);
  await page.evaluate(() => (window as Window).lightbox.close());
  await page.waitForTimeout(1000);
  expect(
    await page.evaluate(() => (window as Window).carousel.getState()),
  ).toMatchObject({ index: paused, isPlaying: false });
});

test("an open or a destroy during the landing leaves no copy, hidden tile or hold behind", async ({
  page,
}) => {
  await stripPage(page, { autoplay: 300 });
  await page.evaluate(() => (window as Window).carousel.pause());
  await openAt(page, 0);
  const after = await page.evaluate(async () => {
    const win = window as Window & { items: unknown[] };
    const read = () => ({
      copies: document.querySelectorAll(".re-lightbox-landing").length,
      hidden: win.tiles.flatMap((tile, index) =>
        tile.style.visibility === "hidden" ? [index] : [],
      ),
    });
    void win.lightbox.close();
    const landing = read();
    win.lightbox.open(win.items, 1);
    const reopened = read();
    await new Promise((resolve) => setTimeout(resolve, 500));
    void win.lightbox.close();
    (win.lightbox as unknown as { destroy(): void }).destroy();
    return { landing, reopened, destroyed: read() };
  });
  expect(after).toEqual({
    landing: { copies: 1, hidden: [0] },
    reopened: { copies: 0, hidden: [1] },
    destroyed: { copies: 0, hidden: [] },
  });
  await page.evaluate(() => {
    (document.activeElement as HTMLElement).blur();
    (window as Window & { carousel: { play(): void } }).carousel.play();
  });
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window).carousel.getState().isPlaying),
    )
    .toBe(true);
});

test.describe("focus after close", { tag: "@desktop" }, () => {
  async function galleryPage(page: Page, history = false) {
    await mount(
      page,
      `<button id="toggle">Open album</button><div id="gallery" style="display:flex;gap:8px;margin:40px">${[
        0, 1, 2,
      ]
        .map(
          (index) =>
            `<a href="${photo(index)}"><img src="${photo(index)}" alt="Photo ${index + 1}" style="display:block;width:150px;height:100px"></a>`,
        )
        .join("")}</div>`,
      styles,
    );
    await page.evaluate(async (useHistory) => {
      const { bindLightboxGallery } = await import(
        "/modules/lightbox/index.js"
      );
      const gallery = document.getElementById("gallery") as HTMLElement;
      const lightbox = bindLightboxGallery(gallery, {
        history: useHistory,
        autoHide: false,
      });
      Object.assign(window, { lightbox });
    }, history);
  }

  const focused = (page: Page) =>
    page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      return {
        id: active.id || active.querySelector("img")?.alt || active.tagName,
        ring:
          active.matches(":focus-visible") &&
          !active.hasAttribute("data-re-focus-quiet"),
      };
    });

  async function clickClose(page: Page) {
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    const box = await page
      .getByRole("button", { name: "Close gallery" })
      .boundingBox();
    if (!box) throw new Error("Missing close button");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator("dialog")).toHaveCount(0);
  }

  test("a mouse close focuses the tile without a ring", async ({ page }) => {
    await galleryPage(page);
    await page.getByAltText("Photo 2").click();
    await clickClose(page);
    expect(await focused(page)).toEqual({ id: "Photo 2", ring: false });
  });

  test("a keyboard open and a mouse close leave no ring until the next key", async ({
    page,
  }) => {
    await galleryPage(page);
    await page.locator('a:has(img[alt="Photo 2"])').focus();
    await page.keyboard.press("Enter");
    await clickClose(page);
    expect(await focused(page)).toEqual({ id: "Photo 2", ring: false });
    expect(
      await page.evaluate(
        () => getComputedStyle(document.activeElement as Element).outlineStyle,
      ),
    ).toBe("none");
    await page.keyboard.press("Shift");
    expect(
      await page.evaluate(() =>
        document.querySelector("[data-re-focus-quiet]"),
      ),
    ).toBeNull();
  });

  test("Back closes like a pointer, without a ring", async ({ page }) => {
    await galleryPage(page, true);
    await page.getByAltText("Photo 2").click();
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    await page.goBack();
    await expect(page.locator("dialog")).toHaveCount(0);
    expect(await focused(page)).toEqual({ id: "Photo 2", ring: false });
  });

  test("Escape focuses the tile with a ring", async ({ page }) => {
    await galleryPage(page);
    await page.getByAltText("Photo 2").click();
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog")).toHaveCount(0);
    expect(await focused(page)).toEqual({ id: "Photo 2", ring: true });
  });

  test("a toggle outside the gallery gets focus back when the photo has no tile", async ({
    page,
  }) => {
    await galleryPage(page);
    await page.evaluate(() => {
      const toggle = document.getElementById("toggle") as HTMLElement;
      const image = document.querySelector("#gallery img") as HTMLImageElement;
      toggle.addEventListener("click", () =>
        (window as Window).lightbox.open(
          [0, 1, 2].map((index) => ({
            src: image.src,
            width: 1200,
            height: 800,
            origin: index === 0 ? image : null,
          })),
          0,
        ),
      );
      toggle.focus();
    });
    await page.keyboard.press("Enter");
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    await page.evaluate(() => (window as Window).lightbox.goTo(2));
    await clickClose(page);
    expect((await focused(page)).id).toBe("toggle");
  });
});
