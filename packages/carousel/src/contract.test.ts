// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { createCarousel } from "./index.js";

const contract = readFileSync(
  join(import.meta.dirname, "../CONTRACT.md"),
  "utf8",
);

function section(heading: string) {
  const start = contract.indexOf(`\n${heading}`);
  if (start === -1) throw new Error(`CONTRACT.md has no ${heading} section.`);
  const end = contract.indexOf("\n\n", start + 1);
  return contract.slice(start, end === -1 ? undefined : end);
}

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

it("lists every state field and method the controller has", () => {
  vi.stubGlobal("matchMedia", () =>
    Object.assign(new EventTarget(), { matches: false }),
  );
  const viewport = document.createElement("div");
  viewport.scrollTo = () => {};
  document.body.append(viewport);
  const carousel = createCarousel(viewport);
  const state = section("CarouselState:");
  const methods = section("Carousel methods:");
  expect(
    Object.keys(carousel.getState()).filter(
      (key) => !new RegExp(`\\b${key}\\b`).test(state),
    ),
  ).toEqual([]);
  expect(
    Object.keys(carousel).filter((name) => !methods.includes(`${name}(`)),
  ).toEqual([]);
  carousel.destroy();
});
