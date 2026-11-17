---
"@reuse-sh/lightbox": patch
---

The page scrolls and takes clicks while the lightbox flies closed, and the photo is no longer cut by its tile's container during the close flight. A mouse drag on the photo pages like a swipe instead of dragging the file out. A page that also loads `@reuse-sh/carousel/styles.css` keeps the slides edge to edge, so a click on the photo zooms again, and the thumbnails keep their size and gap, which fixes a collapsed strip in iOS Safari. A click or a tap opens the viewer with no focus ring on the close button.
