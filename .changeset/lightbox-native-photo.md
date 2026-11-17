---
"@reuse-sh/lightbox": minor
---

The photo in the viewer now behaves like an image on the page: a right click or a long press gives the browser's Save Image and Copy Image menu, and Ctrl+C or Cmd+C copies it as a PNG where the browser supports it, on Latin and non-Latin keyboard layouts. Copy works for same-origin, `data:`, `blob:` and CORS-served files, and an SVG copies at the item's size. A mouse drag that starts on the photo at its fitted size now drags the file out, to the desktop or another app, instead of paging; a drag beside the photo still pages. The new option `protect: true` turns off the menu, the drag and the copy key. A dismiss swipe vibrates once as it crosses the closing distance, where the device supports it.
