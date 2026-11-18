---
"@reuse-sh/lightbox": patch
---

A popup opened by a sandboxed `iframe()` or `embed()` frame keeps the sandbox, so it cannot navigate your tab: the default sandbox no longer has `allow-popups-to-escape-sandbox`.

`append()` during the close flight adds to the list that waits for the close, after an earlier `append()` or `setItems()` in the same close, instead of dropping it.

Thumbnails that `append()` and `setItems()` build on an open viewer take their labels from the strings `setOptions()` set last, not from the strings at open.

`setOptions({ strings: { carouselRole } })` on an open viewer renames the photo strip's `aria-roledescription` at once.

`useLightbox` no longer destroys its lightbox. Effect cleanup closes the viewer at once and frees its dialog and listeners, and the same object opens again, so an effect such as `useEffect(() => lightbox.open(items), [lightbox])` works after `Activity` hides and shows the component, and a real unmount leaves no dialog, scroll lock, listener or timer behind.
