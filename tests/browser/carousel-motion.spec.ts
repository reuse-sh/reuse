import { expect, type Page, test } from "@playwright/test";
import { framesUntilIdle, mount, swipe } from "./harness";

type Strip = {
  next(): void;
  goTo(index: number): void;
  getState(): { index: number };
};

const slideRow = (count: number, width = 300) =>
  Array.from(
    { length: count },
    (_, index) =>
      `<div data-carousel-slide style="flex:0 0 ${width}px;height:200px;background:hsl(${index * 50} 60% 60%)">${index}</div>`,
  ).join("");

async function setup(
  page: Page,
  body = `<div id="strip" style="width:600px;--re-carousel-gap:0px">${slideRow(6)}</div>`,
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

// Presses next() at each delay from a frame and samples the strip on every frame until it rests.
function pressNext(page: Page, delays: number[]) {
  return page.evaluate(
    ([presses, idle]) =>
      new Promise<{ time: number; left: number }[]>((resolve) => {
        const strip = document.getElementById("strip") as HTMLElement;
        const { carousel } = window as unknown as { carousel: Strip };
        requestAnimationFrame(() => {
          const start = performance.now();
          for (const delay of presses)
            if (delay) setTimeout(() => carousel.next(), delay);
            else carousel.next();
          const samples = [{ time: 0, left: strip.scrollLeft }];
          let changed = start;
          const tick = () => {
            const now = performance.now();
            if (strip.scrollLeft !== samples.at(-1)?.left) changed = now;
            samples.push({ time: now - start, left: strip.scrollLeft });
            if (now - changed > idle) resolve(samples);
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }),
    [delays, 250] as const,
  );
}

function settledAt(samples: { time: number; left: number }[]) {
  const last = samples.at(-1)?.left;
  return samples.find((sample) => sample.left === last)?.time ?? 0;
}

test.describe("carousel spring", { tag: "@desktop" }, () => {
  test("next() from the first slide settles on the second in 450 to 550ms", async ({
    page,
  }) => {
    await setup(page);
    const values = await pressNext(page, [0]);
    expect(values.at(-1)?.left).toBe(300);
    const time = settledAt(values);
    expect(time).toBeGreaterThanOrEqual(450);
    expect(time).toBeLessThanOrEqual(550);
  });

  test("a mouse flick on a full-width strip covers 90% of the way to the next slide within 250ms, like next()", async ({
    page,
  }) => {
    await setup(
      page,
      `<div id="strip" style="width:100vw;--re-carousel-gap:0px">${slideRow(6, 1440)}</div>`,
    );
    const width = await page.evaluate(() => innerWidth);
    await page.evaluate(() => {
      const strip = document.getElementById("strip") as HTMLElement;
      const record = { released: 0, samples: [] as [number, number][] };
      addEventListener(
        "pointerup",
        () => {
          record.released = performance.now();
          const tick = () => {
            record.samples.push([
              performance.now() - record.released,
              strip.scrollLeft,
            ]);
            requestAnimationFrame(tick);
          };
          tick();
        },
        { capture: true, once: true },
      );
      Object.assign(window, { record });
    });
    await swipe(page, { x: 1100, y: 100 }, { x: 700, y: 100 }, { speed: 2 });
    await framesUntilIdle(page, scrollLeft);
    const samples = await page.evaluate(
      () =>
        (window as unknown as { record: { samples: [number, number][] } })
          .record.samples,
    );
    expect(samples.at(-1)?.[1]).toBe(width);
    const start = samples[0][1];
    const reached = samples.find(
      ([, left]) => left - start >= 0.9 * (width - start),
    );
    expect(reached?.[0]).toBeLessThanOrEqual(250);
  });

  test("three next() presses within 200ms reach the fourth slide without stopping or turning back", async ({
    page,
  }) => {
    await setup(page);
    const values = await pressNext(page, [0, 100, 200]);
    expect(values.at(-1)?.left).toBe(900);
    const steps = values
      .slice(1)
      .map((sample, index) => sample.left - values[index].left);
    expect(Math.min(...steps)).toBeGreaterThanOrEqual(0);
    const moving = values.findIndex((sample) => sample.left > 0);
    const third = values.findIndex((sample) => sample.time > 220);
    expect(steps.slice(moving, third).filter((step) => step === 0)).toEqual([]);
  });

  test("next() moves on from where a native scroll left the strip", async ({
    page,
  }) => {
    await setup(page);
    await page.evaluate(() =>
      document
        .getElementById("strip")
        ?.scrollTo({ left: 600, behavior: "instant" }),
    );
    await page.waitForTimeout(300);
    const values = await pressNext(page, [0]);
    expect(values.at(-1)?.left).toBe(900);
  });

  test("next() during a native smooth scroll takes over from it", async ({
    page,
  }) => {
    await setup(page);
    await page.evaluate(() => {
      const { carousel } = window as unknown as { carousel: Strip };
      carousel.goTo(2);
      return new Promise((resolve) => setTimeout(resolve, 800));
    });
    await page.evaluate(() => {
      document
        .getElementById("strip")
        ?.scrollTo({ left: 300, behavior: "smooth" });
      return new Promise((resolve) => setTimeout(resolve, 60));
    });
    const values = await pressNext(page, [0]);
    const rest = values.at(-1)?.left ?? 0;
    expect(rest % 300).toBe(0);
    expect(rest).toBeGreaterThanOrEqual(600);
  });

  test("a wheel during a move stops the spring and the strip glides to the point nearest where it stopped", async ({
    page,
  }) => {
    await setup(page);
    await page.mouse.move(300, 100);
    await page.evaluate(() =>
      (window as unknown as { carousel: Strip }).carousel.goTo(4),
    );
    // The wheel lands on the frame the strip passes 420px, 116 to 150px from the nearest point,
    // since a wheel sent from the test can arrive after the 500ms move on a busy runner. Every
    // frame after it is sampled in the page, so a one-frame jump shows as one step.
    const { stoppedAt, values } = await page.evaluate(
      () =>
        new Promise<{ stoppedAt: number; values: number[] }>((resolve) => {
          const strip = document.getElementById("strip") as HTMLElement;
          const values: number[] = [];
          let stoppedAt = 0;
          let changed = 0;
          const sample = () => {
            const now = performance.now();
            if (strip.scrollLeft !== values.at(-1)) changed = now;
            values.push(strip.scrollLeft);
            if (now - changed > 300) resolve({ stoppedAt, values });
            else requestAnimationFrame(sample);
          };
          const watch = () => {
            if (strip.scrollLeft <= 420) return requestAnimationFrame(watch);
            stoppedAt = strip.scrollLeft;
            changed = performance.now();
            strip.dispatchEvent(
              new WheelEvent("wheel", {
                bubbles: true,
                cancelable: true,
                deltaY: 40,
                clientX: 300,
                clientY: 100,
              }),
            );
            requestAnimationFrame(sample);
          };
          watch();
        }),
    );
    expect(stoppedAt).toBeGreaterThan(420);
    expect(stoppedAt).toBeLessThan(1000);
    const rest = values.at(-1) ?? 0;
    expect(rest % 300).toBe(0);
    expect(Math.abs(rest - stoppedAt)).toBeLessThanOrEqual(150.5);
    const steps = values.map((value, at) =>
      Math.abs(value - (at ? values[at - 1] : stoppedAt)),
    );
    expect(Math.max(...steps)).toBeLessThan(Math.abs(rest - stoppedAt) / 2);
  });

  for (const input of ["wheel", "press"] as const)
    test(`after a ${input} stops a move, the strip waits 180ms before it glides to the nearest point`, async ({
      page,
    }) => {
      await setup(page, undefined, input === "press" ? { drag: false } : {});
      await page.mouse.move(300, 100);
      await page.evaluate(() =>
        (window as unknown as { carousel: Strip }).carousel.goTo(4),
      );
      const { waited, stoppedAt, rest } = await page.evaluate(
        (kind) =>
          new Promise<{ waited: number; stoppedAt: number; rest: number }>(
            (resolve) => {
              const strip = document.getElementById("strip") as HTMLElement;
              let stoppedAt = 0;
              let stopped = 0;
              let waited = -1;
              let changed = 0;
              let last = 0;
              const sample = () => {
                const now = performance.now();
                if (strip.scrollLeft !== last) changed = now;
                last = strip.scrollLeft;
                if (waited < 0 && Math.abs(last - stoppedAt) > 0.5)
                  waited = now - stopped;
                if (now - changed > 300)
                  resolve({ waited, stoppedAt, rest: last });
                else requestAnimationFrame(sample);
              };
              const watch = () => {
                if (strip.scrollLeft <= 420)
                  return requestAnimationFrame(watch);
                strip.dispatchEvent(
                  kind === "wheel"
                    ? new WheelEvent("wheel", {
                        bubbles: true,
                        cancelable: true,
                        deltaY: 40,
                        clientX: 300,
                        clientY: 100,
                      })
                    : new PointerEvent("pointerdown", {
                        bubbles: true,
                        pointerType: "mouse",
                        button: 0,
                        clientX: 300,
                        clientY: 100,
                      }),
                );
                stopped = performance.now();
                stoppedAt = last = strip.scrollLeft;
                changed = stopped;
                requestAnimationFrame(sample);
              };
              watch();
            },
          ),
        input,
      );
      expect(rest % 300).toBe(0);
      expect(Math.abs(rest - stoppedAt)).toBeLessThanOrEqual(150.5);
      expect(waited).toBeGreaterThanOrEqual(180);
    });

  test('moveMotion "native" moves with the browser smooth scroll and the spring does not', async ({
    page,
  }) => {
    const behaviors = async (options: Record<string, unknown>) => {
      await setup(page, undefined, options);
      await page.evaluate(() => {
        const strip = document.getElementById("strip") as HTMLElement;
        const calls: (string | undefined)[] = [];
        const scrollTo = strip.scrollTo.bind(strip);
        strip.scrollTo = ((options: ScrollToOptions) => {
          calls.push(options.behavior);
          scrollTo(options);
        }) as typeof strip.scrollTo;
        Object.assign(window, { calls });
        (window as unknown as { carousel: Strip }).carousel.next();
      });
      await framesUntilIdle(page, scrollLeft);
      return page.evaluate(() => ({
        calls: [
          ...new Set(
            (window as unknown as { calls: (string | undefined)[] }).calls,
          ),
        ],
        left: document.getElementById("strip")?.scrollLeft,
      }));
    };
    const native = await behaviors({ moveMotion: "native" });
    expect(native.calls).toContain("smooth");
    expect(native.left).toBe(300);
    expect(await behaviors({})).toEqual({ calls: ["instant"], left: 300 });
  });
});

test.describe("carousel state", { tag: "@desktop" }, () => {
  test("a fast swipe holds hover until 150ms after its last scroll, and a dot does not", async ({
    page,
  }) => {
    await setup(
      page,
      `<div id="strip" style="width:600px;--re-carousel-gap:0px">${slideRow(12)}</div><button id="dot" style="margin-top:20px">3</button>`,
    );
    await page.evaluate(() => {
      const strip = document.getElementById("strip") as HTMLElement;
      const record = { changes: [] as [number, boolean][], lastScroll: 0 };
      new MutationObserver(() =>
        record.changes.push([
          performance.now(),
          strip.hasAttribute("data-re-scrolling"),
        ]),
      ).observe(strip, { attributeFilter: ["data-re-scrolling"] });
      strip.addEventListener("scroll", () => {
        record.lastScroll = performance.now();
      });
      document
        .getElementById("dot")
        ?.addEventListener("click", () =>
          (window as unknown as { carousel: Strip }).carousel.goTo(3),
        );
      Object.assign(window, { record });
    });
    const read = () =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              record: { changes: [number, boolean][]; lastScroll: number };
            }
          ).record,
      );
    await swipe(page, { x: 550, y: 100 }, { x: 150, y: 100 }, { speed: 1 });
    await page.waitForTimeout(1200);
    const swiped = await read();
    expect(swiped.changes[0]?.[1]).toBe(true);
    const off = swiped.changes.at(-1);
    expect(off?.[1]).toBe(false);
    expect((off?.[0] ?? 0) - swiped.lastScroll).toBeLessThanOrEqual(170);
    await page.evaluate(() => {
      (window as unknown as { record: { changes: unknown[] } }).record.changes =
        [];
    });
    await page.click("#dot");
    await page.waitForTimeout(800);
    expect((await read()).changes).toEqual([]);
  });

  test("a strip without overflow is static and the controls bound to it hide", async ({
    page,
  }) => {
    const controls = `<button data-carousel-prev>Previous</button><button data-carousel-next>Next</button><div data-carousel-dots>dots</div>`;
    await setup(
      page,
      `<section id="fits"><div id="strip" style="width:600px">${slideRow(2, 200)}</div>${controls}</section><section><div id="long" style="width:600px">${slideRow(4)}</div>${controls}</section>`,
    );
    await page.evaluate(async () => {
      const { createCarousel } = await import("/modules/carousel/index.js");
      const { bindCarouselControls } = await import(
        "/modules/carousel/controls.js"
      );
      createCarousel(document.getElementById("long") as HTMLElement);
      const { carousel } = window as unknown as { carousel: never };
      bindCarouselControls(
        document.getElementById("fits") as HTMLElement,
        carousel,
      );
    });
    const strip = page.locator("#strip");
    await expect(strip).toHaveAttribute("data-re-static", "");
    for (const control of await page
      .locator(
        "section:first-child [data-carousel-prev], section:first-child [data-carousel-next], section:first-child [data-carousel-dots]",
      )
      .all())
      await expect(control).toBeHidden();
    const long = page.locator("#long");
    await expect(long).not.toHaveAttribute("data-re-static");
    await expect(long).toHaveAttribute("data-re-at-start", "");
    await expect(long).not.toHaveAttribute("data-re-at-end");
    await expect(
      page.locator("section:last-child [data-carousel-next]"),
    ).toBeVisible();
  });

  test("the package CSS leaves the controls it did not bind, and the page's own rule hides them", async ({
    page,
  }) => {
    const next = `<button data-carousel-next>Next</button>`;
    await setup(
      page,
      `<section id="shared"><div id="strip" style="width:600px">${slideRow(2, 200)}</div>${next}<div><div><div id="wide" style="width:600px">${slideRow(4)}</div></div>${next}</div></section>`,
    );
    await page.evaluate(async () => {
      const { createCarousel } = await import("/modules/carousel/index.js");
      createCarousel(document.getElementById("wide") as HTMLElement);
    });
    await expect(page.locator("#strip")).toHaveAttribute("data-re-static", "");
    await expect(page.locator("#wide")).not.toHaveAttribute("data-re-static");
    const shown = () =>
      page
        .locator("[data-carousel-next]")
        .evaluateAll((buttons) =>
          buttons.map((button) => getComputedStyle(button).display !== "none"),
        );
    expect(await shown()).toEqual([true, true]);
    await page.addStyleTag({
      content:
        "section:has(> [data-re-static]) > [data-carousel-next] { display: none; }",
    });
    expect(await shown()).toEqual([false, true]);
  });

  test("a static strip hides the controls bound to it under a parent of a strip that overflows", async ({
    page,
  }) => {
    const prev = `<button data-carousel-prev>Previous</button>`;
    await setup(
      page,
      `<main><div id="hero" style="width:600px">${slideRow(4)}</div><section><div id="fits" style="width:600px">${slideRow(2, 200)}</div>${prev}</section></main>
      <div><div id="strip" style="width:600px"><div data-carousel-slide style="flex:0 0 600px"><div id="inner" style="width:300px">${slideRow(1, 100)}</div>${prev}</div>${slideRow(2)}</div></div>`,
    );
    await page.evaluate(async () => {
      const { createCarousel } = await import("/modules/carousel/index.js");
      const { bindCarouselControls } = await import(
        "/modules/carousel/controls.js"
      );
      for (const id of ["hero", "fits", "inner"]) {
        const viewport = document.getElementById(id) as HTMLElement;
        const carousel = createCarousel(viewport);
        if (id !== "hero")
          bindCarouselControls(viewport.parentElement as HTMLElement, carousel);
      }
    });
    await expect(page.locator("#inner")).toHaveAttribute("data-re-static", "");
    await expect(page.locator("#fits")).toHaveAttribute("data-re-static", "");
    expect(
      await page
        .locator("[data-carousel-prev]")
        .evaluateAll((buttons) =>
          buttons.map((button) => getComputedStyle(button).display),
        ),
    ).toEqual(["none", "none"]);
  });

  test("a static strip hides the controls bound to it in a group elsewhere", async ({
    page,
  }) => {
    await setup(
      page,
      `<section><div id="strip" style="width:600px">${slideRow(2, 200)}</div></section><div id="long" style="width:600px">${slideRow(4)}</div><div data-carousel-controls="strip"><button data-carousel-prev>Previous</button><button data-carousel-next>Next</button><div data-carousel-dots></div></div>`,
    );
    await page.evaluate(async () => {
      const { createCarousel } = await import("/modules/carousel/index.js");
      const { bindCarouselControls } = await import(
        "/modules/carousel/controls.js"
      );
      createCarousel(document.getElementById("long") as HTMLElement);
      const { carousel } = window as unknown as { carousel: never };
      Object.assign(window, {
        unbind: bindCarouselControls(
          document.getElementById("strip") as HTMLElement,
          carousel,
        ),
      });
    });
    const shown = () =>
      page
        .locator("[data-carousel-controls] > *")
        .evaluateAll((controls) =>
          controls.map(
            (control) => getComputedStyle(control).display !== "none",
          ),
        );
    await expect(page.locator("#strip")).toHaveAttribute("data-re-static", "");
    await expect.poll(shown).toEqual([false, false, false]);
    await page.locator("#strip").evaluate((strip) => {
      strip.style.width = "300px";
    });
    await expect(page.locator("#strip")).not.toHaveAttribute("data-re-static");
    await expect.poll(shown).toEqual([true, true, true]);
    await page.locator("#strip").evaluate((strip) => {
      strip.style.width = "600px";
    });
    await expect.poll(shown).toEqual([false, false, false]);
    await page.evaluate(() =>
      (window as unknown as { unbind: () => void }).unbind(),
    );
    await expect(page.locator("[data-re-static]")).toHaveCount(1);
  });

  test("a drag inside a nested strip that scrolls leaves the outer strip still", async ({
    page,
  }) => {
    const inner = (id: string, count: number) =>
      `<div id="${id}" style="width:300px;--re-carousel-gap:0px">${slideRow(count, 150)}</div>`;
    await setup(
      page,
      `<div id="strip" style="width:600px;--re-carousel-gap:0px"><div data-carousel-slide style="flex:0 0 300px">${inner("scrolling", 4)}</div><div data-carousel-slide style="flex:0 0 300px">${inner("fitting", 2)}</div>${slideRow(3)}</div>`,
    );
    await page.evaluate(async () => {
      const { createCarousel } = await import("/modules/carousel/index.js");
      createCarousel(document.getElementById("scrolling") as HTMLElement);
      createCarousel(document.getElementById("fitting") as HTMLElement);
    });
    const lefts = () =>
      page.evaluate(() =>
        ["strip", "scrolling"].map(
          (id) => document.getElementById(id)?.scrollLeft,
        ),
      );
    await swipe(page, { x: 250, y: 100 }, { x: 50, y: 100 }, { hold: 150 });
    await page.waitForTimeout(800);
    const [outer, scrolled] = await lefts();
    expect(outer).toBe(0);
    expect(scrolled).toBeGreaterThan(0);
    await swipe(page, { x: 550, y: 100 }, { x: 350, y: 100 }, { hold: 150 });
    await page.waitForTimeout(800);
    expect((await lefts())[0]).toBe(300);
  });

  test("a proximity strip released far from every snap point stays between slides", async ({
    page,
  }) => {
    await setup(
      page,
      `<div id="strip" style="width:600px;--re-carousel-gap:0px;scroll-snap-type:x proximity">${slideRow(4, 600)}</div>`,
    );
    await swipe(page, { x: 500, y: 100 }, { x: 200, y: 100 }, { hold: 150 });
    await page.waitForTimeout(1000);
    const left = await page.evaluate(
      () => document.getElementById("strip")?.scrollLeft ?? 0,
    );
    expect(left).toBeGreaterThan(250);
    expect(left).toBeLessThan(350);
  });
});

// Each refresh reads every slide's computed style once.
async function countRefreshes(page: Page, slides: number) {
  await page.evaluate((count) => {
    const frames: number[] = [0];
    const tick = () => {
      frames.push(0);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const read = window.getComputedStyle;
    window.getComputedStyle = (element, pseudo) => {
      if (
        element instanceof HTMLElement &&
        element.dataset.carouselSlide !== undefined
      )
        frames[frames.length - 1] += 1 / count;
      return read(element, pseudo);
    };
    Object.assign(window, { refreshes: frames });
  }, slides);
  return () =>
    page.evaluate(() =>
      (window as unknown as { refreshes: number[] }).refreshes.map(Math.round),
    );
}

test.describe("carousel refresh", { tag: "@desktop" }, () => {
  test("one window resize refreshes a fluid strip once", async ({ page }) => {
    await setup(
      page,
      `<div id="strip" style="width:50vw;--re-carousel-gap:0px">${slideRow(6)}</div>`,
    );
    await page.waitForTimeout(200);
    const refreshes = await countRefreshes(page, 6);
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForTimeout(400);
    const counts = await refreshes();
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(1);
  });

  test("a hundred slides whose photos load one by one refresh at most once a frame", async ({
    page,
  }) => {
    const slides = Array.from(
      { length: 100 },
      () =>
        `<div data-carousel-slide style="flex:0 0 auto;height:120px"><img alt="" style="height:120px"></div>`,
    ).join("");
    await setup(
      page,
      `<div id="strip" style="width:600px;--re-carousel-gap:0px">${slides}</div>`,
    );
    await page.waitForTimeout(200);
    const refreshes = await countRefreshes(page, 100);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const images = [
            ...document.querySelectorAll<HTMLImageElement>("#strip img"),
          ];
          let index = 0;
          const load = () => {
            const image = images[index++];
            if (!image) return setTimeout(resolve, 300);
            image.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${160 + (index % 5) * 20}" height="120"/>`)}`;
            setTimeout(load, 4);
          };
          load();
        }),
    );
    const counts = await refreshes();
    expect(counts.reduce((sum, count) => sum + count, 0)).toBeGreaterThan(1);
    expect(Math.max(...counts)).toBeLessThanOrEqual(1);
  });
});

