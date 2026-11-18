---
"@reuse-sh/carousel": patch
---

A string set to `undefined` in `createCarousel({ strings })` or `setOptions({ strings })` returns to its `data-carousel-options` value, else the default, instead of removing the string, which made a later label throw.
