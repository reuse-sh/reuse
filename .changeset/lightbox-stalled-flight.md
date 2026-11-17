---
"@reuse-sh/lightbox": patch
---

A photo no longer stays shrunk and transparent when the browser is too busy to draw its opening or closing animation. Once the animation's deadline passes, WebKit used to keep the first frame, and the viewer now lands on the last one.
