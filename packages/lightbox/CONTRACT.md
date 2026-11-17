# Shared lightbox interface

This contract is shared by everyone who builds on the lightbox: the carousel, the site's control styles and the products that adopt it. Keep these names and shapes stable. Additional options may be added only for an actual required behavior. Browser imports are safe before a DOM exists.

createLightbox(options?: LightboxOptions): Lightbox

LightboxOptions:
- container?: HTMLElement, where the dialog is appended, default document.body
- label?: string, the dialog's accessible name
- imageClick?: "zoom" | "close" | "none", default zoom
- doubleTapZoom?: boolean, default true
- maxZoom?: number, default 4
- tapZoom?: number, default 2.5, clamped between 1 and maxZoom
- preload?: number, neighbors kept loaded on each side, 0 to 2, default 1
- thumbnails?: boolean, default false
- padding?: number, px around the fitted image, default 32
- duration?: number, ms of the open and close flight, default 280
- className?: string, added to the dialog
- icons?: Partial<Record<"close" | "prev" | "next" | "zoom", () => Node>>
- renderContent?: (context: LightboxContentContext) => undefined | (() => void), an overlay above the image; the returned function runs when the slide unloads
- onChange?: (state: LightboxState) => void, discrete actions, completed pointer gestures, and wheel input after 150ms idle

LightboxItem: src, previewSrc?, width?, height?, alt?, caption?, thumbnailSrc?, origin? (HTMLElement | null).

LightboxState: isOpen, isClosing, index, count, zoom. zoom is { scale, x, y } around the viewport center.

Lightbox methods:
- open(items: readonly LightboxItem[], index?: number): void
- close(): Promise<void>, resolves once the dialog is removed
- next(), prev(), goTo(index: number)
- zoomTo(scale: number, focus?: Point), toggleZoom(focus?: Point)
- getState(): LightboxState, live geometry including pointer and wheel samples before notification
- subscribe(listener: (state: LightboxState) => void): () => void, the settled changes onChange reports
- destroy(): void, idempotent, restores the page scroll, the hidden thumbnail and every style and listener it touched

bindLightboxGallery(root: HTMLElement, options?: LightboxOptions & { selector?: string; getItem?: (image: HTMLImageElement) => LightboxItem }): Lightbox. Opens every image inside root in page order on a primary click without modifiers that no one prevented. Its destroy also removes the click listener.

lightboxItemFromImage(image: HTMLImageElement, source?: string): LightboxItem, reads data-lightbox-src, the current source, the natural size, alt and the image as origin.

The viewer is a native modal dialog paged by @reuse-sh/carousel. Escape closes it. Keys act only while it is open. The React hook useLightbox(options) returns the same controller with its state; it belongs to the package and adds no second implementation.

## Planned

The carousel and lightbox work in progress adds the names below. They are fixed now so the controls, the media modules and the site can be built against them. Each moves into the sections above once the code ships it.

### Public API: strings, loop, live items, events, slots, history, CSS files

LightboxOptions additions:
- loop?: boolean, default false, no effect for one item
- history?: boolean, default true, one history entry without a URL change; Back closes the lightbox
- strings?: Partial<LightboxStrings>
- slots?: Partial<Record<LightboxSlotName, LightboxSlot>>
- getOrigin?: (index: number) => HTMLElement | null, read when the lightbox closes

LightboxItem additions: origin may also be a function () => HTMLElement | null.

LightboxSlotName: "toolbarStart" | "toolbarEnd" | "footer" | "aside".

LightboxSlot: (context: { lightbox: Lightbox; document: Document }) => { node: Node; update?: (state: LightboxState) => void; destroy?: () => void }. Slot elements take the theme's button style through the re-lightbox-button class and hide with the controls.

LightboxStrings: dialog ("Image gallery"), slide(index, count) ("Image 3 of 12"), counter(index, count) ("3 / 12"), close, previous, next, zoomIn, zoomOut, fullscreenEnter, fullscreenExit, download, thumbnails, thumbnail(index, count), slideshowStart, slideshowStop, loading, error, retry.

LightboxState additions: isAnimating (a flight, a spring page or an animated zoom), chrome ("shown" | "hidden").

LightboxEventName: "open" | "opened" | "change" | "settle" | "beforeclose" | "closed".

LightboxEvent: { type, index, slide: HTMLElement | null, defaultPrevented, preventDefault() }. beforeclose runs synchronously before the close flight is measured, and preventDefault keeps the dialog open.

Lightbox method additions:
- on(type: LightboxEventName, listener: (event: LightboxEvent) => void): () => void
- append(items: readonly LightboxItem[]): void
- setItems(items: readonly LightboxItem[], index?: number): void
- setOptions(options: Pick<LightboxOptions, "loop">): void
- getSlide(index: number): HTMLElement | null

bindLightboxGallery additions: groups by data-lightbox-group or a group(image) => string option, and an items(root) option that returns its own list.

CSS files: @reuse-sh/lightbox/base.css (layout and states, no colors or fonts, @layer re.base) and @reuse-sh/lightbox/theme.css (the default dark theme, @layer re.theme). Theme values are --re-lightbox-* custom properties. styles.css is removed.

### Close to the tile on screen

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
