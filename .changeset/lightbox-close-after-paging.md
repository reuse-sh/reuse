---
"@reuse-sh/lightbox": patch
---

A close right after paging now flies back to the new photo's tile. `connectCarousel` also moves the page carousel on `beforeclose`, and a close during the strip's settling move ends the move and flies from where the photo is, instead of fading in place.
