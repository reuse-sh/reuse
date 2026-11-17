import { describe, expect, it } from "vitest";
import {
  boundZoom,
  contain,
  cover,
  elasticZoom,
  rubber,
  unrubber,
  zoomAround,
  zoomLimits,
} from "./geometry.js";

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
  it("follows 35% past the edge and 35% of the move where the photo fits", () => {
    expect(rubber(-300 - 200, 300)).toBeCloseTo(-370);
    expect(rubber(120, 300)).toBe(120);
    expect(unrubber(rubber(-500, 300), 300)).toBeCloseTo(-500);
    expect(
      elasticZoom(
        { scale: 2, x: -500, y: 100 },
        { width: 800, height: 400 },
        { width: 1000, height: 800 },
      ),
    ).toEqual({ scale: 2, x: -370, y: 35 });
  });
  it("zooms raster images up to their file pixels and SVG up to 4x the fit", () => {
    const limits = (fileWidth: number | undefined, extra = {}) =>
      zoomLimits({
        fileWidth,
        fittedWidth: 1000,
        svg: false,
        maxZoom: undefined,
        tapZoom: 2.5,
        ...extra,
      });
    expect(limits(4000)).toEqual({ max: 4, tap: 4 });
    expect(limits(1500)).toEqual({ max: 1.5, tap: 1.5 });
    expect(limits(1500, { maxZoom: 2 })).toEqual({ max: 3, tap: 2.5 });
    expect(limits(800)).toEqual({ max: 1, tap: 1 });
    expect(limits(1000)).toEqual({ max: 1, tap: 1 });
    expect(limits(undefined)).toEqual({ max: 1, tap: 1 });
    expect(limits(100, { svg: true })).toEqual({ max: 4, tap: 2.5 });
    expect(limits(100, { svg: true, maxZoom: 2 })).toEqual({ max: 2, tap: 2 });
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
