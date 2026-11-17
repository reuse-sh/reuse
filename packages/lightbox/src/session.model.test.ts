// @vitest-environment jsdom
import { expect, it } from "vitest";
import { explore } from "../../../tests/model/explore.js";
import { lightboxSession } from "../../../tests/model/lightbox-session.js";

// Exhaustive at depth 6: 338 states in about 12s locally; the CI runner ran
// the carousel model check about 23x slower, which puts this one near 280s.
it("leaves one dialog, visible tiles, a free page and no timers under every order of six steps", {
  timeout: 300_000,
}, async () => {
  const verdict = await explore(lightboxSession, 6);
  expect(
    verdict.ok ? "holds" : `${verdict.broke}: ${verdict.path.join(" → ")}`,
  ).toBe("holds");
});
