# Shared lightbox interface

This contract is shared by everyone who builds on the lightbox: the carousel, the site's control styles and the products that adopt it. Keep these names and shapes stable. Additional options may be added only for an actual required behavior. Browser imports are safe before a DOM exists.

createLightbox(options?: LightboxOptions): Lightbox

LightboxOptions:
- container?: HTMLElement, where the dialog is appended, default document.body
- label?: string, the dialog's accessible name, default strings.dialog
- imageClick?: "zoom" | "close" | "none", default zoom; what a mouse click or a finger tap on the photo does. A tap waits out the 300ms double-tap window and then shows or hides the controls; "close" closes at once and turns off the double tap. A click or tap beside the photo closes
- doubleTapZoom?: boolean, default true, two taps within 300ms and 30px zoom
- maxZoom?: number, the most a photo zooms as a multiple of its file's own pixels, default 1 (1:1). An SVG has no pixels, so its maxZoom is a multiple of the fitted size, default 4. A photo whose file is no wider than its fitted width has no zoom: no zoom button, no zoom cursor and no double tap. Until the file decodes, the item's width stands for its pixels; an item without one waits for the decode
- tapZoom?: number, default 2.5, as a multiple of the fitted size; a double tap, a click and the zoom button zoom to the larger of tapZoom and 1:1, at most the maximum
- preload?: number, neighbors kept loaded on each side, 0 to 2, default 1
- thumbnails?: boolean, default false; the active thumbnail stays centered in an overflowing strip
- padding?: number, px around the fitted image, default 32
- duration?: number, ms of both the open and the close flight; unset, they take --re-lightbox-open-duration (400ms) and --re-lightbox-close-duration (300ms)
- autoHide?: number | false, default 2500, ms of a still mouse before the controls hide; false keeps them up
- className?: string, added to the dialog
- icons?: Partial<Record<"close" | "prev" | "next" | "zoom", () => Node>>
- renderContent?: (context: LightboxContentContext) => undefined | (() => void), an overlay above the image; the returned function runs when the slide unloads
- loop?: boolean, default false, no effect for one item. Pages through the carousel loop while the slides cover the viewport, and through the fade otherwise
- history?: boolean, default true at the top level and false in a frame, one history entry without a URL change; Back closes the lightbox with the usual flight, another close goes back only when the top entry is the lightbox's own, and opening again adds no entry
- strings?: Partial<LightboxStrings>
- slots?: Partial<Record<LightboxSlotName, LightboxSlot>>
- getOrigin?: (index: number) => HTMLElement | null, the tile for an index, before item.origin; a "+N" tile that stands for hidden photos is returned for each of them
- onChange?: (state: LightboxState) => void, discrete actions, completed pointer gestures, and wheel input after 150ms idle

Every option except loop is read again at each open. loop is read when the controller is created and changed by setOptions, also while the viewer is open.

LightboxItem: src, previewSrc?, width?, height?, alt?, caption?, thumbnailSrc?, origin? (HTMLElement | null | (() => HTMLElement | null)).

The origin of the current photo is read again whenever the photo changes, to hide that tile with visibility: hidden, and once more after beforeclose, for the close flight and the focus. While the viewer is open only the current photo's tile is hidden; close and destroy restore it.

Close flies to the current photo's tile and lands there under whatever the page stacks above the tile, such as a sticky header: one copy of the photo flies in the dialog and fades with the backdrop, and a second copy, an img.re-lightbox-landing at position: absolute placed right after the tile, flies on the same clock in the tile's own layer and lands opaque. For those 300ms the tile's parent has one more child, which nth-child rules and scripts that count children see. Both are removed once the flight ends. The photo fades in place instead when the current slide is off its place in the strip by more than 1px, as during a swipe or a settling move, or when the tile is detached, fails checkVisibility(), has no size or lies off screen. A close during the open flight reverses it from where the photo is, with no second copy. A close while zoomed or dragged unwinds both in the same flight. The close releases the scroll lock at once and holds the dialog at position: absolute at the current scroll position until it is removed, so a page that scrolls meanwhile carries the photo with the tile.

After close, focus goes to the current photo's tile, or to its closest link or button, when the tile is in the document and rendered, and otherwise to the element that had focus before open, always with preventScroll. A close by Escape or by a key on the close button shows the focus ring. A close by a mouse, a finger, a pen or Back does not: focus uses focusVisible: false, and where an engine still matches :focus-visible, as WebKit does after a keyboard open, the element carries data-re-focus-quiet until the next key or blur. theme.css hides the outline of [data-re-focus-quiet]:focus-visible; a page with its own focus styles hides its ring by the same attribute.

