// @vitest-environment jsdom
import { expect, it } from "vitest";
import { explore } from "../../../tests/model/explore.js";
import { lightboxImages } from "../../../tests/model/lightbox-images.js";

it("keeps every frame in one load state with one spinner or one retry under every order of five steps", {
  timeout: 120_000,
}, async () => {
  const verdict = await explore(lightboxImages, 5);
  expect(
    verdict.ok ? "holds" : `${verdict.broke}: ${verdict.path.join(" → ")}`,
  ).toBe("holds");
});
