---
"@reuse-sh/lightbox": patch
---

`setItems([])` closes the viewer even when a `beforeclose` listener calls `preventDefault()`, also from inside that listener. The `beforeclose` of that close has `cancelable: false`, a new field every `beforeclose` event carries.
