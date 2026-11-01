import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  annotationImageHtml,
  annotationsFromHtml,
  annotationsToHtml,
  createAnnotatedImage,
  parseAnnotations,
  renderAnnotations,
  serializeAnnotations,
} from "./index.js";

const source = [
  { kind: "area", box: [10, 20, 30, 25], label: "A & B" },
  { kind: "spotlight", box: [50, 10, 20, 30] },
  { kind: "arrow", line: [5, 10, 35, 45] },
  { kind: "line", line: [45, 55, 70, 80] },
  { kind: "pointer", point: [20, 35], label: "Open settings", side: "left" },
  {
    kind: "marker",
    point: [80, 75],
    text: "Keep <strong>this</strong> <code>value</code>.",
  },
];

describe("annotation protocol", () => {
  it("round-trips all six kinds through versioned JSON and existing HTML", () => {
    const annotations = parseAnnotations(source);
    expect(annotations).toHaveLength(6);
    expect(parseAnnotations(serializeAnnotations(annotations))).toEqual(
      annotations,
    );
    const dom = new JSDOM(annotationsToHtml(annotations));
    expect(annotationsFromHtml(dom.window.document.body)).toEqual(annotations);
  });
  it("normalizes coordinates at the boundary and rejects degenerate lines", () => {
    expect(
      parseAnnotations([
        { kind: "area", box: [-20, 110, 200, 0], label: "Box" },
        { kind: "line", line: [5, 5, 5, 5] },
        { kind: "marker", point: [40.123, 60.777], text: "Point" },
      ]),
    ).toEqual([
      { kind: "area", box: [0, 99, 100, 1], label: "Box" },
      { kind: "marker", point: [40.1, 60.8], text: "Point" },
    ]);
  });
  it("strips executable marker markup and escapes labels in actual rendered HTML", () => {
    const markup = renderAnnotations(
      [
        {
          kind: "area",
          box: [10, 10, 30, 30],
          label: '<img src=x onerror="bad()">',
        },
        {
          kind: "marker",
          point: [20, 20],
          text: '<strong onclick="bad()">Safe</strong><img src=x onerror=bad()><script>bad()</script>',
        },
      ],
      { ratio: 1.5, id: "safe-example", imageWidth: 600 },
    );
    const dom = new JSDOM(markup.overlay + markup.list);
    expect(
      dom.window.document.querySelectorAll("script,img,[onclick],[onerror]"),
    ).toHaveLength(0);
    expect(dom.window.document.querySelector("strong")?.textContent).toBe(
      "Safe",
    );
    expect(dom.window.document.body.textContent).toContain(
      '<img src=x onerror="bad()">',
    );
  });
  it("rejects unsupported versions and malformed identifiers", () => {
    expect(() => parseAnnotations({ version: 2, annotations: [] })).toThrow(
      "Unsupported annotation version",
    );
    expect(() => renderAnnotations([], { ratio: 1, id: 'x)"' })).toThrow(
      "unique identifier",
    );
  });
  it("renders a complete server-side figure without a DOM dependency", () => {
    const html = annotationImageHtml({
      src: '/image.jpg?x="&y=1',
      alt: "A & B",
      width: 600,
      height: 400,
      annotations: parseAnnotations(source),
      id: "server-example",
    });
    const dom = new JSDOM(html);
    expect(dom.window.document.querySelector("img")?.getAttribute("alt")).toBe(
      "A & B",
    );
    expect(
      dom.window.document.querySelectorAll("[data-annot-area]"),
    ).toHaveLength(1);
    expect(
      dom.window.document.querySelectorAll("[data-annot-shape]"),
    ).toHaveLength(2);
  });
  it("updates real image and overlay nodes and restores the owning root on destroy", () => {
    const dom = new JSDOM('<div id="root"><p>Original content</p></div>', {
      pretendToBeVisual: true,
    });
    const root = dom.window.document.querySelector<HTMLElement>("#root");
    if (!root) throw new Error("Missing fixture");
    const original = root.firstChild;
    expect(() =>
      createAnnotatedImage(root, {
        src: "/invalid.jpg",
        alt: "Invalid",
        annotations: null as never,
      }),
    ).toThrow();
    expect(root.firstChild).toBe(original);
    const controller = createAnnotatedImage(root, {
      src: "/first.jpg",
      alt: "First",
      annotations: parseAnnotations(source),
    });
    expect(root.querySelectorAll("[data-annot-area]")).toHaveLength(1);
    controller.update({
      src: "/second.jpg",
      alt: "Second",
      annotations: [{ kind: "marker", point: [50, 50], text: "New marker" }],
    });
    expect(root.querySelector("img")?.getAttribute("src")).toBe("/second.jpg");
    expect(root.querySelectorAll("[data-annot-area]")).toHaveLength(0);
    expect(root.textContent).toContain("New marker");
    controller.destroy();
    controller.destroy();
    expect(root.firstChild).toBe(original);
    expect(root.textContent).toBe("Original content");
  });
});
