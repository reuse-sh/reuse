---
"@reuse-sh/carousel": minor
---

One event model. `subscribe(listener, { signal })` and the new `on(type, listener, { signal })` return a function that removes the listener, and aborting the signal removes it too. `on` reports `change`, `settle`, `play` and `pause` with `{ state }`. The `re-carousel:*` DOM events stay for markup and scripts that hold no controller. The same function subscribed twice now runs twice, and each unsubscribe removes only its own subscription.

Breaking changes (0.x, so a minor release):

- The `onChange` option is removed. Use `carousel.subscribe(listener)`, or `carousel.on("change", ({ state }) => ...)` for index changes only.
