# @reuse-sh/carousel

A carousel that keeps native touch and trackpad scrolling with CSS snap. It adds mouse dragging, grouping, RTL, synchronized carousels, optional repeat, and autoplay.

## Install

```sh
npm install @reuse-sh/carousel
```

## Browser

```js
import { createCarousel } from "@reuse-sh/carousel";
import "@reuse-sh/carousel/styles.css";

const viewport = document.querySelector("[data-carousel]");
const carousel = createCarousel(viewport, {
  align: "center",
  loop: true,
});
nextButton.addEventListener("click", () => carousel.next());
carousel.subscribe((state) => {
  counter.textContent = String(state.index + 1);
});
```

## React

```tsx
import { useCarousel } from "@reuse-sh/carousel/react";
import "@reuse-sh/carousel/styles.css";

function Gallery({ children }) {
  const { ref, carousel } = useCarousel({ loop: true });
  return <>
    <div ref={ref} className="reuse-carousel">
      {children}
    </div>
    <button onClick={() => carousel?.next()}>Next</button>
  </>;
}
```

## Documentation

- Examples and API: https://reuse.sh/carousel
- Guide for coding agents: https://reuse.sh/carousel/guide.md

## License

MIT
