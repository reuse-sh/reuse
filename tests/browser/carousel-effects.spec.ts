import { expect, type Page, test } from "@playwright/test";
import { framesUntilIdle, mount, swipe } from "./harness";

type Strip = {
  next(): void;
  prev(): void;
  goTo(index: number, behavior?: ScrollBehavior): void;
  refresh(): void;
  destroy(): void;
  getState(): {
    index: number;
    count: number;
    progress: number;
    isLooping: boolean;
    seamSlides: readonly number[];
  };
  take(
    owner: string,
    options?: { onInterrupt?: () => void },
  ): { setPosition(px: number): void; release(): void };
};

const row = (count: number, width = 300, from = 0) =>
  Array.from(
    { length: count },
    (_, index) =>
      `<div data-carousel-slide style="flex:0 0 ${width}px;height:200px;background:hsl(${(from + index) * 40} 60% 60%)">${from + index}</div>`,
  ).join("");

async function setup(
  page: Page,
  body: string,
  options: Record<string, unknown> = {},
) {
  await mount(page, body, ["carousel/styles.css"]);
  await page.evaluate(async (settings) => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const strip = document.getElementById("strip") as HTMLElement;
    Object.assign(window, { carousel: createCarousel(strip, settings) });
  }, options);
}

const scrollLeft = "document.getElementById('strip').scrollLeft";

// Each slide's offset and where its alignment point sits on screen, in slide widths.
function offsets(page: Page) {
  return page.evaluate(() => {
    const strip = document.getElementById("strip") as HTMLElement;
    const box = strip.getBoundingClientRect();
    const rtl = getComputedStyle(strip).direction === "rtl";
    return [
      ...strip.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
    ].map((slide) => {
      const rect = slide.getBoundingClientRect();
      return {
        offset: Number(slide.style.getPropertyValue("--re-carousel-offset")),
        measured:
          (rtl ? box.right - rect.right : rect.left - box.left) / rect.width,
        shift: slide.style.getPropertyValue("--re-carousel-shift"),
        cycle: slide.dataset.reCycle,
        transform: slide.style.transform,
      };
    });
  });
}

test("a looped slide shows its shift and offset and keeps its own transform", async ({
  page,
}) => {
  await setup(
    page,
    `<div id="strip" style="width:600px;--re-carousel-gap:0px">${row(8)}</div>`,
    { loop: true },
  );
  await page.evaluate(() =>
    document
      .querySelectorAll<HTMLElement>("[data-carousel-slide]")
      .forEach((slide) => {
        slide.style.transform = "translateY(4px)";
      }),
  );
  await page.evaluate(() =>
    (window as unknown as { carousel: Strip }).carousel.prev(),
  );
  await framesUntilIdle(page, scrollLeft);
  const slides = await offsets(page);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { carousel: Strip }).carousel.getState().index,
    ),
  ).toBe(7);
  expect(slides.every((slide) => slide.transform === "translateY(4px)")).toBe(
    true,
  );
  expect(slides[7].offset).toBe(0);
  expect(slides[0]).toMatchObject({ offset: 1, cycle: "1" });
  expect(slides[0].shift).not.toBe("0px");
  for (const slide of slides)
    expect(Math.abs(slide.offset - slide.measured)).toBeLessThan(0.01);
});

test("in a right-to-left strip the slide right of the active one has a negative offset", async ({
  page,
}) => {
  await setup(
    page,
    `<div id="strip" dir="rtl" style="width:600px;--re-carousel-gap:0px">${row(8)}</div>`,
    { loop: true },
  );
  await page.evaluate(() =>
    (window as unknown as { carousel: Strip }).carousel.goTo(3, "instant"),
  );
  const slides = await offsets(page);
  expect(slides[2].offset).toBe(-1);
  expect(slides[4].offset).toBe(1);
  for (const slide of slides)
    expect(Math.abs(slide.offset - slide.measured)).toBeLessThan(0.01);
});

