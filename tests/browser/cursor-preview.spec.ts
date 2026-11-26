import { expect, type Page, test } from "@playwright/test";
import { mount } from "./harness";

const picture = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect width="300" height="400" fill="${color}"/></svg>`,
  )}`;

async function setup(page: Page) {
  await page.mouse.move(2, 2);
  await mount(
    page,
    `<ul id="list" style="margin:120px 0 0 120px;padding:0;width:420px;list-style:none">
      <li data-re-preview="${picture("#e07a5f")}" style="height:60px">Coral sky</li>
      <li class="gap" style="height:40px"></li>
      <li data-re-preview="${picture("#81b29a")}" style="height:60px">Mint and ember</li>
    </ul>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createCursorPreview } from "@reuse-sh/interactions";
      createCursorPreview(document.querySelector("#list"), { delay: 0 });
      window.__ready = true;`,
  });
  await expect.poll(() => page.evaluate(() => "__ready" in window)).toBe(true);
  const popup = page.locator(".re-cursor-preview");
  const shown = () =>
    popup.evaluate((element) =>
      (element as HTMLElement).hidden
        ? null
        : (element
            .querySelector(".re-cursor-preview-layer:first-child img")
            ?.getAttribute("src") ?? null),
    );
  return { popup, shown };
}

const angle = (page: Page) =>
  page.evaluate(() =>
    Number(
      /rotate\(([-\d.e]+)deg\)/.exec(
        document.querySelector<HTMLElement>(".re-cursor-preview")?.style
          .transform ?? "",
      )?.[1],
    ),
  );

test("arrives at the pointer, leans while it travels and settles upright", async ({
  page,
}) => {
  const { popup, shown } = await setup(page);
  await page.mouse.move(160, 150, { steps: 4 });
  await expect.poll(shown).toBe(picture("#e07a5f"));
  await expect(popup).toHaveAttribute("data-state", "open");
  const start = await popup.boundingBox();
  expect(start?.x).toBeGreaterThan(150);
  expect(start?.y).toBeGreaterThan(140);

  let deepest = 0;
  for (let x = 170; x <= 500; x += 30) {
    await page.mouse.move(x, 150);
    deepest = Math.max(deepest, await angle(page));
  }
  expect(deepest).toBeGreaterThan(1);
  expect(deepest).toBeLessThanOrEqual(8);
  await expect.poll(() => angle(page)).toBe(0);
});

test("switches from under, so the frame never shows the page", async ({
  page,
}) => {
  const { shown } = await setup(page);
  await page.mouse.move(200, 150, { steps: 3 });
  await expect.poll(shown).toBe(picture("#e07a5f"));
  await page.waitForTimeout(600);
  await page.mouse.move(200, 250, { steps: 3 });
  const samples = await page.evaluate(
    () =>
      new Promise<Array<{ layers: number; bottom: string }>>((resolve) => {
        const out: Array<{ layers: number; bottom: string }> = [];
        const start = performance.now();
        const sample = () => {
          const layers = document.querySelectorAll<HTMLElement>(
            ".re-cursor-preview-layer",
          );
          out.push({
            layers: layers.length,
            bottom: layers[0] ? getComputedStyle(layers[0]).opacity : "none",
          });
          if (performance.now() - start < 320) requestAnimationFrame(sample);
          else resolve(out);
        };
        sample();
      }),
  );
  expect(samples.some((sample) => sample.layers === 2)).toBe(true);
  expect(samples.every((sample) => sample.bottom === "1")).toBe(true);
  expect(samples.at(-1)?.layers).toBe(1);
  expect(await shown()).toBe(picture("#81b29a"));
});

test("holds over a gap, closes after leaving, and comes back mid-exit", async ({
  page,
}) => {
  const { popup, shown } = await setup(page);
  await page.mouse.move(200, 150, { steps: 3 });
  await expect.poll(shown).toBe(picture("#e07a5f"));
  await page.mouse.move(200, 200, { steps: 3 });
  await page.waitForTimeout(300);
  expect(await shown()).toBe(picture("#e07a5f"));

  await page.mouse.move(700, 600, { steps: 2 });
  await page.waitForTimeout(120);
  await expect(popup).toHaveAttribute("data-state", "closing");
  await page.mouse.move(200, 150, { steps: 2 });
  await expect(popup).toHaveAttribute("data-state", "open");
  await page.waitForTimeout(300);
  expect(await shown()).toBe(picture("#e07a5f"));

  await page.mouse.move(700, 600, { steps: 2 });
  await expect(popup).toBeHidden();
});

