---
"@reuse-sh/lightbox": minor
---

The lightbox API is reshaped for plain pages, browser builds and React alike. This is a breaking release; each step below says what to change.

Migration:

- `label` is gone. Pass `strings: { dialog }`, which names the dialog and the viewport.
- `duration` is gone. Set `--re-lightbox-open-duration` and `--re-lightbox-close-duration` in CSS. Zoom and the fade to a distant photo keep their own 220ms and 240ms.
- `padding` is gone. Set `--re-lightbox-padding` on `.re-lightbox`, 32px when unset.
