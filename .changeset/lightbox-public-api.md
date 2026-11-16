---
"@reuse-sh/lightbox": minor
---

Breaking: `@reuse-sh/lightbox/styles.css` is gone. Import `@reuse-sh/lightbox/base.css`, the required layout and states in `@layer re.base`, and `@reuse-sh/lightbox/theme.css`, the default dark theme in `@layer re.theme`. Every theme value is a `--re-lightbox-*` custom property, and `@reuse-sh/lightbox/unlayered/` has both files without layers. Close and zoom now sit in a top bar, `.re-lightbox-toolbar`, so `.re-lightbox-button` no longer positions a button.

Breaking: with the new `history` option on by default, opening the viewer adds one history entry without changing the URL, and Back closes it. Any other close removes that entry again. Pass `history: false` to keep the old behavior.

New options: `loop` pages from the last image to the first, `strings` replaces every visible and spoken text, `slots` adds your own controls in `toolbarStart`, `toolbarEnd`, `footer` and `aside`, and `getOrigin(index)` names the tile an image returns to. New methods: `on(type, listener)` for the `open`, `opened`, `change`, `settle`, `beforeclose` and `closed` events, where `preventDefault()` in `beforeclose` keeps the viewer open, `append()` and `setItems()` change the images while the viewer is open without moving the current one, `setOptions({ loop })` and `getSlide(index)`. The state adds `isAnimating` and `chrome`. `bindLightboxGallery` opens only the images of the clicked image's `data-lightbox-group`, or of `group(image)`, and takes an `items(root)` list. An overflowing thumbnail strip keeps the active thumbnail centered.

`useLightbox` now applies changed options at the next open and a changed `loop` at once. It used to keep the options of its first open.
