// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FakeResizeObserver,
  resized,
} from "../../../tests/model/resize-observer.js";
import { createJustifiedGallery } from "./justified.js";
import { breakRows } from "./rows.js";

const settle = () => new Promise((resolve) => setTimeout(resolve));
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function gallery(ratios: number[], width = 1000) {
  const container = document.createElement("div");
  container.style.columnGap = "8px";
  let current = width;
  Object.defineProperty(container, "clientWidth", {
    get: () => current,
    configurable: true,
  });
  for (const ratio of ratios) {
    const item = document.createElement("figure");
    const image = document.createElement("img");
    image.className = "re-justified-media";
    image.setAttribute("width", String(Math.round(ratio * 1000)));
    image.setAttribute("height", "1000");
    item.append(image, document.createElement("figcaption"));
    container.append(item);
  }
  document.body.append(container);
  return {
    container,
    items: () => Array.from(container.children) as HTMLElement[],
    async resize(next: number) {
      current = next;
      await resized(container);
    },
  };
}

function rows(container: HTMLElement) {
  const result: number[][] = [];
  let open = 0;
  for (const [index, item] of Array.from(container.children).entries()) {
    const share = Number(
      (item as HTMLElement).style.getPropertyValue("--re-justified-share"),
    );
    if (open === 0) result.push([]);
    result.at(-1)?.push(index);
    open += share;
    if (open > 0.999) open = 0;
  }
  return result;
}

