# @reuse-sh/carousel

A carousel that keeps native touch and trackpad scrolling with CSS snap. It adds mouse dragging, grouping, RTL, synchronized carousels, optional repeat, and autoplay.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Let the browser scroll.** Touch and trackpads scroll natively with CSS scroll snap, and every move from code is a scroll too.
- **Never let a drag click.** A mouse drag, or the mouse press that stops a moving strip, never opens the link under it. A thumbnail strip from connectThumbnails lets that press click its thumbnail, like a pagination button. An ordinary click still works, and touch stays native.
- **Drag like a trackpad.** A released mouse drag keeps its speed and glides to the slide nearest where it would stop, or to the stop itself when the strip does not snap there, never past a slide that asks to stop. Past either end it stretches and springs back.
- **Keep the slide it was sent to.** When the last slides share one scroll position, the active index stays the slide that goTo, a dot or a lightbox chose.
- **Repeat without clones.** The loop moves the original slides through a CSS variable, so ids, links, buttons and each slide's own transform stay as they are, and it turns on only when every slide has a width and the slides can cover the viewport.
- **Let autoplay wait for people.** Autoplay pauses for hover, keyboard focus, dragging, hidden pages, strips less than half in view and reduced motion, keeps the rest of its wait, and stays paused after the visitor pauses it. Focus from a mouse click, or returned by a lightbox closed with a pointer, does not pause it.
- **Keep keys local.** Arrow keys act only inside the focused strip and swap sides in right-to-left layouts.
- **Put back what it moved.** Destroy cancels timers and restores the styles, transforms and listeners it added.
- **Move the same way every time.** Next, dots, goTo and a released drag use one motion, so browsers do not differ.
- **Hold hover while the strip moves.** Slides ignore hover during a fast swipe or wheel scroll and respond again once it slows down.
- **Publish one state.** Index, pages, visible slides and autoplay progress come from one source that every control reads.
- **Swipe by the group the buttons use.** With group set, only the first slide of each group and the slide a move was sent to snap, so a swipe and a released drag move a group like next() does.
- **Give the strip back to the visitor.** A drag or a touch takes the position from a driver such as a marquee, and the strip snaps again once the driver lets go.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/carousel
```

## Browser build

For a page without a bundler or an import map, such as a theme or a plugin, copy `dist/browser/` and `dist/styles.css` from the package into your assets. `carousel.js` is one minified ES module with a source map and no imports. `controls.js` beside it holds `bindCarouselControls` and has no imports either.

```html
<link rel="stylesheet" href="/assets/carousel/styles.css" />
<script type="module">
  import { createCarousel } from "/assets/carousel/browser/carousel.js";

  const carousel = createCarousel(document.querySelector("#prints"));
</script>
```

<!-- examples:start -->

## Usage

[Documentation](https://reuse.sh/carousel/getting-started)

### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/carousel/styles.css" layer(components);
```

#### Usage

The viewport scrolls and each direct child snaps. Start with ordinary links and the package classes, then add the controller for dragging and local arrow keys.

```tsx
"use client";

import { Carousel } from "@reuse-sh/carousel/react";

export function PrintGallery() {
  return <Carousel tabIndex={0} aria-label="Prints">
    <a className="re-carousel__slide basis-4/5" href="/prints/blue"><img className="w-full" src="/images/blue.jpg" alt="Blue print" width="640" height="480" /></a>
    <a className="re-carousel__slide basis-4/5" href="/prints/sand"><img className="w-full" src="/images/sand.jpg" alt="Sand print" width="640" height="480" /></a>
  </Carousel>;
}
```

#### Integration

Touch and trackpad scrolling work before scripts run. Keep tabIndex on the viewport so keyboard users can reach local arrow navigation. The React component owns initialization and teardown.

### HTML + JavaScript

#### Usage

The viewport scrolls and each direct child snaps. Start with ordinary links and the package classes, then add the controller for dragging and local arrow keys.

```html
<div id="prints" class="re-carousel" tabindex="0" aria-label="Prints">
  <a class="re-carousel__slide" href="/prints/blue"><img src="/images/blue.jpg" alt="Blue print" width="640" height="480" /></a>
  <a class="re-carousel__slide" href="/prints/sand"><img src="/images/sand.jpg" alt="Sand print" width="640" height="480" /></a>
</div>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/carousel/styles.css";

#prints { --re-carousel-slide-width: 80%; }
#prints img { display: block; width: 100%; height: auto; }
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { createCarousel } from "@reuse-sh/carousel";

const carousel = createCarousel(document.querySelector("#prints"));
```

#### Integration

Touch and trackpad scrolling work before scripts run. Keep tabindex on the viewport so keyboard users can reach local arrow navigation.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
carousel.destroy();
```

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/carousel
- Guide for coding agents: https://reuse.sh/carousel/guide.md

## License

MIT
