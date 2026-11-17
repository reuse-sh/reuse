---
"@reuse-sh/lightbox": minor
---

Items take `srcset` and `sizes`. The viewer sets `sizes` to the photo's shown width when you leave it out, and 150ms after a zoom comes to rest it asks for the zoomed width, so the browser fetches a sharper file. The new file replaces the old one only once it has decoded, and zooming out never swaps in a smaller file. Zoom limits follow the widest `srcset` candidate, and without width descriptors the loaded file's own width instead of its density-corrected `naturalWidth`.

While the photo flies open it shows the tile's loaded pixels, or `previewSrc`, and the full file comes in after the flight. The frame has its final proportions from `width` and `height`, or the tile's until the file arrives. The current photo loads first at high priority and its neighbors after it at low priority; with Save-Data on, only the current photo loads.

A photo still loading after 300ms shows a spinner from `@reuse-sh/loaders` over the new `--re-lightbox-placeholder` background, labeled with `strings.loading`. A failed photo shows `strings.error` and a `strings.retry` button that loads it again. The lightbox now depends on `@reuse-sh/loaders`: a page that loads the modules through an import map adds an entry for `@reuse-sh/loaders`, and the self-contained `browser/lightbox.js` already carries it. A failed photo has no zoom until it loads.

Fixed: `bindLightboxGallery` and `lightboxItemFromImage` open the file an image's link points to when it is an image file, before `data-lightbox-src`, and read `data-lightbox-srcset`, `data-lightbox-sizes`, `data-lightbox-width`, `data-lightbox-height`, the figure's `figcaption` and `data-caption`. A slide without `previewSrc` is no longer blank while its file loads.
