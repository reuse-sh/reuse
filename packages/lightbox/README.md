# @reuse-sh/lightbox

An image viewer that opens from a thumbnail, including a cropped one, and returns to it on close. Pages scroll and swipe with the browser, and images zoom with pinch, pan, double-tap, and the pointer.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Page with native scroll snap.** Pages are a scroll-snap strip from the carousel, so touch and trackpads keep the system's momentum.
- **Open from the thumbnail and return to it.** The image grows out of its cropped preview and goes back to the same place on close.
- **Load only what is near.** Only the current and neighboring images load, and a long jump skips the pages in between.
- **Zoom around the point you touch.** Pinch, wheel and double-tap zoom around the pointer or fingers, and panning stops at the image's edges.
- **Keep focus inside and give it back.** The viewer is a native modal dialog, and closing it returns focus to the element that opened it.
- **Leave the page as it was.** Destroy restores the page scroll, the hidden thumbnail, and every style and listener the viewer touched.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/lightbox
```

## Browser

```js
import { createLightbox } from "@reuse-sh/lightbox";
import "@reuse-sh/lightbox/styles.css";

const viewer = createLightbox({ thumbnails: true });
viewer.open([{
  src: "/photo.jpg",
  alt: "A mountain lake",
  width: 1600,
  height: 1200,
  origin: document.querySelector("img"),
}]);
```

## React

```tsx
import { useLightbox } from "@reuse-sh/lightbox/react";
import "@reuse-sh/lightbox/styles.css";

function Gallery({ images }) {
  const viewer = useLightbox();
  return <button onClick={() => viewer.open(images)}>
    Open gallery
  </button>;
}
```

## Documentation

- Examples and API: https://reuse.sh/lightbox
- Guide for coding agents: https://reuse.sh/lightbox/guide.md

## License

MIT
