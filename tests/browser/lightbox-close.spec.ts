import { expect, type Page, test } from "@playwright/test";
import { framesUntilIdle, mount, photo } from "./harness";

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
  getState(): { index: number; isOpen: boolean; count: number };
  destroy(): void;
  on(type: string, listener: () => void): () => void;
};
type Carousel = {
  getState(): { index: number; isPlaying: boolean; count: number };
  goTo(index: number, behavior?: "instant" | "smooth"): void;
  pause(): void;
};
type Window = globalThis.Window &
  typeof globalThis & {
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

async function stripPage(
  page: Page,
  carousel: Record<string, unknown> = {},
  width = 300,
) {
  await mount(
    page,
    `<div id="strip" style="width:${width}px;margin:100px 0 0 100px;--re-carousel-gap:0px">${tiles(6)}</div>`,
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

for (const [width, visible] of [
  [750, true],
  [740, false],
] as const) {
  test(`paging to a tile with ${width - 600}px of 300px visible ${visible ? "keeps" : "moves"} the strip`, async ({
    page,
  }) => {
    await stripPage(page, {}, width);
    await openAt(page, 1);
    const strip = page.locator("#strip");
    const offset = () => strip.evaluate((element) => element.scrollLeft);
    expect(await offset()).toBe(0);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const { lightbox } = window as Window;
          const stop = lightbox.on("settle", () => {
            stop();
            resolve();
          });
          lightbox.next();
        }),
    );
    const expected = visible ? 0 : 600;
    expect(await offset()).toBe(expected);
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog.re-lightbox")).toHaveCount(0);
    expect(await offset()).toBe(expected);
  });
}

for (const [target, expected, outcome] of [
  [0, 0, "keeps a move that leaves the photo half visible"],
  [5, 600, "redirects a move that would hide the photo"],
] as const) {
  test(`closing the lightbox ${outcome}`, async ({ page }) => {
    await stripPage(page, {}, 750);
    await page.evaluate(() => (window as Window).carousel.goTo(1, "instant"));
    await openAt(page, 2);
    await page.evaluate((index) => {
      const { carousel, lightbox } = window as Window;
      carousel.goTo(index, "smooth");
      return lightbox.close();
    }, target);
    const offsets = await framesUntilIdle(
      page,
      'document.getElementById("strip").scrollLeft',
    );
    expect(offsets.at(-1)).toBe(expected);
  });
}

test("close follows the latest page carousel position before its scroll event", async ({
  page,
}) => {
  await stripPage(page, {}, 750);
  await openAt(page, 1);
  await page.evaluate(() => {
    const strip = document.getElementById("strip") as HTMLElement;
    strip.scrollLeft = 900;
    return (window as Window).lightbox.close();
  });
  expect(
    await page.locator("#strip").evaluate((strip) => strip.scrollLeft),
  ).toBe(300);
});

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
  expect(
    await page.evaluate(() => ({
      slides: (document.getElementById("strip") as HTMLElement).children.length,
      count: (window as Window).carousel.getState().count,
    })),
  ).toEqual({ slides: 6, count: 6 });
  await finishClose(page);
  expect(
    await page.evaluate(() => ({
      visibility: (window as Window).tiles[3].style.visibility,
      copies: document.querySelectorAll(".re-lightbox-landing").length,
      dialogs: document.querySelectorAll("dialog").length,
    })),
  ).toEqual({ visibility: "", copies: 0, dialogs: 0 });
});

test("the landing copy at the strip's last photo leaves the strip's scroll width alone", async ({
  page,
}) => {
  await stripPage(page);
  // A carousel viewport is the copy's containing block when its tiles have no position.
  await page.addStyleTag({ content: "#strip{position:relative}" });
  await page.evaluate(() => (window as Window).carousel.goTo(5, "instant"));
  await openAt(page, 5);
  const strip = () =>
    page.evaluate(() => {
      const element = document.getElementById("strip") as HTMLElement;
      return {
        width: element.scrollWidth,
        left: Math.round(element.scrollLeft),
      };
    });
  const before = await strip();
  const tile = await tileBox(page, 5);
  const start = await page.evaluate(() => {
    const win = window as Window;
    win.closing = win.lightbox.close();
    for (const animation of document.getAnimations()) animation.pause();
    const element = document.getElementById("strip") as HTMLElement;
    return {
      width: element.scrollWidth,
      left: Math.round(element.scrollLeft),
    };
  });
  expect(start).toEqual(before);
  expectOn((await closeAtLastFrame(page)).copy, tile);
  await finishClose(page);
  expect(await strip()).toEqual(before);
});