test("comes back when the pointer returns to a gap during the exit", async ({
  page,
}) => {
  const { popup, shown } = await setup(page);
  await page.mouse.move(200, 150, { steps: 3 });
  await expect.poll(shown).toBe(picture("#e07a5f"));
  await page.mouse.move(700, 160, { steps: 2 });
  await page.waitForTimeout(120);
  await expect(popup).toHaveAttribute("data-state", "closing");
  await page.mouse.move(200, 200, { steps: 2 });
  await expect(popup).toHaveAttribute("data-state", "open");
  await page.waitForTimeout(400);
  expect(await shown()).toBe(picture("#e07a5f"));
});

test("keeps a leaning card inside a short window while it moves", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 280 });
  const { popup, shown } = await setup(page);
  await page.mouse.move(520, 150, { steps: 3 });
  await expect.poll(shown).toBe(picture("#e07a5f"));
  await page.waitForTimeout(600);
  let worst = { top: 0, bottom: 280, left: 0, right: 900 };
  for (const x of [440, 340, 240, 140, 300, 520, 380, 160]) {
    await page.mouse.move(x, 150);
    const box = await popup
      .locator(".re-cursor-preview-frame")
      .evaluate((frame) => frame.getBoundingClientRect().toJSON());
    worst = {
      top: Math.min(worst.top, box.top),
      bottom: Math.max(worst.bottom, box.bottom),
      left: Math.min(worst.left, box.left),
      right: Math.max(worst.right, box.right),
    };
  }
  expect(worst.top).toBeGreaterThanOrEqual(0);
  expect(worst.bottom).toBeLessThanOrEqual(280);
});

test("stays closed over a gap after an item without a picture closed it", async ({
  page,
}) => {
  await page.mouse.move(2, 2);
  await mount(
    page,
    `<ul id="list" style="margin:120px 0 0 120px;padding:0;width:420px;list-style:none">
      <li data-re-preview="${picture("#e07a5f")}" style="height:60px">Coral sky</li>
      <li data-re-preview-template="missing" style="height:60px">No picture</li>
      <li class="gap" style="height:40px"></li>
    </ul>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createCursorPreview } from "@reuse-sh/interactions";
      createCursorPreview(document.querySelector("#list"), { delay: 0 });
      window.__ready = true;`,
  });
  await expect.poll(() => page.evaluate(() => "__ready" in window)).toBe(true);
  const popup = page.locator(".re-cursor-preview");
  await page.mouse.move(200, 150, { steps: 3 });
  await expect(popup).toHaveAttribute("data-state", "open");
  await page.mouse.move(200, 210, { steps: 2 });
  await page.mouse.move(200, 260, { steps: 2 });
  await expect(popup).toBeHidden();
});

test("reduced motion stops the preview's own animations and leaves the content's", async ({
  page,
}) => {
  await page.mouse.move(2, 2);
  await mount(
    page,
    `<ul id="list" style="margin:120px 0 0 120px;padding:0;width:420px;list-style:none">
      <li data-row style="height:60px">Coral sky</li>
      <li data-row style="height:60px">Mint and ember</li>
    </ul>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createCursorPreview } from "@reuse-sh/interactions";
      window.__inner = [];
      createCursorPreview(document.querySelector("#list"), {
        selector: "[data-row]",
        delay: 0,
        content: () => {
          const box = document.createElement("div");
          box.style.cssText = "width:200px;height:150px;background:#81b29a";
          window.__inner.push(box.animate([{ opacity: 1 }, { opacity: 0.6 }], { duration: 10000, fill: "forwards" }));
          return box;
        },
      });
      window.__ready = true;`,
  });
  await expect.poll(() => page.evaluate(() => "__ready" in window)).toBe(true);
  const popup = page.locator(".re-cursor-preview");
  await page.mouse.move(200, 150, { steps: 3 });
  await expect(popup).toHaveAttribute("data-state", "open");
  await page.waitForTimeout(400);
  await page.mouse.move(200, 210, { steps: 2 });
  await page.evaluate(() => {
    const inner = (window as unknown as { __inner: Animation[] }).__inner;
    (window as unknown as { __sample: Promise<unknown> }).__sample =
      new Promise((resolve) =>
        matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
          "change",
          () => {
            const frame = document.querySelector(".re-cursor-preview-frame");
            const running = frame?.getAnimations({ subtree: true }) ?? [];
            resolve({
              own: running.filter((animation) => !inner.includes(animation))
                .length,
              layers: document.querySelectorAll(".re-cursor-preview-layer")
                .length,
              content: inner.at(-1)?.playState,
            });
          },
          { once: true },
        ),
      );
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page.evaluate(
      () => (window as unknown as { __sample: Promise<unknown> }).__sample,
    ),
  ).toEqual({ own: 0, layers: 1, content: "running" });
});
