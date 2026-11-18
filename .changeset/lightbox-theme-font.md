---
"@reuse-sh/lightbox": minor
---

theme.css sets the viewer's font from `--re-lightbox-font`, `system-ui` and the platform sans-serif by default, instead of inheriting the page's, so a page without its own font no longer shows the counter and caption in a serif. `--re-lightbox-glyph-size` is gone, since the controls draw SVG icons.
