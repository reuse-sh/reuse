---
"@reuse-sh/carousel": patch
---

Fixes from the carousel audit:

- A wheel during a move stops the strip where it is and glides to the nearest snap point, instead of jumping there in one frame.
- A press stops a moving strip also with `drag: false`, on `[data-carousel-no-drag]` and without a fine pointer.
- With `loop` and a `group` that does not divide the slide count, `next()` and `prev()` land on the same group starts a swipe snaps to.
- The `[data-carousel-play]` button shows the right pressed state after `pause()`, `play()` or an `autoplay` change from code while a hold keeps the strip still.
- A static strip no longer hides the arrows and dots of another strip in the same parent, or controls in a `data-carousel-controls` element.
- Autoplay pauses for keyboard focus only, so a mouse click on the strip, or a lightbox closed with a pointer, no longer keeps it paused.
- A strip measures once when it is created, not twice.
- `strings.carouselRole` and `strings.slideRole` set the `aria-roledescription` of the strip and its slides, "carousel" and "slide" by default.