LightboxState: isOpen, isClosing, isAnimating, index, count, zoom, chrome. zoom is { scale, x, y } around the viewport center. isAnimating is true during a flight, a paging move or an animated zoom. chrome is "shown" | "hidden", also data-chrome on the dialog. The controls hide after autoHide ms of a still mouse, on a zoom, at the start of a pinch and on a tap; a key, focus moving into them, a 24px mouse move from where they hid, a tap and a return to scale 1 show them. Nothing hides them while a control is hovered or has a visible focus.

LightboxStrings: dialog ("Image gallery"), slide(index, count) ("Image 3 of 12"), counter(index, count) ("3 / 12"), close ("Close gallery"), previous ("Previous image"), next ("Next image"), zoomIn, zoomOut, fullscreenEnter, fullscreenExit, download, thumbnails ("Choose image"), thumbnail(index, count) ("Show image 3"), slideshowStart, slideshowStop, loading, error ("Image could not be loaded."), retry. index is zero-based.

LightboxSlotName: "toolbarStart" | "toolbarEnd" | "footer" | "aside".

LightboxSlot: (context: { lightbox: Lightbox; document: Document }) => { node: Node; update?: (state: LightboxState) => void; destroy?: () => void }. toolbarStart sits at the start of the top bar, toolbarEnd before the close button, footer under the caption, aside in a side panel that moves under the image below 720px. Slot elements take the theme's button style through the re-lightbox-button class, follow the markup in the tab order and hide with the controls. update runs on every published state change and once after mounting; destroy runs once when the dialog closes.

LightboxEventName: "open" | "opened" | "change" | "settle" | "beforeclose" | "closed".

LightboxEvent: { type, index, slide: HTMLElement | null, defaultPrevented, preventDefault() }. open runs in open(), opened once the flight ends, change when the index changes, settle once paging stops, beforeclose synchronously before the close flight is measured, and closed once the dialog is removed, also when open() replaces an open viewer. close() and closed wait until the history entry is gone, so a navigation right after them stays. preventDefault in beforeclose keeps the dialog open; other events ignore it.

Lightbox methods:
- open(items: readonly LightboxItem[], index?: number): void
- close(): Promise<void>, resolves once the dialog is removed
- next(), prev(), goTo(index: number)
- zoomTo(scale: number, focus?: Point), scale clamped between 1 and the current photo's maximum; toggleZoom(focus?: Point), to the tap zoom around focus, or back to 1 at the center
- getState(): LightboxState, live geometry including pointer and wheel samples before notification
- subscribe(listener: (state: LightboxState) => void): () => void, the settled changes onChange reports
- on(type: LightboxEventName, listener: (event: LightboxEvent) => void): () => void
- append(items: readonly LightboxItem[]): void, adds images at the end without moving the current one
- setItems(items: readonly LightboxItem[], index?: number): void, replaces the list; the current image stays when the list still holds it, matched by object and then by src, otherwise index or the nearest image left is shown
- setOptions(options: Pick<LightboxOptions, "loop">): void
- getSlide(index: number): HTMLElement | null
- destroy(): void, idempotent, restores the page scroll, the hidden thumbnail and every style and listener it touched

bindLightboxGallery(root: HTMLElement, options?: LightboxOptions & { selector?: string; getItem?: (image: HTMLImageElement) => LightboxItem; group?: (image: HTMLImageElement) => string; items?: (root: HTMLElement) => readonly LightboxItem[] }): Lightbox. Opens the images inside root in page order on a primary click without modifiers that no one prevented. Only images of the clicked image's group open, read from the closest data-lightbox-group or from group(image). items(root) supplies the list instead, opened at the item whose origin is the clicked image. Its destroy also removes the click listener.

lightboxItemFromImage(image: HTMLImageElement, source?: string): LightboxItem, reads data-lightbox-src, the current source, the natural size, alt and the image as origin.

CSS files: @reuse-sh/lightbox/base.css holds the layout and states (positions, sizes, control visibility, cursors, reduced motion) without colors or fonts in @layer re.base, and is required. @reuse-sh/lightbox/theme.css holds the default dark theme in @layer re.theme. Theme colors, radii, sizes, insets, paddings and the flight timing (--re-lightbox-open-duration, --re-lightbox-close-duration, --re-lightbox-ease; a flight whose easing the browser rejects uses the default curve) are --re-lightbox-* custom properties. Under reduced motion both flights fade in place in at most 150ms. The controls take their opacity from --re-lightbox-chrome-opacity, which base.css sets to 0 while they are hidden and the dismiss swipe lowers; a theme that sets a control's own opacity multiplies it by that property. dist/unlayered/ holds both files without layers.

