---
"@reuse-sh/gallery": patch
---

The masonry fallback measures items in their own lane under `repeat(auto-fit, ...)` columns instead of across the whole width, and reads a percentage row gap as no gap, as native grid lanes do.
