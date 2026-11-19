---
"@reuse-sh/lightbox": patch
---

A mouse press held on the outer edge of close, an arrow, zoom or any other control now presses it. The press scale shrank the control's hit area, so the release landed beside it and no click fired. The scale is now `--re-lightbox-press-scale` (0.96 by default). If you copied a style from the docs site, replace its `.re-lightbox-button:active { transform: scale(0.95) }` rule with `--re-lightbox-press-scale: 0.95`, because a transform of your own shrinks the hit area again.
