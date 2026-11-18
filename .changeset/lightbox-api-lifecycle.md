---
"@reuse-sh/lightbox": patch
---

`setItems` that puts another item at the current index now fires `change`, announces the slide and starts its player. `setItems([])` closes the viewer with the usual close instead of throwing. A list passed during the close flight waits until the dialog is gone, so the photo still flies to its own tile, and the count and index then match the new list. An error thrown by a slot, `renderContent` or `getOrigin` during `open()` no longer leaves the modal and the scroll lock behind. `settle` fires once per move of the strip, not after opening at a later photo and not twice for one move.
