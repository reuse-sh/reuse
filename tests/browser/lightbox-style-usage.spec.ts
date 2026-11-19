import { expect, test } from "@playwright/test";
import {
  LIGHTBOX_STYLE_CLASS,
  lightboxCode,
  lightboxStyles,
} from "../../apps/site/components/docs/lightbox-styles";
import { mount, photo } from "./harness";

for (const [name, options] of Object.entries(lightboxStyles)) {
  test(`published ${name} lightbox layout opens twice and releases its dialog`, async ({
    page,
  }) => {
    const code = lightboxCode(options);
    expect(code.chrome ?? "").not.toContain("querySelector");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await mount(page, code.html, ["lightbox/base.css", "lightbox/theme.css"]);
    await page.route("http://reuse.test/photos/**", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: decodeURIComponent(photo(2).split(",")[1]),
      }),
    );
    await page.reload();
    await page.addStyleTag({ content: code.css });
    const setup = code.js
      .replace(/^import ["'][^"']+\.css["'];\n?/gm, "")
      .replace(/^import \{ [^}]+ \} from "\.\/lightbox-chrome\.js";\n?/m, "");
    await page.addScriptTag({
      type: "module",
      content: `${code.chrome?.replaceAll("export function", "function") ?? ""}\n${setup}\nwindow.__destroy = () => { ${code.cleanup} };\nwindow.__ready = true;`,
    });
    await expect
      .poll(() =>
        page.evaluate(() =>
          Boolean((window as unknown as { __ready?: boolean }).__ready),
        ),
      )
      .toBe(true);
    for (const index of [0, 1]) {
      await page.locator("[data-gallery] a").nth(index).click();
      await expect(page.locator("dialog[open]")).toHaveCount(1);
      await expect(
        page.locator("dialog[open] .re-lightbox-image").first(),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
    }
    await page.locator("[data-gallery] a").first().click();
    await expect(page.locator("dialog[open]")).toHaveCount(1);
    await page.evaluate(() =>
      (window as unknown as { __destroy: () => void }).__destroy(),
    );
    await expect(page.locator("dialog")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`published ${name} lightbox closes from a mouse press held on the close button's outer edge`, async ({
    page,
  }) => {
    const code = lightboxCode(options);
    await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
    await page.addStyleTag({ content: code.css });
    await page.evaluate(
      async ([className, src]) => {
        const { createLightbox } = await import("/modules/lightbox/index.js");
        createLightbox({ history: false, autoHide: false, className }).open([
          { src, width: 1200, height: 800 },
        ]);
      },
      [LIGHTBOX_STYLE_CLASS, photo(1)] as const,
    );
    const close = page.locator("dialog[open] .re-lightbox-close");
    await expect(close).toBeVisible();
    await page.waitForTimeout(500);
    const box = await close.boundingBox();
    if (!box) throw new Error("no close button");
    await page.mouse.move(box.x + box.width - 0.5, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(200);
    await page.mouse.up();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });
}
