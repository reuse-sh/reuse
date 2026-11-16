// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FakeResizeObserver,
  resized,
} from "../../../tests/model/resize-observer.js";
import { createMasonry } from "./masonry.js";

let supported = false;

/** Every item in a lane stacks without overlapping the one before it. */
function stacked(items: HTMLElement[], height: (item: HTMLElement) => number) {
  const lanes = new Map<number, [number, number][]>();
  for (const item of items) {
    const [start, span] = /(\d+) \/ span (\d+)/
      .exec(item.style.gridColumn)
      ?.slice(1)
      .map(Number) ?? [1, 1];
    const top = Number.parseFloat(item.style.marginTop);
    for (let lane = start; lane < start + span; lane++) {
      lanes.set(lane, [...(lanes.get(lane) ?? []), [top, top + height(item)]]);
    }
  }
  return [...lanes.values()].every((spans) =>
    spans
      .sort((a, b) => a[0] - b[0])
      .every((span, index) => index === 0 || span[0] >= spans[index - 1][1]),
  );
}

function masonry(heights: number[], width = 300) {
  const container = document.createElement("div");
  container.style.gridTemplateColumns = "100px 100px 100px";
  container.style.rowGap = "10px";
  let current = width;
  Object.defineProperty(container, "clientWidth", {
    get: () => current,
    configurable: true,
  });
  for (const height of heights) {
    const item = document.createElement("div");
    item.getBoundingClientRect = () => ({ height }) as DOMRect;
    container.append(item);
  }
  document.body.append(container);
  return {
    container,
    items: () => Array.from(container.children) as HTMLElement[],
    setWidth(next: number) {
      current = next;
    },
  };
}

const placed = (items: HTMLElement[]) =>
  items.map((item) => [item.style.gridColumn, item.style.marginTop]);

