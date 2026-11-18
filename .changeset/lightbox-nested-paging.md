---
"@reuse-sh/lightbox": patch
---

A `change` listener that pages the viewer again, such as one that calls `goTo()`, no longer makes the strip bounce back: each photo reports one change and the strip stays on the last one.
