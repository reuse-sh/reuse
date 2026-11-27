import { expect, type Page, test } from "@playwright/test";
import { lightboxStyles } from "../../apps/site/components/docs/lightbox-styles";
import originalGeometry from "./fixtures/demo-geometry.json" with {
  type: "json",
};
import { serveExampleImages } from "./images";

test.use({ viewport: { width: 1280, height: 800 } });
test.beforeEach(({ context }) => serveExampleImages(context));
const preview = '[data-slot="example-preview"]';
const chooser = '[data-slot="docs-sidebar"] .re-framework';

test("framework links change inline usage and keep the running showcase", async ({
  page,
}) => {
  await page.goto("/carousel/examples/product-strip");
  const next = page.getByRole("button", { name: "Next prints", exact: true });
  await next.click();
  const previous = page.getByRole("button", {
    name: "Previous prints",
    exact: true,
  });
  await expect(previous).toBeEnabled();
  await page.locator(`${chooser} summary`).click();
  await page
    .locator(chooser)
    .getByRole("link", { name: "HTML + JavaScript", exact: true })
    .click();
  await expect(page).toHaveURL(/framework=html/);
  await expect(previous).toBeEnabled();
  await expect(page.locator('[data-code-role="setup"]')).toContainText(
    "createCarousel",
  );
  await expect(
    page.locator("a", { hasText: /^Preview$|^Code$|^Open example$/ }),
  ).toHaveCount(0);
  await page
    .getByRole("link", { name: "Getting started", exact: true })
    .click();
  await expect(page).toHaveURL(/framework=html/);
  await expect(
    page.locator('[data-snippet-id="carousel-getting-started-markup"]'),
  ).toContainText("<div");
  await page.getByRole("link", { name: "Reuse", exact: true }).click();
  await expect(page).toHaveURL(/framework=html/);
  await page
    .getByRole("link", { name: "Start with Lightbox", exact: true })
    .click();
  await expect(page).toHaveURL(/framework=html/);
  await expect(page.locator(preview)).toBeVisible();
});

test("framework menu has one moving background after repeated selection and closes with Escape", async ({
  page,
}) => {
  await page.goto("/carousel");
  for (const name of ["HTML + JavaScript", "React"]) {
    await page.locator(`${chooser} summary`).click();
    const options = page.locator(chooser);
    await expect(options.locator(".re-moving-highlight")).toHaveCount(1);
    await options.getByRole("link", { name, exact: true }).focus();
    await expect(options.locator(".re-moving-highlight")).toHaveAttribute(
      "data-visible",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator(`${chooser} summary`)).toBeFocused();
    await page.locator(`${chooser} summary`).click();
    await options.getByRole("link", { name, exact: true }).click();
    await expect(page.locator(`${chooser} summary`)).toContainText(name);
  }
});

test("overview has only the showcase and principles while usage is ordered below example demos", async ({
  page,
}) => {
  await page.goto("/shadows");
  await expect(page.locator(preview)).toBeVisible();
  await expect(page.locator('[data-slot="code-block"]')).toHaveCount(0);
  await page.goto("/shadows/getting-started");
  await expect(page.locator(preview)).toHaveCount(0);
  const code = page.locator('[data-slot="code-block"]');
  await expect(code.first()).toContainText("install @reuse-sh/shadows");
  await expect(code.nth(1)).toContainText("@reuse-sh/shadows/styles.css");
  await expect(code.nth(1)).toContainText('className="re-shadow-ring-md"');
  await page.goto("/carousel/examples/editorial");
  const position = await page.evaluate(() => {
    const demo = document.querySelector('[data-slot="example-preview"]');
    const code = document.querySelector('[data-slot="code-block"]');
    return Boolean(
      demo &&
        code &&
        demo.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
  expect(position).toBe(true);
});

test("code blocks leave the standard content gap before a following paragraph", async ({
  page,
}) => {
  await page.goto("/shadows/getting-started");
  const gap = await page.evaluate(() => {
    const code = document.querySelector('[data-slot="code-block"]');
    const paragraph = code?.nextElementSibling;
    if (!code || paragraph?.tagName !== "P")
      throw new Error("Missing adjacent installation guidance");
    return (
      paragraph.getBoundingClientRect().top -
      code.getBoundingClientRect().bottom
    );
  });
  expect(gap).toBe(16);
});

test.describe("server content without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("carousel images and platform navigation survive without hydration", async ({
    page,
  }) => {
    await page.goto("/carousel");
    await expect(page.locator(`${preview} img`)).toHaveCount(6);
    await expect(page.locator(`${preview} img`).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Next slide", exact: true }),
    ).toBeDisabled();
    await page.locator(`${chooser} summary`).click();
    await page
      .locator(chooser)
      .getByRole("link", { name: "HTML + JavaScript", exact: true })
      .click();
    await expect(page).toHaveURL(/framework=html/);
    await page
      .getByRole("link", { name: "Getting started", exact: true })
      .click();
    await expect(page.locator('[data-code-role="setup"]')).toContainText(
      "createCarousel",
    );
    await expect(page.locator('[data-slot="doc-content"]')).not.toContainText(
      "<!doctype html>",
    );
  });
  test("avatar photos and static loader figures remain visible", async ({
    page,
  }) => {
    await page.goto("/avatars");
    await expect(page.locator(`${preview} .re-avatar-image`)).toHaveCount(7);
    await expect(
      page.locator(`${preview} .re-avatar-image`).first(),
    ).toBeVisible();
    await page.goto("/loaders");
    await expect(
      page.locator(".re-thinking-dots__fallback").first(),
    ).toBeVisible();
    await expect(page.locator(".re-thinking-dots canvas").first()).toBeHidden();
  });
  test("copy actions stay disabled until enhancement", async ({ page }) => {
    await page.goto("/copy-button");
    await expect(
      page.getByRole("button", { name: "Copy install command", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Copy link", exact: true }),
    ).toBeDisabled();
  });
});

for (const framework of ["react", "html"]) {
  test(`carousel ${framework} preserves the original controls and moving dot`, async ({
    page,
  }) => {
    await page.goto(`/carousel?framework=${framework}`);
    const demo = page.locator('[data-slot="example-preview"]');
    const dots = demo.locator(".re-c-dots");
    await expect(dots.locator("button")).toHaveCount(6);
    const geometry = await dots.evaluate((element) => {
      const button = element.querySelector("button") as HTMLButtonElement;
      const dot = getComputedStyle(element, "::after");
      return {
        width: button.getBoundingClientRect().width,
        height: button.getBoundingClientRect().height,
        dotWidth: dot.width,
        dotHeight: dot.height,
        text: element.textContent?.trim(),
      };
    });
    expect(geometry).toEqual({
      width: 10,
      height: 24,
      dotWidth: "4px",
      dotHeight: "4px",
      text: "",
    });
    await expect(demo.locator(".re-c-counter")).toHaveCount(0);
    const next = demo.getByRole("button", { name: "Next slide", exact: true });
    await expect(next.locator("svg")).toHaveAttribute("width", "16");
    expect(
      await next.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).toBe("rgba(0, 0, 0, 0)");
    const dotBounds = await dots.boundingBox();
    const arrowBounds = await next.boundingBox();
    expect(arrowBounds?.x).toBeGreaterThan((dotBounds?.x ?? 0) + 200);
    await next.click();
    await expect(dots.locator("button").nth(1)).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect
      .poll(() =>
        dots.evaluate(
          (element) => getComputedStyle(element, "::after").transform,
        ),
      )
      .toBe("matrix(1, 0, 0, 1, 10, 0)");
  });
}

test("React copy enables after enhancement and writes the original payload", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/copy-button");
  const button = page.getByRole("button", {
    name: "Copy install command",
    exact: true,
  });
  await expect(button).toBeEnabled();
  await button.click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("npm install @reuse-sh/interactions");
});

