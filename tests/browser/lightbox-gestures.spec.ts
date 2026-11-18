import { expect, type Page, test } from "@playwright/test";
import { mount, photo, swipe, synthesizeTouches, tap } from "./harness";

type Lightbox = {
  close(): Promise<void>;
  getState(): {
    index: number;
    isOpen: boolean;
    isClosing: boolean;
    chrome: string;
    zoom: { scale: number };
  };
  on(type: string, listener: () => void): () => void;
};
type Window = globalThis.Window &
  typeof globalThis & { lightbox: Lightbox; settles: number };

async function open(
  page: Page,
  options: Record<string, unknown> & { count?: number } = {},
) {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await openMounted(page, options);
}

async function openMounted(
  page: Page,
  { count = 6, ...options }: Record<string, unknown> & { count?: number } = {},
) {
  await page.evaluate(
    async ([sources, extra]) => {
      const { createLightbox } = await import("/modules/lightbox/index.js");
      const lightbox = createLightbox({ history: false, ...extra });
      Object.assign(window, { lightbox, settles: 0 });
      lightbox.on("settle", () => {
        (window as Window).settles++;
      });
      lightbox.open(
        sources.map((src, index) => ({
          src,
          width: 1200,
          height: 800,
          alt: `Photo ${index + 1}`,
        })),
        0,
      );
    },
    [
      Array.from({ length: count }, (_, index) => photo(index)),
      options,
    ] as const,
  );
}

const state = (page: Page) =>
  page.evaluate(() => (window as Window).lightbox.getState());
const chrome = (page: Page) =>
  page.locator("dialog").getAttribute("data-chrome");
const opacity = (page: Page, selector: string) =>
  page.evaluate(
    (query) =>
      Number(
        getComputedStyle(document.querySelector(query) as Element).opacity,
      ),
    selector,
  );

