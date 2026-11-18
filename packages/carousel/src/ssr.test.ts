// @vitest-environment node

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";

it("imports the native entry point without React or a browser", async () => {
  const module = await import("./index.js");
  expect(typeof module.createCarousel).toBe("function");
  expect(typeof globalThis.document).toBe("undefined");
});

it("renders a strip and its selected state on a server without a browser", async () => {
  const { Carousel, useCarousel, useCarouselState } = await import(
    "./react.js"
  );
  function Counter() {
    const { ref, carousel } = useCarousel({ loop: true });
    const counter = useCarouselState(carousel, (state) => ({
      index: state.index,
      count: state.count,
    }));
    return createElement(
      "div",
      { ref },
      createElement("p", null, `${counter.index + 1} of ${counter.count}`),
    );
  }
  expect(renderToString(createElement(Counter))).toBe(
    "<div><p>1 of 0</p></div>",
  );
  expect(
    renderToString(
      createElement(Carousel, { "aria-label": "Prints" }, "slide"),
    ),
  ).toBe('<div aria-label="Prints" class="re-carousel">slide</div>');
});