test("showcases keep their measured token-based composition", async ({
  page,
}) => {
  for (const original of originalGeometry) {
    await page.goto(original.path);
    await page.evaluate(() => document.fonts.ready);
    const stage = page.locator(
      '[data-slot="example-preview"] > [data-slot="card"]',
    );
    const actual = await stage.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      images: [...element.querySelectorAll("img")].map((image) => [
        image.getBoundingClientRect().width,
        image.getBoundingClientRect().height,
      ]),
    }));
    expect(actual.height, original.path).toBe(original.height);
    expect(actual.images, original.path).toEqual(original.images);
  }
});
test("chat colors and file-menu shortcuts preserve the original hierarchy", async ({
  page,
}) => {
  await page.goto("/lightbox/examples/chat");
  await expect(
    page.getByText("The pink one is my favorite", { exact: true }),
  ).toHaveCSS("background-color", "rgb(31, 111, 235)");
  await page.goto("/moving-highlight/examples/menu");
  const row = page.getByRole("menuitem", { name: "New print" });
  const key = row.locator("kbd");
  const rowBounds = await row.boundingBox();
  const keyBounds = await key.boundingBox();
  expect(keyBounds?.x).toBeGreaterThan((rowBounds?.x ?? 0) + 200);
});

test("image captions keep their title white over the scrim", async ({
  page,
}) => {
  await page.goto("/easing-gradients/examples/image-caption");
  await expect(
    page.locator('[data-slot="example-preview"] figcaption b'),
  ).toHaveCSS("color", "rgb(255, 255, 255)");
});
test("chat composers fit inside narrow panels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const [path, inset, ring] of [
    ["/lightbox/examples/chat", 12, "input"],
    ["/loaders/examples/chat-reply", 32, "form"],
  ] as const) {
    await page.goto(path);
    const form = page.locator(
      '[data-slot="example-preview"] .re-compose, [data-slot="example-preview"] form',
    );
    const send = form.getByRole("button", { name: "Send", exact: true });
    const bounds = await send.boundingBox();
    const panel = await page
      .locator('[data-slot="example-stage"]')
      .boundingBox();
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
      (panel?.x ?? 0) + (panel?.width ?? 0) - inset,
    );
    await expect(send).toBeVisible();
    await form.getByRole("textbox").focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(
      ring === "form" ? form : form.getByRole("textbox"),
    ).not.toHaveCSS("outline-style", "none");
  }
});

test("narrow API tables show every description without sideways scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/lightbox/api");
  const table = page.locator('[data-slot="doc-content"] table');
  const layout = await table.evaluate((element) => {
    const frame = element.parentElement as HTMLElement;
    const row = element.querySelector("tbody tr") as HTMLElement;
    const [name, text] = [...row.children].map((cell) =>
      cell.getBoundingClientRect(),
    );
    return {
      overflow: frame.scrollWidth - frame.clientWidth,
      textBelowName: text.top >= name.bottom,
    };
  });
  expect(layout).toEqual({ overflow: 0, textBelowName: true });
});

