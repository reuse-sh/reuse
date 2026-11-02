---
"@reuse-sh/carousel": patch
---

`goTo` to one of the last slides, which share the end scroll position, now keeps that slide as the active index after the scroll settles. Before, it reported the first slide at that position, so a lightbox on its last photo lit the wrong dot.
