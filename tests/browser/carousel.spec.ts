import { expect, type Page, test } from "@playwright/test";
import { framesUntilIdle, mount } from "./harness";

// @ts-expect-error CarouselInternals lives in @reuse-sh/carousel/internal, not in the public entry point.
type _PublicInternals = import("/modules/carousel/index.js").CarouselInternals;

const slides = Array.from(
  { length: 6 },
  (_, index) =>
    `<div data-carousel-slide style="flex:0 0 300px;height:200px;background:hsl(${index * 50} 60% 60%)">${index}</div>`,
).join("");

async function setup(page: Page) {
  await mount(
    page,
    `<div id="strip" style="width:600px;--re-carousel-gap:0px">${slides}</div>`,
    ["carousel/styles.css"],
  );
  await page.evaluate(async () => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const strip = document.getElementById("strip") as HTMLElement;
    Object.assign(window, { carousel: createCarousel(strip) });
  });
}

const scrollLeft = "document.getElementById('strip').scrollLeft";

test("a drag release never restores snapping between snap points", async ({
  page,
}) => {
  // Some Chrome builds jump to the snap point in one frame when snapping returns early.
  await setup(page);
  await page.mouse.move(400, 100);
  await page.mouse.down();
  await page.mouse.move(200, 100, { steps: 20 });
  await page.waitForTimeout(150);
  await page.evaluate(() => {
    const strip = document.getElementById("strip") as HTMLElement;
    const restored: number[] = [];
    new MutationObserver((records) => {
      const values = records.map((record) => record.oldValue ?? "");
      values.push(strip.getAttribute("style") ?? "");
      for (const value of values.slice(1))
        if (!value.includes("scroll-snap-type"))
          restored.push(strip.scrollLeft);
    }).observe(strip, { attributeFilter: ["style"], attributeOldValue: true });
    Object.assign(window, { restored });
  });
  const frames = framesUntilIdle(page, scrollLeft);
  await page.mouse.up();
  const values = await frames;
  expect(values.at(-1)).toBe(300);
  expect(values.length).toBeGreaterThan(4);
  const restored = await page.evaluate(
    () => (window as unknown as { restored: number[] }).restored,
  );
  expect(restored.every((position) => position % 300 === 0)).toBe(true);
});

test("a short fast flick moves on to the next slide", async ({ page }) => {
  await setup(page);
  await page.mouse.move(400, 100);
  await page.mouse.down();
  await page.mouse.move(355, 100, { steps: 3 });
  await page.mouse.up();
  const values = await framesUntilIdle(page, scrollLeft);
  expect(values.at(-1)).toBe(300);
});

test("a slide resizing during a smooth scroll does not cut the travel short", async ({
  page,
}) => {
  await setup(page);
  const frames = framesUntilIdle(page, scrollLeft);
  await page.evaluate(() => {
    (
      window as unknown as { carousel: { goTo(i: number): void } }
    ).carousel.goTo(3);
    setTimeout(() => {
      const slide = document.querySelector<HTMLElement>(
        "[data-carousel-slide]",
      );
      if (slide) slide.style.height = "260px";
    }, 60);
  });
  const values = await frames;
  expect(values.at(-1)).toBe(900);
  const steps = values.slice(1).map((value, index) => value - values[index]);
  expect(Math.max(...steps)).toBeLessThan(300);
});

test("a click during a smooth scroll travels on to a snap point instead of stopping or jumping", async ({
  page,
}) => {
  await setup(page);
  await page.mouse.move(300, 100);
  await page.evaluate(() =>
    (
      window as unknown as { carousel: { goTo(i: number): void } }
    ).carousel.goTo(4),
  );
  await page.waitForFunction(
    () => {
      const strip = document.getElementById("strip") as HTMLElement;
      if (strip.scrollLeft === 0) return false;
      strip.addEventListener(
        "pointerdown",
        () => Object.assign(window, { caught: strip.scrollLeft }),
        { capture: true, once: true },
      );
      return true;
    },
    undefined,
    { polling: "raf" },
  );
  const frames = framesUntilIdle(page, scrollLeft);
  await page.mouse.down();
  await page.waitForTimeout(30);
  await page.mouse.up();
  const caught = await page.evaluate(
    () => (window as unknown as { caught: number }).caught,
  );
  const values = [caught, ...(await frames)];
  expect(caught).toBeGreaterThan(0);
  expect(caught).toBeLessThan(1200);
  expect((values.at(-1) ?? 1) % 300).toBe(0);
  const steps = values.slice(1).map((value, index) => value - values[index]);
  expect(Math.max(...steps.map(Math.abs))).toBeLessThan(150);
  expect(
    await page.evaluate(
      () => document.getElementById("strip")?.style.scrollSnapType,
    ),
  ).toBe("");
});