const shapes = [1.5, 0.67, 1, 1.78, 0.8, 2.4, 1.33, 0.56, 1.5, 1, 1.33, 0.75];

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("createJustifiedGallery", () => {
  it("writes each full row's shares so they add up to the row", () => {
    const { container, items } = gallery(shapes);
    createJustifiedGallery(container);
    expect(container.getAttribute("data-re-justified")).toBe("start");
    expect(container.style.getPropertyValue("--re-justified-column-gap")).toBe(
      "8px",
    );
    const full = items().filter(
      (item) => !item.hasAttribute("data-re-justified-row"),
    );
    const total = full.reduce(
      (sum, item) =>
        sum + Number(item.style.getPropertyValue("--re-justified-share")),
      0,
    );
    expect(total).toBeCloseTo(rows(container).length - 1, 6);
    expect(items()[0].style.getPropertyValue("--re-ratio")).toBe("1.5");
  });

  it("writes nothing while the container has no width", () => {
    const { container } = gallery(shapes, 0);
    const before = container.innerHTML;
    createJustifiedGallery(container);
    expect(container.innerHTML).toBe(before);
    expect(container.hasAttribute("data-re-justified")).toBe(false);
  });

  it("keeps rows through a scrollbar's width and re-breaks past the range", async () => {
    const { container, resize } = gallery([...shapes, ...shapes]);
    createJustifiedGallery(container);
    const initial = rows(container);
    await resize(985);
    expect(rows(container)).toEqual(initial);
    await resize(1000);
    expect(rows(container)).toEqual(initial);
    await resize(1500);
    expect(rows(container)).not.toEqual(initial);
  });

  it("keeps its layout while hidden and after showing at the same width", async () => {
    const { container, resize } = gallery(shapes);
    createJustifiedGallery(container);
    const before = container.outerHTML;
    await resize(0);
    expect(container.outerHTML).toBe(before);
    await resize(1000);
    expect(container.outerHTML).toBe(before);
  });

  it("lays out again when items are added", async () => {
    const { container, items } = gallery(shapes);
    createJustifiedGallery(container);
    const extra = items()[0].cloneNode(true) as HTMLElement;
    for (const name of [
      "--re-ratio",
      "--re-justified-share",
      "--re-justified-count",
    ]) {
      extra.style.removeProperty(name);
    }
    container.append(extra);
    await settle();
    expect(extra.style.getPropertyValue("--re-justified-share")).not.toBe("");
  });

  it("takes a picture's ratio once it has loaded", async () => {
    const { container, items } = gallery([1, 1, 1, 1, 1]);
    const image = items()[0].querySelector("img") as HTMLImageElement;
    image.removeAttribute("width");
    image.removeAttribute("height");
    createJustifiedGallery(container);
    expect(items()[0].style.getPropertyValue("--re-ratio")).toBe("1");
    Object.defineProperty(image, "naturalWidth", { get: () => 2000 });
    Object.defineProperty(image, "naturalHeight", { get: () => 1000 });
    image.dispatchEvent(new Event("load"));
    await frame();
    expect(items()[0].style.getPropertyValue("--re-ratio")).toBe("2");
  });

  it("keeps a ratio the page declares", () => {
    const { container, items } = gallery([1, 1, 1]);
    items()[1].style.setProperty("--re-ratio", "0.5");
    createJustifiedGallery(container);
    expect(items()[1].style.getPropertyValue("--re-ratio")).toBe("0.5");
  });

  it("hides rows after maxRows and a last row that is not full for hide", () => {
    const { container, items } = gallery([...shapes, ...shapes]);
    createJustifiedGallery(container, { maxRows: 1 });
    const first = rows(container)[0];
    const hidden = items().filter((item) =>
      item.hasAttribute("data-re-justified-hidden"),
    );
    expect(hidden).toHaveLength(items().length - first.length);
  });

  it("does not hide the only row for hide", () => {
    const { container, items } = gallery([1.5, 1]);
    createJustifiedGallery(container, { lastRow: "hide" });
    expect(
      items().some((item) => item.hasAttribute("data-re-justified-hidden")),
    ).toBe(false);
  });

  it("puts back everything it wrote, and destroy is safe twice", () => {
    const { container, items } = gallery(shapes);
    items()[2].style.setProperty("--re-ratio", "1");
    const before = container.outerHTML;
    const instance = createJustifiedGallery(container, { lastRow: "center" });
    instance.destroy();
    instance.destroy();
    instance.refresh();
    expect(container.outerHTML).toBe(before);
  });

  it("rejects options it cannot honour", () => {
    const { container } = gallery(shapes);
    expect(() => createJustifiedGallery(container, { tolerance: -1 })).toThrow(
      RangeError,
    );
    expect(() =>
      // @ts-expect-error an unknown value from untyped callers
      createJustifiedGallery(container, { lastRow: "left" }),
    ).toThrow(RangeError);
    expect(() => createJustifiedGallery(container, { maxRows: 1.5 })).toThrow(
      RangeError,
    );
  });

  it("works on a container in another document", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const inner = frame.contentDocument as Document;
    const container = inner.createElement("div");
    Object.defineProperty(container, "clientWidth", { get: () => 600 });
    for (const ratio of [1.5, 1, 0.75]) {
      const image = inner.createElement("img");
      image.setAttribute("width", String(ratio * 100));
      image.setAttribute("height", "100");
      container.append(image);
    }
    inner.body.append(container);
    createJustifiedGallery(container);
    expect(
      (container.firstElementChild as HTMLElement).style.getPropertyValue(
        "--re-ratio",
      ),
    ).toBe("1.5");
  });

  it("breaks a last row again once it no longer fits at the target height", async () => {
    const { container, resize } = gallery([1, 1, 1.25, 1.25], 608);
    createJustifiedGallery(container);
    await resize(368);
    const expected = breakRows([1, 1, 1.25, 1.25], {
      width: 368,
      gap: 8,
      rowHeight: 240,
      tolerance: 0.25,
    }).map((row) =>
      Array.from({ length: row.end - row.start }, (_, i) => row.start + i),
    );
    expect(rows(container)).toEqual(expected);
  });

  it("does not flip back to rows it just gave up when the width flips back", async () => {
    const ratios = [
      2.4824, 0.7227, 2.5838, 0.7185, 2.609, 1.9347, 0.8785, 0.6872, 1.4271,
      1.5132, 0.8345, 0.5968, 2.5427, 0.6159, 0.5604, 1.5632, 1.8899, 1.0763,
      0.6991, 1.3407, 0.7356, 1.6317, 1.4227, 1.0856, 0.8084, 0.8408, 1.0763,
      2.6232, 0.6078, 1.3813, 0.8423, 2.576, 1.0364, 0.6739,
    ];
    const { container, items, resize } = gallery(ratios);
    items().forEach((item, index) => {
      item.style.setProperty("--re-ratio", String(ratios[index]));
    });
    // The page's scrollbar takes the 15px the container loses.
    const root = document.documentElement;
    Object.defineProperty(root, "clientWidth", {
      configurable: true,
      get: () => window.innerWidth - (container.clientWidth === 985 ? 15 : 0),
    });
    createJustifiedGallery(container);
    const wide = rows(container);
    await resize(985);
    const narrow = rows(container);
    // These pictures leave the range both ways, which is what loops a page
    // whose scrollbar comes and goes with them.
    expect(narrow).not.toEqual(wide);
    await resize(1000);
    expect(rows(container)).toEqual(narrow);
    await resize(985);
    expect(rows(container)).toEqual(narrow);
    Reflect.deleteProperty(root, "clientWidth");
  });

  it("takes a ratio the page sets after the first layout", () => {
    const { container, items } = gallery([1, 1, 1]);
    const instance = createJustifiedGallery(container);
    items()[0].style.setProperty("--re-ratio", "2");
    instance.refresh();
    expect(items()[0].style.getPropertyValue("--re-ratio")).toBe("2");
    expect(
      Number(items()[0].style.getPropertyValue("--re-justified-share")),
    ).toBeCloseTo(0.5, 6);
    instance.destroy();
    expect(items()[0].style.getPropertyValue("--re-ratio")).toBe("2");
  });

  it("follows a gap the page changes on the container", async () => {
    const { container } = gallery(shapes);
    createJustifiedGallery(container);
    container.style.columnGap = "32px";
    await settle();
    expect(container.style.getPropertyValue("--re-justified-column-gap")).toBe(
      "32px",
    );
  });

  it("puts back what it wrote on an item that leaves the gallery", async () => {
    const { container, items } = gallery(shapes);
    createJustifiedGallery(container);
    const gone = items()[0];
    gone.remove();
    await settle();
    expect(gone.hasAttribute("style")).toBe(false);
  });

  it("takes the best rows again after a resize wider than a scrollbar and back", async () => {
    const squares = Array.from({ length: 12 }, () => 1);
    const { container, resize } = gallery(squares);
    createJustifiedGallery(container);
    const wide = rows(container);
    await resize(500);
    expect(rows(container)).not.toEqual(wide);
    await resize(1000);
    expect(rows(container)).toEqual(wide);
  });

  it("keeps a ratio the page sets back to a value the controller once wrote", async () => {
    const { container, items } = gallery([1, 1, 1]);
    const image = items()[0].querySelector("img") as HTMLImageElement;
    image.removeAttribute("width");
    image.removeAttribute("height");
    const instance = createJustifiedGallery(container);
    items()[0].style.setProperty("--re-ratio", "2");
    instance.refresh();
    items()[0].style.setProperty("--re-ratio", "1");
    Object.defineProperty(image, "naturalWidth", { get: () => 3000 });
    Object.defineProperty(image, "naturalHeight", { get: () => 1000 });
    instance.refresh();
    expect(items()[0].style.getPropertyValue("--re-ratio")).toBe("1");
    instance.destroy();
    expect(items()[0].style.getPropertyValue("--re-ratio")).toBe("1");
  });

  it("puts back what it wrote on an item removed while the gallery is hidden", async () => {
    const { container, items, resize } = gallery(shapes);
    createJustifiedGallery(container);
    await resize(0);
    const gone = items()[0];
    gone.remove();
    await settle();
    expect(gone.hasAttribute("style")).toBe(false);
  });

  it("lays out an item moved in from another gallery as its own", async () => {
    const first = gallery(shapes);
    const second = gallery(shapes);
    const one = createJustifiedGallery(first.container);
    createJustifiedGallery(second.container);
    const moved = second.items()[3];
    first.container.append(moved);
    await settle();
    const share = Number(moved.style.getPropertyValue("--re-justified-share"));
    expect(rows(first.container).flat()).toContain(first.items().length - 1);
    expect(share).toBeGreaterThan(0);
    one.destroy();
    expect(moved.hasAttribute("style")).toBe(false);
  });

  it("follows a gap a stylesheet changes without touching the container", async () => {
    const { container, resize } = gallery(shapes);
    container.style.removeProperty("column-gap");
    container.className = "wide-gaps";
    const sheet = document.createElement("style");
    sheet.textContent = ".wide-gaps { column-gap: 8px; }";
    document.head.append(sheet);
    createJustifiedGallery(container);
    sheet.textContent = ".wide-gaps { column-gap: 24px; }";
    await resize(1000);
    expect(container.style.getPropertyValue("--re-justified-column-gap")).toBe(
      "24px",
    );
    sheet.remove();
  });

  it("reads the ratio of an item moved in only after its old gallery lets go", async () => {
    const first = gallery([1, 1, 1, 1]);
    const second = gallery([1, 1, 1]);
    createJustifiedGallery(first.container);
    createJustifiedGallery(second.container);
    const moved = second.items()[0];
    const image = moved.querySelector("img") as HTMLImageElement;
    image.setAttribute("width", "3000");
    first.container.append(moved);
    await settle();
    expect(moved.style.getPropertyValue("--re-ratio")).toBe("3");
  });

  it("takes the best rows again after a gap goes there and back", async () => {
    const { container } = gallery([...shapes, ...shapes]);
    createJustifiedGallery(container);
    const initial = rows(container);
    container.style.columnGap = "40px";
    await settle();
    const wide = rows(container);
    container.style.columnGap = "8px";
    await settle();
    expect(wide).not.toEqual(initial);
    expect(rows(container)).toEqual(initial);
  });

  it("leaves out a child taken out of the flow, such as a spinner", () => {
    const { container, items } = gallery(shapes);
    const spinner = document.createElement("li");
    spinner.style.position = "absolute";
    container.append(spinner);
    createJustifiedGallery(container);
    expect(spinner.hasAttribute("style")).toBe(true);
    expect(spinner.style.getPropertyValue("--re-justified-share")).toBe("");
    expect(items()[0].style.getPropertyValue("--re-justified-share")).not.toBe(
      "",
    );
  });
});
