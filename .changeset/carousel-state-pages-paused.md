---
"@reuse-sh/carousel": minor
---

`getState()` reports `pages`, the index of the slide each page starts at, and `isPaused`, the visitor's own pause: true after `pause()` until `play()` while `autoplay` is set, false without `autoplay`, and never set by hover, focus, a drag or `hold()`. `bindCarouselControls` reads its dots and play button from them, so custom controls can do the same without reaching into the carousel.
