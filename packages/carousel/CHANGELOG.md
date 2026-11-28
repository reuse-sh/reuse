# @reuse-sh/carousel

## 0.2.3

### Patch Changes

- 2f03e2b: Keep linked carousels in place when at least half of the current slide is visible. Redirect a move in progress if it would leave less than half of the slide visible.

## 0.2.2

### Patch Changes

- c3aec79: Keep large lightbox galleries responsive by skipping unused carousel effect offsets in the photo viewport.

## 0.2.1

### Patch Changes

- 3b28d2f: Count the gap between slides when a looping carousel with `group: "page"` steps a page, so slides of different widths are no longer skipped.

## 0.2.0

### Minor Changes

- ed78ac9: Each package ships a self-contained browser build under `@reuse-sh/<package>/browser/`: a minified ES module with a source map that a page loads with `<script type="module">`, with no bundler and no import map. The lightbox build carries the carousel inside it.
- f2ca54e: The package CSS hides only the prev, next and dots controls that `bindCarouselControls` binds while their strip is static. The rule that hid any `[data-carousel-prev]`, `[data-carousel-next]` or `[data-carousel-dots]` near a static strip is removed, because it also hid the arrows of a strip that overflows one wrapper deeper. A page that renders its own controls hides them with a rule on the viewport's `data-re-static`, such as `.gallery:has(> [data-re-static]) .arrows { display: none }`.

  `data-carousel-options` is parsed into typed options before the carousel touches the DOM. An unknown key, a value of the wrong JSON type (`"loop":"false"`, `"align":"end"`) or a strings key that takes a function (`goTo`, `counter`, `slide`) throws a `TypeError` that names the element and the key.

  `setOptions({ strings })` merges over the strings the carousel was created with, from code and markup, and a key set to `undefined` returns to its value at creation instead of the library default. `useCarousel` creates the carousel from `slides` and the markup and applies its other options through `setOptions`, so an option a component drops returns to the markup value or the default, and a markup `slides` selector is kept.

  Fixes: a throwing `on()` or `subscribe` listener is reported through `reportError` and no longer stops later events; `destroy()` removes its abort listeners from the signals passed to `subscribe` and `on`; a padding change on a content-box viewport with a fixed width measures the strip again.

- f2ca54e: One event model. `subscribe(listener, { signal })` and the new `on(type, listener, { signal })` return a function that removes the listener, and aborting the signal removes it too. `on` reports `change`, `settle`, `play` and `pause` with `{ state }`. The `re-carousel:*` DOM events stay for markup and scripts that hold no controller. The same function subscribed twice now runs twice, and each unsubscribe removes only its own subscription.

  `setOptions` applies every option except `slides`: `releaseMotion`, `releaseDuration`, `moveMotion`, `wheel` and `strings` join `autoplay`, `loop`, `group`, `align` and `drag`. New strings relabel the strip, its slides and the controls from `bindCarouselControls` at once.

  Markup options: `data-carousel-options` on the viewport holds a JSON object of options that `createCarousel` reads under the options passed in code, key by key, with `strings` merged. A theme or a plugin can print its settings and translations with the markup. An attribute that is not a JSON object throws a `TypeError` that names the element.

  React: `useCarouselState(carousel, selector)` subscribes a component to the part of the state it selects through `useSyncExternalStore`, with a server snapshot, so autoplay progress no longer re-renders a component that shows only the index. `useCarousel` applies changed options with `setOptions` instead of creating the carousel again.

  Breaking changes (0.x, so a minor release):

  - The `onChange` option is removed. Use `carousel.subscribe(listener)`, or `carousel.on("change", ({ state }) => ...)` for index changes only.
  - `useCarousel` returns `{ ref, carousel }` without `state`. Replace `const { ref, carousel, state } = useCarousel(options)` with `const { ref, carousel } = useCarousel(options)` and `const index = useCarouselState(carousel, (state) => state.index)` for each part of the state a component shows.
  - The `onReady` prop of `<Carousel>` is removed. Use `useCarousel` where the controller is needed.
  - `bindCarouselControls` no longer takes `strings`. Pass them to `createCarousel` (or `data-carousel-options`), the one source for the strip and its controls.
  - `CarouselInternals` is no longer exported from `@reuse-sh/carousel`. It moved to the types-only `@reuse-sh/carousel/internal`, which is not public API and may change in any release.