test("the narrow panel sheet shows one caption line until it expands", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/lightbox/looks/panel");
  // The eighth caption is the one long enough to wrap at 320px.
  await page.locator('main a[href^="/photos/"]').nth(7).click();
  const text = page.locator(".re-lightbox-style-panel-text");
  await expect(text).toBeVisible();
  const lines = () =>
    text.evaluate((element) => ({
      clipped: element.scrollWidth > element.clientWidth,
      lines: Math.round(
        element.clientHeight /
          Number.parseFloat(getComputedStyle(element).lineHeight),
      ),
    }));
  expect(await lines()).toEqual({ clipped: true, lines: 1 });
  const toggle = page.getByRole("button", { name: "All photos" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(await lines()).toEqual({ clipped: false, lines: 2 });
  await page
    .locator(".re-lightbox-style-panel-list button", { hasText: "Cloud peak" })
    .click();
  await expect(page.locator(".re-lightbox-style-panel h2")).toHaveText(
    "Cloud peak",
  );
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("the panel style rises its text through a change and lands on the latest photo", async ({
  page,
}) => {
  await page.goto("/lightbox/looks/panel");
  await page.locator('main a[href^="/photos/"]').nth(1).click();
  const title = page.locator(".re-lightbox-style-panel h2");
  await expect(title).toHaveText("Open sea");
  await expect(page.locator(".re-lightbox-image").nth(1)).toBeVisible();
  await title.evaluate((element) => {
    const frames: [string, number, number][] = [];
    (window as unknown as { frames_: typeof frames }).frames_ = frames;
    const sample = () => {
      const style = getComputedStyle(element);
      frames.push([
        element.textContent ?? "",
        Number(style.opacity),
        Number.parseFloat(style.translate.split(" ")[1] ?? "0"),
      ]);
      if (frames.length < 40) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.keyboard.press("ArrowRight");
  await expect(title).toHaveText("Dunes");
  const recorded = () =>
    page.evaluate(
      () =>
        (window as unknown as { frames_: [string, number, number][] }).frames_,
    );
  await expect.poll(async () => (await recorded()).length).toBe(40);
  const frames = await recorded();
  const seen = (text: string, rise: (y: number) => boolean) =>
    frames.some(
      ([shown, opacity, y]) => shown === text && opacity < 0.5 && rise(y),
    );
  expect({
    leavesUpward: seen("Open sea", (y) => y < 0),
    entersFromBelow: seen("Dunes", (y) => y > 0),
    ends: frames.at(-1),
  }).toEqual({
    leavesUpward: true,
    entersFromBelow: true,
    ends: ["Dunes", 1, 0],
  });
  const opacity = () =>
    title.evaluate((element) => Number(getComputedStyle(element).opacity));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(title).toHaveText("Evening sail");
  await expect.poll(opacity).toBe(1);
  await expect(page.locator(".re-lightbox-style-panel-count")).toHaveText(
    "5 / 8",
  );
  await expect(
    page.locator('.re-lightbox-style-panel-list [aria-current="true"]'),
  ).toHaveText("Evening sail");
  await page
    .locator(".re-lightbox-style-panel-list button", { hasText: "Empty room" })
    .click();
  await expect(title).toHaveText("Empty room");
  await expect(page.locator(".re-lightbox-style-panel-count")).toHaveText(
    "8 / 8",
  );
});

test("the panel style mirrors its rise when paging back and continues from where an interrupted rise is", async ({
  page,
}) => {
  await page.goto("/lightbox/looks/panel");
  await page.locator('main a[href^="/photos/"]').nth(2).click();
  const title = page.locator(".re-lightbox-style-panel h2");
  await expect(title).toHaveText("Dunes");
  await expect(page.locator(".re-lightbox-image").nth(2)).toBeVisible();
  const result = await title.evaluate(async (element) => {
    const text = element.nextElementSibling as HTMLElement;
    const frame = () => new Promise((done) => requestAnimationFrame(done));
    const y = (node: Element) =>
      Number.parseFloat(getComputedStyle(node).translate.split(" ")[1] ?? "0");
    const press = (key: string) =>
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );
    const frames: [string, number, number][] = [];
    press("ArrowLeft");
    for (let at = 0; at < 30; at++) {
      frames.push([
        element.textContent ?? "",
        Number(getComputedStyle(element).opacity),
        y(element),
      ]);
      await frame();
    }
    const seen = (caption: string, side: (y: number) => boolean) =>
      frames.some(
        ([shown, opacity, shift]) =>
          shown === caption && opacity < 0.5 && side(shift),
      );
    press("ArrowRight");
    let left = 120;
    const wait = async (ready: () => boolean) => {
      while (!ready() && left-- > 0) await frame();
      return ready();
    };
    const opacity = () => Number(getComputedStyle(element).opacity);
    const rose =
      (await wait(() => element.textContent === "Dunes" && opacity() <= 0.6)) &&
      (await wait(() => opacity() >= 0.3));
    const before = [y(element), y(text)];
    press("ArrowRight");
    const after = [y(element), y(text)];
    return {
      rose,
      leavesDownward: seen("Dunes", (shift) => shift > 0),
      entersFromAbove: seen("Open sea", (shift) => shift < 0),
      rising: before.every((shift) => shift > 0),
      steady: after.map((shift, at) => Math.abs(shift - before[at]) < 0.1),
    };
  });
  expect(result).toEqual({
    rose: true,
    leavesDownward: true,
    entersFromAbove: true,
    rising: true,
    steady: [true, true],
  });
});

test("the panel style list glides when quick paging changes the text height", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/lightbox/looks/panel");
  // Evening sail wraps to two lines, Cloud peak to one, Dusk beach to two.
  await page.locator('main a[href^="/photos/"]').nth(4).click();
  await expect(page.locator(".re-lightbox-style-panel h2")).toHaveText(
    "Evening sail",
  );
  // The second key lands while Cloud peak fades in, so its height change is still running.
  await page.evaluate(() => {
    const panel = document.querySelector(".re-lightbox-style-panel");
    const label = panel?.querySelector(".re-lightbox-style-panel-label");
    const title = panel?.querySelector("h2");
    const dialog = document.querySelector("dialog.re-lightbox");
    const press = () =>
      dialog?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
    const tops: number[] = [];
    (window as unknown as { tops: number[] }).tops = tops;
    const sample = () => {
      tops.push(label?.getBoundingClientRect().top ?? 0);
      if (tops.length < 60) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    if (title)
      new MutationObserver((_, observer) => {
        if (title.textContent !== "Cloud peak") return;
        observer.disconnect();
        setTimeout(press, 40);
      }).observe(title, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    press();
  });
  await expect(page.locator(".re-lightbox-style-panel h2")).toHaveText(
    "Dusk beach",
  );
  const tops = () =>
    page.evaluate(() => (window as unknown as { tops: number[] }).tops);
  await expect.poll(async () => (await tops()).length).toBe(60);
  const sampled = await tops();
  const steps = sampled.slice(1).map((top, i) => Math.abs(top - sampled[i]));
  expect(Math.max(...sampled) - Math.min(...sampled)).toBeGreaterThan(0);
  expect(Math.max(...steps)).toBeLessThan(12);
});

test("the collapsed panel sheet keeps its list out of the tab order", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/lightbox/looks/panel");
  await page.locator('main a[href^="/photos/"]').first().click();
  const toggle = page.getByRole("button", { name: "All photos" });
  await toggle.focus();
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => ({
    inList: Boolean(
      document.activeElement?.closest(".re-lightbox-style-panel-list"),
    ),
    scrolled: document.querySelector(".re-lightbox-aside")?.scrollTop,
  }));
  expect(focused).toEqual({ inList: false, scrolled: 0 });
});

test("picking from the open panel sheet keeps the arrow keys paging", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 844 });
  await page.goto("/lightbox/looks/panel");
  await page.locator('main a[href^="/photos/"]').first().click();
  const toggle = page.getByRole("button", { name: "All photos" });
  await toggle.click();
  const row = page.locator(".re-lightbox-style-panel-list button", {
    hasText: "Dunes",
  });
  await row.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".re-lightbox-style-panel h2")).toHaveText(
    "Lone pine",
  );
});

