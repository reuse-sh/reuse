---
"@reuse-sh/lightbox": minor
---

The lightbox API is reshaped for plain pages, browser builds and React alike. This is a breaking release; each step below says what to change.

Migration:

- `label` is gone. Pass `strings: { dialog }`, which names the dialog and the viewport.
- `duration` is gone. Set `--re-lightbox-open-duration` and `--re-lightbox-close-duration` in CSS. Zoom and the fade to a distant photo keep their own 350ms and 240ms.
- `padding` is gone. Set `--re-lightbox-padding` on `.re-lightbox`, 32px when unset.
- `getOrigin` is gone. Give each item `origin: () => tile`, which the viewer reads again whenever the photo changes and after `beforeclose`.
- The `autoplay` option is now `autoplayMedia`, so it cannot be mistaken for the slideshow.
- `icons.prev` is now `icons.previous`, matching `strings.previous`. The button keeps the class `re-lightbox-prev`.
- `LightboxItem` is now `LightboxImageItem | LightboxMediaItem`. An image has no `type` and needs `src`, with optional `srcset` and `sizes`. A media item has `type`, an optional `src` and `html`. `item.video` and `item.embed` are gone: put the file or link in `src` and the poster in `previewSrc`.
- `registerEmbed()` is gone, so two pages, or two widgets on one page, no longer share a global provider list. Pass `embed({ providers: [provider] })`; those providers are tried before YouTube and Vimeo.
- `getState()` returns the last snapshot `subscribe()` delivered, the same object. A drag, a pinch or a wheel shows up once it settles; read the photo's position from the page if you need it mid-gesture.
- The `onChange` option is gone. Call `lightbox.subscribe(listener, { signal })`, which returns its own unsubscribe.
- `on(type, listener, { signal })` is typed by `LightboxEventMap`. Only `beforeclose` is a `LightboxCancelableEvent` with `preventDefault()` and `defaultPrevented`; the other events no longer carry them.
- `LightboxState` gains `item` (the object you passed, not a copy), `canPrev`, `canNext` and `isPlaying`, and every field is `readonly`. The controller gains `play()` and `pause()` for the slideshow.
- `createLightbox<Item>()` takes your item type, so `open()`, `setItems()`, `state.item`, `renderContent` and slots use it. `LightboxState`, `LightboxOptions`, `LightboxSlot` and `Lightbox` take the same parameter, `LightboxItem` by default.
- `createLightbox` copies its options. Changing the object you passed no longer reaches the next open; call `setOptions()`, which now takes every option but `container`. Options apply at the next open, and `loop` and `strings` also change an open viewer at once.
- `bindLightboxGallery(root, lightbox, options?)` takes a lightbox you create and returns the function that unbinds; destroy the lightbox yourself. Its options are `selector`, `item(trigger)` and `group(trigger)`: lightbox options go to `createLightbox()`, `getItem` is now `item`, and `items(root)` is gone (open your own list with `lightbox.open()`). Triggers are links, buttons and images by default, so a quick-view link without an image opens too, and a trigger `item()` returns `null` for keeps its normal click.
- `lightboxItemFromImage(image)` is now `lightboxItemFromElement(trigger)`, which reads the trigger and the image inside it and returns `null` for a link to a page. Its second `source` argument is gone.
- A lightbox for a gallery inside a frame, created in the parent page, needs `container: frame.contentDocument.body`.
- `data-caption` is now `data-lightbox-caption`; a `figcaption` still wins.
- New: `data-lightbox-options` on a gallery root holds JSON options that fill whatever the lightbox was not given in code. Invalid JSON, an unknown key or a function string throws a `TypeError` naming the element.
- React: `useLightbox(options)` returns the lightbox itself, the same object on every render, with no `state`, so the component that holds it no longer re-renders while someone pages. Read state with `useLightboxState(lightbox, (state) => state.index)`, which re-renders only when the selected value changes and works on the server. The `Lightbox` render-prop component and the `LightboxHandle` type are gone. A ref that kept the latest handle for `connectCarousel` is no longer needed: pass the lightbox and list it in the effect's dependencies.
