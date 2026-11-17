// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createLightbox } from "./index.js";

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

it("lists every state field and method the controller has", () => {
  const lightbox = createLightbox();
  const state = section("LightboxState:");
  const methods = section("Lightbox methods:");
  expect(
    Object.keys(lightbox.getState()).filter(
      (key) => !new RegExp(`\\b${key}\\b`).test(state),
    ),
  ).toEqual([]);
  expect(
    Object.keys(lightbox).filter((name) => !methods.includes(`${name}(`)),
  ).toEqual([]);
  lightbox.destroy();
});
