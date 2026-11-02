---
"@reuse-sh/avatars": patch
---

Badge and group cutouts are now vector clip paths instead of SVG mask images, so their edges stay sharp in Safari and on iOS when the page is zoomed. In a group, an avatar's badge is now cut around the next avatar together with its face.
