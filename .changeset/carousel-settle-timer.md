---
"@reuse-sh/carousel": patch
---

`destroy()` cancels every pending settle timer. A `refresh()` while the strip was moving started a second timer without clearing the first, so a settle could still run after `destroy()`.
