---
"@reuse-sh/lightbox": minor
---

Close now flies to the tile of the photo on screen, not the one that opened the viewer. The origin comes from `getOrigin(index)` or the item's `origin`, which may now also be a function, and is read after `beforeclose`. The photo lands under a sticky header or anything else the page stacks above the tile, and fades in place when the strip is still moving or the tile is hidden, detached or off screen. A close while zoomed or dragged unwinds both in the flight. The scroll lock ends when the close starts, and the dialog holds its place on the page until the photo lands.

The new `@reuse-sh/lightbox/carousel` entry exports `connectCarousel(lightbox, carousel, { slideOf })`: the page carousel jumps to the current photo whenever the viewer settles, and its autoplay waits while the viewer is open. The browser build ships it as `browser/carousel.js`.

After close, focus goes to the current photo's tile when it is rendered, otherwise to the element that had focus before open. A close by mouse, touch, pen or Back leaves no focus ring, and Escape or a key on the close button shows it. Where an engine would still draw the ring after a pointer close, the element carries `data-re-focus-quiet` until the next key, and `theme.css` hides its outline.
