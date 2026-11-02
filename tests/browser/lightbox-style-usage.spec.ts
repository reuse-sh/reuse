import { expect, test } from "@playwright/test";
import {
  lightboxCode,
  lightboxStyles,
} from "../../apps/site/components/docs/lightbox-styles";
import { mount, photo } from "./harness";

for (const [name, options] of Object.entries(lightboxStyles)) {
  test(`published ${name} lightbox layout opens twice and releases its dialog`, async ({
    page,
  }) => {
    const code = lightboxCode(options);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await mount(page, code.html, ["lightbox/styles.css"]);
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
      .replace(
        /^import \{ addChrome \} from "\.\/lightbox-chrome.js";\n?/m,
        "",
      );
    await page.addScriptTag({
      type: "module",
      content: `${code.chrome?.replace("export function", "function") ?? ""}\n${setup}\nwindow.__destroy = () => { ${code.cleanup} };\nwindow.__ready = true;`,
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
}
