---
"@reuse-sh/lightbox": patch
---

A photo without a width and height opens at the screen's fit with its tile's proportions instead of the tile's pixel size, and takes its size from the widest srcset candidate or the decoded file, never from the first candidate. `lightboxItemFromImage` reads a responsive tile's file width instead of its density-corrected `naturalWidth`. A sharper file that decodes while a finger holds the zoomed photo waits for the release. An SVG at a URL without an extension is recognized from a HEAD request's Content-Type and zooms like a vector.
