// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type {
  Carousel as CarouselController,
  CarouselOptions,
} from "./index.js";
import { useCarousel, useCarouselState } from "./react.js";

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
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  });
}

beforeEach(() => {
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
});

afterEach(() => {
  for (const undo of restore.splice(0)) undo();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.replaceChildren();
});

const slides = () =>
  [0, 1, 2, 3].map((index) =>
    createElement("div", { key: index, "data-carousel-slide": "" }),
  );

let renders: Record<string, number> = {};
let current: CarouselController | null = null;

function Index({ carousel }: { carousel: CarouselController | null }) {
  const index = useCarouselState(carousel, (state) => state.index);
  renders.index = (renders.index ?? 0) + 1;
  return createElement("output", { "data-index": "" }, index + 1);
}

function Pages({ carousel }: { carousel: CarouselController | null }) {
  const { pageIndex, pageCount } = useCarouselState(carousel, (state) => ({
    pageIndex: state.pageIndex,
    pageCount: state.pageCount,
  }));
  renders.pages = (renders.pages ?? 0) + 1;
  return createElement(
    "output",
    { "data-pages": "" },
    pageIndex,
    "/",
    pageCount,
  );
}

function Strip({ options }: { options: CarouselOptions }): ReactNode {
  const { ref, carousel } = useCarousel(options);
  current = carousel;
  renders.strip = (renders.strip ?? 0) + 1;
  return createElement(
    "div",
    null,
    createElement("div", { ref }, slides()),
    createElement(Index, { carousel }),
    createElement(Pages, { carousel }),
  );
}

async function mount(options: CarouselOptions) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(() => root.render(createElement(Strip, { options })));
  return {
    host,
    root,
    render: (next: CarouselOptions) =>
      act(() => root.render(createElement(Strip, { options: next }))),
  };
}

it("applies changed options to the same carousel instead of rebuilding it", async () => {
  const { root, render } = await mount({ group: 1 });
  const first = current;
  expect(first?.getState().pageCount).toBe(4);
  await render({ group: 2 });
  expect(current).toBe(first);
  expect(first?.getState().pageCount).toBe(3);
  await render({ group: 2, strings: { slideRole: "Folie" } });
  await render({ group: 2, strings: { slideRole: "Folie" } });
  expect(current).toBe(first);
  expect(
    document
      .querySelector("[data-carousel-slide]")
      ?.getAttribute("aria-roledescription"),
  ).toBe("Folie");
  await act(() => root.unmount());
});

it("keeps options read from markup until the component changes them", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  function Marked({ options }: { options: CarouselOptions }) {
    const { ref, carousel } = useCarousel(options);
    current = carousel;
    return createElement(
      "div",
      { ref, "data-carousel-options": '{"group":2}' },
      slides(),
    );
  }
  await act(() => root.render(createElement(Marked, { options: {} })));
  await act(() => root.render(createElement(Marked, { options: {} })));
  expect(current?.getState().pageCount).toBe(3);
  await act(() =>
    root.render(createElement(Marked, { options: { group: 1 } })),
  );
  expect(current?.getState().pageCount).toBe(4);
  await act(() => root.render(createElement(Marked, { options: {} })));
  expect(current?.getState().pageCount).toBe(3);
  await act(() => root.unmount());
});

it("returns an option the component drops to the markup or the default", async () => {
  vi.useFakeTimers();
  const { root, render } = await mount({ autoplay: 1000, group: 2 });
  expect(current?.getState()).toMatchObject({ isPlaying: true, pageCount: 3 });
  await render({});
  expect(current?.getState()).toMatchObject({ isPlaying: false, pageCount: 4 });
  await act(() => root.unmount());
});

it("keeps markup options for keys the component leaves undefined", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  function Picked() {
    const { ref, carousel } = useCarousel({ align: undefined });
    current = carousel;
    return createElement(
      "div",
      {
        ref,
        "data-carousel-options": '{"slides":"[data-pick]","align":"center"}',
      },
      [0, 1, 2, 3].map((index) =>
        createElement("div", {
          key: index,
          "data-carousel-slide": "",
          "data-pick": index % 2 ? "" : undefined,
        }),
      ),
    );
  }
  await act(() => root.render(createElement(Picked)));
  expect(current?.getState().count).toBe(2);
  expect(
    (host.querySelector("[data-pick]") as HTMLElement).style.scrollSnapAlign,
  ).toBe("center");
  await act(() => root.unmount());
});

it("re-renders a component only for the part of the state it selects", async () => {
  vi.useFakeTimers();
  renders = {};
  const { host, root } = await mount({ autoplay: 1000 });
  const before = { ...renders };
  for (let frame = 0; frame < 10; frame++)
    await act(() => vi.advanceTimersByTime(50));
  expect(current?.getState().autoplayProgress).toBeGreaterThan(0.4);
  expect(renders).toEqual(before);
  await act(() => current?.next());
  expect(host.querySelector("[data-index]")?.textContent).toBe("2");
  expect(host.querySelector("[data-pages]")?.textContent).toBe("1/4");
  expect(renders.index).toBe(before.index + 1);
  expect(renders.pages).toBe(before.pages + 1);
  expect(renders.strip).toBe(before.strip);
  await act(() => root.unmount());
});

it("selects from the empty state on the server and hydrates without a mismatch", async () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const html = renderToString(createElement(Strip, { options: {} }));
  expect(html).toContain('<output data-index="">1</output>');
  expect(html).toContain("0<!-- -->/<!-- -->0");
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(() => {
    root = hydrateRoot(host, createElement(Strip, { options: {} }));
  });
  expect(host.querySelector("[data-pages]")?.textContent).toBe("0/4");
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
  await act(() => root?.unmount());
});
