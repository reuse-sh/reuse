import { expect, type Page, test } from "@playwright/test";
import {
  ctrlWheel,
  mount,
  type Point,
  pinch,
  pinchThenPan,
  safariPinch,
  swipe,
  tap,
} from "./harness";

type Zoom = { scale: number; x: number; y: number };
type Lightbox = {
  getState(): {
    index: number;
    isOpen: boolean;
    isClosing: boolean;
    isAnimating: boolean;
    zoom: Zoom;
  };
  zoomTo(scale: number, focus?: Point): void;
  close(): Promise<void>;
};
type Window = globalThis.Window & typeof globalThis & { lightbox: Lightbox };

async function open(
  page: Page,
  sizes: [number, number][],
  { aside = false, styles = [] }: { aside?: boolean; styles?: string[] } = {},
) {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css", ...styles]);
  await page.evaluate(
    async ([list, withAside]) => {
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
      const lightbox = createLightbox({
        history: false,
        slots: withAside
          ? {
              aside: ({ document }: { document: Document }) => ({
                node: document.createElement("p"),
              }),
            }
          : {},
      });
      Object.assign(window, { lightbox });
      lightbox.open(
        list.map(([width, height], index) => ({
          src: sources[index],
          width,
          height,
        })),
        0,
      );
    },
    [sizes, aside] as const,
  );
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  await expect(page.locator(".re-lightbox-frame[data-loading]")).toHaveCount(0);
}

const state = (page: Page) =>
  page.evaluate(() => (window as Window).lightbox.getState());

async function zoomTo(page: Page, scale: number, focus: Point) {
  await page.evaluate(
    ([value, at]) => (window as Window).lightbox.zoomTo(value, at),
    [scale, focus] as const,
  );
  await still(page);
}

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

async function screen(page: Page) {
  const box = await page.locator(".re-lightbox-viewport").boundingBox();
  if (!box) throw new Error("Missing viewport");
  return box;
}

function share(
  box: { x: number; y: number; width: number; height: number },
  at: Point,
) {
  return { x: (at.x - box.x) / box.width, y: (at.y - box.y) / box.height };
}

