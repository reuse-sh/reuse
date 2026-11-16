import { describe, expect, it } from "vitest";
import { placeLanes } from "./lanes.js";

const items = (...sizes: number[]) => sizes.map((size) => ({ size, span: 1 }));
const lanesOf = (result: ReturnType<typeof placeLanes>) =>
  result.placements.map((placement) => placement.lane);

describe("placeLanes", () => {
  it("fills the lanes in order while they are level", () => {
    const result = placeLanes(items(100, 100, 100), 3, 10, 0);
    expect(lanesOf(result)).toEqual([0, 1, 2]);
    expect(result.placements.map((p) => p.offset)).toEqual([0, 0, 0]);
  });

  it("puts the next item in the shortest lane", () => {
    const result = placeLanes(items(300, 100, 200, 50), 3, 10, 0);
    expect(lanesOf(result)).toEqual([0, 1, 2, 1]);
    expect(result.placements[3].offset).toBe(110);
  });

  it("treats lanes within the tolerance as level and keeps going after the cursor", () => {
    // After 0, 1, 2 the lanes end at 110, 105 and 120. At tolerance 0 the
    // shortest (lane 1) wins; at 10px lanes 0 and 1 tie, and the cursor has
    // wrapped, so the first of them wins.
    expect(lanesOf(placeLanes(items(100, 95, 110, 10), 3, 10, 0))[3]).toBe(1);
    expect(lanesOf(placeLanes(items(100, 95, 110, 10), 3, 10, 10))[3]).toBe(0);
  });

  it("prefers a tied lane after the last placed item to an earlier one", () => {
    // Lane 0 is lowest; lane 2 ties within 20px and follows the cursor (at 2).
    const result = placeLanes(items(100, 300, 110, 10, 10), 3, 0, 20);
    expect(lanesOf(result)).toEqual([0, 1, 2, 0, 2]);
  });

  it("keeps document order across lanes with an infinite tolerance", () => {
    const result = placeLanes(
      items(300, 10, 10, 10, 10, 10),
      3,
      10,
      Number.POSITIVE_INFINITY,
    );
    expect(lanesOf(result)).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it("places a span at the highest lane it covers", () => {
    const result = placeLanes(
      [
        { size: 100, span: 1 },
        { size: 50, span: 1 },
        { size: 80, span: 2 },
      ],
      3,
      0,
      0,
    );
    expect(result.placements[2]).toEqual({ lane: 1, span: 2, offset: 50 });
  });

  it("narrows a span wider than the lanes to all of them", () => {
    const result = placeLanes([{ size: 100, span: 5 }], 3, 0, 0);
    expect(result.placements[0]).toEqual({ lane: 0, span: 3, offset: 0 });
  });

  it("reports the tallest lane without a trailing gap", () => {
    expect(placeLanes(items(100, 40, 60), 2, 10, 0).size).toBe(110);
    expect(placeLanes([], 3, 10, 0).size).toBe(0);
  });
});
