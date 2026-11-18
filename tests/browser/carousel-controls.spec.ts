import { expect, type Page, test } from "@playwright/test";
import { mount } from "./harness";

const slides = Array.from(
  { length: 8 },
  (_, index) =>
    `<div data-carousel-slide style="flex:0 0 200px;height:150px;background:hsl(${index * 40} 60% 60%)">${index}</div>`,
).join("");

async function setup(page: Page, options: Record<string, unknown> = {}) {
  await mount(
    page,
    `<div id="root">
      <div id="strip" style="width:600px;--re-carousel-gap:0px">${slides}</div>
      <button data-carousel-prev>Back</button>
      <div data-carousel-dots></div>
      <span data-carousel-counter></span>
      <div data-carousel-progress style="width:300px;height:10px"></div>
      <button data-carousel-next>Next</button>
    </div>`,
    ["carousel/styles.css"],
  );
  await page.evaluate(async (settings) => {
    const { createCarousel } = await import("/modules/carousel/index.js");
    const { bindCarouselControls } = await import(
      "/modules/carousel/controls.js"
    );
    const strip = document.getElementById("strip") as HTMLElement;
    const carousel = createCarousel(strip, settings);
    const events: string[] = [];
    for (const type of ["change", "settle", "play", "pause"])
      strip.addEventListener(`re-carousel:${type}`, (event) =>
        events.push(`${type} ${(event as CustomEvent).detail.index}`),
      );
    bindCarouselControls(
      document.getElementById("root") as HTMLElement,
      carousel,
    );
    Object.assign(window, { carousel, events });
  }, options);
}

function snapshot(page: Page) {
  return page.evaluate(() => {
    const { carousel, events } = window as unknown as {
      carousel: {
        getState(): {
          index: number;
          pageIndex: number;
          pageCount: number;
          visible: number[];
        };
      };
      events: string[];
    };
    const state = carousel.getState();
    const dots = [...document.querySelectorAll("[data-carousel-dots] button")];
    return {
      state: {
        index: state.index,
        pageIndex: state.pageIndex,
        pageCount: state.pageCount,
        visible: [...state.visible],
      },
      dots: dots.length,
      currentDot: dots.findIndex((dot) => dot.hasAttribute("aria-current")),
      counter: document.querySelector("[data-carousel-counter]")?.textContent,
      slider: document
        .querySelector("[data-carousel-progress]")
        ?.getAttribute("aria-valuenow"),
      next: (
        document.querySelector("[data-carousel-next]") as HTMLButtonElement
      ).disabled,
      events: [...events],
    };
  });
}

