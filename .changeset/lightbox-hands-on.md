---
"@reuse-sh/lightbox": patch
"@reuse-sh/carousel": patch
---

The page scrolls and takes clicks while the lightbox flies closed, and the photo is no longer cut by its tile's container during the close flight. A mouse drag on the photo pages like a swipe instead of dragging the file out. A page that also loads `@reuse-sh/carousel/styles.css` keeps the slides edge to edge, so a click on the photo zooms again, and the thumbnails keep their size and gap, which fixes a collapsed strip in iOS Safari. A click or a tap opens the viewer with no focus ring on the close button. Thumbnails take quick clicks while the strip still centers the last one. The flights keep the rounded corners of a tile whose link or wrapper rounds the photo. Closing with Escape while scrolling no longer jumps the page back once the viewer is gone. A jump to a distant thumbnail pages in like the next photo instead of fading through the backdrop, and a second click on a thumbnail that is still being centered leaves it centered.
