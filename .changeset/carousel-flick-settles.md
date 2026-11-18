---
"@reuse-sh/carousel": patch
---

A mouse flick on a snapped strip settles on its slide as fast as `next()`: on a full-width strip it covers 90% of the way in about 200ms and rests in about 470ms, down from 500ms and 1300ms. A free glide, on a strip with `scroll-snap-type: none` or a proximity release away from a snap point, keeps the drag's own momentum.
