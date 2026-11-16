// @vitest-environment jsdom
import { expect, it } from "vitest";
import { explore } from "../../../tests/model/explore.js";
import { lightboxSession } from "../../../tests/model/lightbox-session.js";

it("leaves one dialog, visible tiles, a free page and no timers under every order of four steps", {
  timeout: 60_000,
}, async () => {
  const verdict = await explore(lightboxSession, 4);
  expect(
    verdict.ok ? "holds" : `${verdict.broke}: ${verdict.path.join(" → ")}`,
  ).toBe("holds");
});
