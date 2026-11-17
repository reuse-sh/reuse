import { expect, it } from "vitest";
import { lightboxGestures } from "./gestures.js";

it("names the owner's decision on every row where reuse differs from all three viewers", () => {
  const unexplained = lightboxGestures
    .filter(
      (row) =>
        ![row.ios, row.macos, row.google].includes(row.reuse) &&
        row.decision === undefined,
    )
    .map((row) => row.input);
  expect(unexplained).toEqual([]);
});