test.describe("carousel drag listeners", () => {
  // Records from the first script, so a move that lands before the test's own still counts.
  async function addedListeners(page: Page, move: () => Promise<void>) {
    await page.addInitScript(() => {
      const added: string[] = [];
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (type, ...rest) {
        if (this === window && type.startsWith("pointer")) added.push(type);
        return add.call(this, type, ...rest);
      };
      Object.assign(window, { added });
    });
    await setup(page);
    await move();
    return page.evaluate(
      () => (window as unknown as { added: string[] }).added,
    );
  }

  test("a fine pointer moving over the strip adds the drag listeners once", async ({
    page,
  }) => {
    const added = await addedListeners(page, async () => {
      await page.mouse.move(100, 100);
      await page.mouse.move(200, 100);
    });
    expect(added.filter((type) => type === "pointermove")).toHaveLength(1);
  });

  test("a coarse pointer moving over the strip adds no drag listener", {
    tag: "@touch",
  }, async ({ page }) => {
    const added = await addedListeners(page, () =>
      page.evaluate(() => {
        const strip = document.getElementById("strip") as HTMLElement;
        for (const x of [100, 200])
          strip.dispatchEvent(
            new PointerEvent("pointermove", {
              bubbles: true,
              pointerType: "mouse",
              clientX: x,
              clientY: 100,
            }),
          );
      }),
    );
    expect(added).toEqual([]);
  });
});
