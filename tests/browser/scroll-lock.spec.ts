import { expect, test } from "@playwright/test";
import { mount, photo } from "./harness";

test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

test("opening the lightbox keeps page content and right-anchored fixed elements in place", async ({
  page,
}) => {
  await mount(
    page,
    `<main id="content" style="max-width:600px;margin:0 auto;height:3000px">Page</main>
<div id="fixed" style="position:fixed;top:0;right:0;padding-right:var(--re-scrollbar-gap, 0px)">Menu</div>`,
    ["lightbox/styles.css"],
  );
  const measure = () =>
    page.evaluate(() => {
      const text = document.createRange();
      text.selectNodeContents(document.getElementById("fixed") as Node);
      return {
        gap: innerWidth - document.documentElement.clientWidth,
        content: document.getElementById("content")?.getBoundingClientRect()
          .left,
        text: text.getBoundingClientRect().right,
      };
    });
  const before = await measure();
  expect(before.gap).toBeGreaterThan(0);
  await page.evaluate(async (src) => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const lightbox = createLightbox({ duration: 0 });
    lightbox.open([{ src, width: 1200, height: 800 }]);
    Object.assign(window, { lightbox });
  }, photo(1));
  const open = await measure();
  expect(open.gap).toBe(0);
  expect(open.content).toBe(before.content);
  expect(open.text).toBe(before.text);
  await page.evaluate(() =>
    (
      window as unknown as { lightbox: { close(): Promise<void> } }
    ).lightbox.close(),
  );
  expect(
    await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--re-scrollbar-gap"),
    ),
  ).toBe("");
});
