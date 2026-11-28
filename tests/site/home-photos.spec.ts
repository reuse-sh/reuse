import { expect, test } from "@playwright/test";

for (const { name, viewport, density, width } of [
  {
    name: "laptop",
    viewport: { width: 1440, height: 900 },
    density: 1,
    width: 640,
  },
  {
    name: "4K",
    viewport: { width: 1920, height: 1080 },
    density: 2,
    width: 1280,
  },
  {
    name: "phone",
    viewport: { width: 390, height: 844 },
    density: 3,
    width: 1760,
  },
]) {
  test.describe(name, () => {
    test.use({ viewport, deviceScaleFactor: density });

    test("the tile loads the smallest source that covers its crop", async ({
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
      const { source, fileWidth, coverWidth } = await photo.evaluate(
        async (image: HTMLImageElement) => {
          await image.decode();
          const file = new Image();
          file.src = image.currentSrc;
          await file.decode();
          return {
            source: image.currentSrc,
            fileWidth: file.naturalWidth,
            coverWidth:
              Math.max(
                image.clientWidth,
                (image.clientHeight * file.naturalWidth) / file.naturalHeight,
              ) * devicePixelRatio,
          };
        },
      );

      expect(new URL(source).pathname).toBe(
        `/photos/pink-summit-${width}.avif`,
      );
      expect(fileWidth).toBe(width);
      expect(fileWidth).toBeGreaterThanOrEqual(Math.ceil(coverWidth));
    });
  });
}

test.describe("opening a tile on a 4K screen", () => {
  test.use({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });

  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    test(`the viewer loads the larger file on demand with ${reducedMotion} motion`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion });
      const fullPath = "/photos/pink-summit-2560.avif";
      let fullRequests = 0;
      let resume = () => {};
      const pending = new Promise<void>((resolve) => {
        resume = resolve;
      });
      await page.route(`**${fullPath}`, async (route) => {
        fullRequests++;
        await pending;
        await route.continue();
      });

      try {
        await page.goto("/");
        const tile = page.getByRole("button", { name: "Open Pink summit" });
        await tile.scrollIntoViewIfNeeded();
        const image = tile.locator("img");
        await expect
          .poll(() =>
            image.evaluate((photo: HTMLImageElement) => photo.naturalWidth),
          )
          .toBeGreaterThan(0);
        const preview = await image.evaluate(
          (photo: HTMLImageElement) => photo.currentSrc,
        );
        expect(new URL(preview).pathname).toBe("/photos/pink-summit-1280.avif");
        expect(fullRequests).toBe(0);
        await expect(
          page.getByRole("button", { name: "Next slide" }),
        ).toBeEnabled();
        await tile.press("Enter");
        const dialog = page.locator('dialog.re-lightbox[data-phase="open"]');
        const shown = dialog.locator(".re-lightbox-image").first();
        await expect(shown).toHaveJSProperty("currentSrc", preview);
        await expect.poll(() => fullRequests).toBeGreaterThan(0);
        const fading =
          reducedMotion === "no-preference"
            ? page.waitForFunction(() =>
                document
                  .querySelector(".re-home-photo-preview")
                  ?.getAnimations()
                  .some((animation) => {
                    const progress =
                      animation.effect?.getComputedTiming().progress;
                    return (
                      progress !== null &&
                      progress !== undefined &&
                      progress > 0 &&
                      progress < 1
                    );
                  }),
              )
            : undefined;
        resume();
        await expect(shown).toHaveJSProperty(
          "currentSrc",
          new URL(fullPath, page.url()).href,
        );
        await fading;
        await expect(dialog.locator(".re-home-photo-preview")).toHaveCount(0);
      } finally {
        resume();
      }
    });
  }
});

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
    await page.route("**/photos/sailboat-1280.avif", async (route) => {
      await pending;
      await route.continue();
    });

    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const trigger = page.getByRole("button", { name: "Open Pink summit" });
      await trigger.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          trigger
            .locator("img")
            .evaluate((image: HTMLImageElement) => image.currentSrc),
        )
        .toMatch(/pink-summit-1280\.avif$/);
      const neighbor = page.getByRole("button", { name: "Open Evening sail" });
      await expect(neighbor.locator("img")).toHaveJSProperty("naturalWidth", 0);
      await expect(
        page.getByRole("button", { name: "Next slide" }),
      ).toBeEnabled();
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