- a97579a: The carousel state adds `pageCount`, `pageIndex`, `visible` (the slides at least half in view) and `autoplayProgress`. The viewport dispatches `re-carousel:change`, `re-carousel:settle`, `re-carousel:play` and `re-carousel:pause` with the state in `detail`, and carries `--re-carousel-autoplay-progress` while autoplay plays.

  Autoplay keeps the rest of its wait through hover, focus, hidden tabs and `hold()`, starts the wait again on every new slide, pauses while less than half of the strip is in view, and returns from the last slide to the first instead of stopping. `pause()` by the visitor now outlasts every `hold()`.

  `setOptions()` changes `autoplay`, `loop`, `group`, `align` and `drag` in place, and the React adapter uses it instead of rebuilding the carousel. A `goTo()` on a strip that cannot scroll yet lands once the strip overflows. A `div` or `span` viewport gets `role="region"` and such slides get `role="group"` with labels from the new `strings` option when they have no role, so lists, figures and buttons keep their own, and `next()`, `prev()` and the keys announce the slide in a polite live region.

  The lightbox strip picks up the region role, and its arrow keys now also announce the slide through the carousel's live region, beside the lightbox counter.

  New: `bindCarouselControls()` from `@reuse-sh/carousel/controls` wires prev, next, dots, counter, play and progress markup, and `connectThumbnails()` keeps a thumbnail strip centered on the active slide.

- f1cc34f: The loop no longer writes a slide's `transform`. It draws a slide in another period through `--re-carousel-shift`, which the package CSS applies as `translate`, and marks the period in `data-re-cycle`. A looping strip now needs the package stylesheet, or a rule of your own that applies `translate: var(--re-carousel-shift)` to slides whose `data-re-cycle` is not 0.

  Every slide carries `--re-carousel-offset`, its distance from where it would rest aligned in slide widths, updated every frame while the strip moves, so CSS effects such as a coverflow can read it. The loop now stays off while any slide has no width, and turns on at the next refresh once it has one.

  With `group: N` or `group: "page"`, only the first slide of each group keeps `scroll-snap-align`, so touch and trackpad swipes and a released mouse drag move a whole group, like the buttons. `destroy()` gives every slide its own value back.

  New: `take(owner, { onInterrupt })` hands the position to your own driver, such as a marquee, and `state.seamSlides` lists the slides a looping strip shows while it crosses the seam, for eager image loading.

- 1733373: `next()`, `prev()`, `goTo()`, the arrow keys, Home and End now travel on the same spring as a released drag and settle in 500ms in every browser. Presses during a move redirect it without stopping. A touch, a mouse press, a wheel or an outside scroll stops it in place. Set `moveMotion: "native"` to keep the browser smooth scroll. The lightbox pages on the same spring.

  The viewport now carries `data-re-dragging`, `data-re-scrolling`, `data-re-static`, `data-re-at-start` and `data-re-at-end`. The package CSS turns off hover on the slides during a fast swipe or wheel scroll, hides `[data-carousel-prev]`, `[data-carousel-next]` and `[data-carousel-dots]` beside a strip that does not overflow, and scales the slides to `--re-carousel-press-scale` (0.96) while a mouse drags them.

  A strip with `scroll-snap-type: x proximity` or `none` lets a released drag glide to a stop away from snap points; a strip without the package CSS has no snap type and glides the same way. A mouse drag inside a nested strip that can scroll moves only that strip, and slides inside another slide belong to the nested strip. The new `wheel: "vertical"` option turns mouse wheel notches into slides. Mouse drag listeners wait for a fine pointer, and resizes and content changes refresh the strip at most once a frame instead of twice per resize.

- 3627ee9: Slides no longer shrink while a mouse drags the strip unless the page sets `--re-carousel-press-scale`, such as `0.96`. A carousel that wants the press effect sets the property on the viewport or a parent.
- 9da2d3f: `getState()` reports `pages`, the index of the slide each page starts at, and `isPaused`, the visitor's own pause: true after `pause()` until `play()` while `autoplay` is set, false without `autoplay`, and never set by hover, focus, a drag or `hold()`. `bindCarouselControls` reads its dots and play button from them, so custom controls can do the same without reaching into the carousel.

### Patch Changes

- 73a970d: Fixes from the carousel audit:

  - A wheel during a move stops the strip where it is and glides to the nearest snap point, instead of jumping there in one frame.
  - A press stops a moving strip also with `drag: false`, on `[data-carousel-no-drag]` and without a fine pointer.
  - With `loop` and a `group` that does not divide the slide count, `next()` and `prev()` land on the same group starts a swipe snaps to.
  - The `[data-carousel-play]` button shows the right pressed state after `pause()`, `play()` or an `autoplay` change from code while a hold keeps the strip still.
  - A static strip no longer hides the arrows and dots of a strip that overflows, in the same parent or in a nearer one. The arrows and dots `bindCarouselControls` wires to a static strip hide wherever they are, also in a `data-carousel-controls` element.
  - Autoplay pauses for keyboard focus only, so a mouse click on the strip, or a lightbox closed with a pointer, no longer keeps it paused. Keyboard focus inside a shadow root pauses it too.
  - A strip measures once when it is created, not twice, and measures again when only the viewport's padding changes.
  - `strings.carouselRole` and `strings.slideRole` set the `aria-roledescription` of the strip and its slides, "carousel" and "slide" by default.

