import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

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
        } else await expect(page.locator("body")).not.toBeEmpty();
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
      page.getByRole("button", { name: "Next print", exact: true }),
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
    ).toHaveCount(3);
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
  await page.getByRole("button", { name: "Copy command", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "npm install @reuse-sh/interactions",
  );
});