test("a driver crosses the seam one pixel at a time and release snaps again", async ({
  page,
}) => {
  await setup(
    page,
    `<div id="strip" style="width:600px;--re-carousel-gap:0px">${row(8)}</div>`,
    { loop: true },
  );
  const steps = await page.evaluate(() => {
    const strip = document.getElementById("strip") as HTMLElement;
    const { carousel } = window as unknown as { carousel: Strip };
    const driver = carousel.take("marquee");
    Object.assign(window, { driver });
    const box = strip.getBoundingClientRect();
    const slides = [
      ...strip.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
    ];
    const lefts = () =>
      slides.map((slide) => slide.getBoundingClientRect().left - box.left);
    const largest: number[] = [];
    driver.setPosition(2340);
    let previous = lefts();
    for (let px = 2341; px <= 2460; px++) {
      driver.setPosition(px);
      const now = lefts();
      largest.push(
        Math.max(
          ...now
            .map((left, index) => Math.abs(left - previous[index] + 1))
            .filter((_gap, index) => now[index] > -300 && now[index] < 600),
        ),
      );
      previous = now;
    }
    return { largest, snap: strip.style.scrollSnapType };
  });
  expect(steps.snap).toBe("none");
  expect(Math.max(...steps.largest)).toBeLessThanOrEqual(1);
  await page.evaluate(() =>
    (
      window as unknown as { driver: { setPosition(px: number): void } }
    ).driver.setPosition(2500),
  );
  await page.evaluate(() =>
    (window as unknown as { driver: { release(): void } }).driver.release(),
  );
  const values = await framesUntilIdle(page, scrollLeft);
  expect((values.at(-1) ?? 1) % 300).toBe(0);
  expect(
    await page.evaluate(
      () => document.getElementById("strip")?.style.scrollSnapType,
    ),
  ).toBe("");
});

test("a slide without a width keeps the loop off until it loads", async ({
  page,
}) => {
  const slides = Array.from(
    { length: 8 },
    (_, index) =>
      `<div data-carousel-slide style="flex:0 0 auto;height:200px"><img alt="" style="display:block;height:200px" ${index === 3 ? "" : `src="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"/>')}"`}></div>`,
  ).join("");
  await setup(
    page,
    `<div id="strip" style="width:600px;--re-carousel-gap:0px">${slides}</div>`,
    { loop: true },
  );
  await page.waitForTimeout(200);
  const looping = () =>
    page.evaluate(
      () =>
        (window as unknown as { carousel: Strip }).carousel.getState()
          .isLooping,
    );
  expect(await looping()).toBe(false);
  await page.evaluate(() => {
    const image = document.querySelectorAll<HTMLImageElement>("#strip img")[3];
    image.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"/>')}`;
    return image.decode();
  });
  await expect.poll(looping).toBe(true);
});

test("slides added while the seam is on screen leave the active slide in place", async ({
  page,
}) => {
  await setup(
    page,
    `<div id="strip" style="width:600px;--re-carousel-gap:0px">${row(8)}</div>`,
    { loop: true },
  );
  const read = () =>
    page.evaluate(() => {
      const { carousel } = window as unknown as { carousel: Strip };
      const state = carousel.getState();
      const slide = document.querySelectorAll("[data-carousel-slide]")[7];
      const { left, top, width } = slide.getBoundingClientRect();
      return {
        index: state.index,
        count: state.count,
        looping: state.isLooping,
        rect: { left, top, width },
        right: document
          .elementFromPoint(450, 100)
          ?.closest("[data-carousel-slide]")?.textContent,
      };
    });
  await page.evaluate(() =>
    (window as unknown as { carousel: Strip }).carousel.goTo(7, "instant"),
  );
  const before = await read();
  expect(before).toMatchObject({ index: 7, right: "0", looping: true });
  await page.evaluate(
    (added) =>
      document.getElementById("strip")?.insertAdjacentHTML("beforeend", added),
    row(5, 300, 8),
  );
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve)),
  );
  expect(await read()).toEqual({
    ...before,
    count: 13,
    right: "8",
  });
});

