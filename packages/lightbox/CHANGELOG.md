# @reuse-sh/lightbox

## 0.2.0

### Minor Changes

- fb8b393: Listen for `beforechange` to read the upcoming index before the active slide changes.
- 796e4e7: Show or hide configured thumbnails while the lightbox is open with `setOptions({ thumbnailsVisible: true })` or `false`. The current photo stays selected.

## 0.1.1

### Patch Changes

- d4045cb: The bottom thumbnail strip scrolls with a horizontal wheel in WebKit. Its empty ends still pass pointer input through.

## 0.1.0

### Minor Changes

- ed78ac9: Each package ships a self-contained browser build under `@reuse-sh/<package>/browser/`: a minified ES module with a source map that a page loads with `<script type="module">`, with no bundler and no import map. The lightbox build carries the carousel inside it.
- 1733373: `next()`, `prev()`, `goTo()`, the arrow keys, Home and End now travel on the same spring as a released drag and settle in 500ms in every browser. Presses during a move redirect it without stopping. A touch, a mouse press, a wheel or an outside scroll stops it in place. Set `moveMotion: "native"` to keep the browser smooth scroll. The lightbox pages on the same spring.

  The viewport now carries `data-re-dragging`, `data-re-scrolling`, `data-re-static`, `data-re-at-start` and `data-re-at-end`. The package CSS turns off hover on the slides during a fast swipe or wheel scroll, hides `[data-carousel-prev]`, `[data-carousel-next]` and `[data-carousel-dots]` beside a strip that does not overflow, and scales the slides to `--re-carousel-press-scale` (0.96) while a mouse drags them.

  A strip with `scroll-snap-type: x proximity` or `none` lets a released drag glide to a stop away from snap points; a strip without the package CSS has no snap type and glides the same way. A mouse drag inside a nested strip that can scroll moves only that strip, and slides inside another slide belong to the nested strip. The new `wheel: "vertical"` option turns mouse wheel notches into slides. Mouse drag listeners wait for a fine pointer, and resizes and content changes refresh the strip at most once a frame instead of twice per resize.

- 2deb17a: The lightbox adds built-in fullscreen, download and slideshow buttons, off by default, and a `controls` option that turns each built-in control on or off. Breaking: `thumbnails` takes `"bottom"` or `"side"` instead of `true`; the bottom strip is now a carousel that keeps the current thumbnail centered and takes one Tab stop, and `"side"` is a column at the end edge. `caption: "side"` moves captions into the aside panel. The counter moves to the top left, every part of the viewer now sits inside `div.re-lightbox-stage`, and the arrows hide below 480px.
- 301ca20: Every built-in control draws its own SVG icon in `currentColor` instead of a text glyph in the page font: close, previous, next, zoom in and out, fullscreen enter and exit, download, and slideshow play and pause. Zoom, slideshow and fullscreen switch their icon with their state. The `icons` option still replaces any of them by key.
- bfef7d5: Close now flies to the tile of the photo on screen, not the one that opened the viewer. The origin comes from `getOrigin(index)` or the item's `origin`, which may now also be a function, and is read after `beforeclose`. The photo lands under a sticky header or anything else the page stacks above the tile, and fades in place when the strip is still moving or the tile is hidden, detached or off screen. A close while zoomed or dragged unwinds both in the flight. The scroll lock ends when the close starts, and the dialog holds its place on the page until the photo lands.

  The new `@reuse-sh/lightbox/carousel` entry exports `connectCarousel(lightbox, carousel, { slideOf })`: the page carousel jumps to the current photo whenever the viewer settles, and its autoplay waits while the viewer is open. The browser build ships it as `browser/carousel-link.js`.

  After close, focus goes to the current photo's tile when it is rendered, otherwise to the element that had focus before open. A close by mouse, touch, pen or Back leaves no focus ring, and Escape or a key on the close button shows it. Where an engine would still draw the ring after a pointer close, the element carries `data-re-focus-quiet` until the next key, and `theme.css` hides its outline.

