---
"@reuse-sh/lightbox": patch
---

The caption fades out and back in when the photo changes, over `--re-lightbox-fade-duration`, instead of switching abruptly. Its text swaps while it is hidden, so a taller caption or a missing one never jumps into view, and fast paging shows only the newest caption. Reduced motion swaps it at once. The status announcement now reads the caption after the photo number, such as "Image 2 of 8, Mint and ember".
