# Shared lightbox interface

This contract is shared by everyone who builds on the lightbox: the carousel, the site's control styles and the products that adopt it. Keep these names and shapes stable. Additional options may be added only for an actual required behavior. Browser imports are safe before a DOM exists.

createLightbox(options?: LightboxOptions): Lightbox

LightboxOptions:
- container?: HTMLElement, where the dialog is appended, default document.body
- label?: string, the dialog's accessible name, default strings.dialog
- imageClick?: "zoom" | "close" | "none", default zoom
- doubleTapZoom?: boolean, default true
- maxZoom?: number, default 4
- tapZoom?: number, default 2.5, clamped between 1 and maxZoom
- preload?: number, neighbors kept loaded on each side, 0 to 2, default 1
- thumbnails?: boolean, default false; the active thumbnail stays centered in an overflowing strip
- padding?: number, px around the fitted image, default 32
- duration?: number, ms of the open and close flight, default 280
- className?: string, added to the dialog
- icons?: Partial<Record<"close" | "prev" | "next" | "zoom", () => Node>>
- renderContent?: (context: LightboxContentContext) => undefined | (() => void), an overlay above the image; the returned function runs when the slide unloads
- loop?: boolean, default false, no effect for one item. Pages through the carousel loop while the slides cover the viewport, and through the fade otherwise
- history?: boolean, default true at the top level and false in a frame, one history entry without a URL change; Back closes the lightbox with the usual flight, another close goes back only when the top entry is the lightbox's own, and opening again adds no entry
- strings?: Partial<LightboxStrings>
- slots?: Partial<Record<LightboxSlotName, LightboxSlot>>
- getOrigin?: (index: number) => HTMLElement | null, the tile for an index, before item.origin
- onChange?: (state: LightboxState) => void, discrete actions, completed pointer gestures, and wheel input after 150ms idle

Every option except loop is read again at each open. loop is read when the controller is created and changed by setOptions, also while the viewer is open.

LightboxItem: src, previewSrc?, width?, height?, alt?, caption?, thumbnailSrc?, origin? (HTMLElement | null).

LightboxState: isOpen, isClosing, isAnimating, index, count, zoom, chrome. zoom is { scale, x, y } around the viewport center. isAnimating is true during a flight, a paging move or an animated zoom. chrome is "shown" | "hidden", also data-chrome on the dialog.

LightboxStrings: dialog ("Image gallery"), slide(index, count) ("Image 3 of 12"), counter(index, count) ("3 / 12"), close ("Close gallery"), previous ("Previous image"), next ("Next image"), zoomIn, zoomOut, fullscreenEnter, fullscreenExit, download, thumbnails ("Choose image"), thumbnail(index, count) ("Show image 3"), slideshowStart, slideshowStop, loading, error ("Image could not be loaded."), retry. index is zero-based.

LightboxSlotName: "toolbarStart" | "toolbarEnd" | "footer" | "aside".

LightboxSlot: (context: { lightbox: Lightbox; document: Document }) => { node: Node; update?: (state: LightboxState) => void; destroy?: () => void }. toolbarStart sits at the start of the top bar, toolbarEnd before the close button, footer under the caption, aside in a side panel that moves under the image below 720px. Slot elements take the theme's button style through the re-lightbox-button class, follow the markup in the tab order and hide with the controls. update runs on every published state change and once after mounting; destroy runs once when the dialog closes.

LightboxEventName: "open" | "opened" | "change" | "settle" | "beforeclose" | "closed".

LightboxEvent: { type, index, slide: HTMLElement | null, defaultPrevented, preventDefault() }. open runs in open(), opened once the flight ends, change when the index changes, settle once paging stops, beforeclose synchronously before the close flight is measured, and closed once the dialog is removed, also when open() replaces an open viewer. close() and closed wait until the history entry is gone, so a navigation right after them stays. preventDefault in beforeclose keeps the dialog open; other events ignore it.

Lightbox methods:
- open(items: readonly LightboxItem[], index?: number): void
- close(): Promise<void>, resolves once the dialog is removed
- next(), prev(), goTo(index: number)
- zoomTo(scale: number, focus?: Point), toggleZoom(focus?: Point)
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

CSS files: @reuse-sh/lightbox/base.css holds the layout and states (positions, sizes, control visibility, cursors, reduced motion) without colors or fonts in @layer re.base, and is required. @reuse-sh/lightbox/theme.css holds the default dark theme in @layer re.theme. Theme colors, radii, sizes, insets and paddings are --re-lightbox-* custom properties. dist/unlayered/ holds both files without layers.

The viewer is a native modal dialog paged by @reuse-sh/carousel. Escape closes it. Keys act only while it is open. The React hook useLightbox(options) returns the same controller with its state; it belongs to the package and adds no second implementation. It applies changed options at the next open and a changed loop at once.

## Planned

The carousel and lightbox work in progress adds the names below. They are fixed now so the controls, the media modules and the site can be built against them. Each moves into the sections above once the code ships it.

### Close to the tile on screen

LightboxItem additions: origin may also be a function () => HTMLElement | null. The origin is read after beforeclose.

Entry point @reuse-sh/lightbox/carousel:
- connectCarousel(lightbox: Lightbox, carousel: Carousel, options?: { slideOf?: (index: number) => number }): () => void. On every settle the page carousel jumps to the current photo's slide; autoplay is held while the lightbox is open. The returned function removes the link.

After a pointer close the focused tile does not match :focus-visible, or carries data-re-focus-quiet until the next key.

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
