---
"@reuse-sh/carousel": patch
---

A click right after `goTo(index, "instant")` reaches the slide. The instant jump counted as a moving strip for 100ms, so the press was taken as a press that stops the strip, and a lightbox backdrop click right after open did nothing.