The viewer is a native modal dialog paged by @reuse-sh/carousel. Escape closes it, also while zoomed. ArrowLeft and ArrowRight page, swapped on a right-to-left page, Home and End go to the first and last image, and + or = zooms in 1.5 times, - zooms out 1.5 times and 0 returns to 1. While zoomed the four arrows pan the photo by 10% of the viewport instead, the way a scrolled view moves; keys with Alt, Ctrl or Meta are left to the browser. Keys act only while it is open. One image shows no arrows and no counter. The visible counter is aria-hidden and rolls only the digits that change, each number kept in reading order on a right-to-left page; a role="status" region says strings.slide(index, count) when the image changes.

A touch or pen swipe whose first 10px run more vertically than sideways carries the photo, scales it to 1 - 0.25 × progress, where progress is the distance over half the viewport height, and fades the backdrop to 1 - progress and the controls to 1 - 2 × progress. It closes past 120px or 0.5px/ms over the last 80ms before release, flying from where the photo is, and otherwise returns in --re-lightbox-open-duration. pointercancel never closes. A mouse drag never dismisses.

Zoom. A pinch follows the fingers live from 0.6 to 1.25 times the maximum around its first midpoint, and the photo follows the midpoint. When a finger lifts the other one pans on. Once the last lifts, a pinch below 0.75 closes with the usual flight, below 1 returns to 1, and past the maximum returns to it around the fingers. A drag while zoomed pans: past an edge the photo follows 35% of the overshoot, and on an axis where it fits it follows 35% of the move and returns to the center. On release it glides to its position plus the speed over the last 80ms times 180ms, kept inside the edges, in 400ms on --re-lightbox-ease, and under reduced motion it stops inside the edges at once. While zoomed the strip does not page; after a pan comes to rest against the left or right edge, the next horizontal swipe toward that edge longer than 30% of the viewport width drops the zoom and pages, and a shorter one only stretches. A wheel without Ctrl or Meta does nothing at scale 1 and pans inside the edges while zoomed. Ctrl or Meta with the wheel, which is also how browsers report a trackpad pinch, zooms by exp(-deltaY × 0.01) around the pointer between 1 and the maximum, and Safari's gesturestart, gesturechange and gestureend do the same while no finger is on the screen. The viewport's box is measured when the dialog opens, when a gesture starts and on resize, and no pointermove, wheel or gesturechange listener reads layout or computed styles. A resize and a change of photo drop the zoom without animation.

@reuse-sh/lightbox/carousel exports connectCarousel(lightbox: Lightbox, carousel: Carousel, options?: { slideOf?: (index: number) => number }): () => void. On every settle the page carousel goes to slideOf(index), the identity by default, with goTo(slide, "instant"), so the page behind is in place before a close. While the viewer is open it holds the carousel's autoplay with hold("lightbox", true) and releases it after closed; a pause() from the visitor stays. The carousel's own holds still apply, so focus returned to a tile inside the strip keeps autoplay waiting until it leaves. The returned function removes the link and the hold. The browser build ships it as browser/carousel-link.js with no imports, named apart from the carousel package's own browser/carousel.js.

Dialog attributes for styles: data-chrome, data-zoomed, data-zoomable (true when imageClick is zoom and the current photo can zoom), data-panning, and data-phase, one of entering, opening, open, dragging, returning and closing. The React hook useLightbox(options) returns the same controller with its state; it belongs to the package and adds no second implementation. It applies changed options at the next open and a changed loop at once.

## Planned

The carousel and lightbox work in progress adds the names below. They are fixed now so the controls, the media modules and the site can be built against them. Each moves into the sections above once the code ships it.

### Built-in controls, thumbnails, caption and slideshow

LightboxOptions additions:
- controls?: Partial<{ close: boolean (true); arrows: boolean (true); counter: boolean (true); zoom: boolean (true); fullscreen: boolean (false); download: boolean (false); slideshow: boolean (false) }>
- thumbnails?: false | "bottom" | "side", default false, replaces the boolean
- caption?: "bottom" | "side", default bottom
- slideshow?: { interval?: number }, default 4000

Custom property: --re-lightbox-slideshow-progress (0..1).

### Media modules

LightboxContent: { type: string; mount(container: HTMLElement, context: { item: LightboxItem; index: number; signal: AbortSignal }): { unmount(): void; pause?(): void; resume?(): void; aspect?: number; interactive?: boolean } }.

LightboxItem additions: type?: string, video?: { src: string; poster?: string }, embed?: string, html?: () => Node.

LightboxOptions additions:
- content?: LightboxContent[]
- autoplay?: boolean, default true

Entry points, each a content factory the consumer passes in content: @reuse-sh/lightbox/video, @reuse-sh/lightbox/audio, @reuse-sh/lightbox/iframe, @reuse-sh/lightbox/html, @reuse-sh/lightbox/embed. embed exports registerEmbed({ name, pattern: RegExp, url(match, item): string, aspect?: number }) with YouTube and Vimeo built in. HTML slides take only a function that returns a Node; no HTML string is parsed.
