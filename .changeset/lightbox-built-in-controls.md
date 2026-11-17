---
"@reuse-sh/lightbox": minor
---

The lightbox adds built-in fullscreen, download and slideshow buttons, off by default, and a `controls` option that turns each built-in control on or off. Breaking: `thumbnails` takes `"bottom"` or `"side"` instead of `true`; the bottom strip is now a carousel that keeps the current thumbnail centered and takes one Tab stop, and `"side"` is a column at the end edge. `caption: "side"` moves captions into the aside panel. The counter moves to the top left, every part of the viewer now sits inside `div.re-lightbox-stage`, and the arrows hide below 480px.