test.describe("carousel controls", { tag: "@desktop" }, () => {
  test("a native scroll, a dot and the arrows move every control from one state", async ({
    page,
  }) => {
    await setup(page);
    expect(await snapshot(page)).toMatchObject({
      state: { index: 0, pageIndex: 0, pageCount: 6, visible: [0, 1, 2] },
      dots: 6,
      currentDot: 0,
      counter: "1 / 8",
      slider: "1",
    });
    await page.evaluate(() =>
      document
        .getElementById("strip")
        ?.scrollTo({ left: 400, behavior: "instant" }),
    );
    await expect
      .poll(async () => (await snapshot(page)).events)
      .toEqual(["change 2", "settle 2"]);
    expect(await snapshot(page)).toMatchObject({
      state: { index: 2, pageIndex: 2, visible: [2, 3, 4] },
      currentDot: 2,
      counter: "3 / 8",
      slider: "3",
    });
    await page.locator("[data-carousel-dots] button").nth(5).click();
    await expect
      .poll(async () => (await snapshot(page)).state.visible)
      .toEqual([5, 6, 7]);
    expect(await snapshot(page)).toMatchObject({
      next: true,
      state: { index: 5, pageIndex: 5 },
      currentDot: 5,
      counter: "6 / 8",
      slider: "6",
    });
    await page.locator("[data-carousel-prev]").click();
    await expect
      .poll(async () => (await snapshot(page)).state.visible)
      .toEqual([4, 5, 6]);
    expect(await snapshot(page)).toMatchObject({
      state: { index: 4, pageIndex: 4 },
      currentDot: 4,
      counter: "5 / 8",
    });
  });

  test("the autoplay progress moves every frame, holds its place on hover and restarts on a new slide", async ({
    page,
  }) => {
    await setup(page, { autoplay: 1500 });
    await page.mouse.move(700, 500);
    await page.evaluate(() => {
      const strip = document.getElementById("strip") as HTMLElement;
      strip.addEventListener("re-carousel:change", () =>
        Object.assign(window, {
          restarted: strip.style.getPropertyValue(
            "--re-carousel-autoplay-progress",
          ),
        }),
      );
    });
    const read = () =>
      page.evaluate(() =>
        Number(
          document
            .getElementById("strip")
            ?.style.getPropertyValue("--re-carousel-autoplay-progress"),
        ),
      );
    const frames = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const strip = document.getElementById("strip") as HTMLElement;
          const values: number[] = [];
          const tick = () => {
            values.push(
              Number(
                strip.style.getPropertyValue("--re-carousel-autoplay-progress"),
              ),
            );
            if (values.length < 20) requestAnimationFrame(tick);
            else resolve(values);
          };
          requestAnimationFrame(tick);
        }),
    );
    expect(new Set(frames).size).toBeGreaterThan(15);
    await page.mouse.move(300, 75);
    const held = await read();
    await page.waitForTimeout(1600);
    expect(await read()).toBe(held);
    expect((await snapshot(page)).state.index).toBe(0);
    await page.mouse.move(700, 500);
    await expect
      .poll(async () => (await snapshot(page)).state.index, { timeout: 3000 })
      .toBe(1);
    expect(
      await page.evaluate(
        () => (window as unknown as { restarted: string }).restarted,
      ),
    ).toBe("0");
  });

  test("autoplay pauses for keyboard focus, not for the focus a mouse click gives", async ({
    page,
  }) => {
    await setup(page, { autoplay: 600 });
    const state = () =>
      page.evaluate(() => {
        const { carousel } = window as unknown as {
          carousel: { getState(): { index: number; isPlaying: boolean } };
        };
        return {
          ...carousel.getState(),
          focused: document.activeElement?.id,
        };
      });
    await page.mouse.click(300, 75);
    await page.mouse.move(700, 500);
    expect(await state()).toMatchObject({ focused: "strip", isPlaying: true });
    await expect
      .poll(async () => (await state()).index, { timeout: 3000 })
      .toBeGreaterThan(0);
    await page.keyboard.press("ArrowRight");
    const shown = await page
      .locator("#strip")
      .evaluate((strip) => strip.matches(":focus-visible"));
    expect((await state()).isPlaying).toBe(!shown);
    await page.mouse.click(700, 500);
    await page.keyboard.press("Tab");
    const held = await state();
    expect(held).toMatchObject({ focused: "strip", isPlaying: false });
    await page.waitForTimeout(1300);
    expect((await state()).index).toBe(held.index);
  });

  test("a goTo on a hidden strip lands once the strip shows", async ({
    page,
  }) => {
    await setup(page);
    await page.evaluate(() => {
      const strip = document.getElementById("strip") as HTMLElement;
      strip.style.display = "none";
      return new Promise(requestAnimationFrame);
    });
    await page.evaluate(() => {
      (
        window as unknown as { carousel: { goTo(index: number): void } }
      ).carousel.goTo(5);
      (document.getElementById("strip") as HTMLElement).style.display = "";
    });
    await expect
      .poll(() =>
        page.evaluate(() => document.getElementById("strip")?.scrollLeft),
      )
      .toBe(1000);
    expect((await snapshot(page)).state).toMatchObject({
      index: 5,
      visible: [5, 6, 7],
    });
  });
});