async function expectUnder(page: Page, at: Point, held: Point) {
  const box = await photo(page);
  expect(Math.abs(box.x + held.x * box.width - at.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(box.y + held.y * box.height - at.y)).toBeLessThanOrEqual(1);
}

test.describe("lightbox zoom with a mouse, wheel and trackpad", {
  tag: "@desktop",
}, () => {
  test("a photo the screen shows whole has no zoom button, zoom cursor or click zoom", async ({
    page,
  }) => {
    await open(page, [[800, 600]]);
    await expect(page.locator(".re-lightbox-zoom")).toBeHidden();
    const box = await photo(page);
    const cursor = await page
      .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
      .evaluate((frame) => getComputedStyle(frame).cursor);
    expect(cursor).toBe("auto");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(400);
    expect(await state(page)).toMatchObject({
      isOpen: true,
      zoom: { scale: 1, x: 0, y: 0 },
    });
  });

  test("a click zooms a 4000x3000 photo to its file pixels around the pointer and the next one returns to the center", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    await expect(page.locator(".re-lightbox-zoom")).toBeVisible();
    const before = await photo(page);
    // Mouse events carry whole pixels.
    const at = {
      x: Math.round(before.x + before.width * 0.4),
      y: Math.round(before.y + before.height * 0.45),
    };
    const held = share(before, at);
    await page.mouse.click(at.x, at.y);
    await still(page);
    expect(Math.abs((await photo(page)).width - 4000)).toBeLessThanOrEqual(1);
    await expectUnder(page, at, held);
    await page.mouse.click(at.x, at.y);
    await still(page);
    expect(await state(page)).toMatchObject({
      isOpen: true,
      zoom: { scale: 1, x: 0, y: 0 },
    });
  });

  test("a click zooms on a page that also loads the carousel's stylesheet", async ({
    page,
  }) => {
    await open(
      page,
      [
        [4000, 3000],
        [4000, 3000],
      ],
      {
        styles: ["carousel/styles.css"],
      },
    );
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const viewport = document.querySelector(
            ".re-lightbox-viewport",
          ) as HTMLElement;
          return viewport.scrollLeft === viewport.clientWidth;
        }),
      )
      .toBe(true);
    await still(page);
    const box = await photo(page);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await still(page);
    expect((await state(page)).zoom.scale).toBeGreaterThan(1);
  });

  test("a drag 200px past the right edge stretches 70px and springs back to the edge", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    await zoomTo(page, 10, { x: 5000, y: 0 });
    const edge = (await screen(page)).x + (await screen(page)).width;
    const right = async () => {
      const box = await photo(page);
      return box.x + box.width;
    };
    expect(Math.abs((await right()) - edge)).toBeLessThanOrEqual(1);
    const drag = swipe(
      page,
      { x: 720, y: 450 },
      { x: 520, y: 450 },
      {
        speed: 0.5,
        hold: 800,
      },
    );
    await expect.poll(async () => Math.round(edge - (await right()))).toBe(70);
    await drag;
    await page.waitForTimeout(600);
    expect(Math.abs((await right()) - edge)).toBeLessThanOrEqual(1);
  });

  test("a flick at 1px/ms glides about 180px further and stops at the edge", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    await zoomTo(page, 10, { x: 0, y: 0 });
    await swipe(page, { x: 900, y: 450 }, { x: 700, y: 450 }, { speed: 1 });
    await still(page);
    const glide = -200 - (await state(page)).zoom.x;
    expect(glide).toBeGreaterThan(100);
    expect(glide).toBeLessThan(230);
    await zoomTo(page, 1, { x: 0, y: 0 });
    await zoomTo(page, 10, { x: 5000, y: 0 });
    const limit = (await state(page)).zoom.x;
    await swipe(page, { x: 900, y: 450 }, { x: 700, y: 450 }, { speed: 1 });
    await still(page);
    expect((await state(page)).zoom.x).toBe(limit);
  });

  test("an ordinary wheel does nothing at fit, and Ctrl with the wheel zooms around the pointer", async ({
    page,
  }) => {
    await open(page, [
      [4000, 3000],
      [4000, 3000],
      [4000, 3000],
    ]);
    const at = { x: 600, y: 400 };
    await page.mouse.move(at.x, at.y);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(300);
    expect(await state(page)).toMatchObject({
      index: 0,
      zoom: { scale: 1, x: 0, y: 0 },
    });
    const held = share(await photo(page), at);
    for (let step = 0; step < 3; step++) {
      await ctrlWheel(page, at, -40);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(300);
    expect((await state(page)).zoom.scale).toBeGreaterThan(1.5);
    await expectUnder(page, at, held);
  });

  test("a photo beside an aside panel fits the room the panel leaves", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]], { aside: true });
    const panel = await page.locator(".re-lightbox-aside").boundingBox();
    const box = await photo(page);
    if (!panel) throw new Error("Missing aside");
    expect(panel.x).toBeLessThan(1440);
    expect(Math.round(box.width)).toBe(Math.round(panel.x - 64));
    expect(Math.round(box.x + box.width / 2 - panel.x / 2)).toBe(0);
  });

  test("a zoomed photo pans to the window's edges under the panel and the bottom room, with only close and zoom left", async ({
    page,
  }) => {
    await open(
      page,
      [
        [4000, 3000],
        [4000, 3000],
      ],
      { aside: true },
    );
    await page.addStyleTag({
      content: ".re-lightbox { --re-lightbox-bottom-room: 100px; }",
    });
    await page.setViewportSize({ width: 1440, height: 901 });
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect
      .poll(async () => {
        const rest = await photo(page);
        return Math.round(rest.y + rest.height);
      })
      .toBeLessThanOrEqual(900 - 100);
    const edges = async () => {
      const box = await photo(page);
      return [box.x, box.y, box.x + box.width, box.y + box.height].map(
        (value) => Math.abs(Math.round(value)),
      );
    };
    await zoomTo(page, 10, { x: 9000, y: 9000 });
    await expect
      .poll(async () => (await edges()).slice(2))
      .toEqual([1440, 900]);
    await zoomTo(page, 1, { x: 0, y: 0 });
    await zoomTo(page, 10, { x: -9000, y: -9000 });
    await expect.poll(async () => (await edges()).slice(0, 2)).toEqual([0, 0]);
    await page.mouse.move(700, 400);
    await page.mouse.move(760, 460, { steps: 4 });
    await expect(page.locator(".re-lightbox-close")).toBeVisible();
    await expect(page.locator(".re-lightbox-zoom")).toBeVisible();
    for (const hidden of [
      ".re-lightbox-aside",
      ".re-lightbox-next",
      ".re-lightbox-counter",
    ])
      await expect(page.locator(hidden)).toBeHidden();
  });

  test("a zoom from a focused arrow moves focus to the photo, where the arrow keys pan", async ({
    page,
  }) => {
    await open(page, [
      [4000, 3000],
      [4000, 3000],
    ]);
    await page.locator(".re-lightbox-next").focus();
    await page.keyboard.press("+");
    await still(page);
    expect(
      await page.evaluate(() =>
        document.activeElement?.classList.contains("re-lightbox-viewport"),
      ),
    ).toBe(true);
    const before = (await state(page)).zoom.x;
    await page.keyboard.press("ArrowLeft");
    await still(page);
    expect((await state(page)).zoom.x).not.toBe(before);
    expect((await state(page)).index).toBe(0);
  });

  test("a click in the bottom room beside the photo leaves the viewer open", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    await page.addStyleTag({
      content: ".re-lightbox { --re-lightbox-bottom-room: 100px; }",
    });
    await page.setViewportSize({ width: 1440, height: 901 });
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect
      .poll(async () => {
        const rest = await photo(page);
        return Math.round(rest.y + rest.height);
      })
      .toBeLessThanOrEqual(800);
    await page.mouse.click(60, 870);
    await page.waitForTimeout(500);
    expect((await state(page)).isOpen).toBe(true);
    await page.mouse.click(60, 400);
    await expect.poll(async () => (await state(page)).isOpen).toBe(false);
  });

  test("a mouse drag on a zoomed photo shows the grabbing cursor until release", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    await zoomTo(page, 10, { x: 0, y: 0 });
    const cursor = () =>
      page.evaluate(() => {
        const viewport = document.querySelector(".re-lightbox-viewport");
        return viewport && getComputedStyle(viewport).cursor;
      });
    await page.mouse.move(720, 450);
    await page.mouse.down();
    await page.mouse.move(600, 380, { steps: 6 });
    expect(await cursor()).toBe("grabbing");
    await page.mouse.up();
    expect(await cursor()).not.toBe("grabbing");
  });

  test("keys keep working after paging from the focused zoom button to a photo that cannot zoom", async ({
    page,
  }) => {
    await open(page, [
      [4000, 3000],
      [800, 600],
      [4000, 3000],
    ]);
    await page.locator(".re-lightbox-zoom").focus();
    await page.keyboard.press("Enter");
    await still(page);
    await page.keyboard.press("Enter");
    await still(page);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator(".re-lightbox-zoom")).toBeHidden();
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await state(page)).index).toBe(2);
  });

  test("a zoom eases in, covering under a fifth of the way in its first frame", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    const covered = await page.evaluate(() => {
      const frame = document.querySelector(
        '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
      ) as HTMLElement;
      const width = () => frame.getBoundingClientRect().width;
      const before = width();
      (window as Window).lightbox.zoomTo(3);
      const [motion] = frame
        .getAnimations()
        .filter((animation) => animation.playState === "running");
      motion.pause();
      motion.currentTime = 16;
      const early = width();
      motion.currentTime = Number(motion.effect?.getComputedTiming().endTime);
      return (early - before) / (width() - before);
    });
    expect(covered).toBeGreaterThan(0);
    expect(covered).toBeLessThan(0.2);
  });

  test("reduced motion zooms at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, [[4000, 3000]]);
    const running = await page.evaluate(() => {
      (window as Window).lightbox.zoomTo(3);
      return document
        .querySelector(
          '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
        )
        ?.getAnimations()
        .filter((animation) => animation.playState === "running").length;
    });
    expect(running).toBe(0);
    expect((await state(page)).zoom.scale).toBe(3);
  });

  test("a zoom-out that hides the focused zoom button moves focus to the photo", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    await page.addStyleTag({
      content:
        '.re-lightbox:not([data-zoomed="true"]) .re-lightbox-zoom { display: none; }',
    });
    await zoomTo(page, 3, { x: 0, y: 0 });
    await page.locator(".re-lightbox-zoom").focus();
    await page.keyboard.press("Enter");
    await still(page);
    await expect(page.locator(".re-lightbox-zoom")).toBeHidden();
    expect(
      await page.evaluate(() =>
        document.activeElement?.classList.contains("re-lightbox-viewport"),
      ),
    ).toBe(true);
    await page.keyboard.press("+");
    await expect
      .poll(async () => (await state(page)).zoom.scale)
      .toBeGreaterThan(1);
  });

  test("--re-lightbox-zoom-duration: 0ms zooms at once", async ({ page }) => {
    await page.addInitScript(() =>
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent = ".re-lightbox{--re-lightbox-zoom-duration:0ms}";
        document.head.append(style);
      }),
    );
    await open(page, [[4000, 3000]]);
    const result = await page.evaluate(() => {
      const frame = document.querySelector(
        '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
      ) as HTMLElement;
      (window as Window).lightbox.zoomTo(3);
      return [
        frame
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
        (window as Window).lightbox.getState().isAnimating,
      ];
    });
    expect(result).toEqual([0, false]);
  });

  test("a close during a zoom leaves no zoom motion running under the flight", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    const running = await page.evaluate(async () => {
      const frame = document.querySelector(
        '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
      ) as HTMLElement;
      const zooming = () =>
        frame
          .getAnimations()
          .filter(
            (animation) =>
              animation.playState === "running" &&
              (animation.effect as KeyframeEffect)
                .getKeyframes()
                .some((key) => String(key.transform).includes("scale(3)")),
          ).length;
      (window as Window).lightbox.zoomTo(3);
      await new Promise((resolve) => setTimeout(resolve, 60));
      const before = zooming();
      void (window as Window).lightbox.close();
      return [before, zooming()];
    });
    expect(running).toEqual([1, 0]);
  });

  test("a mouse drag at the edge of a zoomed photo pans and never pages", async ({
    page,
  }) => {
    await open(page, [
      [4000, 3000],
      [4000, 3000],
      [4000, 3000],
    ]);
    await zoomTo(page, 10, { x: 5000, y: 0 });
    for (let drag = 0; drag < 2; drag++) {
      await swipe(
        page,
        { x: 1000, y: 450 },
        { x: 400, y: 450 },
        {
          speed: 1,
          hold: 150,
        },
      );
      await still(page);
    }
    expect((await state(page)).index).toBe(0);
    expect((await state(page)).zoom.scale).toBeGreaterThan(1);
  });

  test("Safari's gesture events zoom to their scale", async ({ page }) => {
    await open(page, [[4000, 3000]]);
    await safariPinch(page, { x: 720, y: 450 }, { scale: 2 });
    expect((await state(page)).zoom.scale).toBeCloseTo(2, 5);
  });
});

