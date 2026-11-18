---
"@reuse-sh/lightbox": patch
---

`destroy()` takes the abort listeners that `subscribe` and `on` put on your signals off them.

`bindLightboxGallery` knows which content modules a lightbox has even when the lightbox comes from another copy of the package, so it still leaves out typed items with no module and follows a clicked one.

`bindLightboxGallery` throws a `TypeError` when its second argument is not a lightbox, such as the options object of the old call shape. A click on a trigger is left to the page when the lightbox is destroyed or `open()` throws, instead of being cancelled with nothing opened.

`bindLightboxGallery` no longer takes a text link to an image, such as "Download full size", as a photo. By default a link is a trigger only when it holds an `img` or carries `data-lightbox-type` or `data-lightbox-src`, and a link with `download` never is. Pass `selector` to keep the old `"a[href], button, img"`.

A gallery's `data-lightbox-options` apply only while a photo from that gallery is open, so two galleries can share one lightbox with different options, and the lightbox's own options return on close. Markup strings fill the text strings the lightbox's own `strings` leave unset.

`--re-lightbox-padding` accepts any length, such as `2rem`, `calc()` or `clamp()`, instead of reading only the number at its start.

A lightbox without `container` opens in the document of the photo's tile, so a gallery inside a same-origin frame, bound from the parent page, opens in the frame.

The zoom and the slide fade read `--re-lightbox-zoom-duration` and `--re-lightbox-fade-duration` (220ms and 240ms in theme.css); `0ms` makes them instant.

Download saves a file under the name its `Content-Disposition` header gives when the page can read that header, and otherwise under the decoded last part of its path.

`useLightboxState` renders the lightbox's state at creation on the server and while hydrating, so a Suspense boundary that hydrates after the lightbox opened no longer fails hydration.

`useLightbox` keeps one lightbox through StrictMode's rehearsal unmount: it destroys the lightbox in the task after unmount, and an effect that runs again before then keeps it.
