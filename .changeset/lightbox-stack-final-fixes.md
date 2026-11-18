---
"@reuse-sh/lightbox": patch
---

A popup opened by a sandboxed `iframe()` or `embed()` frame keeps the sandbox, so it cannot navigate your tab: the default sandbox no longer has `allow-popups-to-escape-sandbox`.

`append()` during the close flight adds to the list that waits for the close, after an earlier `append()` or `setItems()` in the same close, instead of dropping it.
