import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 1000 } });

test("agent handoff uses the white secondary surface", async ({ page }) => {
  for (const path of ["/lightbox", "/", "/for-agents"]) {
    await page.goto(path);
    const button = page.getByRole("button", {
      name: "Copy prompt for your agent",
      exact: true,
    });
    await expect(button).toBeEnabled();
    await expect(button).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(button).toHaveCSS("color", "rgb(17, 17, 17)");
  }
});

test("copy press and release retain scale transitions and respect reduced motion", async ({
  page,
}) => {
  await page.goto("/lightbox");
  const button = page.getByRole("button", {
    name: "Copy prompt for your agent",
    exact: true,
  });
  await expect(button).toBeEnabled();
  const properties = await button.evaluate((element) =>
    getComputedStyle(element)
      .transitionProperty.split(",")
      .map((value) => value.trim()),
  );
  expect(properties).toContain("scale");
  expect(properties).toContain("transform");
  await expect(button).toHaveCSS("transition-duration", "0.15s");
  const resting = await button.evaluate(
    (element) => getComputedStyle(element).scale,
  );
  const box = await button.boundingBox();
  if (!box) throw new Error("The prompt control is missing");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await button.evaluate(async (element) => {
    await Promise.allSettled(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  await expect(button).toHaveCSS("scale", "0.97");
  await page.mouse.up();
  await button.evaluate(async (element) => {
    await Promise.allSettled(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  await expect(button).toHaveCSS("scale", resting);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(button).toHaveCSS("transition-property", "none");
});

for (const platform of ["react", "html"])
  test(`Media is a supported-image reference in ${platform}`, async ({
    page,
  }) => {
    await page.goto(`/lightbox/guides/media?framework=${platform}`);
    const article = page.locator('[data-slot="doc-content"]');
    await expect(
      article.getByRole("heading", { name: "Supported media", exact: true }),
    ).toBeVisible();
    await expect(
      article.getByRole("heading", {
        name: "Full-size images and previews",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      article.getByRole("heading", {
        name: "Loading and failure",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      article.getByRole("heading", { name: "Install", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("are planned");
  });

test("all reference guides omit duplicate installation sections", async ({
  page,
}) => {
  for (const path of [
    "/lightbox/guides/media",
    "/carousel/guides/controls",
    "/annotations/guides/data-format",
    "/easing-gradients/guides/easing-curves",
  ]) {
    await page.goto(path);
    await expect(
      page
        .locator('[data-slot="doc-content"]')
        .getByRole("heading", { name: "Install", exact: true }),
    ).toHaveCount(0);
  }
});

test("reference prompts keep the exact page and selected platform", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const path of [
    "/lightbox/guides/media",
    "/lightbox/controls/classic",
    "/lightbox/api",
  ]) {
    await page.goto(`${path}?framework=html`);
    await page
      .getByRole("button", { name: "Copy prompt for your agent", exact: true })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain(`https://reuse.sh${path}?framework=html`);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
      "Use HTML, CSS and JavaScript.",
    );
  }
});

test("general agent prompts stay independent of the documentation platform", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  for (const path of ["/?framework=html", "/for-agents?framework=react"]) {
    await page.goto(path);
    const button = page.getByRole("button", {
      name: "Copy prompt for your agent",
      exact: true,
    });
    await button.click();
    await expect(button).toHaveAttribute("data-state", "copied");
    const value = await page.evaluate(() => navigator.clipboard.readText());
    expect(value).toContain("https://reuse.sh/llms.txt");
    expect(value).not.toContain("Use React with Tailwind CSS.");
    expect(value).not.toContain("Use HTML, CSS and JavaScript.");
  }
});
