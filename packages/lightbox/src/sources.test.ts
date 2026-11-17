// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  fileWidth,
  formatOf,
  isImageFile,
  largestWidth,
  lookupFormat,
  parseSrcset,
  parseSvgSize,
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

describe("media formats", () => {
  it("reads alpha-capable and vector formats from the path or the data: type", () => {
    expect(formatOf("/a/photo.PNG?w=2#top", base)).toBe("transparent");
    expect(formatOf("logo.svg", base)).toBe("svg");
    expect(formatOf("anim.gif", base)).toBe("transparent");
    expect(formatOf("pic.apng", base)).toBe("transparent");
    expect(formatOf("/photo.jpg", base)).toBe("opaque");
    expect(formatOf("/photos/42", base)).toBe("opaque");
    expect(formatOf("/page.html?file=a.png", base)).toBe("opaque");
    expect(formatOf("data:image/svg+xml,%3Csvg%3E", base)).toBe("svg");
    expect(formatOf("data:image/webp;base64,AAAA", base)).toBe("transparent");
    expect(formatOf("data:image/jpeg;base64,AAAA", base)).toBe("opaque");
    expect(formatOf("blob:https://example.test/1", base)).toBeUndefined();
  });

  it("fetches a blob: URL once and keeps its Blob type", async () => {
    const urls: string[] = [];
    const fetcher = async (url: string) => {
      urls.push(url);
      return new Response("<svg/>", {
        headers: { "content-type": "image/svg+xml" },
      });
    };
    const url = "blob:https://example.test/svg";
    const [first, second] = await Promise.all([
      lookupFormat(url, base, fetcher),
      lookupFormat(url, base, fetcher),
    ]);
    expect([first, second]).toEqual(["svg", "svg"]);
    expect(formatOf(url, base)).toBe("svg");
    expect(await lookupFormat(url, base, fetcher)).toBe("svg");
    expect(urls).toEqual([url]);
    expect(
      await lookupFormat("blob:https://example.test/gone", base, () =>
        Promise.reject(new TypeError("revoked")),
      ),
    ).toBe("opaque");
  });
});

describe("SVG size", () => {
  const size = (markup: string) => parseSvgSize(markup, new DOMParser());
  const svg = (attributes: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" ${attributes}/>`;

  it("takes the root's absolute width and height", () => {
    expect(size(svg('width="1200" height="800" viewBox="0 0 10 10"'))).toEqual({
      width: 1200,
      height: 800,
    });
    expect(size(svg('width="2in" height="72pt"'))).toEqual({
      width: 192,
      height: 96,
    });
    expect(size(svg('width="2.54cm" height="6pc"'))).toEqual({
      width: 96,
      height: 96,
    });
  });

  it("falls back to the viewBox for percentages, em and missing sizes", () => {
    expect(size(svg('viewBox="0 0 800 400"'))).toEqual({
      width: 800,
      height: 400,
    });
    expect(
      size(svg('width="100%" height="2em" viewBox="0,0,400,800"')),
    ).toEqual({ width: 400, height: 800 });
    expect(size(svg('width="200" viewBox="0 0 400 800"'))).toEqual({
      width: 200,
      height: 400,
    });
    expect(size(svg('width="50%"'))).toBeUndefined();
    expect(size("<html>not svg")).toBeUndefined();
  });
});
