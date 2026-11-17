// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { Carousel as CarouselController } from "./index.js";
import { Carousel } from "./react.js";

const restore: (() => void)[] = [];

function measure(name: string, get: (element: HTMLElement) => unknown) {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, name);
  Object.defineProperty(HTMLElement.prototype, name, {
    configurable: true,
    get(this: HTMLElement) {
      return get(this);
    },
  });
  restore.push(() => {
    if (original) Object.defineProperty(HTMLElement.prototype, name, original);
  });
}

afterEach(() => {
  for (const undo of restore.splice(0)) undo();
  vi.unstubAllGlobals();
});

it("applies changed options to the same carousel instead of rebuilding it", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () =>
    Object.assign(new EventTarget(), { matches: false }),
  );
  const slide = (element: HTMLElement) =>
    element.hasAttribute("data-carousel-slide");
  measure("clientWidth", () => 100);
  measure("scrollWidth", () => 400);
  measure("offsetWidth", () => 100);
  measure("offsetParent", (element) => element.parentElement);
  measure("offsetLeft", (element) =>
    slide(element)
      ? Array.from(element.parentElement?.children ?? []).indexOf(element) * 100
      : 0,
  );
  HTMLElement.prototype.scrollTo = function (this: HTMLElement, options) {
    this.scrollLeft = (options as ScrollToOptions).left ?? 0;
  } as HTMLElement["scrollTo"];
  restore.push(() => Reflect.deleteProperty(HTMLElement.prototype, "scrollTo"));
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const ready: CarouselController[] = [];
  const render = (group: number) =>
    act(() =>
      root.render(
        createElement(
          Carousel,
          { options: { group }, onReady: (carousel) => ready.push(carousel) },
          [0, 1, 2, 3].map((index) =>
            createElement("div", { key: index, "data-carousel-slide": "" }),
          ),
        ),
      ),
    );
  try {
    await render(1);
    expect(ready[0]?.getState().pageCount).toBe(4);
    await render(2);
    expect(ready).toHaveLength(1);
    expect(ready[0].getState().pageCount).toBe(3);
  } finally {
    await act(() => root.unmount());
    host.remove();
  }
});