test("creating a strip measures it once, and a resize or a new padding in either box sizing measures it again", async ({
  page,
}) => {
  await mount(
    page,
    `<div id="strip" style="width:600px;--re-carousel-gap:0px">${slides}</div>`,
    ["carousel/styles.css"],
  );
  const refreshes = await page.evaluate(async () => {
    const strip = document.getElementById("strip") as HTMLElement;
    let reads = 0;
    const read = window.getComputedStyle;
    window.getComputedStyle = (element, pseudo) => {
      if (element instanceof HTMLElement && element.parentElement === strip)
        reads++;
      return read(element, pseudo);
    };
    const frames = (count: number) =>
      new Promise<void>((resolve) => {
        const tick = () => (--count ? requestAnimationFrame(tick) : resolve());
        requestAnimationFrame(tick);
      });
    const { createCarousel } = await import("/modules/carousel/index.js");
    createCarousel(strip);
    await frames(5);
    const created = reads / 6;
    strip.style.width = "500px";
    await frames(5);
    const resized = reads / 6 - created;
    strip.style.boxSizing = "border-box";
    await frames(5);
    strip.style.paddingInline = "60px";
    await frames(5);
    const padded = reads / 6 - created - resized;
    strip.style.boxSizing = "content-box";
    await frames(5);
    const before = reads / 6;
    strip.style.paddingInline = "20px";
    await frames(5);
    return {
      created,
      resized,
      padded,
      paddedContentBox: reads / 6 - before,
    };
  });
  expect(refreshes).toEqual({
    created: 1,
    resized: 1,
    padded: 1,
    paddedContentBox: 1,
  });
});

test("a percentage scroll padding places the slide at the padded edge", async ({
  page,
}) => {
  await mount(
    page,
    `<div id="strip" style="box-sizing:border-box;width:800px;--re-carousel-gap:0px;padding-inline:100px;scroll-padding-inline:max(20px, (100% - 600px) / 2)">${slides}</div>`,
    ["carousel/styles.css"],
  );
  const result = await page.evaluate(async () => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const strip = document.getElementById("strip") as HTMLElement;
    const carousel = createCarousel(strip);
    carousel.goTo(2, "instant");
    const edge = (index: number) =>
      strip.children[index].getBoundingClientRect().left -
      strip.getBoundingClientRect().left;
    return {
      scrollLeft: strip.scrollLeft,
      edge: edge(2),
      index: carousel.getState().index,
      children: strip.childElementCount,
    };
  });
  expect(result).toEqual({ scrollLeft: 600, edge: 100, index: 2, children: 6 });
});

test("a drag past the end stretches the slides, keeps the scroll edge, and springs back", async ({
  page,
}) => {
  await setup(page);
  const edge = await page.evaluate(() => {
    const strip = document.getElementById("strip") as HTMLElement;
    strip.scrollTo({ left: strip.scrollWidth, behavior: "instant" });
    return { left: strip.scrollLeft, width: strip.scrollWidth };
  });
  await page.mouse.move(400, 100);
  await page.mouse.down();
  await page.mouse.move(100, 100, { steps: 20 });
  const pulled = await page.evaluate(() => {
    const strip = document.getElementById("strip") as HTMLElement;
    const slide = strip.querySelector<HTMLElement>("[data-carousel-slide]");
    return {
      left: strip.scrollLeft,
      width: strip.scrollWidth,
      shift: Number.parseFloat(slide?.style.translate ?? ""),
      cursor: getComputedStyle(strip).cursor,
    };
  });
  expect(pulled.left).toBe(edge.left);
  expect(pulled.width).toBe(edge.width);
  expect(pulled.shift).toBeLessThan(-30);
  expect(pulled.shift).toBeGreaterThan(-300);
  expect(pulled.cursor).toBe("grabbing");
  await page.mouse.up();
  await framesUntilIdle(
    page,
    "document.querySelector('#strip [data-carousel-slide]').style.translate",
  );
  const settled = await page.evaluate(() => {
    const strip = document.getElementById("strip") as HTMLElement;
    return {
      left: strip.scrollLeft,
      translate: strip.querySelector<HTMLElement>("[data-carousel-slide]")
        ?.style.translate,
      cursor: getComputedStyle(strip).cursor,
    };
  });
  expect(settled).toEqual({ left: edge.left, translate: "", cursor: "grab" });
});

