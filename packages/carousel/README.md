# @reuse-sh/carousel

A carousel that keeps native touch and trackpad scrolling with CSS snap. It adds mouse dragging, grouping, RTL, synchronized carousels, optional repeat, and autoplay.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Let the browser scroll.** Touch and trackpads scroll natively with CSS scroll snap, and every move from code is a scroll too.
- **Never let a drag click.** A mouse drag, or the press that stops a moving strip, never opens the link under it. An ordinary click still works, and touch stays native.
- **Drag like a trackpad.** A released mouse drag keeps its speed and glides to the slide nearest where it would stop, never past a slide that asks to stop. Past either end it stretches and springs back.
- **Repeat without clones.** The loop moves the original slides, so ids, links and buttons stay unique, and it turns on only when the slides can cover the viewport.
- **Let autoplay wait for people.** Autoplay pauses for hover, focus, dragging, hidden pages, offscreen strips and reduced motion.
- **Keep keys local.** Arrow keys act only inside the focused strip and swap sides in right-to-left layouts.
- **Put back what it moved.** Destroy cancels timers and restores the styles, transforms and listeners it added.

<!-- principles:end -->

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
    <div ref={ref} className="re-carousel">
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
