// @vitest-environment jsdom
import { expect, it } from "vitest";
import { explore } from "../../../tests/model/explore.js";
import { lightboxSession } from "../../../tests/model/lightbox-session.js";

it("leaves one dialog, visible tiles, a free page and no timers under every order of six steps", {
  timeout: 300_000,
}, async () => {
  const verdict = await explore(lightboxSession, 6);
  expect(
    verdict.ok ? "holds" : `${verdict.broke}: ${verdict.path.join(" → ")}`,
  ).toBe("holds");
});