test("the documented center padding brings the first and last slides to the middle", async ({
  page,
}) => {
  await setup(
    page,
    `<div id="strip" style="--re-carousel-gap:0px;--re-carousel-slide-width:320px;padding-inline:calc(50% - 160px);scroll-padding-inline:calc(50% - 160px)">${row(6, 320)}</div>`,
    { align: "center" },
  );
  const center = (index: number) =>
    page.evaluate((at) => {
      const { carousel } = window as unknown as { carousel: Strip };
      carousel.goTo(at, "instant");
      const slide = document.querySelectorAll("[data-carousel-slide]")[at];
      const rect = slide.getBoundingClientRect();
      return rect.left + rect.width / 2 - window.innerWidth / 2;
    }, index);
  expect(Math.abs(await center(0))).toBeLessThan(1);
  expect(Math.abs(await center(5))).toBeLessThan(1);
});

test.describe("carousel groups and drivers on touch", { tag: "@touch" }, () => {
  const groups = (page: Page) =>
    setup(
      page,
      `<div id="strip" style="width:360px;--re-carousel-gap:0px">${row(9, 120)}</div>`,
      { group: 3 },
    );

  test("group 3 snaps only group starts and destroy gives back each slide's snap", async ({
    page,
  }) => {
    await groups(page);
    const aligns = () =>
      page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
        ].map((slide) => slide.style.scrollSnapAlign),
      );
    expect((await aligns()).slice(0, 6)).toEqual([
      "start",
      "none",
      "none",
      "start",
      "none",
      "none",
    ]);
    await page.evaluate(() =>
      (window as unknown as { carousel: Strip }).carousel.destroy(),
    );
    expect(new Set(await aligns())).toEqual(new Set([""]));
  });

  test("a one-slide swipe on group 3 moves one whole group", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "needs native touch scrolling");
    await groups(page);
    await swipe(page, { x: 250, y: 100 }, { x: 110, y: 100 }, { speed: 0.6 });
    const values = await framesUntilIdle(page, scrollLeft, 400);
    expect(values.at(-1)).toBe(360);
  });

  test("a touch takes the position back from a driver", async ({ page }) => {
    await setup(
      page,
      `<div id="strip" style="width:360px;--re-carousel-gap:0px">${row(9, 120)}</div>`,
      { loop: true },
    );
    await page.evaluate(() => {
      const { carousel } = window as unknown as { carousel: Strip };
      const record = { interrupted: 0 };
      const driver = carousel.take("marquee", {
        onInterrupt: () => record.interrupted++,
      });
      driver.setPosition(50);
      Object.assign(window, { record });
    });
    await swipe(page, { x: 250, y: 100 }, { x: 200, y: 100 });
    await framesUntilIdle(page, scrollLeft, 400);
    const after = await page.evaluate(() => ({
      interrupted: (window as unknown as { record: { interrupted: number } })
        .record.interrupted,
      snap: document.getElementById("strip")?.style.scrollSnapType,
      left: document.getElementById("strip")?.scrollLeft ?? 1,
    }));
    expect(after).toMatchObject({ interrupted: 1, snap: "" });
    expect(after.left % 120).toBe(0);
  });

  const A = { x: 200, y: 100, id: 0 };
  const B = { x: 200, y: 600, id: 1 };
  for (const [name, steps, lift] of [
    [
      "a vertical page swipe that starts on a taken strip leaves it on a snap point",
      [
        ["touchStart", [A]],
        ["touchMove", [{ ...A, y: 60 }]],
        ["touchMove", [{ ...A, y: 20 }]],
        ["touchEnd", []],
      ],
      [],
    ],
    [
      "a second finger outside the strip does not keep it from settling",
      [
        ["touchStart", [A, B]],
        ["touchEnd", [A]],
      ],
      [B],
    ],
  ] as const)
    test(name, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "needs trusted CDP touches");
      await setup(
        page,
        `<div id="strip" style="width:360px;--re-carousel-gap:0px">${row(9, 120)}</div><div style="height:3000px"></div>`,
        { loop: true },
      );
      await page.evaluate(() => {
        const { carousel } = window as unknown as { carousel: Strip };
        const record = { settles: 0 };
        document
          .getElementById("strip")
          ?.addEventListener("re-carousel:settle", () => record.settles++);
        carousel.take("marquee").setPosition(50);
        Object.assign(window, { record });
      });
      const cdp = await page.context().newCDPSession(page);
      for (const [type, touchPoints] of steps) {
        await cdp.send("Input.dispatchTouchEvent", {
          type,
          touchPoints: [...touchPoints],
        });
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(400);
      await framesUntilIdle(page, scrollLeft, 300);
      const after = await page.evaluate(() => ({
        settles: (window as unknown as { record: { settles: number } }).record
          .settles,
        snap: document.getElementById("strip")?.style.scrollSnapType,
        left: document.getElementById("strip")?.scrollLeft ?? 1,
      }));
      expect(after.settles).toBeGreaterThan(0);
      expect(after.snap).toBe("");
      expect(after.left % 120).toBe(0);
      if (lift.length)
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [...lift],
        });
      await cdp.detach();
    });
});

