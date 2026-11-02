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

<!-- examples:start -->

## Usage

[Documentation](https://reuse.sh/lightbox/getting-started)

### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/lightbox/styles.css" layer(components);
```

#### Usage

Keep a real image link as the trigger, then open its full-size image through useLightbox. The origin image gives the opening and closing transition its actual crop.

```tsx
"use client";

import { useLightbox } from "@reuse-sh/lightbox/react";

export function Gallery() {
  const lightbox = useLightbox({});
  return (
    <a href="/images/print-large.jpg" onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lightbox.open([{
        src: event.currentTarget.href,
        alt: "Marble print",
        origin: event.currentTarget.querySelector("img"),
      }]);
    }}>
      <img src="/images/print.jpg" alt="Marble print" width="640" height="480" />
    </a>
  );
}
```

#### Integration

Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element. The React hook destroys its viewer on unmount.

### HTML + JavaScript

#### Usage

Keep a real image link as the trigger, then enhance the gallery with bindLightboxGallery. The origin image gives the opening and closing transition its actual crop.

```html
<div id="gallery">
  <a href="/images/print-large.jpg">
    <img data-lightbox-src="/images/print-large.jpg" src="/images/print.jpg" alt="Marble print" width="640" height="480" />
  </a>
</div>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/lightbox/styles.css";
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { bindLightboxGallery } from "@reuse-sh/lightbox";

const gallery = bindLightboxGallery(document.querySelector("#gallery"), {});
```

#### Integration

Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
gallery.destroy();
```

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/lightbox
- Guide for coding agents: https://reuse.sh/lightbox/guide.md

## License

MIT