- 7f86756: The viewer now dismisses, taps and times its controls like a phone's photo app. A vertical swipe up or down carries the photo, fades the backdrop and the controls with it, and closes past 120px or a quick flick; a slower drag or a cancelled touch puts the photo back. On a phone a tap on the photo shows or hides the controls, a double tap zooms, and a tap beside the photo closes. With a mouse the controls hide after 2500ms without movement and while zoomed, and come back on a move, a key or focus; the new `autoHide` option changes the delay or, with `false`, keeps them up. Nothing hides the controls while one is hovered or focused.

  The open flight now takes 400ms and the close flight 300ms on `cubic-bezier(0.32, 0.72, 0, 1)`, set by the theme's `--re-lightbox-open-duration`, `--re-lightbox-close-duration` and `--re-lightbox-ease`; `duration` still sets both. The controls fade in 160ms after the photo starts and fade out before it lands. Under reduced motion the photo fades in place.

  Fixed: ArrowLeft and ArrowRight swap on a right-to-left page, and one image no longer shows disabled arrows and "1 / 1". Home and End go to the first and last image, and keys with Alt, Ctrl or Meta are left to the browser. The counter rolls its digits and is hidden from screen readers; a separate status region announces the image. Breaking: the counter is a `span` instead of an `output`, so read its text with `textContent`.

- 571997c: `embed()` plays only YouTube, Vimeo and providers added with `registerEmbed()`; any other URL now opens a blank frame instead of loading the page. Every frame from another origin, from `iframe()` or `embed()` and registered providers included, now gets `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"`, so a framed page and the popups it opens can no longer navigate your tab. A same-origin page still loads unsandboxed, so an open redirect on your own site defeats the sandbox. The `sandbox` option replaces the default.
- b194ad5: Video, audio, iframe, embed and HTML slides ship as separate modules: `@reuse-sh/lightbox/video`, `/audio`, `/iframe`, `/embed` and `/html` export `video()`, `audio()`, `iframe()`, `embed()` and `html()` for the new `content` option, and an item picks one with `type`. The embed module plays YouTube (from youtube-nocookie.com, Shorts at 9:16) and Vimeo links and `registerEmbed` adds providers. Only the current slide plays, a player starts by itself once when `autoplay` (default true) is on and a click opened the viewer, and gestures over a player leave it alone. `src` is optional for items with a type. Each module is its own file in `browser/`, and the core build carries none of them.
- 507f915: The lightbox API is reshaped for plain pages, browser builds and React alike. This is a breaking release; each step below says what to change.

  Migration:

  - `label` is gone. Pass `strings: { dialog }`, which names the dialog and the viewport.
  - `duration` is gone. Set `--re-lightbox-open-duration` and `--re-lightbox-close-duration` in CSS. Zoom and the fade to a distant photo keep their own 350ms and 240ms.
  - `padding` is gone. Set `--re-lightbox-padding` on `.re-lightbox`, 32px when unset.
  - `getOrigin` is gone. Give each item `origin: () => tile`, which the viewer reads again whenever the photo changes and after `beforeclose`.
  - The `autoplay` option is now `autoplayMedia`, so it cannot be mistaken for the slideshow.
  - `icons.prev` is now `icons.previous`, matching `strings.previous`. The button keeps the class `re-lightbox-prev`.
  - `LightboxItem` is now `LightboxImageItem | LightboxMediaItem`. An image has no `type` and needs `src`, with optional `srcset` and `sizes`. A media item has `type`, an optional `src` and `html`. `item.video` and `item.embed` are gone: put the file or link in `src` and the poster in `previewSrc`.
  - `registerEmbed()` is gone, so two pages, or two widgets on one page, no longer share a global provider list. Pass `embed({ providers: [provider] })`; those providers are tried before YouTube and Vimeo.
  - `getState()` returns the last snapshot `subscribe()` delivered, the same object. A drag, a pinch or a wheel shows up once it settles; read the photo's position from the page if you need it mid-gesture.
  - The `onChange` option is gone. Call `lightbox.subscribe(listener, { signal })`, which returns its own unsubscribe.
  - `on(type, listener, { signal })` is typed by `LightboxEventMap`. Only `beforeclose` is a `LightboxCancelableEvent` with `preventDefault()` and `defaultPrevented`; the other events no longer carry them.
  - `LightboxState` gains `item` (the object you passed, not a copy), `canPrev`, `canNext` and `isPlaying`, and every field is `readonly`. The controller gains `play()` and `pause()` for the slideshow.
  - `createLightbox<Item>()` takes your item type, so `open()`, `setItems()`, `state.item`, `renderContent` and slots use it. `LightboxState`, `LightboxOptions`, `LightboxSlot` and `Lightbox` take the same parameter, `LightboxItem` by default.
  - `createLightbox` copies its options. Changing the object you passed no longer reaches the next open; call `setOptions()`, which now takes every option but `container`. Options apply at the next open, and `loop` and `strings` also change an open viewer at once.
  - `bindLightboxGallery(root, lightbox, options?)` takes a lightbox you create and returns the function that unbinds; destroy the lightbox yourself. Its options are `selector`, `item(trigger)` and `group(trigger)`: lightbox options go to `createLightbox()`, `getItem` is now `item`, and `items(root)` is gone (open your own list with `lightbox.open()`). Triggers are links, buttons and images by default, so a quick-view link without an image opens too, and a trigger `item()` returns `null` for keeps its normal click.
  - `lightboxItemFromImage(image)` is now `lightboxItemFromElement(trigger)`, which reads the trigger and the image inside it and returns `null` for a link to a page. Its second `source` argument is gone.
  - A lightbox for a gallery inside a frame, created in the parent page, needs `container: frame.contentDocument.body`.
  - `data-caption` is now `data-lightbox-caption`; a `figcaption` still wins.
  - New: `data-lightbox-options` on a gallery root holds JSON options that fill whatever the lightbox was not given in code. Invalid JSON, an unknown key or a function string throws a `TypeError` naming the element.
  - React: `useLightbox(options)` returns the lightbox itself, the same object on every render, with no `state`, so the component that holds it no longer re-renders while someone pages. Read state with `useLightboxState(lightbox, (state) => state.index)`, which re-renders only when the selected value changes and works on the server. The `Lightbox` render-prop component and the `LightboxHandle` type are gone. A ref that kept the latest handle for `connectCarousel` is no longer needed: pass the lightbox and list it in the effect's dependencies.

