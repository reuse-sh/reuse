import { expect, test } from "@playwright/test";

for (const { name, viewport } of [
  { name: "phone", viewport: { width: 390, height: 844 } },
  { name: "laptop", viewport: { width: 1440, height: 900 } },
]) {
  test.describe(name, () => {
    test.use({ viewport, deviceScaleFactor: 2 });

    test("the home carousel opens a sharp photo without changing its source", async ({
      page,
    }) => {
      await page.goto("/");
      const tile = page.getByRole("button", { name: "Open Pink summit" });
      await tile.scrollIntoViewIfNeeded();
      const photo = tile.locator("img");
      await expect
        .poll(() =>
          photo.evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const { source, width, coverWidth } = await photo.evaluate(
        async (image: HTMLImageElement) => {
          await image.decode();
          const file = new Image();
          file.src = image.currentSrc;
          await file.decode();
          return {
            source: image.currentSrc,
            width: file.naturalWidth,
            coverWidth:
              Math.max(
                image.clientWidth,
                (image.clientHeight * file.naturalWidth) / file.naturalHeight,
              ) * devicePixelRatio,
          };
        },
      );

      const flight = page.evaluate(
        () =>
          new Promise<string[]>((resolve) => {
            const sources = new Set<string>();
            const sample = () => {
              const viewer = document.querySelector("dialog.re-lightbox");
              const image =
                viewer?.querySelector<HTMLImageElement>(".re-lightbox-image");
              if (image) sources.add(image.currentSrc || image.src);
              if (
                image &&
                viewer?.getAttribute("data-phase") === "open" &&
                !image.closest("[data-loading]")
              )
                resolve([...sources]);
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          }),
      );
      await tile.press("Enter");
      const sources = await flight;
      const fittedWidth = await page
        .locator("dialog.re-lightbox .re-lightbox-image")
        .first()
        .evaluate(
          (image) => image.getBoundingClientRect().width * devicePixelRatio,
        );

      expect(sources).toEqual([source]);
      expect(width).toBeGreaterThanOrEqual(
        Math.ceil(Math.max(coverWidth, fittedWidth)),
      );
    });
  });
}

test.describe("a pending neighbor on the home carousel", () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  test("the lightbox keeps the AVIF format for a photo that is still loading", async ({
    page,
  }) => {
    const fullPath = "/photos/sailboat-2560.avif";
    const jpegRequests: string[] = [];
    page.on("request", (request) => {
      const path = new URL(request.url()).pathname;
      if (path.startsWith("/photos/sailboat-") && path.endsWith(".jpg"))
        jpegRequests.push(path);
    });
    let resume = () => {};
    const pending = new Promise<void>((resolve) => {
      resume = resolve;
    });
    await page.route(`**${fullPath}`, async (route) => {
      await pending;
      await route.continue();
    });

    try {
      await page.goto("/");
      const trigger = page.getByRole("button", { name: "Open Pink summit" });
      await trigger.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          trigger
            .locator("img")
            .evaluate((image: HTMLImageElement) => image.currentSrc),
        )
        .toMatch(/pink-summit-2560\.avif$/);
      const neighbor = page.getByRole("button", { name: "Open Evening sail" });
      await expect(neighbor.locator("img")).toHaveJSProperty("currentSrc", "");
      await trigger.press("Enter");
      const dialog = page.locator('dialog.re-lightbox[data-phase="open"]');
      const thumbnail = dialog.locator(".re-lightbox-thumbnails button").nth(1);
      await expect(thumbnail.locator("img")).toHaveAttribute(
        "src",
        "/photos/sailboat-640.avif",
      );

      await page.keyboard.press("ArrowRight");
      resume();
      const shown = dialog.getByRole("img", { name: /A small sailboat/ });
      await expect(shown).toHaveAttribute(
        "src",
        new URL(fullPath, page.url()).href,
      );
      expect(jpegRequests).toEqual([]);
    } finally {
      resume();
    }
  });
});
