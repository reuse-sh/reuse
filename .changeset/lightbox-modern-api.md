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
- `registerEmbed()` is gone, so two pages, or two widgets on one page, no longer share a global provider list. Pass `embed({ providers: [provider] })`; those providers are tried before YouTube and Vimeo.
- `getState()` returns the last snapshot `subscribe()` delivered, the same object. A drag, a pinch or a wheel shows up once it settles; read the photo's position from the page if you need it mid-gesture.
- The `onChange` option is gone. Call `lightbox.subscribe(listener, { signal })`, which returns its own unsubscribe.
- `on(type, listener, { signal })` is typed by `LightboxEventMap`. Only `beforeclose` is a `LightboxCancelableEvent` with `preventDefault()` and `defaultPrevented`; the other events no longer carry them.