- 393368b: The photo in the viewer now behaves like an image on the page: a right click or a long press gives the browser's Save Image and Copy Image menu, and Ctrl+C or Cmd+C copies it as a PNG where the browser supports it, on Latin and non-Latin keyboard layouts. Copy works for same-origin, `data:`, `blob:` and CORS-served files, and an SVG copies at the item's size. The new option `protect: true` turns off the menu and the copy key. A dismiss swipe vibrates once as it crosses the closing distance, where the device supports it.
- ca77e39: Breaking: `@reuse-sh/lightbox/styles.css` is gone. Import `@reuse-sh/lightbox/base.css`, the required layout and states in `@layer re.base`, and `@reuse-sh/lightbox/theme.css`, the default dark theme in `@layer re.theme`. The theme's colors, radii, sizes, insets and paddings are `--re-lightbox-*` custom properties, and `@reuse-sh/lightbox/unlayered/` has both files without layers. Close and zoom now sit in a top bar, `.re-lightbox-toolbar`, so `.re-lightbox-button` no longer positions a button.

  Breaking: with the new `history` option on by default, opening the viewer adds one history entry without changing the URL, and Back closes it. Any other close removes that entry again, and `close()` and the `closed` event wait until it is gone. Pass `history: false` to keep the old behavior. In a frame, history stays off unless you pass `history: true`.

  New options: `loop` pages from the last image to the first, `strings` replaces every visible and spoken text, `slots` adds your own controls in `toolbarStart`, `toolbarEnd`, `footer` and `aside`, and `getOrigin(index)` names the tile an image returns to. New methods: `on(type, listener)` for the `open`, `opened`, `change`, `settle`, `beforeclose` and `closed` events, where `preventDefault()` in `beforeclose` keeps the viewer open, `append()` and `setItems()` change the images while the viewer is open without moving the current one, `setOptions({ loop })` and `getSlide(index)`. The state adds `isAnimating` and `chrome`. `bindLightboxGallery` opens only the images of the clicked image's `data-lightbox-group`, or of `group(image)`, and takes an `items(root)` list. An overflowing thumbnail strip keeps the active thumbnail centered.

  `useLightbox` now applies changed options at the next open and a changed `loop` at once. It used to keep the options of its first open.