test("the panel sheet shows its title after turning from wide to narrow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/lightbox/looks/panel");
  await page.locator('main a[href^="/photos/"]').first().click();
  const count = page.locator(".re-lightbox-style-panel-count");
  await expect(count).toHaveText("1 / 8");
  for (let step = 2; step <= 6; step++) {
    await page.keyboard.press("ArrowRight");
    await expect(count).toHaveText(`${step} / 8`);
  }
  await expect(page.locator(".re-lightbox-style-panel h2")).toHaveText(
    "Cloud peak",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "All photos" }),
  ).toBeInViewport();
  const inside = await page.evaluate(() => {
    const sheet = document
      .querySelector(".re-lightbox-aside")
      ?.getBoundingClientRect();
    const title = document
      .querySelector(".re-lightbox-style-panel h2")
      ?.getBoundingClientRect();
    return Boolean(
      sheet && title && title.top >= sheet.top && title.bottom <= sheet.bottom,
    );
  });
  expect(inside).toBe(true);
});

test("the panel style switches its text at once under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lightbox/looks/panel");
  await page.locator('main a[href^="/photos/"]').nth(1).click();
  const title = page.locator(".re-lightbox-style-panel h2");
  await expect(title).toHaveText("Open sea");
  await page.keyboard.press("ArrowRight");
  const shown = await title.evaluate((element) => ({
    text: element.textContent,
    animations: element.getAnimations().length,
  }));
  const count = page.locator(".re-lightbox-style-panel-count");
  const rolled = await count.evaluate((element) => ({
    text: element.textContent,
    animations: element.getAnimations({ subtree: true }).length,
  }));
  expect(shown).toEqual({ text: "Dunes", animations: 0 });
  expect(rolled).toEqual({ text: "3 / 8", animations: 0 });
});

test("the panel style rolls its position digit in the paging direction", async ({
  page,
}) => {
  await page.goto("/lightbox/looks/panel");
  await page.locator('main a[href^="/photos/"]').nth(1).click();
  const count = page.locator(".re-lightbox-style-panel-count");
  await expect(count).toHaveText("2 / 8");
  const roll = (key: string) =>
    count.evaluate((element, key) => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );
      return element
        .getAnimations({ subtree: true })
        .map((animation) =>
          (animation.effect as KeyframeEffect)
            .getKeyframes()
            .map((frame) => frame.translate)
            .join(" > "),
        )
        .sort();
    }, key);
  expect(await roll("ArrowRight")).toEqual([
    "0px 100% > 0px",
    "0px > 0px -100%",
  ]);
  await expect(count).toHaveText("3 / 8");
  await expect
    .poll(() =>
      count.evaluate(
        (element) => element.getAnimations({ subtree: true }).length,
      ),
    )
    .toBe(0);
  expect(await roll("ArrowLeft")).toEqual([
    "0px -100% > 0px",
    "0px > 0px 100%",
  ]);
  await expect(count).toHaveText("2 / 8");
});

test("the panel style fits the photo beside its card and above its sheet", async ({
  page,
}) => {
  for (const [width, height] of [
    [1280, 800],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/lightbox/looks/panel");
    await page.locator('main a[href^="/photos/"]').nth(1).click();
    const image = page.locator(".re-lightbox-image").nth(1);
    await expect(image).toBeVisible();
    await expect(page.locator("dialog[open]")).toHaveAttribute(
      "data-phase",
      "open",
    );
    const card = await page.locator(".re-lightbox-aside").boundingBox();
    const photo = await image.boundingBox();
    if (!card || !photo) throw new Error("Missing card or photo");
    const sheet = width < 720;
    const room = sheet ? { width, height: card.y } : { width: card.x, height };
    const end = sheet ? photo.y + photo.height : photo.x + photo.width;
    expect(
      {
        fills:
          Math.max(photo.width / room.width, photo.height / room.height) > 0.75,
        clear: end <= (sheet ? card.y : card.x) + 0.5,
      },
      `${width}px`,
    ).toEqual({ fills: true, clear: true });
  }
});

test("the panel style keeps a plain close button inside its card", async ({
  page,
}) => {
  await page.goto("/lightbox/looks/panel");
  await page.locator('main a[href^="/photos/"]').first().click();
  const close = page.getByRole("button", { name: "Close gallery" });
  await expect(close).toBeVisible();
  const look = await close.evaluate((element) => {
    const button = element.getBoundingClientRect();
    const card = element
      .closest("dialog")
      ?.querySelector(".re-lightbox-aside")
      ?.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      size: [button.width, button.height],
      inside:
        !!card && button.top >= card.top + 8 && button.right <= card.right - 8,
      fill: style.backgroundColor,
      ring: style.boxShadow,
    };
  });
  expect(look).toEqual({
    size: [40, 40],
    inside: true,
    fill: "rgba(0, 0, 0, 0)",
    ring: "none",
  });
});

// The lightbox leaves its history entry with an asynchronous history.back(), which aborts a
// navigation that starts before it lands.
async function closed(page: Page) {
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (history.state as { reuseLightbox?: string } | null)?.reuseLightbox,
      ),
    )
    .toBeUndefined();
}

// Carousel tiles are image links, so a click before hydration follows the link instead of
// opening the viewer. The arrows turn on once the carousel exists.
async function hydrated(page: Page, path: string) {
  if (path.startsWith("/carousel"))
    await expect(
      page.getByRole("button", { name: "Next slide", exact: true }),
    ).toBeEnabled();
}

test("every control style shows an icon in each lightbox button", async ({
  page,
}) => {
  for (const style of Object.keys(lightboxStyles)) {
    await page.goto(`/lightbox/looks/${style}`);
    await page.locator('main a[href^="/photos/"]').first().click();
    await expect(
      page.locator("dialog[open] .re-lightbox-image").first(),
    ).toBeVisible();
    const textOnly = await page
      .locator("dialog[open] .re-lightbox-button")
      .evaluateAll((buttons) =>
        buttons
          .filter(
            (button) =>
              button.checkVisibility() && !button.querySelector("svg"),
          )
          .map(
            (button) =>
              `${button.getAttribute("aria-label")}: ${button.textContent}`,
          ),
      );
    expect(textOnly, style).toEqual([]);
    await page.keyboard.press("Escape");
    await closed(page);
  }
});

