import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { JSDOM } from "jsdom";
import { mount } from "../browser/harness";
import originalGeometry from "./fixtures/demo-geometry.json" with {
  type: "json",
};

test.use({ viewport: { width: 1280, height: 800 } });

const root = resolve("apps/site/examples");
const recipes = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

for (const width of [216, 1280]) {
  test.describe(`${width}px recipe container`, () => {
    test.use({ viewport: { width, height: 800 } });
    for (const id of recipes) {
      test(`${id} runs without the site shell`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`/examples/${id}/index.html`);
        if (id === "loaders-start" || id === "loaders-figures") {
          const canvas = page.locator("canvas").first();
          await expect(canvas).toBeVisible();
          const painted = await canvas.evaluate((element) => {
            const context = element.getContext("2d");
            return (
              context &&
              Array.from(
                context.getImageData(0, 0, element.width, element.height).data,
              ).some((value, index) => index % 4 === 3 && value > 0)
            );
          });
          expect(painted).toBe(true);
        } else {
          const content = page.locator(".re-example, .re-cc").first();
          await expect(content).toBeVisible();
          expect((await content.boundingBox())?.height).toBeGreaterThan(0);
        }
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth,
          ),
        ).toBe(true);
        expect(errors).toEqual([]);
      });
    }
  });
}

test("framework navigation and source files follow the selected platform", async ({
  page,
}) => {
  await page.goto(
    "/carousel/getting-started?framework=html&view=code&file=main.js",
  );
  await expect(page.locator(".re-example-source code")).toHaveText(
    await readFile(resolve(root, "carousel-start/main.js"), "utf8"),
  );
  await page.getByRole("link", { name: "Product strip", exact: true }).click();
  await expect(page).toHaveURL(/framework=html/);
  await expect(page.getByTitle("HTML and JavaScript example")).toBeVisible();
  await page.getByRole("link", { name: "Code", exact: true }).click();
  await page.getByRole("link", { name: "styles.css", exact: true }).click();
  await expect(page.locator(".re-example-source code")).toHaveText(
    await readFile(resolve(root, "carousel-product-strip/styles.css"), "utf8"),
  );
  await page.reload();
  await expect(page.locator(".re-source-files a[aria-current]")).toHaveText(
    "styles.css",
  );
  await page.goBack();
  await expect(page.locator(".re-source-files a[aria-current]")).toHaveText(
    "index.html",
  );
  await page.getByRole("link", { name: "Reuse", exact: true }).click();
  await expect(page).toHaveURL(/framework=html/);
  await page
    .getByRole("link", { name: "Start with Lightbox", exact: true })
    .click();
  await expect(page).toHaveURL(/framework=html/);
  await expect(page.getByTitle("HTML and JavaScript example")).toBeVisible();
});

test("framework menu uses one moving background and only the active view is underlined", async ({
  page,
}) => {
  await page.goto("/carousel");
  await page.locator(".d-side .re-framework summary").click();
  const options = page.locator(".d-side .re-framework-options");
  await expect(options.locator(".re-moving-highlight")).toHaveCount(1);
  await options
    .getByRole("link", { name: "HTML + JavaScript", exact: true })
    .focus();
  await expect(options.locator(".re-moving-highlight")).toHaveAttribute(
    "data-visible",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".d-side .re-framework summary")).toBeFocused();
  await page.locator(".d-side .re-framework summary").click();
  await options
    .getByRole("link", { name: "HTML + JavaScript", exact: true })
    .click();
  await page.locator(".d-side .re-framework summary").click();
  await expect(options.locator(".re-moving-highlight")).toHaveCount(1);
  const borders = await page
    .locator(".re-example-tabs")
    .evaluate((element) => ({
      root: getComputedStyle(element).borderBottomWidth,
      selected: getComputedStyle(
        element.querySelector('[aria-current="page"]') as Element,
      ).borderBottomColor,
      selectedWidth: getComputedStyle(
        element.querySelector('[aria-current="page"]') as Element,
      ).borderBottomWidth,
    }));
  expect(borders.root).toBe("0px");
  expect(borders.selectedWidth).toBe("1px");
  expect(borders.selected).not.toBe("rgba(0, 0, 0, 0)");
});