- f2be193: A window resize or a device rotation no longer drops the zoom. The lightbox handles it once per frame, keeps the current photo and the point at the screen center where they are, and keeps a photo at rest at rest. A lightbox inside a frame, or made in the parent page for a frame's document, locks only that document's scroll and returns focus there, and `bindLightboxGallery` works on a root inside a frame. `bindLightboxGallery` appends the dialog to the body its root's document has at each open, so a page that swaps in a new body, as Turbo Drive does, still opens the viewer.
- e5060e9: Items take `srcset` and `sizes`. The viewer sets `sizes` to the photo's shown width when you leave it out, and 150ms after a zoom comes to rest it asks for the zoomed width, so the browser fetches a sharper file. The new file replaces the old one only once it has decoded, and zooming out never swaps in a smaller file. Zoom limits follow the widest `srcset` candidate, and without width descriptors the loaded file's own width instead of its density-corrected `naturalWidth`.

  While the photo flies open it shows the tile's loaded pixels, or `previewSrc`, and the full file comes in after the flight. The frame has its final proportions from `width` and `height`, or the tile's until the file arrives. The current photo loads first at high priority and its neighbors after it at low priority; with Save-Data on, only the current photo loads.

  A photo still loading after 300ms shows a spinner from `@reuse-sh/loaders` over the new `--re-lightbox-placeholder` background, labeled with `strings.loading`. A failed photo shows `strings.error` and a `strings.retry` button that loads it again. The lightbox now depends on `@reuse-sh/loaders`: a page that loads the modules through an import map adds an entry for `@reuse-sh/loaders`, and the self-contained `browser/lightbox.js` already carries it. A failed photo has no zoom until it loads.

  Fixed: `bindLightboxGallery` and `lightboxItemFromImage` open the file an image's link points to when it is an image file, before `data-lightbox-src`, and read `data-lightbox-srcset`, `data-lightbox-sizes`, `data-lightbox-width`, `data-lightbox-height`, the figure's `figcaption` and `data-caption`. A slide without `previewSrc` is no longer blank while its file loads.

- 571997c: The Download button appears only for an `http:`, `https:` or `blob:` file or a PNG, JPEG, GIF, WebP or AVIF `data:` image, so a `javascript:` URL or another `data:` type from markup is never offered. A file from another origin is fetched once the button is pressed or focused and saved under its decoded name instead of navigating the page away. When its server does not allow the fetch, the click opens it in a new tab.
- 301ca20: The `icons` option and a slot's `icon(name)` gain `zoomOut`, `fullscreenExit` and `slideshowPause`. The zoom, fullscreen and slideshow buttons show them while zoomed, in full screen and playing. Without one, a button keeps the icon you gave for its first state, or switches to the built-in second icon when you gave none.
- f7c07cb: A slot's context gains `counter()`, which returns a counter that shows the position and rolls its digits like the built-in one, at once under reduced motion, and hides with one photo. A custom toolbar or side panel shows the count in its own place without writing its own animation.
- 301ca20: A slot's context gains `icon(name)`, which returns the icon a built-in control shows: yours from the `icons` option, else the package's built-in SVG. A custom toolbar in a slot matches the built-in controls without importing an icon set.
- 42191df: A very tall photo opens at the screen width with its top edge at the top and scrolls with a drag, the wheel or the up and down arrows; a double tap shows it whole. A double tap on a very wide photo zooms it to the screen height.
- 301ca20: theme.css sets the viewer's font from `--re-lightbox-font`, `system-ui` and the platform sans-serif by default, instead of inheriting the page's, so a page without its own font no longer shows the counter and caption in a serif. `--re-lightbox-glyph-size` is gone, since the controls draw SVG icons.
- 56bde98: Add themes/dark.css, themes/light.css, themes/page.css and themes/photos.css. Each loads after theme.css and sets only --re-lightbox-\* custom properties. The photos theme turns the room black while the controls are hidden, over the new --re-lightbox-background-duration.
- aa61ca7: The bottom thumbnail strip runs from edge to edge, and each thumbnail keeps its photo's proportions from the item's `width` and `height` (square without them, at least 24px wide). A ring stands still in the middle of the strip and marks the current photo instead of a border, and the others sit at 45% opacity and brighten on hover. Dragging, swiping or scrolling the strip, or the side column, opens each photo in place as its thumbnail passes under the ring, with previews until the strip stops and the full files after. A theme that styled `button[aria-current="true"]` can restyle the marker through `.re-lightbox-thumbnail-ring`.
- d574477: PNG, APNG, WebP, AVIF, GIF and SVG photos show on a light backing, `--re-lightbox-media-background` (`#f2f2f2` in the default theme), painted only under the photo itself; JPEG and unknown formats get none. An SVG without an item width and height takes its size from its own width and height, else its viewBox, instead of the browser's 300px default, and a `blob:` SVG now zooms by the vector rule.
- b1f9ed2: A zoomed photo now pans to the window's edges, also under the aside panel, the thumbnail strip and the room a page keeps for its own footer with the new `--re-lightbox-bottom-room` property, and only the close and zoom buttons come back while it is zoomed, with every footer child hidden. Dragging a zoomed photo shows the grabbing cursor instead of the default arrow. A zoom by the button, a key, a click or a double tap eases in over 350ms on `--re-lightbox-ease` instead of jumping most of the way in its first frames; a pinch and a wheel still follow the input at once.
- c90e67e: Zoom now follows the photo's own pixels. A double tap, a click and the zoom button go to 1:1, or to `tapZoom` when that is larger, and a photo the screen already shows at full resolution has no zoom button, zoom cursor or double tap, so it is never stretched. Breaking: `maxZoom` is now a multiple of 1:1 and defaults to 1; for an SVG it stays a multiple of the fitted size with a default of 4. `zoomTo()` stops at the current photo's maximum.

  A pan while zoomed stretches past the edges and glides on release. A pinch goes a little past its limits and springs back, closes below 0.75, and carries on as a pan when one finger lifts. Ctrl or Cmd with the wheel and a trackpad pinch zoom around the pointer, Safari's gesture events do the same, and a plain wheel does nothing until you zoom in. While zoomed the strip stops paging; a second swipe toward the edge the photo rests against goes to the next photo. The arrow keys pan a zoomed photo by 10% of the screen, and zooming out by tap, click or the button returns to the center. A resize or a change of photo drops the zoom at once, and no pointer move, wheel or gesture event reads layout.

