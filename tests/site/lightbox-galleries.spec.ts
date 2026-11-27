import { expect, type Page, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

const preview = '[data-slot="example-preview"]';
const dialog = (page: Page) => page.locator("dialog.re-lightbox[open]");
const counter = (page: Page) => dialog(page).locator(".re-lightbox-counter");
const caption = (page: Page) => dialog(page).locator(".re-lightbox-caption");
const tiles = (page: Page) =>
  page.locator(preview).getByRole("button", { name: /^Open / });
/** Every tile, also the one the open viewer hides. */
const gridTiles = (page: Page) => page.locator(".re-portfolio-grid > button");
const subject = (page: Page, name: string) =>
  page
    .locator(preview)
    .locator("label")
    .filter({ hasText: new RegExp(`^${name}$`) })
    .click();

async function noSideScroll(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBe(0);
}

test.describe("portfolio grid", () => {
  test.beforeEach(({ page }) => page.goto("/lightbox/examples/portfolio"));

  test("the filter decides which photos the viewer pages through", async ({
    page,
  }) => {
    await expect(tiles(page)).toHaveCount(24);
    await tiles(page).nth(1).click();
    await expect(counter(page)).toHaveText("2 / 24");
    await expect(caption(page)).toHaveText("Blue ridges");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);

    await subject(page, "Sea");
    await expect(tiles(page)).toHaveCount(5);
    await tiles(page).nth(2).click();
    await expect(counter(page)).toHaveText("3 / 5");
    await expect(caption(page)).toHaveText("Horizon");
    await page.keyboard.press("End");
    await expect(counter(page)).toHaveText("5 / 5");
    await expect(caption(page)).toHaveText("Dusk beach");
  });

  test("Load more inside the open viewer adds twelve photos, keeps the current one and then goes", async ({
    page,
  }) => {
    await tiles(page).nth(4).click();
    await expect(counter(page)).toHaveText("5 / 24");
    await expect(caption(page)).toHaveText("Pink hour");
    const more = dialog(page).getByRole("button", { name: "Load more" });
    await more.click();
    await expect(counter(page)).toHaveText("5 / 36");
    await expect(caption(page)).toHaveText("Pink hour");
    await expect(more).toBeHidden();
    await expect(dialog(page).locator(".re-lightbox-viewport")).toBeFocused();
    await expect(gridTiles(page)).toHaveCount(36);
    await expect(
      page.locator(preview).getByRole("button", { name: "Load more" }),
    ).toHaveCount(0);

    await page.keyboard.press("End");
    await expect(counter(page)).toHaveText("36 / 36");
    await expect(caption(page)).toHaveText("Afternoon shadow");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open Afternoon shadow" }),
    ).toBeFocused();

    await tiles(page).first().click();
    await expect(counter(page)).toHaveText("1 / 36");
    await expect(
      dialog(page).getByRole("button", { name: "Load more" }),
    ).toBeHidden();
  });

  test("a group with one photo opens alone and Load more brings its second", async ({
    page,
  }) => {
    await subject(page, "Interiors");
    await expect(tiles(page)).toHaveCount(1);
    await tiles(page).click();
    await expect(caption(page)).toHaveText("Arch room");
    await expect(counter(page)).toBeHidden();
    await expect(
      dialog(page).getByRole("button", { name: "Next image" }),
    ).toBeHidden();
    await dialog(page).getByRole("button", { name: "Load more" }).click();
    await expect(counter(page)).toHaveText("1 / 2");
    await expect(caption(page)).toHaveText("Arch room");
    await dialog(page).getByRole("button", { name: "Next image" }).click();
    await expect(caption(page)).toHaveText("Grey lounge");
    await page.keyboard.press("Escape");
    await expect(tiles(page)).toHaveCount(2);

    await subject(page, "All");
    await expect(gridTiles(page)).toHaveCount(36);
  });

  test("the page's Load more focuses the first new photo and goes", async ({
    page,
  }) => {
    await subject(page, "City");
    await expect(tiles(page)).toHaveCount(3);
    const more = page
      .locator(preview)
      .getByRole("button", { name: "Load more" });
    await more.click();
    await expect(tiles(page)).toHaveCount(5);
    await expect(more).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open Balconies" }),
    ).toBeFocused();
  });

  test("keyboard: arrows move the filter, Enter opens and Escape returns focus", async ({
    page,
  }) => {
    const all = page.getByRole("radio", { name: "All", exact: true });
    await all.focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("radio", { name: "Architecture", exact: true }),
    ).toBeChecked();
    await expect(tiles(page)).toHaveCount(5);
    await page.keyboard.press("Tab");
    await expect(tiles(page).first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(tiles(page).nth(1)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(counter(page)).toHaveText("2 / 5");
    await expect(caption(page)).toHaveText("Steel wave");
    await expect(
      dialog(page).getByRole("button", { name: "Close gallery" }),
    ).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(caption(page)).toHaveText("Concrete blocks");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open Concrete blocks" }),
    ).toBeFocused();
  });

  test("at 320px the grid keeps two columns and the page does not scroll sideways, also open", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await noSideScroll(page);
    const [first, second] = await Promise.all([
      tiles(page).nth(0).boundingBox(),
      tiles(page).nth(1).boundingBox(),
    ]);
    expect(first && second && Math.abs(first.y - second.y)).toBeLessThan(1);
    await tiles(page).first().click();
    const more = dialog(page).getByRole("button", { name: "Load more" });
    await expect(more).toBeVisible();
    const box = await more.boundingBox();
    expect(box && box.x >= 0 && box.x + box.width <= 320).toBe(true);
    await more.click();
    await expect(counter(page)).toHaveText("1 / 36");
    await noSideScroll(page);
  });

  test("right to left: Load more sits in the mirrored toolbar and paging follows the direction", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await tiles(page).first().click();
    await expect(counter(page)).toHaveText("1 / 24");
    const more = dialog(page).getByRole("button", { name: "Load more" });
    const close = dialog(page).getByRole("button", { name: "Close gallery" });
    const [moreBox, closeBox] = await Promise.all([
      more.boundingBox(),
      close.boundingBox(),
    ]);
    expect(moreBox && closeBox && moreBox.x > closeBox.x).toBe(true);
    await more.click();
    await page.keyboard.press("ArrowLeft");
    await expect(counter(page)).toHaveText("2 / 36");
    await noSideScroll(page);
  });
});