test.describe("server HTML without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("carousel content and platform links survive without hydration", async ({
    page,
  }) => {
    await page.goto("/carousel/getting-started");
    await expect(page.locator(".re-example-panel img")).toHaveCount(6);
    await expect(page.locator(".re-example-panel img").first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Next slide", exact: true }),
    ).toBeDisabled();
    await page.locator(".d-side .re-framework summary").click();
    await page
      .locator(".d-side .re-framework-options")
      .getByRole("link", { name: "HTML + JavaScript", exact: true })
      .click();
    await expect(page).toHaveURL(/framework=html/);
    await page.getByRole("link", { name: "Code", exact: true }).click();
    await expect(page.locator(".re-example-source code")).toContainText(
      "<!doctype html>",
    );
  });
  test("avatar photos and static loader figures survive without hydration", async ({
    page,
  }) => {
    await page.goto("/avatars/getting-started");
    await expect(
      page.locator(".re-example-panel .re-avatar-image"),
    ).toHaveCount(7);
    await expect(
      page.locator(".re-example-panel .re-avatar-image").first(),
    ).toBeVisible();
    await page.goto("/loaders/getting-started");
    await expect(
      page.locator(".re-thinking-dots__fallback").first(),
    ).toBeVisible();
    await expect(page.locator(".re-thinking-dots canvas").first()).toBeHidden();
  });
});

test("a persisted pagehide keeps the native copy controller alive", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/examples/copy-start/index.html");
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    ),
  );
  await page
    .getByRole("button", { name: "Copy install command", exact: true })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "npm install @reuse-sh/interactions",
  );
});