### Patch Changes

- a97579a: The carousel state adds `pageCount`, `pageIndex`, `visible` (the slides at least half in view) and `autoplayProgress`. The viewport dispatches `re-carousel:change`, `re-carousel:settle`, `re-carousel:play` and `re-carousel:pause` with the state in `detail`, and carries `--re-carousel-autoplay-progress` while autoplay plays.

  Autoplay keeps the rest of its wait through hover, focus, hidden tabs and `hold()`, starts the wait again on every new slide, pauses while less than half of the strip is in view, and returns from the last slide to the first instead of stopping. `pause()` by the visitor now outlasts every `hold()`.

  `setOptions()` changes `autoplay`, `loop`, `group`, `align` and `drag` in place, and the React adapter uses it instead of rebuilding the carousel. A `goTo()` on a strip that cannot scroll yet lands once the strip overflows. A `div` or `span` viewport gets `role="region"` and such slides get `role="group"` with labels from the new `strings` option when they have no role, so lists, figures and buttons keep their own, and `next()`, `prev()` and the keys announce the slide in a polite live region.

  The lightbox strip picks up the region role, and its arrow keys now also announce the slide through the carousel's live region, beside the lightbox counter.

  New: `bindCarouselControls()` from `@reuse-sh/carousel/controls` wires prev, next, dots, counter, play and progress markup, and `connectThumbnails()` keeps a thumbnail strip centered on the active slide.

- fa62ee0: `setItems` that puts another item at the current index now fires `change`, announces the slide and starts its player. `setItems([])` closes the viewer with the usual close instead of throwing. A list passed during the close flight waits until the dialog is gone, so the photo still flies to its own tile, and the count and index then match the new list. An error thrown by a slot, `renderContent` or `getOrigin` during `open()` no longer leaves the modal and the scroll lock behind. `settle` fires once per move of the strip, not after opening at a later photo and not twice for one move.
- 507f915: `destroy()` takes the abort listeners that `subscribe` and `on` put on your signals off them.

  `bindLightboxGallery` knows which content modules a lightbox has even when the lightbox comes from another copy of the package, so it still leaves out typed items with no module and follows a clicked one.

  `bindLightboxGallery` throws a `TypeError` when its second argument is not a lightbox, such as the options object of the old call shape. A click on a trigger is left to the page when the lightbox is destroyed or `open()` throws, instead of being cancelled with nothing opened.

  `bindLightboxGallery` no longer takes a text link to an image, such as "Download full size", as a photo. By default a link is a trigger only when it holds an `img` or carries `data-lightbox-type` or `data-lightbox-src`, and a link with `download` never is. Pass `selector` to keep the old `"a[href], button, img"`.

  A gallery's `data-lightbox-options` apply only while a photo from that gallery is open, so two galleries can share one lightbox with different options, and the lightbox's own options return on close. Markup strings fill the text strings the lightbox's own `strings` leave unset.

  `--re-lightbox-padding` accepts any length, such as `2rem`, `calc()` or `clamp()`, instead of reading only the number at its start.

  A lightbox without `container` opens in the document of the photo's tile, so a gallery inside a same-origin frame, bound from the parent page, opens in the frame.

  The zoom and the slide fade read `--re-lightbox-zoom-duration` and `--re-lightbox-fade-duration` (350ms and 240ms in theme.css); `0ms` makes them instant.

  Download saves a file under the name its `Content-Disposition` header gives when the page can read that header, and otherwise under the decoded last part of its path.

  `useLightboxState` renders the lightbox's state at creation on the server and while hydrating, so a Suspense boundary that hydrates after the lightbox opened no longer fails hydration.

  `useLightbox` keeps one lightbox through StrictMode's rehearsal unmount: it destroys the lightbox in the task after unmount, and an effect that runs again before then keeps it.

  `useLightbox` compares plain objects and arrays in its options by value and functions by identity, so a re-render with an equal inline `strings` or `controls` object no longer calls `setOptions` or relabels the open viewer.