async function thumbnails(page: Page) {
  const count = 12;
  const views = Array.from(
    { length: count },
    (_, index) =>
      `<div data-carousel-slide style="flex:0 0 300px;height:150px;background:hsl(${index * 30} 60% 60%)">${index}</div>`,
  ).join("");
  const thumbs = Array.from(
    { length: count },
    (_, index) =>
      `<button type="button" class="thumb" aria-label="Show slide ${index + 1}" style="flex:none;width:68px;height:48px;padding:0;border:0;background:hsl(${index * 30} 60% 60%)">${index}</button>`,
  ).join("");
  await mount(
    page,
    `<div id="main" style="width:300px;--re-carousel-gap:0px">${views}</div>
    <div id="thumbs" style="width:456px;display:flex;gap:8px;padding:4px;overflow-x:auto;--re-carousel-gap:8px;--re-carousel-slide-width:68px">${thumbs}</div>`,
    ["carousel/styles.css"],
  );
  await page.evaluate(async () => {
    const { connectThumbnails, createCarousel } = await import(
      "/modules/carousel/index.js"
    );
    const main = createCarousel(
      document.getElementById("main") as HTMLElement,
      {
        loop: false,
      },
    );
    const strip = createCarousel(
      document.getElementById("thumbs") as HTMLElement,
      { slides: ".thumb" },
    );
    const disconnect = connectThumbnails(main, strip);
    Object.assign(window, { main, strip, disconnect });
  });
}

const mainIndex = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as { main: { getState(): { index: number } } }
      ).main.getState().index,
  );

async function thumbCenter(page: Page, index: number) {
  return page.evaluate((target) => {
    const thumb = document.querySelectorAll(".thumb")[target] as HTMLElement;
    const box = thumb.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    if (!thumb.contains(document.elementFromPoint(x, y)))
      throw new Error(`Thumbnail ${target} is out of view.`);
    return { x, y };
  }, index);
}

const stripMoving = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const strip = document.getElementById("thumbs") as HTMLElement;
        const before = strip.scrollLeft;
        requestAnimationFrame(() => resolve(strip.scrollLeft !== before));
      }),
  );

test("quick thumbnail clicks while the strip still moves each pick their slide", async ({
  page,
}) => {
  await thumbnails(page);
  await page.waitForTimeout(150);
  for (const [step, index] of [3, 4, 5, 2].entries()) {
    if (step > 0) expect(await stripMoving(page)).toBe(true);
    const { x, y } = await thumbCenter(page, index);
    await page.mouse.click(x, y);
    expect(await mainIndex(page)).toBe(index);
    await page.waitForTimeout(60);
  }
  await framesUntilIdle(page, "document.getElementById('thumbs').scrollLeft");
  const start = await thumbCenter(page, 4);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x - 40, start.y, { steps: 5 });
  await page.mouse.up();
  expect(await mainIndex(page)).toBe(2);

  await page.evaluate(() => {
    const { disconnect, strip } = window as unknown as {
      disconnect(): void;
      strip: { goTo(index: number): void };
    };
    disconnect();
    document.getElementById("thumbs")?.addEventListener("click", (event) =>
      Object.assign(window, {
        clicked: (event.target as Element).closest(".thumb") !== null,
      }),
    );
    strip.goTo(11);
  });
  expect(await stripMoving(page)).toBe(true);
  const late = await page.evaluate(() => {
    const box = (
      document.getElementById("thumbs") as HTMLElement
    ).getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  });
  await page.mouse.click(late.x, late.y);
  expect(
    await page.evaluate(() => (window as { clicked?: boolean }).clicked),
  ).toBeUndefined();
  await page.waitForTimeout(150);
  await framesUntilIdle(page, "document.getElementById('thumbs').scrollLeft");
  await page.mouse.click(late.x, late.y);
  expect(
    await page.evaluate(() => (window as { clicked?: boolean }).clicked),
  ).toBe(true);
});

test("a click right after an instant goTo reaches the slide, since the strip is not moving", async ({
  page,
}) => {
  await setup(page);
  await page.mouse.move(300, 100);
  const jumped = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const strip = document.getElementById("strip") as HTMLElement;
        strip.addEventListener("click", () =>
          Object.assign(window, { clicked: true }),
        );
        (
          window as unknown as {
            carousel: { goTo(index: number, behavior: string): void };
          }
        ).carousel.goTo(3, "instant");
        strip.addEventListener("scroll", () => resolve(performance.now()), {
          once: true,
        });
      }),
  );
  await page.mouse.click(300, 100);
  const elapsed = await page.evaluate(
    (time) => performance.now() - time,
    jumped,
  );
  expect(elapsed).toBeLessThan(100);
  expect(
    await page.evaluate(() => (window as { clicked?: boolean }).clicked),
  ).toBe(true);
});

