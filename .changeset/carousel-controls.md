---
"@reuse-sh/carousel": minor
"@reuse-sh/lightbox": patch
---

The carousel state adds `pageCount`, `pageIndex`, `visible` (the slides at least half in view) and `autoplayProgress`. The viewport dispatches `re-carousel:change`, `re-carousel:settle`, `re-carousel:play` and `re-carousel:pause` with the state in `detail`, and carries `--re-carousel-autoplay-progress` while autoplay plays.

Autoplay keeps the rest of its wait through hover, focus, hidden tabs and `hold()`, starts the wait again on every new slide, pauses while less than half of the strip is in view, and returns from the last slide to the first instead of stopping. `pause()` by the visitor now outlasts every `hold()`.

`setOptions()` changes `autoplay`, `loop`, `group`, `align` and `drag` in place, and the React adapter uses it instead of rebuilding the carousel. A `goTo()` on a strip that cannot scroll yet lands once the strip overflows. A `div` or `span` viewport gets `role="region"` and such slides get `role="group"` with labels from the new `strings` option when they have no role, so lists, figures and buttons keep their own, and `next()`, `prev()` and the keys announce the slide in a polite live region.

The lightbox strip picks up the region role, and its arrow keys now also announce the slide through the carousel's live region, beside the lightbox counter.

New: `bindCarouselControls()` from `@reuse-sh/carousel/controls` wires prev, next, dots, counter, play and progress markup, and `connectThumbnails()` keeps a thumbnail strip centered on the active slide.