- 0caeac8: The caption fades out and back in when the photo changes, over `--re-lightbox-fade-duration`, instead of switching abruptly. It rises 0.4em as it leaves and the next one rises into place from below, the other way when paging back. Its text swaps while it is hidden, so a taller caption or a missing one never jumps into view, and fast paging shows only the newest caption. The fade ends on the caption's own opacity, and reduced motion swaps it at once. The status announcement now reads the caption after the photo number, such as "Image 2 of 8, Mint and ember": `strings.slide(index, count, caption)` receives it as a third argument, so a translation sets its own order and separator.
- 73a970d: `strings.carouselRole` sets how screen readers describe the photo strip, "carousel" by default, so a translated viewer no longer announces it in English.
- 301ca20: On a page with a classic scrollbar the close flight starts where the photo rests and lands on its tile, instead of jumping and landing half the scrollbar's width to the left when the scrollbar comes back.
- bde2b16: A close right after paging now flies back to the new photo's tile. `connectCarousel` also moves the page carousel on `beforeclose`, and a close during the strip's settling move ends the move and flies from where the photo is, instead of fading in place.
- 301ca20: Closing while a mouse drag holds the photo, or while a touch fling still moves it, ends the drag, puts the strip on the current photo at once and flies the photo to its tile from where it was, instead of fading it with the neighboring photo still in view.
- fa62ee0: Close and dismiss fixes. A close during a swipe or a pinch ends the gesture, so the finger lifting afterwards no longer sends the photo back. A second finger during a dismiss swipe leaves the photo with the first finger instead of snapping it back. On a right-to-left page with a side caption the photo now flies to and from its tile, and below 720px the next arrow sits at the edge. A tile clipped away by its own scroll container fades instead of receiving the photo, while a tile visible beside the caption panel gets it back. A tile the page renders again in `beforeclose` stays hidden during the flight. The landing photo no longer counts as a slide of a carousel built on bare images. A busy main thread right after `open()` no longer cuts the flight short, and an easing list in `--re-lightbox-ease` falls back to the default curve instead of skipping the flight.
- a1c3cf6: A control's hover color now follows `--re-lightbox-control`, so a theme that sets only the control color, such as a white one, no longer gets the dark default on hover.
- 507f915: Download starts its fetch when the button is pressed, by pointer or with Enter or Space, so tabbing past it no longer downloads the file in the background.
- 507f915: Download fetches a same-origin file too, so a server that redirects it to another origin no longer navigates the tab in Firefox and Safari. Only `blob:` and `data:` files download natively.
- 301ca20: The download link is the same 44px square as the other buttons on a page that does not set `box-sizing` itself, instead of 64px.
- 0f17063: A mouse press held on the outer edge of close, an arrow, zoom or any other control now presses it. The press scale shrank the control's hit area, so the release landed beside it and no click fired. The scale is now `--re-lightbox-press-scale` (0.96 by default). If you copied a style from the docs site, replace its `.re-lightbox-button:active { transform: scale(0.95) }` rule with `--re-lightbox-press-scale: 0.95`, because a transform of your own shrinks the hit area again.
- 507f915: `setItems([])` closes the viewer even when a `beforeclose` listener calls `preventDefault()`, also from inside that listener. The `beforeclose` of that close has `cancelable: false`, a new field every `beforeclose` event carries.
- 9007e27: The page scrolls and takes clicks while the lightbox flies closed, and the photo is no longer cut by its tile's container during the close flight. A mouse drag on the photo pages like a swipe instead of dragging the file out. A page that also loads `@reuse-sh/carousel/styles.css` keeps the slides edge to edge, so a click on the photo zooms again, and the thumbnails keep their size and gap, which fixes a collapsed strip in iOS Safari. A click or a tap opens the viewer with no focus ring on the close button. Thumbnails take quick clicks while the strip still centers the last one. The flights keep the rounded corners of a tile whose link or wrapper rounds the photo. Closing with Escape while scrolling no longer jumps the page back once the viewer is gone. A jump to a distant thumbnail pages in like the next photo instead of fading through the backdrop, in a looping viewer too, and a second click on a thumbnail that is still being centered leaves it centered. A looping viewer on a page without the carousel stylesheet no longer shows an empty page while it passes from the last photo to the first.
- bc55bd2: A side panel that a theme insets from the window's edges, or keeps on the other side, no longer counts as a panel under the photo. The photo takes the room above, before or after the panel, whichever is largest, instead of shrinking to a sliver.
- 507f915: A close from the last photo of a strip whose tiles have no position of their own lands on the tile again. The landing photo sits in a box over the tile that clips it, so it no longer widens the strip's scroll area, and mandatory snapping no longer moves the strip under the flight.
- 2a95080: Paging a large gallery no longer reads the position of every slide on each frame, and a change of photo updates only the two slides it concerns. With preload 2, neighbors now load nearest first in the direction of travel.
- 507f915: The open flight still plays when the page is busy for longer than the flight right after `open()`, instead of jumping to the open photo.
- fa62ee0: A `change` listener that pages the viewer again, such as one that calls `goTo()`, no longer makes the strip bounce back: each photo reports one change and the strip stays on the last one.
- 507f915: A photo at a URL without an extension, such as an image CDN URL with `?w=1200`, no longer costs a HEAD request. The viewer asks for the type only when the file decodes at 300x150, the size a browser gives an SVG without its own width and height.
- 1cd306a: The lightbox keeps a single live region: the carousel inside it no longer adds its own.
- fa62ee0: Two viewers no longer leave a dead Back entry behind. When one viewer closes or is destroyed while another viewer's history entry sits above its own, its entry is skipped once it becomes the current one.
- 301ca20: A key, `next()` or `goTo()` during a held mouse drag goes straight to the new photo instead of showing the starting photo for a frame.
- 301ca20: An arrow key, Home, End, a thumbnail or `goTo()` while a mouse drag holds the photo ends the drag, so releasing the mouse no longer pages the viewer back.
- 301ca20: Paging with the arrows, End or `next()` while the photo is still flying open leaves the backdrop fully opaque instead of stuck part-way through its fade.
- a2cbf6c: A window resize during the opening flight no longer leaves the photo and the backdrop half transparent. The resize lands the flight at its last frame before it lays the photo out again.
- 42a7719: On a right-to-left page the previous arrow sits on the right and the next arrow on the left, matching the swapped arrow keys, and a custom arrow icon is mirrored.
- fa62ee0: On a right-to-left page the counter reads "2 / 3" for the second of three photos instead of "3 / 2"; a counter string with right-to-left letters still reads right to left.
- 301ca20: On a right-to-left page a slot's `icon("previous")` and `icon("next")` are mirrored like the built-in arrows, so they point the right way. The built-in arrow SVGs carry the class `re-lightbox-arrow-icon`.
- fa62ee0: A photo without a width and height opens at the screen's fit with its tile's proportions instead of the tile's pixel size, and takes its size from the widest srcset candidate or the decoded file, never from the first candidate. `lightboxItemFromImage` reads a responsive tile's file width instead of its density-corrected `naturalWidth`. A sharper file that decodes while a finger holds the zoomed photo waits for the release. An SVG at a URL without an extension is recognized from a HEAD request's Content-Type and zooms like a vector.
- 507f915: A photo without a width and height eases to its file's size once the file decodes, instead of snapping smaller when the open flight lands.
- 507f915: A slideshow moves to the next photo as soon as the current video or audio ends, instead of waiting out a full interval after it.
- fa62ee0: The slideshow waits while the current video or audio slide plays and goes on once it pauses or ends, and it waits on an embed until the visitor pages. From the last photo without loop it returns to the first the way a jump does, instead of springing past every empty slide between.
- 301ca20: A slot's `icon(name)` follows the built-in buttons: without a second-state icon it keeps the first-state icon you gave, and arrows you gave point the reading way on a right-to-left page.
- 507f915: A popup opened by a sandboxed `iframe()` or `embed()` frame keeps the sandbox, so it cannot navigate your tab: the default sandbox no longer has `allow-popups-to-escape-sandbox`.

  `append()` during the close flight adds to the list that waits for the close, after an earlier `append()` or `setItems()` in the same close, instead of dropping it.

  Thumbnails that `append()` and `setItems()` build on an open viewer take their labels from the strings `setOptions()` set last, not from the strings at open.

  `setOptions({ strings: { carouselRole } })` on an open viewer renames the photo strip's `aria-roledescription` at once.

  `useLightbox` no longer destroys its lightbox. Effect cleanup closes the viewer at once and frees its dialog and listeners, and the same object opens again, so an effect such as `useEffect(() => lightbox.open(items), [lightbox])` works after `Activity` hides and shows the component, and a real unmount leaves no dialog, scroll lock, listener or timer behind.

