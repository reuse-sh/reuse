---
"@reuse-sh/lightbox": patch
---

A mouse press held on the outer edge of close, an arrow, zoom or any other control now presses it. The press scale shrank the control's hit area, so the release landed beside it and no click fired. The scale is now `--re-lightbox-press-scale` (0.96 by default).
