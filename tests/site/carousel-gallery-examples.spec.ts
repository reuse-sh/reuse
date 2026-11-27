import { expect, type Page, test } from "@playwright/test";
import { serveExampleImages } from "./images";

test.use({ viewport: { width: 1280, height: 800 } });
test.beforeEach(({ context }) => serveExampleImages(context));

const preview = '[data-slot="example-preview"]';
const gallery = "/carousel/examples/product-gallery";
const captions = [
  "Open sea",
  "Evening sail",
  "Golden calm",
  "Shoreline",
  "Dusk beach",
];

function parts(page: Page) {
  const demo = page.locator(preview);
  const strip = demo.getByRole("region", { name: "Photos" });
  return {
    strip,
    photos: strip.locator("a"),
    thumbnail: (at: number) =>
      demo.getByRole("button", { name: `Show ${captions[at]}`, exact: true }),
    dialog: page.locator("dialog.re-lightbox[open]"),
  };
}

// The first thumbnail is marked once connectThumbnails has joined the two strips.
async function openGallery(page: Page) {
  await page.goto(gallery);
  const { thumbnail } = parts(page);
  await expect(thumbnail(0)).toHaveAttribute("aria-current", "true");
  return parts(page);
}

async function shows(page: Page, at: number) {
  const { strip, photos, thumbnail } = parts(page);
  await expect(photos.nth(at)).toBeInViewport({ ratio: 0.9 });
  // A click while the strip still glides lands on the strip, not on the photo.
  await expect
    .poll(() =>
      photos
        .nth(at)
        .evaluate((photo) =>
          Math.abs(
            photo.getBoundingClientRect().left -
              (photo.parentElement?.getBoundingClientRect().left ?? 0),
          ),
        ),
    )
    .toBeLessThan(1);
  await expect(strip).not.toHaveAttribute("data-re-scrolling");
  for (let other = 0; other < captions.length; other++)
    if (other !== at)
      await expect(thumbnail(other)).not.toHaveAttribute("aria-current");
  await expect(thumbnail(at)).toHaveAttribute("aria-current", "true");
}

test("a thumbnail click moves the main strip and takes the mark", async ({
  page,
}) => {
  const { photos, thumbnail } = await openGallery(page);
  await thumbnail(3).click();
  await shows(page, 3);
  await expect(photos.nth(0)).not.toBeInViewport();
});

test("rapid thumbnail clicks end on the last one clicked", async ({ page }) => {
  const { thumbnail } = await openGallery(page);
  for (const at of [4, 0, 2, 4, 1]) await thumbnail(at).click();
  await shows(page, 1);
});

test("paging the main strip by keyboard moves the thumbnail mark", async ({
  page,
}) => {
  const { photos } = await openGallery(page);
  await photos.nth(0).focus();
  await page.keyboard.press("ArrowRight");
  await shows(page, 1);
  await page.keyboard.press("End");
  await shows(page, 4);
  await page.keyboard.press("Home");
  await shows(page, 0);
});

test("a thumbnail works from the keyboard", async ({ page }) => {
  const { thumbnail } = await openGallery(page);
  await thumbnail(2).focus();
  await page.keyboard.press("Enter");
  await shows(page, 2);
});

test("the viewer opens on the main photo and a close leaves the strip where it closed", async ({
  page,
}) => {
  const { photos, thumbnail, dialog } = await openGallery(page);
  await thumbnail(1).click();
  await shows(page, 1);
  await photos.nth(1).click();
  await expect(dialog.locator(".re-lightbox-counter")).toHaveText("2 / 5");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator(".re-lightbox-counter")).toHaveText("4 / 5");
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await shows(page, 3);
  await expect(photos.nth(3)).toBeFocused();
});

test("a drag on the main strip pages it without opening the viewer", async ({
  page,
}) => {
  const { photos } = await openGallery(page);
  const box = await photos.nth(0).boundingBox();
  if (!box) throw new Error("No main photo");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.9, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.1, y, { steps: 20 });
  await page.mouse.up();
  const marked = () =>
    page
      .locator(`${preview} [aria-current="true"]`)
      .evaluate((mark) =>
        [...(mark.parentElement?.children ?? [])].indexOf(mark),
      );
  await expect.poll(marked).toBeGreaterThan(0);
  await shows(page, await marked());
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("at 320 px the page does not scroll sideways and the mark stays in view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const { photos, thumbnail } = await openGallery(page);
  const overflow = () =>
    page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
  expect(await overflow()).toBe(0);
  await photos.nth(0).focus();
  await page.keyboard.press("End");
  await shows(page, 4);
  await expect(thumbnail(4)).toBeInViewport();
  expect(await overflow()).toBe(0);
});

test("in RTL the strips run from the right and the arrow keys follow", async ({
  page,
}) => {
  await page.addInitScript(() =>
    document.addEventListener("DOMContentLoaded", () =>
      document.documentElement.setAttribute("dir", "rtl"),
    ),
  );
  const { photos, thumbnail } = await openGallery(page);
  const [first, second] = await Promise.all([
    thumbnail(0).boundingBox(),
    thumbnail(1).boundingBox(),
  ]);
  expect(first?.x).toBeGreaterThan(second?.x ?? Number.POSITIVE_INFINITY);
  await thumbnail(2).click();
  await shows(page, 2);
  await photos.nth(2).focus();
  await page.keyboard.press("ArrowLeft");
  await shows(page, 3);
});

test("under reduced motion a thumbnail still moves the main strip", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { thumbnail } = await openGallery(page);
  await thumbnail(4).click();
  await shows(page, 4);
});

test("the product strip arrows turn off at each end", async ({ page }) => {
  await page.goto("/carousel/examples/product-strip");
  const previous = page.getByRole("button", {
    name: "Previous prints",
    exact: true,
  });
  const next = page.getByRole("button", { name: "Next prints", exact: true });
  await expect(next).toBeEnabled();
  await expect(previous).toBeDisabled();
  await next.click();
  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
});

test("the editorial dots and counter follow the strip", async ({ page }) => {
  await page.goto("/carousel/examples/editorial");
  const demo = page.locator(preview);
  const counter = demo.locator("[data-carousel-counter]");
  const dot = (name: string) =>
    demo.getByRole("button", { name: `Show ${name}`, exact: true });
  await expect(counter).toHaveText("01 / 06");
  await expect(dot("Evening sail")).toHaveAttribute("aria-current", "true");
  const previous = demo.getByRole("button", {
    name: "Previous slide",
    exact: true,
  });
  // The editorial strip loops, so its arrows wrap instead of turning off.
  await previous.click();
  await expect(counter).toHaveText("06 / 06");
  await expect(dot("Dunes")).toHaveAttribute("aria-current", "true");
  await demo.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(counter).toHaveText("01 / 06");
  await dot("Pink summit").click();
  await expect(counter).toHaveText("03 / 06");
  await expect(dot("Pink summit")).toHaveAttribute("aria-current", "true");
  await expect(dot("Evening sail")).not.toHaveAttribute("aria-current");
  await demo.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(counter).toHaveText("04 / 06");
  await expect(dot("Lone pine")).toHaveAttribute("aria-current", "true");
  await previous.click();
  await expect(counter).toHaveText("03 / 06");
});