test("a close right after paging still lands on the new photo's tile", async ({
  page,
}) => {
  await stripPage(page);
  await openAt(page, 0);
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        Object.assign(window, { pagedAt: performance.now() });
        (window as Window).lightbox.next();
        requestAnimationFrame(resolve);
      }),
  );
  const landing = await closeAtLastFrame(page);
  const tile = await tileBox(page, 1);
  expect(
    await page.evaluate(
      () =>
        performance.now() - (window as Window & { pagedAt: number }).pagedAt,
    ),
  ).toBeLessThan(200);
  expect(
    await page.evaluate(() => (window as Window).carousel.getState().index),
  ).toBe(1);
  expectOn(landing.frame, tile);
  expectOn(landing.copy, tile);
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

test("a slow beforeclose does not eat into the close flight", {
  tag: "@desktop",
}, async ({ page }) => {
  await stripPage(page);
  // A 5s close keeps the flight running however late the first frame after close() paints.
  await page.addStyleTag({
    content: ".re-lightbox{--re-lightbox-close-duration:5s}",
  });
  await openAt(page, 0);
  const flight = await page.evaluate(async () => {
    const win = window as Window;
    win.lightbox.on("beforeclose", () => {
      const until = performance.now() + 120;
      while (performance.now() < until);
    });
    void win.lightbox.close();
    const vetted = performance.now();
    const painted = await new Promise<number>(requestAnimationFrame);
    const frame = document.querySelector(
      '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
    ) as HTMLElement;
    return {
      elapsed: Number(frame.getAnimations()[0]?.currentTime),
      late: painted - vetted,
    };
  });
  // Time the browser takes to paint after close() returns is not time beforeclose took.
  expect(flight.elapsed - flight.late, JSON.stringify(flight)).toBeLessThan(60);
});

const tile = (index: number, style = "") =>
  `<img class="tile" src="${photo(index)}" alt="Photo ${index + 1}" style="display:block;width:300px;height:200px;${style}">`;

// A viewer over the plain .tile images of the page, each item's origin read when the flight starts.
async function tilePage(
  page: Page,
  body: string,
  options: Record<string, unknown> = {},
  dir = "ltr",
) {
  await mount(page, body, styles);
  await page.evaluate(
    async ([extra, direction]) => {
      document.documentElement.dir = direction as string;
      const { createLightbox } = await import("/modules/lightbox/index.js");
      const lightbox = createLightbox({
        history: false,
        autoHide: false,
        ...(extra as object),
      });
      const images = [...document.querySelectorAll<HTMLImageElement>(".tile")];
      Object.assign(window, {
        lightbox,
        tiles: images,
        items: images.map((image, index) => ({
          src: image.src,
          width: 1200,
          height: 800,
          alt: image.alt,
          caption: `Caption ${index + 1}`,
          origin: () => document.querySelectorAll(".tile")[index],
        })),
      });
    },
    [options, dir] as const,
  );
}

