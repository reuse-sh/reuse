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
      const { source, width, coverWidth } = await tile
        .locator("img")
        .evaluate(async (image: HTMLImageElement) => {
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
        });

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
