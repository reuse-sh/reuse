---
"@reuse-sh/carousel": minor
---

The package CSS hides only the prev, next and dots controls that `bindCarouselControls` binds while their strip is static. The rule that hid any `[data-carousel-prev]`, `[data-carousel-next]` or `[data-carousel-dots]` near a static strip is removed, because it also hid the arrows of a strip that overflows one wrapper deeper. A page that renders its own controls hides them with a rule on the viewport's `data-re-static`, such as `.gallery:has(> [data-re-static]) .arrows { display: none }`.

`data-carousel-options` is parsed into typed options before the carousel touches the DOM. An unknown key, a value of the wrong JSON type (`"loop":"false"`, `"align":"end"`) or a strings key that takes a function (`goTo`, `counter`, `slide`) throws a `TypeError` that names the element and the key.

`setOptions({ strings })` merges over the strings the carousel was created with, from code and markup, and a key set to `undefined` returns to its value at creation instead of the library default. `useCarousel` creates the carousel from `slides` and the markup and applies its other options through `setOptions`, so an option a component drops returns to the markup value or the default, and a markup `slides` selector is kept.

Fixes: a throwing `on()` or `subscribe` listener is reported through `reportError` and no longer stops later events; `destroy()` removes its abort listeners from the signals passed to `subscribe` and `on`; a padding change on a content-box viewport with a fixed width measures the strip again.
