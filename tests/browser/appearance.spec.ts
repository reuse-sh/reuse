import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import { mount } from "./harness";

const root = join(import.meta.dirname, "../..");
const site = join(root, "apps/site");
const siteRequire = createRequire(join(site, "package.json"));
const postcss = siteRequire("postcss");
const tailwind = siteRequire("@tailwindcss/postcss");
const sizes = ["xs", "sm", "md", "lg", "xl", "2xl"];
const shadows = sizes.flatMap((size) => [
  `re-shadow-${size}`,
  `re-shadow-ring-${size}`,
]);
const easings = ["ease-in-out-sine", "ease-in", "ease-out", "linear"];
const directions = {
  t: "top",
  tr: "top right",
  r: "right",
  br: "bottom right",
  b: "bottom",
  bl: "bottom left",
  l: "left",
  tl: "top left",
};

let css: string;

test.use({ javaScriptEnabled: false });

test.beforeAll(async () => {
  const candidates = [
    ...shadows,
    "hover:re-shadow-ring-lg",
    "md:re-shadow-xl",
    "re-gradient",
    ...easings.map((easing) => `re-gradient-${easing}`),
    ...Object.keys(directions).map(
      (direction) => `re-gradient-dir-${direction}`,
    ),
    "re-gradient-from-brand",
    "re-gradient-to-ink",
    "re-gradient-to-brand/60",
    "hover:re-gradient-to-ink/60",
    "md:re-gradient-dir-r",
  ];
  const result = await postcss([
    tailwind({ base: site, optimize: false }),
  ]).process(
    `@import "tailwindcss" source(none);
@import "@reuse-sh/shadows/tailwind.css";
@import "@reuse-sh/gradients/tailwind.css";
@source inline("${candidates.join(" ")}");
@theme { --color-brand: #f06030; --color-ink: #182438; }
.applied-shadow { @apply re-shadow-ring-lg; }
.applied-gradient { @apply re-gradient re-gradient-ease-out re-gradient-to-brand/60 re-gradient-dir-r; }
.sample { display: block; width: 60px; height: 24px; margin: 8px; }`,
    { from: join(site, "appearance-test.css") },
  );
  css = result.css;
});

test("Tailwind shadows match the plain stylesheet with local variables and dark ancestors", async ({
  page,
}) => {
  const samples = shadows
    .map((name) => `<div class="sample ${name}"></div>`)
    .join("");
  await mount(
    page,
    `<section>${samples}</section>
<section data-re-theme="dark">${samples}</section>
<section data-re-theme="dark" style="--re-shadow-strength:2;--re-shadow-color:rebeccapurple;--re-ring-color:orange;--re-ring-width:3px">${samples}</section>`,
    ["shadows/styles.css"],
  );
  const read = () =>
    page
      .locator(".sample")
      .evaluateAll((elements) =>
        elements.map((element) => getComputedStyle(element).boxShadow),
      );
  const plain = await read();
  expect(plain.every((shadow) => shadow !== "none")).toBe(true);
  expect(plain[0]).not.toBe(plain[12]);
  expect(plain[12]).not.toBe(plain[24]);
  await page.locator("link[rel=stylesheet]").evaluateAll((links) => {
    for (const link of links) link.remove();
  });
  await page.evaluate((content) => {
    const style = document.createElement("style");
    style.textContent = content;
    document.head.append(style);
  }, css);
  expect(await read()).toEqual(plain);
});

test("Tailwind shadow variants and apply override the base utility", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 700 });
  await mount(
    page,
    `<div id="hover" class="sample re-shadow-xs hover:re-shadow-ring-lg"></div>
<div id="responsive" class="sample re-shadow-xs md:re-shadow-xl"></div>
<div id="small" class="sample re-shadow-xs"></div>
<div id="large" class="sample re-shadow-ring-lg"></div>
<div id="wide" class="sample re-shadow-xl"></div>
<div id="applied" class="sample applied-shadow"></div>`,
  );
  await page.evaluate((content) => {
    const style = document.createElement("style");
    style.textContent = content;
    document.head.append(style);
  }, css);
  const shadow = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((element) => getComputedStyle(element).boxShadow);
  expect(await shadow("responsive")).toBe(await shadow("small"));
  expect(await shadow("hover")).toBe(await shadow("small"));
  await page.locator("#hover").hover();
  expect(await shadow("hover")).toBe(await shadow("large"));
  expect(await shadow("applied")).toBe(await shadow("large"));
  await page.setViewportSize({ width: 900, height: 700 });
  expect(await shadow("responsive")).toBe(await shadow("wide"));
});

