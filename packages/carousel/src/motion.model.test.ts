// @vitest-environment jsdom
import { expect, it } from "vitest";
import { carouselMotion } from "../../../tests/model/carousel-motion.js";
import { explore } from "../../../tests/model/explore.js";

it("keeps its index, snap point and cleanup under every order of four inputs", {
  timeout: 30_000,
}, async () => {
  const verdict = await explore(carouselMotion, 4);
  expect(
    verdict.ok ? "holds" : `${verdict.broke}: ${verdict.path.join(" → ")}`,
  ).toBe("holds");
});
