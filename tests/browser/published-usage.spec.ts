import { expect, test } from "@playwright/test";
import {
  docPages,
  libraries,
  usageRecipes,
} from "../../packages/catalog/dist/index.js";
import { mount, photo } from "./harness";

const routes = libraries.flatMap((library) =>
  docPages(library)
    .filter(
      (page) =>
        page.path === "getting-started" ||
        (page.path.startsWith("examples/") &&
          `${library.slug}/${page.path}` !==
            "lightbox/examples/device-check") ||
        page.path.startsWith("guides/"),
    )
    .map((page) => `${library.slug}/${page.path}`),
);

test("published usage covers every start, example and guide", () => {
  expect(Object.keys(usageRecipes).sort()).toEqual(routes.sort());
});

for (const [path, recipe] of Object.entries(usageRecipes)) {
  test(`${path} native fragment initializes and tears down with real package exports`, async ({
    page,
    context,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const blocks = recipe.html
      .flatMap((section) => section.blocks)
      .filter((block) => block.kind === "code");
    const markup = blocks
      .filter((block) => block.language === "html")
      .map((block) => block.code)
      .join("\n");
    const styles = blocks
      .filter((block) => block.language === "css")
      .map((block) => block.code)
      .join("\n");
    const setup = blocks
      .filter(
        (block) => block.language === "javascript" && block.role !== "cleanup",
      )
      .map((block) => block.code)
      .join("\n");
    const cleanup = blocks
      .filter(
        (block) => block.language === "javascript" && block.role === "cleanup",
      )
      .map((block) => block.code)
      .join("\n");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const imports = [
      ...styles.matchAll(/@import\s+["']@reuse-sh\/([^"']+)["'][^;]*;/g),
    ].map((match) => match[1]);
    await mount(page, markup, imports, "http://localhost:4173");
    await page.route(/\/(?:images|photos)\//, (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: decodeURIComponent(photo(1).split(",")[1]),
      }),
    );
    await page.reload();
    const localStyles = styles.replace(/@import[^;]*;/g, "").trim();
    if (localStyles) await page.addStyleTag({ content: localStyles });
    if (path.startsWith("loaders/"))
      await expect(
        page.locator(".re-thinking-dots__fallback").first(),
      ).toBeVisible();
    if (path.startsWith("lightbox/"))
      await expect(page.locator("img").first()).toBeVisible();
    if (setup) {
      await page.addScriptTag({
        type: "module",
        content: `${setup}\nwindow.__usageCleanup = () => { ${cleanup} };\nwindow.__usageReady = true;`,
      });
      await expect
        .poll(() =>
          page.evaluate(() =>
            Boolean(
              (window as unknown as { __usageReady?: boolean }).__usageReady,
            ),
          ),
        )
        .toBe(true);
    }
    if (path.startsWith("lightbox/")) {
      await page.locator("a").first().click();
      await expect(page.locator("dialog[open]")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await page.locator("a").first().click();
      await expect(page.locator("dialog[open]")).toHaveCount(1);
    }
    if (path === "lightbox/examples/product") {
      const dialog = page.locator("dialog[open]");
      await expect(dialog.locator(".re-lightbox-backdrop")).toHaveCSS(
        "background-color",
        "rgb(252, 252, 252)",
      );
      const close = dialog.locator(".re-lightbox-close");
      await expect(close).toHaveCSS("width", "40px");
      await expect(close).toHaveCSS("background-color", "rgb(255, 255, 255)");
      const counter = await dialog
        .locator(".re-lightbox-counter")
        .boundingBox();
      expect(
        [counter?.x, counter?.y, counter?.height].map((n) =>
          Math.round(n ?? 0),
        ),
      ).toEqual([16, 16, 40]);
      const zoomPaths = () =>
        dialog
          .locator(".re-lightbox-zoom path")
          .evaluateAll((paths) => paths.map((path) => path.getAttribute("d")));
      expect(await zoomPaths()).toEqual([
        "M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0M21 21l-4.35-4.35",
        "M11 8v6M8 11h6",
      ]);
      await dialog.locator(".re-lightbox-zoom").click();
      await expect
        .poll(zoomPaths)
        .toEqual([
          "M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0M21 21l-4.35-4.35",
          "M8 11h6",
        ]);
    }
    if (path.startsWith("annotations/") && !path.endsWith("data-format"))
      await expect(page.locator("[data-re-annotations]")).toHaveCount(1);
    if (path.startsWith("floating-tooltip/")) {
      await page
        .locator("[data-re-tooltip], [data-re-tooltip-template]")
        .first()
        .focus();
      await expect(page.getByRole("tooltip")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
    }
    if (path.startsWith("demo-stage/")) {
      await expect(page.locator(".re-stage-cursor[data-visible]")).toHaveCount(
        1,
      );
      await expect(page.locator("#share-menu")).toBeVisible();
      await expect(page.locator("#share-menu")).toBeHidden();
    }
    if (path.startsWith("copy-button/")) {
      await page.locator("#copy").click();
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .not.toBe("");
    }
    if (path === "moving-highlight/examples/tabs") {
      await expect(page.locator("#tab-files")).toHaveCSS("padding", "8px 12px");
      await page.locator("#tab-activity").click();
      await expect(page.locator("#panel-activity")).toBeVisible();
      await expect(page.locator("#panel-files")).toBeHidden();
      await page.locator("#tab-activity").press("ArrowRight");
      await expect(page.locator("#tab-files")).toBeFocused();
    }
    if (path.startsWith("loaders/")) {
      await expect(
        page.locator(".re-thinking-dots__fallback").first(),
      ).toBeHidden();
      const painted = await page
        .locator("canvas")
        .first()
        .evaluate((canvas: HTMLCanvasElement) => {
          const pixels = canvas
            .getContext("2d")
            ?.getImageData(0, 0, canvas.width, canvas.height).data;
          return (
            pixels &&
            Array.from(pixels).some(
              (value, index) => index % 4 === 3 && value > 0,
            )
          );
        });
      expect(painted).toBe(true);
    }
    if (path.startsWith("justified-gallery/"))
      await expect(
        page.locator(".re-justified[data-re-justified]"),
      ).toHaveCount(1);
    if (path === "justified-gallery/examples/lightbox") {
      await page.locator("#prints button").first().click();
      await expect(page.locator("dialog[open]")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
    }
    if (path.startsWith("masonry/")) {
      await expect(page.locator(".re-masonry[data-re-masonry]")).toHaveCount(1);
      await expect
        .poll(() =>
          page
            .locator(".re-masonry > :nth-child(2)")
            .evaluate((element: HTMLElement) => element.style.gridColumn),
        )
        .not.toBe("");
    }
    if (path === "lightbox/examples/portfolio") {
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await page.locator("#load-more").click();
      await expect(page.locator("#load-more")).toBeHidden();
      await expect(
        page.locator('#portfolio a[href$="pier.jpg"]'),
      ).toBeFocused();
    }
    if (setup)
      await page.evaluate(() =>
        (window as unknown as { __usageCleanup: () => void }).__usageCleanup(),
      );
    if (path.startsWith("justified-gallery/"))
      await expect(page.locator("[data-re-justified]")).toHaveCount(0);
    if (path === "justified-gallery/examples/lightbox")
      await expect(page.locator("dialog")).toHaveCount(0);
    if (path.startsWith("masonry/"))
      await expect(page.locator("[data-re-masonry], [style]")).toHaveCount(0);
    if (path.startsWith("lightbox/"))
      await expect(page.locator("dialog")).toHaveCount(0);
    if (path.startsWith("loaders/"))
      await expect(
        page.locator(".re-thinking-dots__fallback").first(),
      ).toBeVisible();
    if (path === "moving-highlight/examples/tabs") {
      await expect(page.locator("#project-tabs")).toBeHidden();
      await expect(page.locator("#panel-files")).toBeVisible();
      await expect(page.locator("#panel-activity")).toBeVisible();
    }
    if (path.startsWith("shadows/")) {
      const shadow = await page
        .locator('[class*="re-shadow-"]')
        .first()
        .evaluate((element) => getComputedStyle(element).boxShadow);
      expect(shadow).not.toBe("none");
    }
    if (
      path.startsWith("easing-gradients/") &&
      markup.includes('class="re-gradient')
    ) {
      const gradient = await page
        .locator(".re-gradient")
        .first()
        .evaluate((element) => getComputedStyle(element).backgroundImage);
      expect(gradient).not.toBe("none");
    }
    expect(errors).toEqual([]);
  });
}
