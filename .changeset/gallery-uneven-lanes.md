---
"@reuse-sh/gallery": patch
---

The masonry fallback keeps every lane holding an item while it measures lanes of different widths, so `repeat(auto-fit, ...)` columns whose tracks round to fractional widths no longer collapse and leave gaps.