test.describe("lightbox controls with a mouse and keys", () => {
  test("a still mouse hides the controls after 2500ms, and only a move past 24px shows them", async ({
    page,
  }) => {
    await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
    await page.mouse.move(490, 350);
    await page.mouse.move(500, 350);
    await openMounted(page);
    const hiddenAfter = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const start = performance.now();
          const dialog = document.querySelector("dialog") as HTMLElement;
          new MutationObserver(() => {
            if (dialog.dataset.chrome === "hidden")
              resolve(performance.now() - start);
          }).observe(dialog, { attributes: true });
        }),
    );
    expect(hiddenAfter).toBeGreaterThan(2300);
    expect(hiddenAfter).toBeLessThan(3000);
    await page.mouse.move(520, 350);
    await page.waitForTimeout(100);
    expect(await chrome(page)).toBe("hidden");
    await page.mouse.move(530, 350);
    await expect(page.locator("dialog")).toHaveAttribute(
      "data-chrome",
      "shown",
    );
  });

  test("a control under the mouse keeps the controls up", async ({ page }) => {
    await open(page);
    const box = await page
      .getByRole("button", { name: "Close gallery" })
      .boundingBox();
    if (!box) throw new Error("Missing close button");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(3200);
    expect(await chrome(page)).toBe("shown");
  });

  test("hidden controls hide a disabled arrow too", async ({ page }) => {
    await open(page, { autoHide: 50 });
    await expect(page.locator("dialog")).toHaveAttribute(
      "data-chrome",
      "hidden",
    );
    await expect.poll(() => opacity(page, ".re-lightbox-prev")).toBe(0);
  });

  test("the controls fade in 160ms after the photo starts and are gone before it lands on close", async ({
    page,
  }) => {
    await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
    const samples = await page.evaluate(
      async ([source]) => {
        const { createLightbox } = await import("/modules/lightbox/index.js");
        const lightbox = createLightbox({ history: false });
        const read = () =>
          Number(
            getComputedStyle(
              document.querySelector(".re-lightbox-toolbar") as Element,
            ).opacity,
          );
        const record = (until: Promise<unknown> | number) =>
          new Promise<{ time: number; opacity: number }[]>((resolve) => {
            const start = performance.now();
            const out: { time: number; opacity: number }[] = [];
            let done = false;
            if (typeof until !== "number")
              void until.then(() => {
                done = true;
              });
            const tick = () => {
              const time = performance.now() - start;
              if (!done) out.push({ time, opacity: read() });
              if (done || (typeof until === "number" && time > until))
                resolve(out);
              else requestAnimationFrame(tick);
            };
            tick();
          });
        lightbox.open([{ src: source, width: 1200, height: 800 }]);
        const opening = await record(700);
        const closing = record(lightbox.close());
        return { opening, closing: await closing };
      },
      [photo(1)] as const,
    );
    expect(
      samples.opening.filter(
        (sample) => sample.time < 150 && sample.opacity > 0,
      ),
    ).toEqual([]);
    expect(samples.opening.at(-1)?.opacity).toBe(1);
    const gone = samples.closing.find((sample) => sample.opacity === 0);
    const landed = samples.closing.at(-1)?.time ?? 0;
    expect(gone?.time).toBeLessThan(220);
    expect(landed).toBeGreaterThan(250);
  });

  test("ArrowLeft pages forward on a right-to-left page", async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await page.keyboard.press("ArrowLeft");
    await expect.poll(async () => (await state(page)).index).toBe(1);
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await state(page)).index).toBe(0);
  });

  test("a right-to-left page keeps each number of the counter in reading order", async ({
    page,
  }) => {
    await open(page, { count: 12 });
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const cells = page.locator(
      ".re-lightbox-counter-number:last-child .re-lightbox-counter-cell",
    );
    const [one, two] = await Promise.all([
      cells.nth(0).boundingBox(),
      cells.nth(1).boundingBox(),
    ]);
    expect(await cells.allTextContents()).toEqual(["1", "2"]);
    expect(one && two && one.x < two.x).toBe(true);
  });

  for (const ease of ["bounce", "ease, linear"])
    test(`a theme easing the browser rejects (${ease}) still lets the viewer close`, async ({
      page,
    }) => {
      await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
      await page.addStyleTag({
        content: `.re-lightbox { --re-lightbox-ease: ${ease}; }`,
      });
      await openMounted(page);
      await page.evaluate(() => (window as Window).lightbox.close());
      await expect(page.locator("dialog")).toHaveCount(0);
    });

  test("three quick ArrowRight presses travel three photos in one direction", async ({
    page,
  }) => {
    await open(page);
    await page.waitForTimeout(500);
    const positions = page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const viewport = document.querySelector(
            ".re-lightbox-viewport",
          ) as HTMLElement;
          const out: number[] = [];
          const start = performance.now();
          const tick = () => {
            out.push(Math.abs(viewport.scrollLeft));
            if (performance.now() - start < 1400) requestAnimationFrame(tick);
            else resolve(out);
          };
          tick();
        }),
    );
    for (let press = 0; press < 3; press++) {
      await page.keyboard.press("ArrowRight");
      expect(await page.locator(".re-lightbox-counter").textContent()).toBe(
        `${press + 2} / 6`,
      );
      await page.waitForTimeout(80);
    }
    const strip = await positions;
    expect((await state(page)).index).toBe(3);
    expect(strip.at(-1)).toBe(3000);
    expect(
      strip.filter((left, i) => i > 0 && left < strip[i - 1] - 0.5),
    ).toEqual([]);
  });

  test("one photo opens without arrows, counter or paging", async ({
    page,
  }) => {
    await open(page, { count: 1 });
    await expect(
      page.getByRole("button", { name: "Previous image" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Next image" })).toHaveCount(
      0,
    );
    await expect(page.locator(".re-lightbox-counter")).toBeHidden();
    await page.keyboard.press("ArrowRight");
    expect((await state(page)).index).toBe(0);
  });

  test("reduced motion fades the photo in place on open and close", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
    const boxes = await page.evaluate(
      async ([source]) => {
        const { createLightbox } = await import("/modules/lightbox/index.js");
        const lightbox = createLightbox({ history: false });
        const tile = document.createElement("img");
        tile.src = source;
        tile.style.cssText = "width:120px;height:80px;margin:20px";
        document.body.append(tile);
        const out = new Set<string>();
        let running = true;
        const tick = () => {
          const frame = document.querySelector(".re-lightbox-frame");
          if (frame) {
            const box = frame.getBoundingClientRect();
            out.add(
              [box.x, box.y, box.width, box.height].map(Math.round).join(),
            );
          }
          if (running) requestAnimationFrame(tick);
        };
        lightbox.open([
          { src: source, width: 1200, height: 800, origin: tile },
        ]);
        tick();
        await new Promise((resolve) => setTimeout(resolve, 400));
        await lightbox.close();
        running = false;
        return [...out];
      },
      [photo(2)] as const,
    );
    expect(boxes).toHaveLength(1);
  });
});

