// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMasonry } from "./masonry.js";

let supported = false;

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
});
