import { describe, expect, it } from "vitest";
import {
  boundZoom,
  contain,
  cover,
  elasticZoom,
  rubber,
  shapeOf,
  unrubber,
  widthFit,
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
  it("pans to the edges of an area whose center sits below the photo's resting center", () => {
    const area = { width: 1000, height: 900, y: 50 };
    expect(
      boundZoom(
        { scale: 2, x: 0, y: -5000 },
        { width: 800, height: 600 },
        area,
      ),
    ).toEqual({ scale: 2, x: 0, y: -100 });
    expect(
      boundZoom({ scale: 2, x: 0, y: 5000 }, { width: 800, height: 600 }, area),
    ).toEqual({ scale: 2, x: 0, y: 200 });
    expect(
      boundZoom({ scale: 1.4, x: 0, y: 0 }, { width: 800, height: 600 }, area),
    ).toEqual({ scale: 1.4, x: 0, y: 20 });
    expect(
      boundZoom({ scale: 1, x: 0, y: 40 }, { width: 800, height: 600 }, area),
    ).toEqual({ scale: 1, x: 0, y: 0 });
  });
  it("follows 35% past the edge and 35% of the move where the photo fits", () => {
    const range = { min: -300, max: 300 };
    expect(rubber(-300 - 200, range)).toBeCloseTo(-370);
    expect(rubber(120, range)).toBe(120);
    expect(unrubber(rubber(-500, range), range)).toBeCloseTo(-500);
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
        image: { width: 2000, height: 1500 },
        viewport: { width: 1064, height: 900 },
        padding: 32,
        svg: false,
        maxZoom: undefined,
        tapZoom: 2.5,
        ...extra,
      });
    expect(limits(4000)).toEqual({ min: 1, max: 4, tap: 4 });
    expect(limits(1500)).toEqual({ min: 1, max: 1.5, tap: 1.5 });
    expect(limits(1500, { maxZoom: 2 })).toEqual({ min: 1, max: 3, tap: 2.5 });
    expect(limits(800)).toEqual({ min: 1, max: 1, tap: 1 });
    expect(limits(1000)).toEqual({ min: 1, max: 1, tap: 1 });
    expect(limits(undefined)).toEqual({ min: 1, max: 1, tap: 1 });
    expect(limits(100, { svg: true })).toEqual({ min: 1, max: 4, tap: 2.5 });
    expect(limits(100, { svg: true, maxZoom: 2 })).toEqual({
      min: 1,
      max: 2,
      tap: 2,
    });
  });
  it("fits a tall photo to the width and calls only very tall or very wide photos special", () => {
    const phone = { width: 390, height: 844 };
    expect(widthFit({ width: 1170, height: 8000 }, phone, 32)).toEqual({
      width: 326,
      height: (8000 * 326) / 1170,
    });
    expect(widthFit({ width: 100, height: 900 }, phone, 32)).toEqual({
      width: 100,
      height: 900,
    });
    expect(shapeOf({ width: 1170, height: 8000 }, phone, 32)).toBe("tall");
    expect(shapeOf({ width: 1170, height: 3000 }, phone, 32)).toBe("regular");
    expect(shapeOf({ width: 300, height: 1500 }, phone, 32)).toBe("regular");
    expect(shapeOf({ width: 6000, height: 1000 }, phone, 32)).toBe("wide");
    expect(shapeOf({ width: 3000, height: 1000 }, phone, 32)).toBe("regular");
  });
  it("lets a tall photo zoom out to its whole height and a wide one tap to the screen height", () => {
    const phone = { width: 390, height: 844 };
    const limits = (
      image: { width: number; height: number },
      fileWidth = image.width,
      extra = {},
    ) =>
      zoomLimits({
        fileWidth,
        image,
        viewport: phone,
        padding: 32,
        svg: false,
        maxZoom: undefined,
        tapZoom: 2.5,
        ...extra,
      });
    const tall = limits({ width: 1170, height: 8000 });
    expect(tall.min).toBeCloseTo(780 / 8000 / (326 / 1170));
    expect(tall.max).toBeCloseTo(1170 / 326);
    expect(tall.tap).toBe(tall.min);
    expect(limits({ width: 300, height: 8000 }).max).toBe(1);
    expect(limits({ width: 300, height: 8000 }).tap).toBeCloseTo(780 / 8000);
    const wide = limits({ width: 6000, height: 1000 });
    expect(wide.min).toBe(1);
    expect(wide.tap).toBeCloseTo(844 / ((1000 * 326) / 6000));
    expect(wide.max).toBeCloseTo(6000 / 326);
    expect(limits({ width: 6000, height: 1000 }, 1200).tap).toBeCloseTo(
      1200 / 326,
    );
    expect(limits({ width: 6000, height: 1000 }, 100, { svg: true }).tap).toBe(
      4,
    );
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