beforeEach(() => {
  supported = false;
  vi.stubGlobal("CSS", { supports: () => supported });
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("createMasonry", () => {
  it("leaves layout to the browser where grid lanes exist", () => {
    supported = true;
    const { container } = masonry([100, 50, 80]);
    const before = container.innerHTML;
    const instance = createMasonry(container);
    expect(instance.native).toBe(true);
    expect(container.innerHTML).toBe(before);
    expect(container.hasAttribute("data-re-masonry")).toBe(false);
  });

  it("places each item in the shortest lane with its offset", () => {
    const { container, items } = masonry([100, 50, 80, 40, 30]);
    const instance = createMasonry(container);
    expect(instance.native).toBe(false);
    expect(container.getAttribute("data-re-masonry")).toBe("");
    expect(placed(items())).toEqual([
      ["1 / span 1", "0px"],
      ["2 / span 1", "0px"],
      ["3 / span 1", "0px"],
      ["2 / span 1", "60px"],
      ["3 / span 1", "90px"],
    ]);
  });

  it("keeps a span the page declares", () => {
    const { container, items } = masonry([100, 50, 80]);
    items()[2].style.gridColumn = "span 2";
    createMasonry(container);
    expect(items()[2].style.gridColumn).toBe("2 / span 2");
    expect(items()[2].style.marginTop).toBe("60px");
  });

  it("writes nothing while the container has no width", () => {
    const { container } = masonry([100, 50], 0);
    const before = container.innerHTML;
    createMasonry(container);
    expect(container.innerHTML).toBe(before);
  });

  it("places items added later", async () => {
    const { container, items } = masonry([100, 50, 80]);
    createMasonry(container);
    const extra = document.createElement("div");
    extra.getBoundingClientRect = () => ({ height: 20 }) as DOMRect;
    container.append(extra);
    await new Promise((resolve) => setTimeout(resolve));
    expect(items()[3].style.gridColumn).toBe("2 / span 1");
    expect(items()[3].style.marginTop).toBe("60px");
  });

  it("puts back everything it wrote, and destroy is safe twice", () => {
    const { container, items } = masonry([100, 50, 80]);
    items()[1].style.gridColumn = "span 2";
    const before = container.outerHTML;
    const instance = createMasonry(container);
    instance.destroy();
    instance.destroy();
    instance.refresh();
    expect(container.outerHTML).toBe(before);
  });

  it("places an item again when the page shows it after hiding it", async () => {
    const { container, items } = masonry([100, 50, 80, 40, 30]);
    createMasonry(container);
    const item = items()[1];
    item.style.display = "none";
    await resized(item);
    item.style.display = "";
    await resized(item);
    expect(placed(items())).toEqual([
      ["1 / span 1", "0px"],
      ["2 / span 1", "0px"],
      ["3 / span 1", "0px"],
      ["2 / span 1", "60px"],
      ["3 / span 1", "90px"],
    ]);
  });

  it("counts tracks, not line names", () => {
    const { container, items } = masonry([100, 50, 80, 40]);
    container.style.gridTemplateColumns = "[a] 100px [b] 100px [c] 100px [d]";
    createMasonry(container);
    expect(items()[3].style.gridColumn).toBe("2 / span 1");
  });

  it("takes a span the page sets after the first placement", () => {
    const { container, items } = masonry([100, 50, 80]);
    const instance = createMasonry(container);
    items()[2].style.gridColumn = "span 2";
    instance.refresh();
    expect(items()[2].style.gridColumn).toBe("2 / span 2");
    instance.destroy();
    expect(items()[2].style.gridColumn).toBe("span 2");
  });

  it("measures each item at the width of the lane it lands in", () => {
    const container = document.createElement("div");
    container.style.gridTemplateColumns = "200px 100px";
    container.style.rowGap = "8px";
    Object.defineProperty(container, "clientWidth", { get: () => 308 });
    const widthOf = (item: HTMLElement) => {
      const [start, span] = /(\d+) \/ span (\d+)/
        .exec(item.style.gridColumn)
        ?.slice(1)
        .map(Number) ?? [Number.parseInt(item.style.gridColumn, 10) || 1, 1];
      return [200, 100]
        .slice(start - 1, start - 1 + span)
        .reduce((a, b) => a + b, 0);
    };
    for (let index = 0; index < 6; index++) {
      const item = document.createElement("div");
      // A square picture: as tall as the lane is wide.
      item.getBoundingClientRect = () => ({ height: widthOf(item) }) as DOMRect;
      container.append(item);
    }
    document.body.append(container);
    createMasonry(container);
    const items = Array.from(container.children) as HTMLElement[];
    expect(stacked(items, widthOf)).toBe(true);
  });

  it("puts back what it wrote on an item that leaves", async () => {
    const { container, items } = masonry([100, 50, 80]);
    createMasonry(container);
    const gone = items()[0];
    gone.remove();
    await new Promise((resolve) => setTimeout(resolve));
    expect(gone.hasAttribute("style")).toBe(false);
  });

  it("measures each item in its own lane when lanes differ by a fraction of a pixel", () => {
    const container = document.createElement("div");
    container.style.gridTemplateColumns = "100px 100.4px";
    container.style.rowGap = "0px";
    Object.defineProperty(container, "clientWidth", { get: () => 200.4 });
    const widthOf = (item: HTMLElement) => {
      const start = Number.parseInt(item.style.gridColumn, 10) || 1;
      return start === 2 ? 100.4 : 100;
    };
    for (let index = 0; index < 6; index++) {
      const item = document.createElement("div");
      // A 1:4 portrait: four times as tall as its lane is wide.
      item.getBoundingClientRect = () =>
        ({ height: widthOf(item) * 4 }) as DOMRect;
      container.append(item);
    }
    document.body.append(container);
    createMasonry(container);
    const items = Array.from(container.children) as HTMLElement[];
    expect(stacked(items, (item) => widthOf(item) * 4)).toBe(true);
  });

  it("places an item moved in from another gallery at its own offset", async () => {
    const first = masonry([100, 50, 80]);
    const second = masonry([30, 30, 30, 200, 40]);
    const one = createMasonry(first.container);
    createMasonry(second.container);
    const moved = second.items()[4];
    first.container.append(moved);
    await new Promise((resolve) => setTimeout(resolve));
    expect([moved.style.gridColumn, moved.style.marginTop]).toEqual([
      "2 / span 1",
      "60px",
    ]);
    one.destroy();
    expect(moved.hasAttribute("style")).toBe(false);
  });

  it("puts back what it wrote on an item removed while the gallery is hidden", async () => {
    const { container, items, setWidth } = masonry([100, 50, 80]);
    createMasonry(container);
    setWidth(0);
    const gone = items()[0];
    gone.remove();
    await new Promise((resolve) => setTimeout(resolve));
    expect(gone.hasAttribute("style")).toBe(false);
  });

  it("places the items again in the frame a picture loads", async () => {
    const heights = new Map<Element, number>();
    const { container, items } = masonry([100, 50, 80, 40]);
    for (const [index, item] of items().entries()) {
      heights.set(item, [100, 50, 80, 40][index]);
      item.getBoundingClientRect = () =>
        ({ height: heights.get(item) ?? 0 }) as DOMRect;
    }
    createMasonry(container);
    const image = document.createElement("img");
    items()[1].append(image);
    await new Promise((resolve) => setTimeout(resolve));
    heights.set(items()[1], 150);
    image.dispatchEvent(new Event("load"));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(items()[3].style.gridColumn).toBe("3 / span 1");
  });
});
