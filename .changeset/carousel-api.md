---
"@reuse-sh/carousel": minor
---

One event model. `subscribe(listener, { signal })` and the new `on(type, listener, { signal })` return a function that removes the listener, and aborting the signal removes it too. `on` reports `change`, `settle`, `play` and `pause` with `{ state }`. The `re-carousel:*` DOM events stay for markup and scripts that hold no controller. The same function subscribed twice now runs twice, and each unsubscribe removes only its own subscription.

`setOptions` applies every option except `slides`: `releaseMotion`, `releaseDuration`, `moveMotion`, `wheel` and `strings` join `autoplay`, `loop`, `group`, `align` and `drag`. New strings relabel the strip and its slides at once.

React: `useCarouselState(carousel, selector)` subscribes a component to the part of the state it selects through `useSyncExternalStore`, with a server snapshot, so autoplay progress no longer re-renders a component that shows only the index. `useCarousel` applies changed options with `setOptions` instead of creating the carousel again.

Breaking changes (0.x, so a minor release):

- The `onChange` option is removed. Use `carousel.subscribe(listener)`, or `carousel.on("change", ({ state }) => ...)` for index changes only.
- `useCarousel` returns `{ ref, carousel }` without `state`. Replace `const { ref, carousel, state } = useCarousel(options)` with `const { ref, carousel } = useCarousel(options)` and `const index = useCarouselState(carousel, (state) => state.index)` for each part of the state a component shows.
- The `onReady` prop of `<Carousel>` is removed. Use `useCarousel` where the controller is needed.
