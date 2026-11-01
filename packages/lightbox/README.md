# @reuse-sh/lightbox

An image viewer that opens from a thumbnail, including a cropped one, and returns to it on close. Pages scroll and swipe with the browser, and images zoom with pinch, pan, double-tap, and the pointer.

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
