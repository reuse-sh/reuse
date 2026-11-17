// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  fileWidth,
  isImageFile,
  largestWidth,
  parseSrcset,
} from "./sources.js";

const base = "https://example.test/gallery/";

describe("srcset sources", () => {
  it("parses width and density candidates, commas inside URLs included", () => {
    expect(
      parseSrcset(
        "https://cdn.test/w_900,h_600/a.jpg 900w,\n /b.jpg 1800w, c.jpg 2x, d.jpg, e.jpg 1.5x",
      ),
    ).toEqual([
      { url: "https://cdn.test/w_900,h_600/a.jpg", width: 900 },
      { url: "/b.jpg", width: 1800 },
      { url: "c.jpg", density: 2 },
      { url: "d.jpg", density: 1 },
      { url: "e.jpg", density: 1.5 },
    ]);
    expect(parseSrcset("a.jpg 1x,b.jpg 2x")).toEqual([
      { url: "a.jpg", density: 1 },
      { url: "b.jpg", density: 2 },
    ]);
    expect(parseSrcset("  ")).toEqual([]);
  });

  it("names the widest candidate only for width descriptors", () => {
    expect(largestWidth("a.jpg 900w, b.jpg 3600w, c.jpg 1800w")).toBe(3600);
    expect(largestWidth("a.jpg 1x, b.jpg 2x")).toBeUndefined();
    expect(largestWidth(undefined)).toBeUndefined();
  });

  it("reads the loaded file's own width instead of the density-corrected natural width", () => {
    const image = document.createElement("img");
    Object.defineProperty(image, "naturalWidth", { value: 326 });
    Object.defineProperty(image, "currentSrc", {
      value: "https://example.test/gallery/1800.jpg",
    });
    expect(fileWidth(image, "900.jpg 900w, 1800.jpg 1800w", base)).toBe(1800);
    expect(fileWidth(image, "900.jpg 1x, 1800.jpg 2x", base)).toBe(652);
    expect(fileWidth(image, undefined, base)).toBe(326);
  });

  it("recognizes image files by the path's extension, ignoring case, query and hash", () => {
    expect(isImageFile("/large.JPG?w=2000#top", base)).toBe(true);
    expect(isImageFile("photo.avif", base)).toBe(true);
    expect(isImageFile("/photos/42", base)).toBe(false);
    expect(isImageFile("/page.html?file=a.jpg", base)).toBe(false);
  });
});