- 4fe7d5c: A photo no longer stays shrunk and transparent when the browser is too busy to draw its opening or closing animation. Once the animation's deadline passes, WebKit used to keep the first frame, and the viewer now lands on the last one.
- 507f915: With `loop` on, the thumbnail strip's arrow keys wrap from the last photo to the first and back, as the viewer's own arrows do.
- 507f915: A wheel over the thumbnail strip opens the photo under the ring also when the strip scrolls in one frame, as Firefox does, or snaps again after the scroll ends, as Safari does.
- fa62ee0: theme.css reads its remaining literals from custom properties with the same defaults: `--re-lightbox-font-size` (14px), `--re-lightbox-counter-font-size` (13px), `--re-lightbox-blur` (16px), `--re-lightbox-control-duration` (300ms) and `--re-lightbox-ring-duration` (150ms).
- 301ca20: A click or tap between two thumbnails, or on a thumbnail that a centering strip slid away, no longer closes the viewer as if it hit the backdrop.
- fa62ee0: Thumbnail strip fixes. A drag on the strip fires one `change` and one announcement for the photo it stops on, instead of one per photo it passes, and the tab stop and focus move to that photo's thumbnail. The strip's scroll listener no longer reads layout on every event. Arrow keys, Home and End inside the strip now page the viewer, so the ring always marks the current photo. A bottom thumbnail is at most 3:1 wide; a wider photo crops around its center.
- 301ca20: The photo fits above the bottom thumbnail strip and before the side column instead of running under them, and its open and close flights start and land at that position.
- Updated dependencies [ed78ac9]
- Updated dependencies [f2ca54e]
- Updated dependencies [f2ca54e]
- Updated dependencies [73a970d]
- Updated dependencies [301ca20]
- Updated dependencies [a97579a]
- Updated dependencies [f1cc34f]
- Updated dependencies [3627ee9]
- Updated dependencies [3627ee9]
- Updated dependencies [3627ee9]
- Updated dependencies [3627ee9]
- Updated dependencies [3627ee9]
- Updated dependencies [3627ee9]
- Updated dependencies [1733373]
- Updated dependencies [3627ee9]
- Updated dependencies [301ca20]
- Updated dependencies [8f6ef10]
- Updated dependencies [54f7b7d]
- Updated dependencies [3627ee9]
- Updated dependencies [9da2d3f]
- Updated dependencies [e79a7a8]
- Updated dependencies [f2ca54e]
- Updated dependencies [9007e27]
- Updated dependencies [1cd306a]
- Updated dependencies [a0284a0]
  - @reuse-sh/carousel@0.2.0

