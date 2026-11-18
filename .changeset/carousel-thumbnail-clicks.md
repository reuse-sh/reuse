---
"@reuse-sh/carousel": patch
---

A thumbnail strip from `connectThumbnails()` takes a click while it is still moving, so quick clicks on one thumbnail after another each pick their slide. Before, the press that stopped the moving strip dropped its click. A mouse drag that moves the strip still never clicks.
