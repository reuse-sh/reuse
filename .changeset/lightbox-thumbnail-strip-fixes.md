---
"@reuse-sh/lightbox": patch
---

Thumbnail strip fixes. A drag on the strip fires one `change` and one announcement for the photo it stops on, instead of one per photo it passes, and the tab stop and focus move to that photo's thumbnail. The strip's scroll listener no longer reads layout on every event. Arrow keys, Home and End inside the strip now page the viewer, so the ring always marks the current photo. A bottom thumbnail is at most 3:1 wide; a wider photo crops around its center.