// The harness page has no viewport meta, so a phone lays it out 980px wide; read the photo's place.
async function photoCenter(page: Page) {
  const box = await page
    .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
    .boundingBox();
  if (!box) throw new Error("Missing photo");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe("lightbox dismiss and taps", { tag: "@touch" }, () => {
  const center = { x: 195, y: 422 };

  test("a quick 60px flick down closes", async ({ page }) => {
    await open(page);
    await page.waitForTimeout(500);
    await swipe(page, center, { x: 195, y: 482 }, { speed: 0.8 });
    await expect.poll(async () => (await state(page)).isOpen).toBe(false);
  });

  test("a close during a held dismiss drag ignores the finger that lifts after it", async ({
    page,
  }) => {
    await open(page);
    await page.waitForTimeout(500);
    await synthesizeTouches(page, "start", [center]);
    for (let step = 1; step <= 5; step++)
      await synthesizeTouches(page, "move", [{ x: 195, y: 422 + step * 10 }]);
    await expect(page.locator("dialog")).toHaveAttribute(
      "data-phase",
      "dragging",
    );
    await page.evaluate(() => {
      const dialog = document.querySelector("dialog") as HTMLElement;
      const phases: string[] = [];
      Object.assign(window, { phases });
      new MutationObserver((records) => {
        for (const _ of records) phases.push(dialog.dataset.phase ?? "");
      }).observe(dialog, { attributeFilter: ["data-phase"] });
      void (window as Window).lightbox.close();
    });
    // Stamped 300ms later, the lift carries no speed that would close by itself.
    await synthesizeTouches(
      page,
      "end",
      [{ x: 195, y: 472 }],
      0,
      Date.now() + 300,
    );
    await page.waitForTimeout(100);
    expect(
      await page.evaluate(
        () => (window as unknown as { phases: string[] }).phases,
      ),
    ).toEqual(["closing"]);
  });

  test("a second finger during a dismiss drag leaves the photo and the backdrop where they are", async ({
    page,
  }) => {
    await open(page);
    await page.waitForTimeout(500);
    await synthesizeTouches(page, "start", [{ x: 195, y: 300 }]);
    for (let step = 1; step <= 10; step++)
      await synthesizeTouches(page, "move", [{ x: 195, y: 300 + step * 10 }]);
    const read = () =>
      page.evaluate(() => ({
        top: (
          document.querySelector(
            '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
          ) as Element
        ).getBoundingClientRect().top,
        backdrop: Number(
          getComputedStyle(
            document.querySelector(".re-lightbox-backdrop") as Element,
          ).opacity,
        ),
      }));
    const before = await read();
    await synthesizeTouches(page, "start", [{ x: 275, y: 400 }], 1);
    const after = await read();
    await synthesizeTouches(page, "end", [{ x: 275, y: 400 }], 1);
    await synthesizeTouches(page, "end", [{ x: 195, y: 400 }]);
    expect(Math.abs(after.top - before.top)).toBeLessThan(2);
    expect(Math.abs(after.backdrop - before.backdrop)).toBeLessThan(0.02);
  });

  test("a slow 100px drag puts the photo back", async ({ page }) => {
    await open(page);
    await page.waitForTimeout(500);
    const before = await page
      .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
      .boundingBox();
    await swipe(page, center, { x: 195, y: 522 }, { speed: 0.2 });
    await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
    expect((await state(page)).isOpen).toBe(true);
    const after = await page
      .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
      .boundingBox();
    expect(after).toEqual(before);
    expect(await opacity(page, ".re-lightbox-backdrop")).toBe(1);
    expect(await opacity(page, ".re-lightbox-toolbar")).toBe(1);
  });

  test("a 150px drag up closes", async ({ page }) => {
    await open(page);
    await page.waitForTimeout(500);
    await swipe(page, center, { x: 195, y: 272 }, { speed: 0.3 });
    await expect.poll(async () => (await state(page)).isOpen).toBe(false);
  });

  test("a cancelled pointer never closes, even 300px down", async ({
    page,
  }) => {
    await open(page);
    await page.waitForTimeout(500);
    await swipe(
      page,
      { x: 195, y: 300 },
      { x: 195, y: 600 },
      { speed: 0.8, cancel: true },
    );
    await page.waitForTimeout(700);
    expect((await state(page)).isOpen).toBe(true);
  });

  test("a flick that pauses 150ms before lifting stays open", async ({
    page,
  }) => {
    await open(page);
    await page.waitForTimeout(500);
    await swipe(page, center, { x: 195, y: 482 }, { speed: 0.8, hold: 150 });
    await page.waitForTimeout(700);
    expect((await state(page)).isOpen).toBe(true);
  });

  test("a quarter of the way down the backdrop is at 0.75 and the controls at 0.5, with no settle while held", async ({
    page,
  }) => {
    await open(page);
    await page.waitForTimeout(500);
    const half = await page.evaluate(
      () =>
        (document.querySelector(".re-lightbox-viewport") as HTMLElement)
          .clientHeight / 2,
    );
    const drag = swipe(
      page,
      center,
      { x: center.x, y: center.y + half / 4 },
      { speed: 0.6, hold: 1500 },
    );
    await expect
      .poll(() => opacity(page, ".re-lightbox-backdrop"))
      .toBeCloseTo(0.75, 2);
    expect(await opacity(page, ".re-lightbox-toolbar")).toBeCloseTo(0.5, 2);
    const settles = await page.evaluate(() => (window as Window).settles);
    await drag;
    expect(settles).toBe(0);
  });

  test("a single tap hides the controls after 300ms and a second tap brings them back", async ({
    page,
  }) => {
    await open(page);
    await page.waitForTimeout(500);
    const hiddenAfter = page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const start = performance.now();
          const dialog = document.querySelector("dialog") as HTMLElement;
          new MutationObserver(() => {
            if (dialog.dataset.chrome === "hidden")
              resolve(performance.now() - start);
          }).observe(dialog, { attributes: true });
        }),
    );
    const target = await photoCenter(page);
    await tap(page, target);
    expect(await hiddenAfter).toBeGreaterThan(250);
    await page.waitForTimeout(100);
    await tap(page, target);
    await expect(page.locator("dialog")).toHaveAttribute(
      "data-chrome",
      "shown",
    );
  });

  test("a double tap zooms and does not toggle the controls", async ({
    page,
  }) => {
    await open(page);
    await page.waitForTimeout(500);
    const target = await photoCenter(page);
    await tap(page, target, { count: 2 });
    await expect
      .poll(async () => (await state(page)).zoom.scale)
      .toBeGreaterThan(1);
    await page.waitForTimeout(500);
    expect(await chrome(page)).toBe("hidden");
    await tap(page, target, { count: 2 });
    await expect.poll(async () => (await state(page)).zoom.scale).toBe(1);
    await page.waitForTimeout(500);
    expect(await chrome(page)).toBe("shown");
  });

  test("a tap beside the photo closes at once", async ({ page }) => {
    await open(page);
    await page.waitForTimeout(500);
    const target = await photoCenter(page);
    await tap(page, { x: target.x, y: 60 });
    expect((await state(page)).isClosing).toBe(true);
  });
});