test("plain gradient presets match the JavaScript generator without page scripts", async ({
  page,
}) => {
  const { easingGradient } = await import(
    pathToFileURL(join(root, "packages/gradients/dist/easing.js")).href
  );
  const cases = easings.flatMap((easing) =>
    Object.entries(directions).map(([direction, value]) => ({
      classes: `re-gradient re-gradient-${easing} re-gradient-dir-${direction}`,
      expected: easingGradient({
        from: "#f06030",
        to: "#182438",
        easing,
        direction: `to ${value}`,
      }),
    })),
  );
  await mount(
    page,
    `${cases.map(({ classes }, index) => `<div id="case-${index}" class="sample ${classes}" style="--re-gradient-from:#f06030;--re-gradient-to:#182438"></div>`).join("")}
<div id="default" class="re-gradient" style="--re-gradient-to:#182438"></div>
<div id="missing" class="re-gradient" style="--re-gradient-from:#f06030"></div>
<div class="re-gradient re-gradient-linear" style="--re-gradient-to:red"><div id="nested" class="re-gradient" style="--re-gradient-to:#182438"></div></div>`,
    ["gradients/styles.css"],
  );
  const expected = [
    ...cases.map(({ expected }) => expected),
    easingGradient({ to: "#182438" }),
  ];
  const actual = await page.evaluate((values) => {
    const reference = document.createElement("div");
    document.body.append(reference);
    const expected = values.map((value) => {
      reference.style.backgroundImage = value;
      return getComputedStyle(reference).backgroundImage;
    });
    reference.remove();
    const actual = [
      ...document.querySelectorAll(".sample"),
      document.getElementById("default") as HTMLElement,
    ].map((element) => getComputedStyle(element).backgroundImage);
    return { actual, expected };
  }, expected);
  expect(actual.actual).toEqual(actual.expected);
  expect(actual.actual.every((image) => image !== "none")).toBe(true);
  await expect(page.locator("#missing")).toHaveCSS("background-image", "none");
  await expect(page.locator("#nested")).toHaveCSS(
    "background-image",
    actual.expected.at(-1),
  );
});

test("Tailwind gradient colors, opacity, variants and apply render real gradients", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 700 });
  await mount(
    page,
    `<div id="colored" class="sample re-gradient re-gradient-from-brand re-gradient-to-ink"></div>
<div id="hover" class="sample re-gradient re-gradient-to-brand/60 hover:re-gradient-to-ink/60"></div>
<div id="responsive" class="sample re-gradient re-gradient-to-brand/60 re-gradient-dir-b md:re-gradient-dir-r"></div>
<div id="applied" class="sample applied-gradient"></div>
<div id="reference" class="sample re-gradient re-gradient-ease-out re-gradient-to-brand/60 re-gradient-dir-r"></div>`,
  );
  await page.evaluate((content) => {
    const style = document.createElement("style");
    style.textContent = content;
    document.head.append(style);
  }, css);
  const image = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((element) => getComputedStyle(element).backgroundImage);
  const { easingGradient } = await import(
    pathToFileURL(join(root, "packages/gradients/dist/easing.js")).href
  );
  const expected = await page.evaluate(
    (value) => {
      const reference = document.createElement("div");
      reference.style.backgroundImage = value;
      document.body.append(reference);
      const result = getComputedStyle(reference).backgroundImage;
      reference.remove();
      return result;
    },
    easingGradient({ from: "#f06030", to: "#182438" }),
  );
  expect(await image("colored")).toBe(expected);
  const before = await image("hover");
  expect(before).not.toBe("none");
  await page.locator("#hover").hover();
  const hovered = await image("hover");
  expect(hovered).not.toBe(before);
  expect(hovered).not.toBe("none");
  const color = await page.locator("#hover").evaluate((element) => {
    const reference = document.createElement("div");
    reference.style.color =
      getComputedStyle(element).getPropertyValue("--re-gradient-to");
    element.append(reference);
    return getComputedStyle(reference).color;
  });
  expect(color).toContain("0.6");
  expect(await image("applied")).toBe(await image("reference"));
  const narrow = await image("responsive");
  await page.setViewportSize({ width: 900, height: 700 });
  const wide = await image("responsive");
  expect(wide).not.toBe(narrow);
  expect(wide).toContain("to right");
});
