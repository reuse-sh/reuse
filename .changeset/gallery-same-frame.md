---
"@reuse-sh/gallery": patch
---

A window resize lays out the justified gallery and masonry in the same frame, before it paints. Both laid out on the next frame, so every resize showed one frame of the previous width's layout: masonry items off by a few pixels, and at a column or row break items in the wrong place.
