import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 1000 } });

test("home, overview and guide cards share compact feature copy and distinct title colors", async ({
  page,
}) => {
  for (const path of ["/", "/carousel", "/for-agents"]) {
    await page.goto(path);
    const copy = page.locator('[data-slot="feature-copy"]').first();
    await expect(copy).toHaveCSS("font-size", "14px");
    await expect(copy).toHaveCSS("line-height", "21px");
    await expect(copy).toHaveCSS("color", "rgb(91, 91, 91)");
    await expect(copy.locator("strong")).toHaveCSS("color", "rgb(17, 17, 17)");
  }
});

test("documentation typography and navigation use their compact roles", async ({
  page,
}) => {
  await page.goto("/carousel");
  await expect(
    page.getByRole("heading", { name: "Principles", exact: true }),
  ).toHaveCSS("font-size", "17px");
  await expect(
    page.getByRole("heading", { name: "Principles", exact: true }),
  ).toHaveCSS("line-height", "24px");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS(
    "letter-spacing",
    "-1.088px",
  );
  const sidebar = page.locator('[data-slot="docs-sidebar"]');
  await expect(
    sidebar.getByRole("link", { name: "Overview", exact: true }),
  ).toHaveCSS("padding", "0px");
  expect(
    (
      await sidebar
        .getByRole("link", { name: "Overview", exact: true })
        .boundingBox()
    )?.height,
  ).toBe(24);
  const pager = page.getByRole("navigation", {
    name: "Previous and next page",
  });
  await expect(pager).toHaveCSS("border-radius", "12px");
  await expect(pager.getByRole("link")).toHaveCSS("padding", "14px 16px");
  await page
    .getByRole("button", { name: "Carousel", exact: true })
    .press("ArrowDown");
  const row = page
    .getByRole("navigation", { name: "Libraries", exact: true })
    .getByRole("link")
    .first();
  const centers = await row.evaluate((element) => {
    const icon = element.querySelector("svg")?.getBoundingClientRect();
    const title = element.querySelector("b")?.getBoundingClientRect();
    return {
      icon: icon ? icon.y + icon.height / 2 : 0,
      title: title ? title.y + title.height / 2 : 1,
    };
  });
  expect(centers.icon).toBe(centers.title);
});

test("hold labels stay small and the confirmation fill reaches the borderless control edges", async ({
  page,
}) => {
  await page.goto("/hold-to-confirm");
  const button = page.getByRole("button", {
    name: "Hold to delete",
    exact: true,
  });
  await expect(button).toBeEnabled();
  await expect(button).toHaveCSS("font-size", "14px");
  await expect(button).toHaveCSS("line-height", "20px");
  await expect(button).toHaveCSS("border-width", "0px");
  const box = await button.boundingBox();
  if (!box) throw new Error("The hold control is missing");
  expect(box.height).toBe(40);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const fill = button.locator(".re-hold-fill");
  await expect
    .poll(() =>
      fill.evaluate(
        (element) => new DOMMatrix(getComputedStyle(element).transform).a,
      ),
    )
    .toBeGreaterThan(0);
  const insets = await fill.evaluate((element) => {
    const control = element.parentElement?.getBoundingClientRect();
    if (!control) throw new Error("The hold fill has no control");
    const bounds = element.getBoundingClientRect();
    return {
      left: bounds.left - control.left,
      top: bounds.top - control.top,
      bottom: control.bottom - bounds.bottom,
    };
  });
  expect(insets).toEqual({ left: 0, top: 0, bottom: 0 });
  await page.locator('[data-slot="example-preview"]').screenshot({
    path: ".specs/001-documentation-platforms/polish-media/after/hold-progress.png",
  });
  await page.mouse.up();
  await expect
    .poll(() =>
      fill.evaluate(
        (element) => new DOMMatrix(getComputedStyle(element).transform).a,
      ),
    )
    .toBe(0);
});

test("code frames reveal copying on hover and focus and preserve copied feedback", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/shadows/getting-started");
  const code = page.locator('[data-slot="code-block"]').first();
  const action = code.locator('[data-slot="code-copy"]');
  const copy = action.getByRole("button", { name: "Copy code", exact: true });
  await expect(copy).toBeEnabled();
  await expect(code.locator('[data-slot="code-toolbar"]')).toContainText(
    "Terminal",
  );
  await expect(code.locator('[data-slot="code-surface"]')).toHaveCount(1);
  await page.mouse.move(0, 0);
  await expect(action).toHaveCSS("opacity", "0");
  await code.hover();
  await expect(action).toHaveCSS("opacity", "1");
  await copy.focus();
  await page.mouse.move(0, 0);
  await expect(action).toHaveCSS("opacity", "1");
  await copy.press("Enter");
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("npm install @reuse-sh/shadows");
  await page.getByRole("link", { name: "Reuse", exact: true }).focus();
  await expect(action).toHaveCSS("opacity", "1");
});

test("agent handoff copies the current example and platform without a bottom prompt panel", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/carousel");
  const actions = page.locator('[data-slot="doc-actions"]');
  await expect(
    actions.getByRole("link", { name: "Get started", exact: true }),
  ).toHaveAttribute("href", "/carousel/getting-started");
  await actions
    .getByRole("button", { name: "Copy prompt for your agent", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("Use React with Tailwind CSS.");
  await page.goto("/carousel/examples/product-strip?framework=html");
  const prompt = page.getByRole("button", {
    name: "Copy prompt for your agent",
    exact: true,
  });
  await expect(prompt).toHaveCount(1);
  await prompt.click();
  const value = await page.evaluate(() => navigator.clipboard.readText());
  expect(value).toContain("https://reuse.sh/carousel/guide.md");
  expect(value).toContain("https://reuse.sh/carousel/examples/product-strip");
  expect(value).toContain("Use HTML, CSS and JavaScript.");
  await expect(
    page.getByText("Hand this page to your coding agent.", { exact: true }),
  ).toHaveCount(0);
});

test.describe("touch code actions", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  test("copying stays visible without hover", async ({ page }) => {
    await page.goto("/shadows/getting-started");
    await expect(page.locator('[data-slot="code-copy"]').first()).toHaveCSS(
      "opacity",
      "1",
    );
  });
});

test.describe("agent entry without scripts", () => {
  test.use({ javaScriptEnabled: false });
  test("initial copy controls are disabled while the native getting-started link works", async ({
    page,
  }) => {
    await page.goto("/carousel?framework=html");
    await expect(
      page.getByRole("button", {
        name: "Copy prompt for your agent",
        exact: true,
      }),
    ).toBeDisabled();
    await page.getByRole("link", { name: "Get started", exact: true }).click();
    await expect(page).toHaveURL(/carousel\/getting-started\?framework=html/);
    await expect(
      page
        .locator('[data-slot="code-block"]')
        .first()
        .getByRole("button", { name: "Copy code", exact: true }),
    ).toBeDisabled();
  });
});
