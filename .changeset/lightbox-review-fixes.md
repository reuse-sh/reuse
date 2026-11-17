---
"@reuse-sh/carousel": patch
---

A strip turned off with `setEnabled(false)` no longer changes its index when the browser ends a scroll on its own, as WebKit does after a rotation, so a zoomed lightbox photo stays current and zoomed.
