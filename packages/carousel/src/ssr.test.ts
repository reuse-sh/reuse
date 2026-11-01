// @vitest-environment node

import { expect, it } from "vitest";

it("imports the native entry point without React or a browser", async () => {
  const module = await import("./index.js");
  expect(typeof module.createCarousel).toBe("function");
  expect(typeof globalThis.document).toBe("undefined");
});