test("the toolbar style hides its bar while zoomed and zooms out from the button left of close", async ({
  page,
}) => {
  await page.goto("/lightbox/looks/toolbar");
  await page.locator('main a[href^="/photos/"]').first().click();
  await expect(
    page.locator("dialog[open] .re-lightbox-image").first(),
  ).toBeVisible();
  const bar = page.locator("dialog[open] .re-lightbox-style-toolbar");
  const zoomIn = bar.getByRole("button", { name: "Zoom in" });
  const icon = await zoomIn.evaluate((button) => button.innerHTML);
  await zoomIn.click();
  const seen = await page.evaluate(() => {
    const top = document.querySelector("dialog[open] .re-lightbox-toolbar");
    const zoom = top?.querySelector(".re-lightbox-zoom");
    if (!top || !zoom) return -1;
    return (
      Number(getComputedStyle(zoom).opacity) *
      Number(getComputedStyle(top).opacity)
    );
  });
  expect(seen).toBeLessThan(0.05);
  await expect(bar).toBeHidden();
  await page.mouse.move(600, 400);
  await page.mouse.move(660, 460, { steps: 4 });
  const zoomOut = page.locator(
    "dialog[open] .re-lightbox-toolbar .re-lightbox-zoom",
  );
  const close = page.locator("dialog[open] .re-lightbox-close");
  await expect(zoomOut).toBeVisible();
  await expect(zoomOut).toHaveAttribute("aria-label", "Zoom out");
  expect(await zoomOut.evaluate((button) => button.innerHTML)).not.toBe(icon);
  const [out, shut] = await Promise.all([
    zoomOut.boundingBox(),
    close.boundingBox(),
  ]);
  if (!out || !shut) throw new Error("Missing controls");
  expect([out.width, out.height]).toEqual([shut.width, shut.height]);
  expect(out.y).toBe(shut.y);
  expect(shut.x - (out.x + out.width)).toBe(8);
  await zoomOut.click();
  await expect(bar).toBeVisible();
  await expect(zoomOut).toBeHidden();
  expect(await zoomIn.evaluate((button) => button.innerHTML)).toBe(icon);
});

test("every lightbox on the site uses the site's icons and font", async ({
  page,
}) => {
  const closeIcons = new Set<string>();
  const check = async (where: string, open: () => Promise<void>) => {
    await expect(async () => {
      await open();
      await expect(
        page.locator("dialog[open] .re-lightbox-image").first(),
        where,
      ).toBeVisible({ timeout: 1000 });
    }).toPass();
    const viewer = await page.locator("dialog[open]").evaluate((dialog) => ({
      textOnly: [...dialog.querySelectorAll(".re-lightbox-button")]
        .filter(
          (button) => button.checkVisibility() && !button.querySelector("svg"),
        )
        .map(
          (button) =>
            `${button.getAttribute("aria-label")}: ${button.textContent}`,
        ),
      close: dialog.querySelector(".re-lightbox-close svg")?.innerHTML ?? "",
      hearts: dialog.textContent?.includes("\u2665") ?? false,
      font:
        getComputedStyle(dialog.querySelector(".re-lightbox") ?? dialog)
          .fontFamily === getComputedStyle(document.body).fontFamily,
    }));
    expect(viewer.textOnly, where).toEqual([]);
    expect(viewer.hearts, where).toBe(false);
    expect(viewer.font, where).toBe(true);
    closeIcons.add(viewer.close);
    await page.keyboard.press("Escape");
    await closed(page);
  };
  for (const look of [
    "dark",
    "light",
    "page",
    "photos",
    "photos-app",
    "social-feed",
    "cloud-library",
    "minimal",
  ]) {
    await page.goto(`/lightbox/looks/${look}`);
    await check(look, () =>
      page.locator('main a[href^="/photos/"]').first().click(),
    );
  }
  for (const path of [
    "/",
    "/lightbox/examples/carousel",
    "/lightbox/examples/album",
    "/justified-gallery/examples/lightbox",
    "/carousel",
    "/carousel/examples/editorial",
  ]) {
    await page.goto(path);
    await hydrated(page, path);
    const area = page.locator(path === "/" ? "main" : preview);
    await check(path, () =>
      area
        .locator("button:has(img), a:has(img)")
        .filter({ visible: true })
        .first()
        .click(),
    );
  }
  expect([...closeIcons]).toHaveLength(1);
});

test("gallery examples give the photo paged to its own tile", async ({
  page,
}) => {
  for (const path of [
    "/justified-gallery/examples/lightbox",
    "/carousel",
    "/carousel/examples/editorial",
  ]) {
    await page.goto(path);
    await hydrated(page, path);
    const images = page.locator(`${preview} img`);
    const opened = images.filter({ visible: true }).first();
    const index = await opened.evaluate((image) =>
      [
        ...document.querySelectorAll(`[data-slot="example-preview"] img`),
      ].indexOf(image),
    );
    await expect(async () => {
      await opened.click();
      await expect(
        page.locator("dialog[open] .re-lightbox-image").first(),
      ).toBeVisible({ timeout: 1000 });
    }).toPass();
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(
        () =>
          images.evaluateAll((all) =>
            all.flatMap((image, at) =>
              (image as HTMLElement).style.visibility === "hidden" ? [at] : [],
            ),
          ),
        { message: path },
      )
      .toEqual([index + 1]);
    await page.keyboard.press("Escape");
    await closed(page);
  }
});

test("the journal keeps the default click: on the open photo it zooms, beside it it closes", async ({
  page,
}) => {
  await page.goto("/lightbox/examples/journal");
  const dialog = page.locator("dialog.re-lightbox[open]");
  const open = async () => {
    await expect(async () => {
      await page.locator(`${preview} a`).first().click();
      await expect(dialog.locator(".re-lightbox-image").first()).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await expect(dialog).toHaveAttribute("data-phase", "open");
    const box = await dialog
      .locator(".re-lightbox-image")
      .first()
      .boundingBox();
    if (!box) throw new Error("Missing open photo");
    return box;
  };
  const photo = await open();
  await page.mouse.click(photo.x + photo.width / 2, photo.y / 2);
  await closed(page);
  const again = await open();
  await page.mouse.click(again.x + again.width / 2, again.y + again.height / 2);
  await expect(dialog).toHaveAttribute("data-zoomed", "true");
});

test("a narrow annotated screenshot drops the pointer label gutter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/annotations/examples/review-notes");
  const figure = page.locator(`${preview} figure[data-re-annotations]`);
  await expect(figure.locator("[data-annot-drawing]")).toBeHidden();
  const [image, frame] = await Promise.all([
    figure.locator("[data-annot-media] img").boundingBox(),
    figure.boundingBox(),
  ]);
  expect(image?.width).toBe(frame?.width);
});

