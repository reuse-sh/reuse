---
"@reuse-sh/lightbox": minor
---

The lightbox API is reshaped for plain pages, browser builds and React alike. This is a breaking release; each step below says what to change.

Migration:

- `label` is gone. Pass `strings: { dialog }`, which names the dialog and the viewport.
- `duration` is gone. Set `--re-lightbox-open-duration` and `--re-lightbox-close-duration` in CSS. Zoom and the fade to a distant photo keep their own 220ms and 240ms.
- `padding` is gone. Set `--re-lightbox-padding` on `.re-lightbox`, 32px when unset.
- `getOrigin` is gone. Give each item `origin: () => tile`, which the viewer reads again whenever the photo changes and after `beforeclose`.
- The `autoplay` option is now `autoplayMedia`, so it cannot be mistaken for the slideshow.
- `icons.prev` is now `icons.previous`, matching `strings.previous`. The button keeps the class `re-lightbox-prev`.
- `LightboxItem` is now `LightboxImageItem | LightboxMediaItem`. An image has no `type` and needs `src`, with optional `srcset` and `sizes`. A media item has `type`, an optional `src` and `html`. `item.video` and `item.embed` are gone: put the file or link in `src` and the poster in `previewSrc`.
