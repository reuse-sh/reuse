---
"@reuse-sh/gallery": patch
---

The masonry fallback keeps the empty lanes of `repeat(auto-fit, ...)` when there are fewer items than lanes, as native grid lanes do, and measures lanes that differ only by layout rounding once instead of once per lane.
