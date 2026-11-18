---
"@reuse-sh/carousel": patch
---

`next()`, `prev()` and `goTo()` right after a wheel scroll or a touch fling keep going to the slide they chose. The spring used to give way to the browser's wheel animation still running, and the strip went back to the slide the wheel had reached.
