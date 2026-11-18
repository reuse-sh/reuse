import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { photo } from "./harness";

const packages = join(import.meta.dirname, "../../packages");

test("the browser builds run on a theme page with plain files and no import map", async ({
  page,
}) => {
  await page.route("http://theme.test/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/") {
      await route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/assets/carousel/styles.css">
<link rel="stylesheet" href="/assets/lightbox/base.css">
<link rel="stylesheet" href="/assets/lightbox/theme.css">
<script type="module">
import { createCarousel } from "/assets/carousel/browser/carousel.js";
import { bindLightboxGallery, createLightbox } from "/assets/lightbox/browser/lightbox.js";
window.strip = createCarousel(document.getElementById("strip"));
window.gallery = createLightbox();
bindLightboxGallery(document.getElementById("gallery"), window.gallery);
</script></head><body>
<div id="strip" style="width:300px">${[0, 1, 2]
          .map(
            (index) =>
              `<div data-carousel-slide style="flex:0 0 300px;height:100px">${index}</div>`,
          )
          .join("")}</div>
<div id="gallery"><a href="${photo(1)}"><img src="${photo(1)}" alt="Photo" width="120" height="80"></a></div>
</body></html>`,
      });
      return;
    }
    const match = /^\/assets\/(carousel|lightbox)\/(.+)$/.exec(pathname);
    if (!match) return route.fulfill({ status: 404 });
    await route.fulfill({
      contentType: pathname.endsWith(".css") ? "text/css" : "text/javascript",
      body: await readFile(join(packages, match[1], "dist", match[2])),
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://theme.test/");
  await page.waitForFunction(() => "gallery" in window && "strip" in window);
  await page.locator("#gallery img").click();
  await expect(page.locator("dialog.re-lightbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog.re-lightbox")).toHaveCount(0);
  await page.evaluate(() =>
    (window as unknown as { strip: { next(): void } }).strip.next(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as unknown as {
              strip: { getState(): { index: number } };
            }
          ).strip.getState().index,
      ),
    )
    .toBe(1);
  expect(errors).toEqual([]);
});

for (const [name, file] of [
  ["@reuse-sh/carousel", "carousel/dist/browser/carousel.js"],
  ["@reuse-sh/lightbox", "lightbox/dist/browser/lightbox.js"],
  ["@reuse-sh/lightbox", "lightbox/dist/browser/carousel-link.js"],
] as const) {
  test(`${file} opens with its banner and imports nothing by name`, async () => {
    const source = await readFile(join(packages, file), "utf8");
    const { version } = JSON.parse(
      await readFile(
        join(packages, file.split("/")[0], "package.json"),
        "utf8",
      ),
    );
    expect(source.split("\n")[0]).toBe(
      `/*! ${name} ${version} | MIT License */`,
    );
    expect(source).not.toMatch(/\b(?:from|import)\s*["'][^./]/);
    expect(source).toMatch(/\/\/# sourceMappingURL=\S+\.js\.map\s*$/);
  });
}

test("the lightbox build wraps base.css and theme.css in their layers and keeps copies without them", async () => {
  const dist = join(packages, "lightbox/dist");
  for (const [file, layer] of [
    ["base.css", "re.base"],
    ["theme.css", "re.theme"],
  ] as const) {
    const source = await readFile(join(packages, "lightbox/src", file), "utf8");
    const layered = await readFile(join(dist, file), "utf8");
    expect(layered.split("\n").slice(0, 2)).toEqual([
      "@layer re.base, re.theme;",
      `@layer ${layer} {`,
    ]);
    expect(layered).toContain(source);
    expect(await readFile(join(dist, "unlayered", file), "utf8")).toBe(source);
  }
});
