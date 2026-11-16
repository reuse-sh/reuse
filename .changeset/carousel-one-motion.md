---
"@reuse-sh/carousel": minor
"@reuse-sh/lightbox": minor
---

`next()`, `prev()`, `goTo()`, the arrow keys, Home and End now travel on the same spring as a released drag and settle in 500ms in every browser. Presses during a move redirect it without stopping. A touch, a mouse press, a wheel or an outside scroll stops it in place. Set `moveMotion: "native"` to keep the browser smooth scroll. The lightbox pages on the same spring.

The viewport now carries `data-re-dragging`, `data-re-scrolling`, `data-re-static`, `data-re-at-start` and `data-re-at-end`. The package CSS turns off hover on the slides during a fast swipe or wheel scroll, hides `[data-carousel-prev]`, `[data-carousel-next]` and `[data-carousel-dots]` beside a strip that does not overflow, and scales the slides to `--re-carousel-press-scale` (0.96) while a mouse drags them.

A strip with `scroll-snap-type: x proximity` or `none` lets a released drag glide to a stop away from snap points. A mouse drag inside a nested strip that can scroll moves only that strip, and slides inside another slide belong to the nested strip. The new `wheel: "vertical"` option turns mouse wheel notches into slides. Mouse drag listeners wait for a fine pointer, and resizes and content changes refresh the strip at most once a frame instead of twice per resize.