test("only the press to grab example shrinks its slides during a mouse drag", async ({
  page,
}) => {
  const press = async (path: string, scale: string) => {
    await page.goto(path);
    const strip = page.locator(`${preview} .re-carousel`);
    const slide = strip.locator(".re-carousel__slide").first();
    const box = await strip.boundingBox();
    if (!box) throw new Error(`No strip on ${path}`);
    const y = box.y + box.height / 2;
    // Until hydration creates the carousel, a drag does not mark the strip.
    await expect(async () => {
      await page.mouse.move(box.x + box.width / 2, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 - 120, y, { steps: 10 });
      try {
        await expect(strip).toHaveAttribute("data-re-dragging", "", {
          timeout: 500,
        });
        await expect
          .poll(() => slide.evaluate((node) => getComputedStyle(node).scale), {
            message: path,
          })
          .toBe(scale);
      } finally {
        await page.mouse.up();
      }
    }).toPass();
  };
  await press("/carousel/examples/press-to-grab", "0.96");
  await press("/carousel/examples/product-strip", "none");
});

test("the arrows style sizes each edge fade by the scroll left, frame by frame", async ({
  page,
}) => {
  const mountArrows = async () => {
    await page.goto("/carousel/guides/controls");
    let mounted: { fades: string[]; animations: number } | undefined;
    await expect(async () => {
      mounted = await page.evaluate(async () => {
        const label = [...document.querySelectorAll(".cc-seg-item")].find(
          (node) => node.textContent?.trim() === "Arrows",
        ) as HTMLElement;
        label.click();
        const frame = () => new Promise(requestAnimationFrame);
        let view: HTMLElement | null = null;
        for (let at = 0; at < 30 && !view; at++) {
          await frame();
          view = document.querySelector<HTMLElement>(".cc-edge .cc-view");
        }
        if (!view) throw new Error("Arrows did not mount");
        view.scrollIntoView({ block: "center" });
        const style = getComputedStyle(view);
        return {
          fades: [
            style.getPropertyValue("--re-fade-start"),
            style.getPropertyValue("--re-fade-end"),
          ],
          animations: view.getAnimations().length,
        };
      });
    }).toPass();
    return mounted;
  };
  // The fade edge measures on the frame after a scroll, so a fade may show the scroll of up to two frames before.
  const offTrack = () =>
    page.locator(".cc-edge .cc-view").evaluate(async (view) => {
      const next = view
        .closest(".cc-c")
        ?.querySelector<HTMLElement>("[data-carousel-next]");
      const max = view.scrollWidth - view.clientWidth;
      const read = () => {
        const style = getComputedStyle(view);
        const scrolled = Math.abs(view.scrollLeft);
        return {
          start: Math.min(56, scrolled),
          end: Math.min(56, max - scrolled),
          fades: [
            Number.parseFloat(style.getPropertyValue("--re-fade-start")),
            Number.parseFloat(style.getPropertyValue("--re-fade-end")),
          ],
        };
      };
      const misses: string[] = [];
      const recent = [read(), read()];
      const near = (value: number, targets: number[]) =>
        value >= Math.min(...targets) - 0.5 &&
        value <= Math.max(...targets) + 0.5;
      for (const _ of [0, 1, 2]) {
        next?.click();
        const begin = performance.now();
        while (performance.now() - begin < 700) {
          await new Promise(requestAnimationFrame);
          const now = read();
          recent.push(now);
          const window = recent.slice(-3);
          const [start, end] = now.fades;
          if (
            !near(
              start,
              window.map((frame) => frame.start),
            ) ||
            !near(
              end,
              window.map((frame) => frame.end),
            )
          )
            misses.push(`${start}/${end} at ${now.start}/${now.end}`);
        }
      }
      return { misses, reached: recent.at(-1)?.fades };
    });

  expect(await mountArrows()).toEqual({
    fades: ["0px", "56px"],
    animations: 0,
  });
  expect(await offTrack()).toEqual({ misses: [], reached: [56, 0] });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await mountArrows();
  expect(await offTrack()).toEqual({ misses: [], reached: [56, 0] });
});

test("the panel style shows the photo's position once", async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/lightbox/looks/panel");
    await page.locator('main a[href^="/photos/"]').first().click();
    await expect(page.locator(".re-lightbox-style-panel-count")).toBeVisible();
    const positions = await page.locator("dialog[open] *").evaluateAll(
      (elements) =>
        elements.filter((element) => {
          const position = (node: Element) =>
            /^1\s*(\/|of)\s*8$/.test(node.textContent?.trim() ?? "");
          return (
            position(element) &&
            element.checkVisibility() &&
            ![...element.children].some(position)
          );
        }).length,
    );
    expect(positions, `${width}px`).toBe(1);
  }
});

test("the footer lines up with the documentation column and the page bottom", async ({
  page,
}) => {
  await page.goto("/lightbox");
  const content = await page.locator("main#main").boundingBox();
  const footer = await page
    .locator('footer [data-slot="container"]')
    .boundingBox();
  expect(footer?.x).toBe(content?.x);
  expect(footer?.width).toBe(content?.width);
  await page.goto("/no-such-page");
  const bottom = await page.locator("footer").evaluate((element) => ({
    footer: Math.round(element.getBoundingClientRect().bottom),
    viewport: innerHeight,
  }));
  expect(bottom.footer).toBe(bottom.viewport);
});

test("404 navigation retains the framework after hydration", async ({
  page,
}) => {
  await page.goto("/lightbox/missing-page?framework=html");
  await expect(
    page.getByRole("link", { name: "Reuse", exact: true }),
  ).toHaveAttribute("href", "/?framework=html");
});

