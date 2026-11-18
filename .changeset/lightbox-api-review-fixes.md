---
"@reuse-sh/lightbox": patch
---

`destroy()` takes the abort listeners that `subscribe` and `on` put on your signals off them.

`bindLightboxGallery` knows which content modules a lightbox has even when the lightbox comes from another copy of the package, so it still leaves out typed items with no module and follows a clicked one.