## 0.0.6

### Patch Changes

- Updated dependencies [c7d7331]
  - @reuse-sh/carousel@0.1.1

## 0.0.5

### Patch Changes

- b118549: A released mouse drag now keeps its speed and glides to the slide nearest where it would stop, like trackpad momentum. Dragging past either end stretches the strip, and it springs back on release. A press that stops a moving strip no longer clicks the slide under it. The viewport shows a grab cursor while a mouse drag can move it. The lightbox gets the same dragging through its carousel and still moves one photo per flick.
- Updated dependencies [b118549]
- Updated dependencies [d2eaadb]
  - @reuse-sh/carousel@0.1.0

## 0.0.4

### Patch Changes

- Updated dependencies [73973fc]
  - @reuse-sh/carousel@0.0.4

## 0.0.3

### Patch Changes

- ed02d8a: Breaking: class names, custom properties and data attributes now start with `re-` instead of `reuse-` (for example `.re-carousel`, `--re-shadow-color`, `data-re-row`). Rename them in your markup and CSS when you upgrade.
- Updated dependencies [ed02d8a]
  - @reuse-sh/carousel@0.0.3

## 0.0.2

### Patch Changes

- c3d63ba: Document the library's principles in its README.
- Updated dependencies [c3d63ba]
  - @reuse-sh/carousel@0.0.2