test("a recipe tooltip has one owner inside the documentation shell", async ({
  page,
}) => {
  for (const [path, label] of [
    ["/floating-tooltip", "Zoom in"],
    ["/floating-tooltip/examples/shortcuts", "Zoom in"],
    ["/floating-tooltip/examples/links", "Pink summit"],
    ["/floating-tooltip/examples/people", "Mara Lind"],
  ]) {
    await page.goto(path);
    await expect(
      page.locator('[role="tooltip"][class*="re-tooltip-"]'),
    ).toHaveCount(1);
    await page
      .getByRole(path.endsWith("/links") ? "link" : "button", {
        name: label,
        exact: true,
      })
      .focus();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toHaveCount(1);
    await expect(tooltip).toContainText(label);
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
  }
});

test("rich shortcut tooltips preserve their original dark pill", async ({
  page,
}) => {
  await page.goto("/floating-tooltip/examples/shortcuts");
  await expect(page.locator(".re-tooltip-shortcuts-popup")).toHaveCount(1);
  await page.getByRole("button", { name: "Zoom in", exact: true }).focus();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toHaveCount(1);
  await expect(tooltip).toHaveCSS("background-color", "rgb(17, 17, 17)");
  await expect(tooltip).toHaveCSS("padding", "4px 4px 4px 10px");
  await expect(tooltip.locator("kbd")).toHaveText("⌘+");
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
});

test("platform menu survives every short sequence of selection, closing and reopening", async ({
  page,
}) => {
  const { explore } = await import("../model/explore");
  const result = await explore(async () => {
    await page.goto("/shadows/getting-started");
    const menu = page.locator(chooser);
    let state = {
      open: false,
      selected: "React",
      current: 0,
      highlights: 0,
      agrees: false,
    };
    const read = async () => {
      await expect(menu.locator(".re-moving-highlight")).toHaveCount(1);
      state = await menu.evaluate((element) => ({
        open: (element as HTMLDetailsElement).open,
        selected:
          element.querySelector('a[aria-current="true"] span')?.textContent ??
          "",
        current: element.querySelectorAll('a[aria-current="true"]').length,
        highlights: element.querySelectorAll(".re-moving-highlight").length,
        agrees:
          (new URL(location.href).searchParams.get("framework") === "html") ===
          element
            .querySelector('a[aria-current="true"]')
            ?.textContent?.includes("HTML"),
      }));
    };
    await read();
    const select = async (name: string) => {
      if (!state.open) await menu.locator("summary").click();
      await menu.getByRole("link", { name, exact: true }).click();
      await expect(menu.locator('a[aria-current="true"]')).toContainText(name);
      await read();
    };
    return {
      steps: {
        toggle: async () => {
          await menu.locator("summary").click();
          await read();
        },
        escape: async () => {
          await page.keyboard.press("Escape");
          await read();
        },
        react: () => select("React"),
        html: () => select("HTML + JavaScript"),
      },
      checks: {
        "one background remains after repeated selection": () =>
          state.highlights === 1,
        "one selected platform agrees with the URL": () =>
          state.current === 1 && state.agrees,
      },
      fingerprint: () => JSON.stringify(state),
      home: () => !state.open && state.selected === "React",
    };
  }, 3);
  expect(result).toMatchObject({ ok: true });
  console.log("Platform menu model", result);
});

test("the shadow card stays inside its narrow showcase", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/shadows");
  const bounds = await page
    .locator('[data-slot="example-stage"]')
    .evaluate((stage) => {
      const card = stage.querySelector('[class*="re-shadow-ring-"]');
      if (!card) throw new Error("Missing shadow card");
      const area = stage.getBoundingClientRect();
      const box = card.getBoundingClientRect();
      return { left: box.left - area.left, right: area.right - box.right };
    });
  expect(bounds.left).toBeGreaterThanOrEqual(32);
  expect(bounds.right).toBeGreaterThanOrEqual(32);
});

for (const look of ["classic", "dark", "photos-app"]) {
  test(`the ${look} viewer opens the lightbox over the whole page from its tile`, async ({
    page,
  }) => {
    await page.goto(`/lightbox/looks/${look}`);
    const tile = page.locator('main a[href^="/photos/"]').first();
    await tile.scrollIntoViewIfNeeded();
    await tile.click();
    const dialog = page.locator("dialog.re-lightbox[open]");
    await expect(dialog).toHaveCount(1);
    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.width).toBe(viewport?.width);
    expect(box?.height).toBe(viewport?.height);
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });
}

test("the looks frame holds the real viewer's controls until the pointer moves, then pages, zooms and closes it", async ({
  page,
}) => {
  await page.goto("/lightbox/looks");
  await page.getByRole("tab", { name: "Layouts", exact: true }).click();
  const classic = page.getByRole("tab", { name: "Classic", exact: true });
  await expect(classic).toHaveAttribute("aria-selected", "true");
  const frame = page.frameLocator('iframe[title="Classic viewer"]');
  const dialog = frame.locator("dialog.re-lightbox[open]");
  await expect(dialog.locator(".re-lightbox-image").first()).toBeVisible();
  // Past the 2.5s a still mouse hides the controls after.
  await page.waitForTimeout(3200);
  await expect(dialog).toHaveAttribute("data-chrome", "shown");
  await expect(
    page.getByRole("tab", { name: "Layouts", exact: true }),
  ).toBeFocused();
  const box = await page.locator("iframe").boundingBox();
  if (!box) throw new Error("Missing frame");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, {
    steps: 4,
  });
  await expect(dialog).toHaveAttribute("data-chrome", "hidden", {
    timeout: 5000,
  });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3, {
    steps: 4,
  });
  await dialog.getByRole("button", { name: "Next image" }).click();
  await expect(dialog.locator(".re-lightbox-counter")).toHaveText("2 / 8");
  await dialog.getByRole("button", { name: "Zoom in" }).click();
  await expect(dialog).toHaveAttribute("data-zoomed", "true");
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(frame.locator("dialog[open]")).toHaveCount(0);
  await frame.locator('main a[href^="/photos/"]').nth(2).click();
  await expect(dialog.locator(".re-lightbox-counter")).toHaveText("3 / 8");
});