// A browser rounds scrollLeft to device pixels, so a looped strip with fractional sizes
// rests a fraction away from its measured snap points.
for (const scale of [1, 1.5, 2])
  test.describe(`a looped strip at device pixel ratio ${scale}`, () => {
    test.use({ deviceScaleFactor: scale });

    test("with fractional sizes comes to rest after creation and after crossing the seam", {
      tag: "@desktop",
    }, async ({ page }) => {
      const strips = [601.7, 599.3, 640.5, 377.25].flatMap((width) =>
        [7.3, 0.5, 12.6].flatMap((gap) =>
          ["33.33%", "47.5%"].map((slide) => ({ width, gap, slide })),
        ),
      );
      await mount(
        page,
        strips
          .map(
            ({ width, gap, slide }) =>
              `<div class="strip" data-case="${width}px ${gap}px ${slide}" style="width:${width}px;margin-left:3.3px;--re-carousel-gap:${gap}px">${Array.from(
                { length: 9 },
                (_, index) =>
                  `<div data-carousel-slide style="flex:0 0 ${slide};height:20px">${index}</div>`,
              ).join("")}</div>`,
          )
          .join(""),
        ["carousel/styles.css"],
      );
      await page.evaluate(async () => {
        const { createCarousel } = await import("/modules/carousel/index.js");
        const carousels = [
          ...document.querySelectorAll<HTMLElement>(".strip"),
        ].map((strip) => createCarousel(strip, { loop: true }));
        Object.assign(window, { carousels });
      });
      // Resolves once no strip has scrolled for 400ms, naming the strips still moving after 3s.
      const moving = () =>
        page.evaluate(
          () =>
            new Promise<string[]>((resolve) => {
              const elements = [
                ...document.querySelectorAll<HTMLElement>(".strip"),
              ];
              const last = elements.map((strip) => strip.scrollLeft);
              const changed = elements.map(() => performance.now());
              const started = performance.now();
              const tick = () => {
                const now = performance.now();
                elements.forEach((strip, index) => {
                  if (strip.scrollLeft === last[index]) return;
                  last[index] = strip.scrollLeft;
                  changed[index] = now;
                });
                const busy = elements
                  .filter((_, index) => now - changed[index] < 400)
                  .map((strip) => strip.dataset.case ?? "");
                if (!busy.length || now - started > 3000) resolve(busy);
                else requestAnimationFrame(tick);
              };
              requestAnimationFrame(tick);
            }),
        );
      const each = (method: "prev" | "next") =>
        page.evaluate((name) => {
          for (const carousel of (window as unknown as { carousels: Strip[] })
            .carousels)
            carousel[name]();
        }, method);
      // Names the strips not resting on the first slide with a progress of 0.
      const awayFromStart = () =>
        page.evaluate(() =>
          (window as unknown as { carousels: Strip[] }).carousels.flatMap(
            (carousel, at) => {
              const { index, progress } = carousel.getState();
              return index === 0 && progress < 0.01
                ? []
                : [`${at} index ${index} progress ${progress}`];
            },
          ),
        );
      expect(await moving()).toEqual([]);
      expect(await awayFromStart()).toEqual([]);
      await each("prev");
      expect(await moving()).toEqual([]);
      await each("next");
      expect(await moving()).toEqual([]);
      expect(await awayFromStart()).toEqual([]);
    });
  });