test("with a side caption on a right-to-left page the close lands on the tile", async ({
  page,
}) => {
  await tilePage(
    page,
    `<div style="padding:100px">${tile(0)}</div>`,
    { caption: "side" },
    "rtl",
  );
  await openAt(page, 0);
  const landing = await closeAtLastFrame(page);
  const target = await tileBox(page, 0);
  expect(Math.abs(landing.frame.x - target.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(landing.frame.y - target.y)).toBeLessThanOrEqual(1);
  await finishClose(page);
});

test("a tile on screen beside a side caption still gets the photo back", async ({
  page,
}) => {
  await tilePage(
    page,
    `<div style="padding:100px 0 0 750px">${tile(0, "width:200px;height:133px")}</div>`,
    { caption: "side" },
  );
  await openAt(page, 0);
  const landing = await closeAtLastFrame(page);
  const target = await tileBox(page, 0);
  expect(Math.abs(landing.frame.x - target.x)).toBeLessThanOrEqual(1);
  expect(landing.copy).not.toBeNull();
  await finishClose(page);
});

test("a tile scrolled out of its own clipping container fades in place", async ({
  page,
}) => {
  await tilePage(
    page,
    `<div style="display:flex;width:300px;overflow:hidden;margin:100px">${[0, 1, 2].map((i) => `<div style="flex:0 0 300px">${tile(i)}</div>`).join("")}</div>`,
  );
  await openAt(page, 2);
  const landing = await closeAtLastFrame(page);
  expect(landing.copy).toBeNull();
  expect(landing.frame.width).toBeGreaterThan(600);
  expect(landing.frameOpacity).toBe(0);
  await finishClose(page);
});

test("a tile the page renders again in beforeclose stays hidden for the flight and shows after it", async ({
  page,
}) => {
  await tilePage(page, `<div style="padding:100px">${tile(0)}</div>`);
  await openAt(page, 0);
  const during = await page.evaluate(() => {
    const win = window as Window;
    win.lightbox.on("beforeclose", () => {
      const old = document.querySelector(".tile") as HTMLElement;
      const fresh = old.cloneNode() as HTMLElement;
      fresh.style.visibility = "";
      old.replaceWith(fresh);
    });
    win.closing = win.lightbox.close();
    return getComputedStyle(document.querySelector(".tile") as Element)
      .visibility;
  });
  await page.evaluate(() => (window as Window).closing);
  expect(during).toBe("hidden");
  expect(
    await page.evaluate(
      () => (document.querySelector(".tile") as HTMLElement).style.visibility,
    ),
  ).toBe("");
});

test("the landing photo is not a slide of a carousel built on bare images", async ({
  page,
}) => {
  await mount(
    page,
    `<div id="strip" style="width:300px;margin:100px 0 0 100px;--re-carousel-gap:0px">${Array.from(
      { length: 6 },
      (_, i) =>
        `<img src="${photo(i)}" alt="Photo ${i + 1}" style="display:block;flex:0 0 300px;width:300px;height:200px">`,
    ).join("")}</div>`,
    styles,
  );
  await page.evaluate(async () => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const { connectCarousel } = await import("/modules/lightbox/carousel.js");
    const strip = document.getElementById("strip") as HTMLElement;
    const images = [...strip.querySelectorAll("img")];
    const carousel = createCarousel(strip, {});
    const lightbox = createLightbox({ history: false, autoHide: false });
    connectCarousel(lightbox, carousel);
    Object.assign(window, {
      carousel,
      lightbox,
      items: images.map((image) => ({
        src: image.src,
        width: 1200,
        height: 800,
        alt: image.alt,
        origin: () => image,
      })),
    });
  });
  await openAt(page, 2);
  const counts = await page.evaluate(async () => {
    const win = window as Window;
    const counts = [win.carousel.getState().count];
    win.closing = win.lightbox.close();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    counts.push(
      win.carousel.getState().count,
      document.querySelectorAll(".re-lightbox-landing").length,
    );
    await win.closing;
    return counts;
  });
  expect(counts).toEqual([6, 6, 1]);
});

test("a 200ms stall right after open() does not cut the open flight short", async ({
  page,
}) => {
  await tilePage(page, `<div style="padding:100px">${tile(0)}</div>`);
  const flight = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const win = window as Window & { items: unknown[] };
        win.lightbox.open(win.items, 0);
        const until = performance.now() + 200;
        while (performance.now() < until);
        const stalled = performance.now();
        const stop = win.lightbox.on("opened", () => {
          stop();
          resolve(performance.now() - stalled);
        });
      }),
  );
  expect(flight).toBeGreaterThan(380);
});

test("a 600ms stall right after open(), longer than the flight, still flies", async ({
  page,
}) => {
  await tilePage(page, `<div style="padding:100px">${tile(0)}</div>`);
  const flight = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const win = window as Window & { items: unknown[] };
        win.lightbox.open(win.items, 0);
        const until = performance.now() + 600;
        while (performance.now() < until);
        const stalled = performance.now();
        const stop = win.lightbox.on("opened", () => {
          stop();
          resolve(performance.now() - stalled);
        });
      }),
  );
  expect(flight).toBeGreaterThan(380);
});

