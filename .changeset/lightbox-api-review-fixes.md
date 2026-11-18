---
"@reuse-sh/lightbox": patch
---

`destroy()` takes the abort listeners that `subscribe` and `on` put on your signals off them.

`bindLightboxGallery` knows which content modules a lightbox has even when the lightbox comes from another copy of the package, so it still leaves out typed items with no module and follows a clicked one.

`bindLightboxGallery` throws a `TypeError` when its second argument is not a lightbox, such as the options object of the old call shape. A click on a trigger is left to the page when the lightbox is destroyed or `open()` throws, instead of being cancelled with nothing opened.

`bindLightboxGallery` no longer takes a text link to an image, such as "Download full size", as a photo. By default a link is a trigger only when it holds an `img` or carries `data-lightbox-type` or `data-lightbox-src`, and a link with `download` never is. Pass `selector` to keep the old `"a[href], button, img"`.
