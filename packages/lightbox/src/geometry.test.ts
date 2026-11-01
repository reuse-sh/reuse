import { describe, expect, it } from "vitest";
import { boundZoom, contain, cover, zoomAround } from "./geometry.js";

describe("image geometry", () => {
  it("contains large images with padding and never enlarges a small image", () => {
    expect(
      contain({ width: 1600, height: 1200 }, { width: 864, height: 664 }),
    ).toEqual({ width: 800, height: 600 });
    expect(
      contain({ width: 100, height: 50 }, { width: 864, height: 664 }),
    ).toEqual({ width: 100, height: 50 });
  });
  it("keeps the image point under the zoom focus", () => {
    const zoom = zoomAround({ scale: 1, x: 0, y: 0 }, 2, { x: 100, y: -50 });
    expect(zoom).toEqual({ scale: 2, x: -100, y: 50 });
    expect(100 * zoom.scale + zoom.x).toBe(100);
    expect(-50 * zoom.scale + zoom.y).toBe(-50);
  });
  it("bounds panning and centers images smaller than the viewport", () => {
    expect(
      boundZoom(
        { scale: 2, x: 900, y: -900 },
        { width: 800, height: 600 },
        { width: 1000, height: 800 },
      ),
    ).toEqual({ scale: 2, x: 300, y: -200 });
    expect(
      boundZoom(
        { scale: 1, x: 30, y: 50 },
        { width: 200, height: 100 },
        { width: 1000, height: 800 },
      ),
    ).toEqual({ scale: 1, x: 0, y: 0 });
  });
  it("preserves image ratio while cropping a square thumbnail", () => {
    expect(
      cover({ width: 800, height: 400 }, { width: 100, height: 100 }),
    ).toEqual({ width: 200, height: 100, left: -50, top: 0 });
    expect(
      cover(
        { width: 800, height: 400 },
        { width: 100, height: 100 },
        { x: 1, y: 0.5 },
      ).left,
    ).toBe(-100);
  });
});