test.describe("contact sheet", () => {
  test.beforeEach(({ page }) => page.goto("/lightbox/examples/contact-sheet"));

  test("sixty frames, and a frame near the end opens with its number and photo", async ({
    page,
  }) => {
    await expect(tiles(page)).toHaveCount(60);
    await page
      .getByRole("button", { name: "Open frame 57, Palm and sand" })
      .click();
    await expect(counter(page)).toHaveText("57 / 60");
    await expect(caption(page)).toHaveText("Frame 57, Palm and sand");
    await page.keyboard.press("Home");
    await expect(counter(page)).toHaveText("1 / 60");
    await expect(caption(page)).toHaveText("Frame 1, Courtyard stair");
    await page.keyboard.press("End");
    await expect(counter(page)).toHaveText("60 / 60");
    await expect(caption(page)).toHaveText("Frame 60, Golden calm");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Open frame 60, Golden calm" }),
    ).toBeFocused();
  });

  test("the side column jumps to a far frame and follows the current one", async ({
    page,
  }) => {
    await tiles(page).first().click();
    const view = dialog(page);
    await expect(view).toHaveAttribute("data-thumbnails", "side");
    const strip = view.getByRole("group", { name: "Choose image" });
    const [stripBox, closeBox] = await Promise.all([
      strip.boundingBox(),
      view.getByRole("button", { name: "Close gallery" }).boundingBox(),
    ]);
    expect(stripBox && stripBox.x > 1280 / 2).toBe(true);
    expect(stripBox && closeBox && stripBox.y >= closeBox.y).toBe(true);
    await strip
      .getByRole("button", { name: "Show image 3", exact: true })
      .click();
    await expect(counter(page)).toHaveText("3 / 60");
    await page.keyboard.press("End");
    await expect(counter(page)).toHaveText("60 / 60");
    const last = strip.getByRole("button", {
      name: "Show image 60",
      exact: true,
    });
    await expect(last).toHaveAttribute("aria-current", "true");
    await expect(last).toBeInViewport();
    await strip
      .getByRole("button", { name: "Show image 58", exact: true })
      .click();
    await expect(counter(page)).toHaveText("58 / 60");
    await expect(caption(page)).toHaveText("Frame 58, Dunes");
  });

  test("the slideshow advances on its own and stops on the button", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Open frame 38, Into the fog" })
      .click();
    await expect(counter(page)).toHaveText("38 / 60");
    await page.mouse.move(10, 400);
    await dialog(page).getByRole("button", { name: "Start slideshow" }).click();
    await expect(dialog(page)).toHaveAttribute("data-slideshow", "playing");
    await page.mouse.move(300, 400);
    await expect(counter(page)).toHaveText("39 / 60", { timeout: 6000 });
    await expect(caption(page)).toHaveText("Frame 39, Courtyard stair");
    await page.mouse.move(340, 420, { steps: 4 });
    await dialog(page).getByRole("button", { name: "Stop slideshow" }).click();
    await expect(dialog(page)).not.toHaveAttribute("data-slideshow", "playing");
    await page.mouse.move(300, 400, { steps: 4 });
    await page.waitForTimeout(4500);
    await expect(counter(page)).toHaveText("39 / 60");
  });

  test("under reduced motion the slideshow still moves to the next frame", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await tiles(page).first().click();
    await dialog(page).getByRole("button", { name: "Start slideshow" }).click();
    await page.mouse.move(300, 400);
    await expect(counter(page)).toHaveText("2 / 60", { timeout: 6000 });
  });

  test("keyboard: Enter opens a frame, the column is one Tab stop and Escape returns focus", async ({
    page,
  }) => {
    await tiles(page).nth(9).focus();
    await page.keyboard.press("Enter");
    await expect(counter(page)).toHaveText("10 / 60");
    const strip = dialog(page).getByRole("group", { name: "Choose image" });
    const current = strip.getByRole("button", {
      name: "Show image 10",
      exact: true,
    });
    await current.focus();
    await page.keyboard.press("ArrowDown");
    await expect(counter(page)).toHaveText("11 / 60");
    await expect(
      strip.getByRole("button", { name: "Show image 11", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open frame 11, White grid" }),
    ).toBeFocused();
  });

  test("at 320px the sheet does not scroll sideways and the column becomes the bottom strip", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await noSideScroll(page);
    await tiles(page).nth(56).click();
    await expect(counter(page)).toHaveText("57 / 60");
    const strip = dialog(page).getByRole("group", { name: "Choose image" });
    const box = await strip.boundingBox();
    expect(box?.width).toBeGreaterThan(280);
    expect(box?.y).toBeGreaterThan(640 / 2);
    await noSideScroll(page);
  });

  test("right to left: the side column sits at the left edge", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await tiles(page).first().click();
    const box = await dialog(page)
      .getByRole("group", { name: "Choose image" })
      .boundingBox();
    expect(box && box.x + box.width).toBeLessThan(1280 / 2);
    await page.keyboard.press("ArrowLeft");
    await expect(counter(page)).toHaveText("2 / 60");
    await noSideScroll(page);
  });
});