test.describe("lightbox zoom with fingers", { tag: "@touch" }, () => {
  async function center(page: Page) {
    const box = await photo(page);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  test("a double tap leaves a photo the screen shows whole at fit", async ({
    page,
  }) => {
    await open(page, [[800, 600]]);
    await expect(page.locator(".re-lightbox-zoom")).toBeHidden();
    await tap(page, await center(page), { count: 2 });
    await page.waitForTimeout(500);
    expect((await state(page)).zoom.scale).toBe(1);
  });

  test("a double tap zooms a 4000x3000 photo to its file pixels around the finger", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    const before = await photo(page);
    const at = {
      x: before.x + before.width * 0.4,
      y: before.y + before.height * 0.45,
    };
    const held = share(before, at);
    await tap(page, at, { count: 2 });
    await expect
      .poll(async () => (await state(page)).zoom.scale)
      .toBeGreaterThan(1);
    await still(page);
    expect(Math.abs((await photo(page)).width - 4000)).toBeLessThanOrEqual(1);
    await expectUnder(page, at, held);
  });

  test("a tap during the spring back still lands the photo on its edge", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    await zoomTo(page, 10, { x: 5000, y: 0 });
    const box = await screen(page);
    const y = box.y + box.height / 2;
    await swipe(
      page,
      { x: box.x + box.width * 0.7, y },
      { x: box.x + box.width * 0.3, y },
      { speed: 0.5, hold: 200 },
    );
    const stretched = await photo(page);
    expect(stretched.x + stretched.width).toBeLessThan(box.x + box.width - 5);
    await tap(page, { x: box.x + box.width / 2, y });
    await still(page);
    const frame = await photo(page);
    expect(
      Math.abs(frame.x + frame.width - (box.x + box.width)),
    ).toBeLessThanOrEqual(1);
  });

  test("a pinch to 0.6 closes, and one to 0.85 springs back to fit with the controls hidden", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    await pinch(page, await center(page), { from: 200, to: 170 });
    await still(page);
    expect(await state(page)).toMatchObject({
      isOpen: true,
      zoom: { scale: 1, x: 0, y: 0 },
    });
    await expect(page.locator("dialog")).toHaveAttribute(
      "data-chrome",
      "hidden",
    );
    await pinch(page, await center(page), { from: 300, to: 180 });
    await expect.poll(async () => (await state(page)).isOpen).toBe(false);
  });

  test("lifting one of two fingers lets the other pan the photo", async ({
    page,
  }) => {
    await open(page, [[4000, 3000]]);
    await zoomTo(page, 3, { x: 0, y: 0 });
    await pinchThenPan(page, await center(page), {
      from: 200,
      to: 240,
      pan: { x: -150, y: 0 },
    });
    await still(page);
    const { zoom } = await state(page);
    expect(zoom.scale).toBeGreaterThan(3.2);
    expect(zoom.scale).toBeLessThanOrEqual(3.6);
    expect(zoom.x).toBeLessThan(-100);
  });

  test("at the right edge the first swipe stretches and the second pages to the next photo at fit", async ({
    page,
  }) => {
    await open(page, [
      [4000, 3000],
      [4000, 3000],
      [4000, 3000],
    ]);
    await zoomTo(page, 10, { x: 5000, y: 0 });
    const box = await screen(page);
    const y = box.y + box.height / 2;
    const from = { x: box.x + box.width * 0.7, y };
    const to = { x: box.x + box.width * 0.3, y };
    await tap(page, { x: box.x + box.width / 2, y });
    await page.waitForTimeout(400);
    await swipe(page, from, to, { speed: 0.5, hold: 150 });
    await still(page);
    expect((await state(page)).index).toBe(0);
    expect((await state(page)).zoom.scale).toBeGreaterThan(1);
    await swipe(page, from, to, { speed: 0.5, hold: 150 });
    await expect.poll(async () => (await state(page)).index).toBe(1);
    expect((await state(page)).zoom).toEqual({ scale: 1, x: 0, y: 0 });
  });
});