- 301ca20: A click on a control inside a slide is no longer swallowed after a drag that a key ended with the mouse released off the strip.
- 3627ee9: A mouse flick on a snapped strip settles on its slide as fast as `next()`: on a full-width strip it covers 90% of the way in about 200ms and rests in about 470ms, down from 500ms and 1300ms. A free glide, on a strip with `scroll-snap-type: none` or a proximity release away from a snap point, keeps the drag's own momentum.
- 3627ee9: A click right after `goTo(index, "instant")` reaches the slide. The instant jump counted as a moving strip for 100ms, so the press was taken as a press that stops the strip, and a lightbox backdrop click right after open did nothing.
- 3627ee9: A key, a control or goTo during a held mouse drag ends the drag and pages on, so letting go of the mouse no longer returns the strip to where the drag started or clicks the link under the mouse.
- 3627ee9: A looping strip with fractional slide widths or gaps comes to rest on its slide. Before, Chromium and Safari could jump it between two laps on every frame with no input.
- 3627ee9: A looping strip resting on its first slide reports a progress of 0, not almost 1, when the browser rounds its scroll position just below the slide.
- 3627ee9: `next()`, `prev()` and `goTo()` right after a wheel scroll or a touch fling keep going to the slide they chose. The spring used to give way to the browser's wheel animation still running, and the strip went back to the slide the wheel had reached.
- 301ca20: A key, a control or goTo while the mouse is pressed on the strip but has not dragged yet is no longer undone by the first mouse move: the drag continues from where the strip went.
- 8f6ef10: `destroy()` cancels every pending settle timer. A `refresh()` while the strip was moving started a second timer without clearing the first, so a settle could still run after `destroy()`.
- 54f7b7d: The progress slider's handle no longer jumps. A click on the track moves it once, together with the strip, instead of jumping to the pointer and back. After a drag it eases from the pointer to where the strip comes to rest, and lands there at once under reduced motion.
- 3627ee9: A strip resized during a touch fling, with an instant `goTo()` after the resize, no longer stays between two slides with snapping off. Once the fling stops, the strip glides to the nearest slide and snaps again.
- e79a7a8: A thumbnail strip from `connectThumbnails()` takes a click while it is still moving, so quick clicks on one thumbnail after another each pick their slide. Before, the press that stopped the moving strip dropped its click. A mouse drag that moves the strip still never clicks.
- f2ca54e: A string set to `undefined` in `createCarousel({ strings })` or `setOptions({ strings })` returns to its `data-carousel-options` value, else the default, instead of removing the string, which made a later label throw.
- 9007e27: The page scrolls and takes clicks while the lightbox flies closed, and the photo is no longer cut by its tile's container during the close flight. A mouse drag on the photo pages like a swipe instead of dragging the file out. A page that also loads `@reuse-sh/carousel/styles.css` keeps the slides edge to edge, so a click on the photo zooms again, and the thumbnails keep their size and gap, which fixes a collapsed strip in iOS Safari. A click or a tap opens the viewer with no focus ring on the close button. Thumbnails take quick clicks while the strip still centers the last one. The flights keep the rounded corners of a tile whose link or wrapper rounds the photo. Closing with Escape while scrolling no longer jumps the page back once the viewer is gone. A jump to a distant thumbnail pages in like the next photo instead of fading through the backdrop, in a looping viewer too, and a second click on a thumbnail that is still being centered leaves it centered. A looping viewer on a page without the carousel stylesheet no longer shows an empty page while it passes from the last photo to the first.
- 1cd306a: The lightbox keeps a single live region: the carousel inside it no longer adds its own.
- a0284a0: A strip turned off with `setEnabled(false)` no longer changes its index when the browser ends a scroll on its own, as WebKit does after a rotation, so a zoomed lightbox photo stays current and zoomed.

## 0.1.1

### Patch Changes

- c7d7331: `goTo` to one of the last slides, which share the end scroll position, now keeps that slide as the active index after the scroll settles. Before, it reported the first slide at that position, so a lightbox on its last photo lit the wrong dot.

## 0.1.0

### Minor Changes

- b118549: A released mouse drag now keeps its speed and glides to the slide nearest where it would stop, like trackpad momentum. Dragging past either end stretches the strip, and it springs back on release. A press that stops a moving strip no longer clicks the slide under it. The viewport shows a grab cursor while a mouse drag can move it. The lightbox gets the same dragging through its carousel and still moves one photo per flick.

### Patch Changes

- d2eaadb: A mouse drag past either end stretches less and stops growing at 120px, or 30% of a narrow strip, closer to trackpad overscroll.

## 0.0.4

### Patch Changes

- 73973fc: Read a percentage or `calc()` `scroll-padding-inline` correctly, so slides line up with the padded edge instead of the viewport edge.

## 0.0.3

### Patch Changes

- ed02d8a: Breaking: class names, custom properties and data attributes now start with `re-` instead of `reuse-` (for example `.re-carousel`, `--re-shadow-color`, `data-re-row`). Rename them in your markup and CSS when you upgrade.

## 0.0.2

### Patch Changes

- c3d63ba: Document the library's principles in its README.
