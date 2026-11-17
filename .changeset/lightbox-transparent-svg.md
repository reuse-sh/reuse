---
"@reuse-sh/lightbox": minor
---

PNG, APNG, WebP, AVIF, GIF and SVG photos show on a light backing, `--re-lightbox-media-background` (`#f2f2f2` in the default theme), painted only under the photo itself; JPEG and unknown formats get none. An SVG without an item width and height takes its size from its own width and height, else its viewBox, instead of the browser's 300px default, and a `blob:` SVG now zooms by the vector rule.
