---
"@reuse-sh/interactions": minor
---

Hold to confirm keeps a confirmed button full for `resetMs` (1600 ms by default) and ignores presses until then, instead of emptying the fill when the press is released. The new `onReset` callback and `reset()` method end the confirmed state, and `data-confirmed` marks it for styling.