test.describe("lightbox paging during a held mouse drag", {
  tag: "@desktop",
}, () => {
  async function holdDrag(page: Page) {
    await open(page);
    await page.waitForTimeout(500);
    const from = await photoCenter(page);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let step = 1; step <= 10; step++) {
      await page.mouse.move(from.x - step * 22, from.y);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(100);
    return from;
  }
  const settled = (page: Page) =>
    page.evaluate(() => {
      const viewport = document.querySelector(
        ".re-lightbox-viewport",
      ) as HTMLElement;
      return {
        index: (window as Window).lightbox.getState().index,
        page: Math.abs(viewport.scrollLeft) / viewport.clientWidth,
      };
    });

  for (const [name, act] of [
    ["End", (page: Page) => page.keyboard.press("End")],
    ["ArrowRight", (page: Page) => page.keyboard.press("ArrowRight")],
    [
      "goTo(3)",
      (page: Page) =>
        page.evaluate(() =>
          (
            window as unknown as { lightbox: { goTo(index: number): void } }
          ).lightbox.goTo(3),
        ),
    ],
    [
      "next()",
      (page: Page) =>
        page.evaluate(() =>
          (window as unknown as { lightbox: { next(): void } }).lightbox.next(),
        ),
    ],
  ] as const)
    test(`${name} ends the drag, so its release leaves the viewer on the new photo`, async ({
      page,
    }) => {
      const from = await holdDrag(page);
      await act(page);
      await page.waitForTimeout(100);
      await page.mouse.move(from.x - 260, from.y);
      await page.mouse.up();
      const target = { End: 5, ArrowRight: 1, "goTo(3)": 3, "next()": 1 }[name];
      await expect
        .poll(() => settled(page))
        .toEqual({ index: target, page: target });
    });

  test("End while the mouse is pressed on the photo but has not moved is kept by the drag that follows", async ({
    page,
  }) => {
    await open(page);
    await page.waitForTimeout(500);
    const from = await photoCenter(page);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.keyboard.press("End");
    await expect.poll(() => settled(page)).toEqual({ index: 5, page: 5 });
    await page.mouse.move(from.x - 20, from.y, { steps: 4 });
    expect((await settled(page)).page).toBeGreaterThanOrEqual(5);
    await page.mouse.up();
    await expect.poll(() => settled(page)).toEqual({ index: 5, page: 5 });
  });
});