test("an easing list in --re-lightbox-ease falls back to the default curve and still flies", async ({
  page,
}) => {
  await tilePage(page, `<div style="padding:100px">${tile(0)}</div>`);
  await page.addStyleTag({
    content: ".re-lightbox{--re-lightbox-ease: ease, linear}",
  });
  const easings = await page.evaluate(() => {
    const win = window as Window & { items: unknown[] };
    win.lightbox.open(win.items, 0);
    return (
      document.querySelector(
        '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
      ) as HTMLElement
    )
      .getAnimations()
      .map((animation) => animation.effect?.getTiming().easing);
  });
  expect(easings).toEqual(["cubic-bezier(0.32, 0.72, 0, 1)"]);
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

for (const release of ["held", "released during the flight"])
  test(`a close while a mouse drag holds the strip between two photos ends the drag and lands on the tile (mouse ${release})`, {
    tag: "@desktop",
  }, async ({ page }) => {
    await stripPage(page);
    await openAt(page, 1);
    const frame = await page
      .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
      .boundingBox();
    if (!frame) throw new Error("Missing photo");
    const from = {
      x: frame.x + frame.width / 2,
      y: frame.y + frame.height / 2,
    };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let step = 1; step <= 10; step++) {
      await page.mouse.move(from.x - step * 22, from.y);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(100);
    const neighbors = await page.evaluate(() => {
      const win = window as Window;
      win.closing = win.lightbox.close();
      const box = (
        document.querySelector(".re-lightbox-viewport") as Element
      ).getBoundingClientRect();
      const index = win.lightbox.getState().index;
      return [...document.querySelectorAll(".re-lightbox-slide")]
        .filter((slide, at) => {
          const rect = slide.getBoundingClientRect();
          return (
            at !== index &&
            Math.min(rect.right, box.right) - Math.max(rect.left, box.left) > 1
          );
        })
        .map((slide) => slide.getAttribute("aria-label"));
    });
    expect(neighbors).toEqual([]);
    if (release !== "held") await page.mouse.up();
    const landing = await page.evaluate(() => {
      for (const animation of document.getAnimations()) {
        animation.pause();
        animation.currentTime = Number(
          animation.effect?.getComputedTiming().endTime ?? 0,
        );
      }
      const copy = document.querySelector(".re-lightbox-landing");
      const { x, y, width, height } = (copy as Element).getBoundingClientRect();
      return { x, y, width, height };
    });
    expectOn(landing, await tileBox(page, 1));
    await finishClose(page);
    if (release === "held") await page.mouse.up();
    await expect(page.locator("dialog")).toHaveCount(0);
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
    const lightbox = createLightbox({ history: false, autoHide: false });
    const items = Array.from({ length: 7 }, (_, index) => ({
      src:
        sources[index] ??
        `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="hsl(${index * 47} 60% 55%)"/></svg>`)}`,
      width: 1200,
      height: 800,
      origin: () => shown[index] ?? more,
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

test("a photo in a tile that rounds its clipping wrapper flies with the wrapper's corners", async ({
  page,
}) => {
  await mount(
    page,
    `<a id="tile" href="${photo(0)}" style="display:block;width:300px;height:200px;margin:100px;overflow:hidden;border-radius:16px 16px 0 0"><img src="${photo(0)}" alt="Photo 1" style="display:block;width:300px;height:200px"></a>`,
    styles,
  );
  await page.evaluate(async () => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const image = document.querySelector("#tile img") as HTMLImageElement;
    const lightbox = createLightbox({ history: false, autoHide: false });
    Object.assign(window, { lightbox, tiles: [image] });
    Object.assign(window, {
      items: [{ src: image.src, width: 1200, height: 800, origin: image }],
    });
  });
  const start = await page.evaluate(async () => {
    const win = window as Window & { items: unknown[] };
    win.lightbox.open(win.items, 0);
    for (;;) {
      const frame = document.querySelector<HTMLElement>(".re-lightbox-frame");
      const [animation] = frame?.getAnimations() ?? [];
      if (frame && animation) {
        animation.pause();
        animation.currentTime = 0;
        return getComputedStyle(frame).clipPath;
      }
      await new Promise(requestAnimationFrame);
    }
  });
  expect(start).toMatch(/round ([1-9][\d.]*)px \1px 0px( 0px)?\)$/);
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
async function stickyPage(page: Page, layered = false) {
  const tile = `<img id="tile" src="${photo(0)}" alt="Photo 1" style="display:block;width:300px;height:200px;margin-left:100px">`;
  const body = `<header id="header" style="position:sticky;top:0;z-index:2;height:64px;background:#111"></header><div style="height:200px"></div>${layered ? `<div style="position:relative;z-index:1;background:#fff">${tile}</div>` : tile}<div style="height:2000px"></div>`;
  await mount(
    page,
    `<style>.re-lightbox{--re-lightbox-close-duration:5s}</style>${layered ? `<div style="isolation:isolate">${body}</div>` : body}`,
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

for (const layered of [false, true])
  test(`the landing photo passes under a 64px sticky header and over its own tile${layered ? " inside an isolated root and a z-index card" : ""}`, async ({
    page,
  }) => {
    await stickyPage(page, layered);
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

test("a wheel during the close flight scrolls the page", async ({ page }) => {
  await stickyPage(page);
  await openAt(page, 0);
  await page.evaluate(() => {
    const win = window as Window;
    win.closing = win.lightbox.close();
  });
  await page.mouse.move(500, 350);
  await page.mouse.wheel(0, 100);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(332);
  expect(
    await page.evaluate(() => document.querySelectorAll("dialog").length),
  ).toBe(1);
  await finishClose(page);
});

test("a wheel during an Escape close keeps the page where it scrolled after the history back", {
  tag: "@desktop",
}, async ({ page }) => {
  await mount(
    page,
    `<div style="height:300px"></div>${tiles(1)}<div style="height:3000px"></div>`,
    styles,
  );
  await page.addStyleTag({
    content: ".re-lightbox{--re-lightbox-close-duration:600ms}",
  });
  await page.evaluate(async () => {
    const { bindLightboxGallery, createLightbox } = await import(
      "/modules/lightbox/index.js"
    );
    bindLightboxGallery(document.body, createLightbox({ autoHide: false }));
    scrollTo(0, 200);
  });
  await page.locator(".tile img").click();
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => history.scrollRestoration)).toBe("auto");
  await page.keyboard.press("Escape");
  await page.mouse.move(640, 400);
  for (let tick = 0; tick < 4; tick++) {
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(30);
  }
  await expect.poll(() => page.locator("dialog").count()).toBe(0);
  const scrolled = await page.evaluate(() => scrollY);
  expect(scrolled).toBeGreaterThan(400);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBe(scrolled);
  expect(await page.evaluate(() => history.scrollRestoration)).toBe("auto");
});

test("the photo flies whole out of a strip that clips its tile", async ({
  page,
}) => {
  await stripPage(page);
  await openAt(page, 0);
  const corner = await page.evaluate(() => {
    const win = window as Window;
    win.closing = win.lightbox.close();
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime =
        Number(animation.effect?.getComputedTiming().endTime ?? 0) * 0.4;
    }
    const { right, bottom } = (
      document.querySelector(
        '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
      ) as HTMLElement
    ).getBoundingClientRect();
    return { x: Math.round(right - 20), y: Math.round(bottom - 20) };
  });
  const strip = await page.locator("#strip").boundingBox();
  expect(corner.x).toBeGreaterThan((strip?.x ?? 0) + (strip?.width ?? 0));
  const seen = await pixel(page, corner.x, corner.y);
  for (const [channel, value] of [209, 71, 71].entries())
    expect(Math.abs(seen[channel] - value)).toBeLessThanOrEqual(3);
  await finishClose(page);
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
        .join("")}</div><button>After gallery</button>`,
      styles,
    );
    await page.evaluate(async (useHistory) => {
      const { bindLightboxGallery, createLightbox } = await import(
        "/modules/lightbox/index.js"
      );
      const gallery = document.getElementById("gallery") as HTMLElement;
      const lightbox = createLightbox({ history: useHistory, autoHide: false });
      const unbind = bindLightboxGallery(gallery, lightbox);
      Object.assign(window, { lightbox, unbind });
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

  test("a mouse open focuses the close button without a ring", async ({
    page,
  }) => {
    await galleryPage(page);
    await page.getByAltText("Photo 2").click();
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    expect(await focused(page)).toEqual({ id: "BUTTON", ring: false });
  });

  const slowClose = (page: Page, rule = "") =>
    page.evaluate((extra) => {
      const style = document.createElement("style");
      style.textContent = `.re-lightbox{--re-lightbox-close-duration:2s}${extra}`;
      document.head.append(style);
    }, rule);

  test("a click on another photo during the close flight opens the gallery without the landing copy", async ({
    page,
  }) => {
    await galleryPage(page);
    await slowClose(page);
    await page.getByAltText("Photo 2").click();
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    await page.keyboard.press("Escape");
    await expect(page.locator(".re-lightbox-landing")).toHaveCount(1);
    await page.locator("#gallery").getByAltText("Photo 3").click();
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    expect(
      await page.evaluate(() => {
        const { index, count } = (window as Window).lightbox.getState();
        return { index, count };
      }),
    ).toEqual({ index: 2, count: 3 });
  });

  test("a gallery bound to the body ignores the viewer's own images", async ({
    page,
  }) => {
    await galleryPage(page);
    await page.evaluate(async () => {
      const old = window as Window & { unbind: () => void };
      old.unbind();
      old.lightbox.destroy();
      const { bindLightboxGallery, createLightbox } = await import(
        "/modules/lightbox/index.js"
      );
      const lightbox = createLightbox({ history: false, autoHide: false });
      bindLightboxGallery(document.body, lightbox);
      Object.assign(window, { lightbox });
    });
    await slowClose(page);
    await page.locator("#gallery").getByAltText("Photo 2").click();
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    const state = () =>
      page.evaluate(() => {
        const { index, count } = (window as Window).lightbox.getState();
        return { index, count };
      });
    await page.locator("dialog .re-lightbox-close").focus();
    await page.keyboard.press("Escape");
    await page.locator("#gallery").getByAltText("Photo 3").click();
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    expect(await state()).toEqual({ index: 2, count: 3 });
  });

  test("a page that hides closed dialogs still shows the close flight", async ({
    page,
  }) => {
    await galleryPage(page);
    await slowClose(page, "dialog:not([open]){display:none}");
    await page.getByAltText("Photo 2").click();
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog")).toHaveAttribute(
      "data-phase",
      "closing",
    );
    expect(
      await page.evaluate(() => {
        const dialog = document.querySelector("dialog") as HTMLElement;
        const frame = dialog.querySelector(
          '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
        ) as HTMLElement;
        return [
          getComputedStyle(dialog).display,
          frame.getBoundingClientRect().width > 0,
        ];
      }),
    ).toEqual(["block", true]);
  });

  test("focus moved to a field during the close flight stays there", async ({
    page,
  }) => {
    await galleryPage(page);
    await slowClose(page);
    await page.evaluate(() =>
      document.body.insertAdjacentHTML("afterbegin", '<input id="search">'),
    );
    await page.getByAltText("Photo 2").click();
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    await page.keyboard.press("Escape");
    await page.locator("#search").click();
    await expect(page.locator("dialog")).toHaveCount(0);
    expect((await focused(page)).id).toBe("search");
  });

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

  for (const [input, ring] of [
    ["click", false],
    ["Enter", true],
    ["Tab after click", true],
  ] as const) {
    test(`Escape restores focus ${ring ? "with" : "without"} a ring after ${input}`, async ({
      page,
    }) => {
      await galleryPage(page);
      const tile = page.locator('a:has(img[alt="Photo 2"])');
      if (input === "Enter") await tile.press("Enter");
      else await tile.click();
      await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
      if (input === "Tab after click") await page.keyboard.press("Tab");
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog")).toHaveCount(0);
      await expect(tile).toBeFocused();
      if (ring) await expect(tile).not.toHaveCSS("outline-style", "none");
      else await expect(tile).toHaveCSS("outline-style", "none");

      await page.keyboard.press("Tab");
      const next = page.locator(":focus-visible");
      await expect(next).toHaveCount(1);
      await expect(next).not.toHaveCSS("outline-style", "none");
      await expect(tile).not.toBeFocused();
    });
  }

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
