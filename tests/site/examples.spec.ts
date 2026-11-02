import { expect, test } from "@playwright/test";
import originalGeometry from "./fixtures/demo-geometry.json" with {
  type: "json",
};

test.use({ viewport: { width: 1280, height: 800 } });
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
    if (paragraph?.tagName !== "P")
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
    page.getByText("The coral one is my favorite", { exact: true }),
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
  for (const path of [
    "/lightbox/examples/chat",
    "/loaders/examples/chat-reply",
  ]) {
    await page.goto(path);
    const form = page.locator(
      '[data-slot="example-preview"] .re-compose, [data-slot="example-preview"] form',
    );
    const bounds = await form.boundingBox();
    const panel = await page
      .locator('[data-slot="example-stage"]')
      .boundingBox();
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(
      (panel?.x ?? 0) + (panel?.width ?? 0) - 31,
    );
    await expect(
      form.getByRole("button", { name: "Send", exact: true }),
    ).toBeVisible();
  }
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
    ["/floating-tooltip/examples/links", "Coral sky"],
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

test("lightbox preview shows its reopen action only after closing", async ({
  page,
}) => {
  await page.goto("/lightbox/controls/classic");
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("dialog[open]")).toHaveCount(1);
  await expect(
    frame.getByRole("button", { name: "Open again", exact: true }),
  ).toBeHidden();
  await frame
    .getByRole("button", { name: "Close gallery", exact: true })
    .click();
  await expect(
    frame.getByRole("button", { name: "Open again", exact: true }),
  ).toBeVisible();
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