test("arrow keys on the look tabs keep focus on the page while each frame opens", async ({
  page,
}) => {
  await page.goto("/lightbox/looks");
  await page.getByRole("tab", { name: "Recipes", exact: true }).click();
  const tab = (name: string) =>
    page
      .getByRole("tablist", { name: "Recipes" })
      .getByRole("tab", { name, exact: true });
  await tab("Photos app").focus();
  for (const name of ["Social feed", "Cloud library"]) {
    await page.keyboard.press("ArrowRight");
    await expect(tab(name)).toBeFocused();
    await expect(
      page
        .frameLocator(`iframe[title="${name} viewer"]`)
        .locator("dialog[open] .re-lightbox-image")
        .first(),
    ).toBeVisible();
    await expect(tab(name)).toBeFocused();
  }
  await page.keyboard.press("End");
  await expect(tab("Minimal")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(tab("Photos app")).toBeFocused();
  await expect(page.locator("iframe")).toHaveCount(1);
});

test("a framed look viewer reports no visit", async ({ page }) => {
  const visits = /cloud\.umami\.is|cdn\.visitors\.now/;
  await page.route(visits, (route) => route.abort());
  const requested: string[] = [];
  page.on("request", (request) => {
    if (visits.test(request.url())) requested.push(request.frame().url());
  });
  await page.goto("/lightbox/looks");
  await expect(
    page
      .frameLocator('iframe[title="Dark viewer"]')
      .locator("dialog[open] .re-lightbox-image")
      .first(),
  ).toBeVisible();
  await expect.poll(() => requested.length).toBe(2);
  expect(requested.every((url) => url.endsWith("/lightbox/looks"))).toBe(true);
});

test("every site lightbox opens with the Classic controls", async ({
  page,
}) => {
  const look = async (path: string) => {
    await page.goto(path);
    await page
      .locator("main :is(a, button):has(img) >> visible=true")
      .first()
      .click();
    const close = page.locator("dialog.re-lightbox[open] .re-lightbox-close");
    await expect(close).toBeVisible();
    const style = await close.evaluate((button) => {
      const own = getComputedStyle(button);
      const room = button
        .closest(".re-lightbox")
        ?.querySelector(".re-lightbox-backdrop");
      return {
        size: own.width,
        control: own.backgroundColor,
        ring: own.boxShadow,
        room: room ? getComputedStyle(room).backgroundColor : null,
      };
    });
    await page.keyboard.press("Escape");
    return style;
  };
  const classic = await look("/lightbox/looks/classic");
  for (const path of [
    "/lightbox",
    "/lightbox/examples/product",
    "/lightbox/examples/album",
    "/justified-gallery/examples/lightbox",
    "/carousel",
    "/",
  ])
    expect(await look(path), path).toEqual(classic);
});

test("a site lightbox with one photo shows no counter", async ({ page }) => {
  await page.goto("/lightbox/examples/chat");
  await page.locator(".re-single a").click();
  await expect(
    page.locator("dialog.re-lightbox[open] .re-lightbox-close"),
  ).toBeVisible();
  await expect(
    page.locator("dialog.re-lightbox[open] .re-lightbox-counter"),
  ).toBeHidden();
});

test("the narrow header keeps a visible library icon and a usable keyboard switcher", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const [path, name] of [
    ["/shadows", "Shadows"],
    ["/", "Libraries"],
  ]) {
    await page.goto(path);
    const button = page.getByRole("button", { name, exact: true });
    const bounds = await button.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(32);
    const icon = await button.locator("svg").first().boundingBox();
    expect(icon?.width).toBe(16);
    const nav = await page
      .getByRole("navigation", { name: "Site", exact: true })
      .boundingBox();
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
      nav?.x ?? 0,
    );
    await button.press("ArrowDown");
    await expect(
      page
        .getByRole("navigation", { name: "Libraries", exact: true })
        .locator("a:focus"),
    ).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
  }
});

test("every library preview plays its real scene and keeps the menu open", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://cdn.visitors.now/v.js", (route) => route.abort());
  await page.route("https://cloud.umami.is/script.js", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Libraries" }).click();
  await page.mouse.move(1200, 700);
  const rows = page.locator("[data-peek]");
  const count = await rows.count();
  expect(count).toBe(15);
  for (let index = 0; index < count; index++) {
    await rows.nth(index).hover();
    await expect(
      page.locator(".f-peek-tip:not([hidden]) .re-stage-cursor[data-visible]"),
    ).toHaveCount(1);
    await expect(page.locator(".library-menu")).toBeVisible();
    await page.mouse.move(1200, 700);
  }
  expect(errors).toEqual([]);
});

test("a playing demo stage leaves the visitor's tooltip where the pointer is", async ({
  page,
}) => {
  await page.goto("/demo-stage");
  await page.locator(".re-stage").scrollIntoViewIfNeeded();
  await expect(page.locator(".re-stage-cursor[data-visible]")).toHaveCount(1);
  const github = page.locator('[data-re-tooltip="GitHub"]');
  const box = await github.boundingBox();
  if (!box) throw new Error("The GitHub link is not on screen.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 3,
  });
  const tip = page.getByRole("tooltip").filter({ hasText: "GitHub" });
  await expect(tip).toBeVisible();
  await expect
    .poll(() => tip.evaluate((popup) => popup.style.transform))
    .not.toContain("scale(");
  const first = await tip.boundingBox();
  await page.waitForTimeout(2000);
  await expect(tip).toBeVisible();
  expect(await tip.boundingBox()).toEqual(first);
});

test("the home strip lightbox closes onto the tile it paged to", async ({
  page,
}) => {
  await page.goto("/");
  const strip = page.locator(".h-strip-vp");
  const tiles = strip.locator("[data-carousel-slide] button");
  await tiles.first().scrollIntoViewIfNeeded();
  await tiles.first().click();
  await page.waitForSelector('dialog.re-lightbox[data-phase="open"]');
  for (let step = 0; step < 4; step++) {
    await page.keyboard.press("ArrowRight");
    if (step < 3)
      await page.waitForFunction(
        () => !document.querySelector(".h-strip-vp[data-re-scrolling]"),
      );
  }
  await page.keyboard.press("Escape");
  const tile = strip.locator("[data-carousel-slide] img").nth(4);
  const atClose = await tile.evaluate(
    (image) =>
      new Promise<number>((resolve) =>
        requestAnimationFrame(() =>
          resolve(image.getBoundingClientRect().left),
        ),
      ),
  );
  await expect(page.locator("dialog.re-lightbox")).toHaveCount(0);
  await page.waitForFunction(
    () => !document.querySelector(".h-strip-vp[data-re-scrolling]"),
  );
  const settled = await tile.evaluate(
    (image) => image.getBoundingClientRect().left,
  );
  expect(Math.abs(settled - atClose)).toBeLessThanOrEqual(1);
});