test.describe("review regressions without scripts", () => {
  test.use({ javaScriptEnabled: false });
  test("HTML framework survives the global shell and home page", async ({
    page,
  }) => {
    await page.goto("/carousel/getting-started?framework=html");
    await expect(
      page.getByRole("link", { name: "Reuse", exact: true }),
    ).toHaveAttribute("href", "/?framework=html");
    await page.getByRole("link", { name: "Reuse", exact: true }).click();
    await expect(
      page.getByRole("link", { name: "Start with Lightbox", exact: true }),
    ).toHaveAttribute("href", "/lightbox?framework=html");
    await page
      .getByRole("link", { name: "Start with Lightbox", exact: true })
      .click();
    await expect(page).toHaveURL(/framework=html/);
    await expect(page.getByTitle("HTML and JavaScript example")).toBeVisible();
  });
  test("React copy actions start disabled before enhancement", async ({
    page,
  }) => {
    await page.goto("/copy-button/getting-started");
    await expect(
      page.getByRole("button", { name: "Copy install command", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Copy link", exact: true }),
    ).toBeDisabled();
    await page.goto("/copy-button/examples/code-block");
    await expect(
      page.getByRole("button", { name: "Copy command", exact: true }),
    ).toBeDisabled();
    await expect(page.locator(".re-example-panel code")).toHaveText(
      "$ npm install @reuse-sh/interactions",
    );
    await page.goto("/copy-button/examples/share-link");
    await expect(
      page.getByRole("button", { name: "Copy link", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("textbox", { name: "Link to the print" }),
    ).toHaveValue("https://prints.example/coral-sky");
  });
});

test("review regression: exported lightbox HTML opens the viewer after closing it", async ({
  page,
  request,
}) => {
  const response = await request.get(
    "/lightbox/controls/classic?framework=html",
  );
  const document = new JSDOM(await response.text()).window.document;
  const code = [...document.querySelectorAll(".d-ex-code .c-code pre")].map(
    (element) => element.textContent ?? "",
  );
  expect(code).toHaveLength(3);
  const gallery = new JSDOM(code[0]).window.document;
  gallery.querySelectorAll("script").forEach((script) => {
    script.remove();
  });
  await page.route("https://reuse.sh/images/**", async (route) => {
    const name =
      new URL(route.request().url()).pathname.split("/").at(-1) ?? "";
    await route.fulfill({
      contentType: "image/svg+xml",
      body: await readFile(resolve("apps/site/public/images", name)),
    });
  });
  await mount(page, gallery.body.innerHTML, ["lightbox/styles.css"]);
  await page.addStyleTag({ content: code[2] });
  await page.addScriptTag({
    type: "module",
    content: code[1].replace(/^import ["'][^"']+\.css["'];\n?/gm, ""),
  });
  const viewer = page.locator("dialog[open]");
  if (await viewer.count()) {
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);
  }
  await page.getByRole("link").first().click();
  await expect(viewer).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(viewer).toHaveCount(0);
  await page.getByRole("link").nth(1).click();
  await expect(viewer).toHaveCount(1);
});

for (const framework of ["react", "html"]) {
  test(`carousel ${framework} preserves the original controls and moving dot`, async ({
    page,
  }) => {
    await page.goto(`/carousel?framework=${framework}`);
    const demo =
      framework === "html"
        ? page.frameLocator('iframe[title="HTML and JavaScript example"]')
        : page.locator(".re-example-panel");
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

test("existing demos keep their measured composition after the styling migration", async ({
  page,
}) => {
  for (const original of originalGeometry) {
    await page.goto(original.path);
    await page.evaluate(() => document.fonts.ready);
    const stage = page.locator(".re-example-panel .d-stage-card");
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
    page.getByText("The coral one is my favorite", { exact: true }),
  ).toHaveCSS("background-color", "rgb(31, 111, 235)");
  await page.goto("/moving-highlight/examples/menu");
  const row = page.getByRole("menuitem", { name: "New print" });
  const key = row.locator("kbd");
  const rowBounds = await row.boundingBox();
  const keyBounds = await key.boundingBox();
  expect(keyBounds?.x).toBeGreaterThan((rowBounds?.x ?? 0) + 200);
});

for (const width of [320, 768, 1280]) {
  test(`HTML preview keeps the page breakpoints at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/carousel/examples/product-strip");
    const sizes = await page
      .locator(".re-example-panel img")
      .evaluateAll((images) =>
        images.map((image) => ({
          width: image.getBoundingClientRect().width,
          height: image.getBoundingClientRect().height,
        })),
      );
    await page.goto("/carousel/examples/product-strip?framework=html");
    const images = page
      .frameLocator('iframe[title="HTML and JavaScript example"]')
      .locator("img");
    await expect(images).toHaveCount(6);
    await expect
      .poll(() =>
        images.evaluateAll((images) =>
          images.map((image) => ({
            width: image.getBoundingClientRect().width,
            height: image.getBoundingClientRect().height,
          })),
        ),
      )
      .toEqual(sizes);
  });
}

test("image captions keep their title white over the scrim", async ({
  page,
}) => {
  await page.goto("/easing-gradients/examples/image-caption");
  await expect(page.locator(".re-example-panel figcaption b")).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
});
test("chat composers fit inside narrow panels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const path of [
    "/lightbox/examples/chat",
    "/loaders/examples/chat-reply",
  ]) {
    await page.goto(path);
    const form = page.locator(
      ".re-example-panel .re-compose, .re-example-panel form",
    );
    const bounds = await form.boundingBox();
    const panel = await page
      .locator(".re-example-panel .d-stage")
      .boundingBox();
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
      (panel?.x ?? 0) + (panel?.width ?? 0) - 31,
    );
    await expect(
      form.getByRole("button", { name: "Send", exact: true }),
    ).toBeVisible();
  }
});