test("a strip whose slides take their width from the package stylesheet overflows from the start", async ({
  page,
}) => {
  await mount(
    page,
    `<div id="strip" style="width:600px;--re-carousel-slide-width:100%">${Array.from(
      { length: 4 },
      () =>
        `<figure data-carousel-slide style="margin:0;height:100px"></figure>`,
    ).join("")}</div><button data-carousel-next>Next</button>`,
    ["carousel/styles.css"],
  );
  const state = await page.evaluate(async () => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const strip = document.getElementById("strip") as HTMLElement;
    const carousel = createCarousel(strip);
    return {
      static: strip.hasAttribute("data-re-static"),
      canNext: carousel.getState().canNext,
    };
  });
  expect(state).toEqual({ static: false, canNext: true });
});

test("slides keep their size during a mouse drag unless the page sets a press scale", async ({
  page,
}) => {
  await setup(page);
  const pressed = async () => {
    await page.mouse.move(400, 100);
    await page.mouse.down();
    await page.mouse.move(300, 100, { steps: 10 });
    await page.waitForTimeout(400);
    const scale = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector("#strip > [data-carousel-slide]") as Element,
        ).scale,
    );
    await page.mouse.up();
    await page.waitForTimeout(700);
    return scale;
  };
  expect(await pressed()).toBe("none");
  await page.evaluate(() =>
    (document.getElementById("strip") as HTMLElement).style.setProperty(
      "--re-carousel-press-scale",
      "0.96",
    ),
  );
  expect(await pressed()).toBe("0.96");
});

test("an arrow key during a held mouse drag pages on and the release keeps the page", async ({
  page,
}) => {
  await setup(page);
  await page.focus("#strip");
  await page.mouse.move(400, 100);
  await page.mouse.down();
  await page.mouse.move(340, 100, { steps: 8 });
  await page.keyboard.press("ArrowRight");
  await page.mouse.move(380, 100, { steps: 4 });
  await page.mouse.up();
  const values = await framesUntilIdle(page, scrollLeft);
  expect(values.at(-1)).toBe(300);
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as { carousel: { getState(): { index: number } } }
        ).carousel.getState().index,
    ),
  ).toBe(1);
});

for (const release of ["over the strip", "outside the strip"])
  test(`an arrow key that ends a held mouse drag keeps the release ${release} from clicking, and the next click goes through`, {
    tag: "@desktop",
  }, async ({ page }) => {
    await mount(
      page,
      `<div id="strip" style="width:600px;--re-carousel-gap:0px">${Array.from(
        { length: 6 },
        (_, index) =>
          `<div data-carousel-slide style="flex:0 0 300px;height:200px"><button type="button" style="width:100%;height:100%">${index}</button></div>`,
      ).join("")}</div>`,
      ["carousel/styles.css"],
    );
    await page.evaluate(async () => {
      const { createCarousel } = await import("/modules/carousel/index.js");
      const strip = document.getElementById("strip") as HTMLElement;
      const clicks: string[] = [];
      window.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        if (strip.contains(target)) clicks.push(target.textContent ?? "");
      });
      Object.assign(window, { carousel: createCarousel(strip), clicks });
    });
    const clicks = () =>
      page.evaluate(() => (window as unknown as { clicks: string[] }).clicks);
    await page.focus("#strip");
    await page.mouse.move(400, 100);
    await page.mouse.down();
    await page.mouse.move(340, 100, { steps: 8 });
    await page.keyboard.press("ArrowRight");
    await framesUntilIdle(page, scrollLeft);
    if (release === "outside the strip") await page.mouse.move(400, 400);
    await page.mouse.up();
    expect(await clicks()).toEqual([]);
    await page.focus("#strip button >> nth=1");
    await page.keyboard.press("Enter");
    expect(await clicks()).toEqual(["1"]);
  });

test("next() during a held mouse drag across the seam of a looped strip moves one slide forward", {
  tag: "@desktop",
}, async ({ page }) => {
  await mount(
    page,
    `<div id="strip" style="width:600px;--re-carousel-gap:0px">${slides}</div>`,
    ["carousel/styles.css"],
  );
  await page.evaluate(async () => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const strip = document.getElementById("strip") as HTMLElement;
    Object.assign(window, { carousel: createCarousel(strip, { loop: true }) });
  });
  await framesUntilIdle(page, scrollLeft);
  const first =
    "Math.round(document.querySelector('#strip > [data-carousel-slide]').getBoundingClientRect().left - document.getElementById('strip').getBoundingClientRect().left)";
  await page.mouse.move(200, 100);
  await page.mouse.down();
  await page.mouse.move(500, 100, { steps: 10 });
  expect(await page.evaluate(first)).toBe(300);
  await page.evaluate(() =>
    (window as unknown as { carousel: { next(): void } }).carousel.next(),
  );
  const values = await framesUntilIdle(page, first);
  await page.mouse.up();
  expect(values.filter((value) => value < -1 || value > 301)).toEqual([]);
  expect(
    values.filter((value, at) => at && value > values[at - 1] + 1),
  ).toEqual([]);
  expect(values.at(-1)).toBe(0);
});
