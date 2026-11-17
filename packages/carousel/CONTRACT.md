# Shared carousel interface

This contract is shared with the lightbox worker. Keep these names and shapes stable. Additional options may be added only for an actual required behavior. Browser imports are safe before a DOM exists.

createCarousel(viewport: HTMLElement, options?: CarouselOptions): Carousel

CarouselOptions:
- slides?: string, defaults to [data-carousel-slide] descendants or direct element children when no marked slides exist
- align?: "start" | "center", default start
- loop?: boolean, default false
- drag?: boolean, default true
- group?: number | "page", default 1
- autoplay?: number, milliseconds, off by default
- releaseMotion?: "spring" | "native", default spring. A released mouse drag projects its speed 260ms ahead and travels to the snap point nearest that stop, at least one slide ahead after a flick, and never past the first slide on the way whose scroll-snap-stop is always. Spring starts at the drag speed and slows down without overshooting a target it moves toward; native uses the browser smooth scroll. Reduced motion jumps.
- releaseDuration?: number, milliseconds, default 260, the spring time for a slow release and for the return from a stretched end
- moveMotion?: "spring" | "native", default spring. next, prev, goTo, the arrow keys, Home and End travel on the same critically damped spring as a released drag, settling in 500ms. A move during a move redirects the spring, keeps its speed and counts from its target. The spring crosses the loop seam. native keeps the browser smooth scroll. goTo(index, "instant") and reduced motion jump.
- wheel?: "vertical", off by default. A vertical mouse wheel (line or page deltaMode, or |deltaY| >= 50 per event) moves one slide per notch and lets the page scroll once the strip cannot move that way; trackpads stay native.
- strings?: Partial<CarouselStrings>, the slide labels and announcements
- onChange?: (state: CarouselState) => void

CarouselState: index, count, progress, canPrev, canNext, isPlaying, isDragging, isLooping, pageCount, pageIndex, visible, autoplayProgress. index is zero-based; progress is 0..1. isLooping is true only while the slides can cover the viewport and the loop actually repeats them. pageCount is the number of distinct stops next() reaches from the first slide (fewer than count with group N or "page", or when the last slides share the end position), and pageIndex is the last page whose position is at or before the active slide's. visible lists the slides at least half inside the viewport, in index order, measured during scrolling and replaced only when it changes. autoplayProgress is the part of the autoplay wait that has passed, 0..1 in whole percents. getState returns a stable snapshot until something actually changes.

CarouselStrings: previous ("Previous slide"), next ("Next slide"), goTo(index, count) ("Go to slide 3 of 8"), counter(index, count) ("3 / 8"), slide(index, count) ("3 of 8"), play ("Play slideshow"), pause ("Pause slideshow"), progress ("Slide position"). index is zero-based, like the state's.

Carousel methods:
- next(), prev()
- goTo(index: number, behavior?: ScrollBehavior), defaults smooth except reduced motion
- getState(): CarouselState
- subscribe(listener: (state: CarouselState) => void): () => void
- refresh(): void, remeasure dynamic content while retaining the active element where possible
- setEnabled(enabled: boolean): void, temporarily suspend user scrolling and dragging, used for lightbox zoom
- play(), pause(), hold(reason: string, isHeld: boolean)
- setOptions(options: Pick<CarouselOptions, "autoplay" | "loop" | "group" | "align" | "drag">): void, applies the options it is given without rebuilding and keeps the active slide in place
- destroy(): void, idempotent, restore owned DOM/style/listeners and cancel all pending work

Autoplay waits for its interval, then moves on; on the last slide of a strip that does not loop it returns to the first slide the same way. Hover, focus, a drag, a hidden page, a strip less than half visible, reduced motion and hold() pause it and keep what is left of the wait. Any change of index starts the wait again. pause() by the visitor outlasts every hold(): releasing the holds does not resume it. --re-carousel-autoplay-progress on the viewport carries the passed part of the wait, written every frame while autoplay plays and left in place while it pauses.

DOM events on the viewport, bubbling, with the state in detail: re-carousel:change when index changes, re-carousel:settle when a move comes to rest, re-carousel:play and re-carousel:pause when isPlaying changes.

A goTo while the strip does not overflow (a hidden tab, display: none, images not loaded) only sets the index; the first refresh that finds overflow scrolls to that slide at once. A later goTo replaces it.

A div or span viewport without a role gets role="region" and aria-roledescription="carousel"; a div or span slide without a role gets role="group", aria-roledescription="slide" and, without its own label, aria-label from strings.slide. next(), prev() and the keys announce the slide they reach in a polite live region placed after the viewport when the carousel is created (on the first announcement for a viewport that had no parent then); autoplay, goTo from code, drags and swipes do not. destroy removes all of it.

A touch, a mouse press, a wheel and a scroll from outside the carousel stop a running spring where it is, and the strip snaps to the nearest point.

Viewport attributes: data-re-dragging while a mouse drag moves the strip (past 5px), data-re-scrolling during a fast scroll by the user, data-re-static when the content does not overflow, data-re-at-start and data-re-at-end at the edges (never while looping). data-re-scrolling starts with a scroll that begins within 100ms of a wheel or a pressed pointer move, ends once the speed over a window of at least 64ms falls below 0.1 px/ms or 150ms after the last scroll event, and returns only above 0.5 px/ms. Moves from code never set it. The package CSS turns off pointer events on the slides while it is set, and hides [data-carousel-prev], [data-carousel-next] and [data-carousel-dots] inside the parent of a static strip. destroy removes every attribute.

Custom properties: --re-carousel-press-scale (0.96, 1 turns it off) scales the slides while data-re-dragging is set, over --re-carousel-press-duration (300ms), and back over twice that. Snapping returns once the slides are back to full size, because snap areas follow transforms.

Scroll snap type is read on refresh: mandatory snaps as before, proximity snaps a released drag only when its stop is within a third of the snapport of a snap point and otherwise glides and stops, none lets a released drag glide and stop, and next and prev step from the nearest slide start.

A mouse drag that starts inside a nested strip with room to scroll moves that strip only; one that fits lets the outer strip move. Slides inside another slide belong to the nested strip. Mouse drag listeners are added on the first pointer move over an overflowing strip while (hover: hover) and (pointer: fine) matches; measuring and keys work at once. ResizeObserver, MutationObserver and, without ResizeObserver, the window resize event request a refresh, which runs at most once per animation frame. An explicit refresh() runs at once.

A mouse drag past either end of a non-repeating strip stretches it with a rubber band curve through the slides' CSS translate, which replaces a slide's own translate while it lasts, and a spring brings it back after release or any interruption, native release included; reduced motion and an instant or auto goTo drop it at once. A wheel does not stop that return. A mouse press while the strip is visibly moving (a spring, or a scroll in the last 100ms) stops it and does not click. While a mouse drag can move the strip, the viewport cursor is grab, and grabbing during a drag; destroy restores both the transforms and the cursor.

When disabled, the current viewport position stays stable. No global keyboard interception. Keyboard controls only handle events within the viewport and prevent their own handled event so modal owners do not act twice.

The React adapter belongs to the package and uses this same controller, not a duplicate geometry implementation. Controls may be rendered by the owner. Native touch and trackpad scrolling remain browser scrolling. Looping must preserve original interactive slide behavior and must not leave duplicate ids or stale transformations on destroy.

Main entry: connectThumbnails(main: Carousel, thumbnails: Carousel): () => void sets the thumbnail strip to align: "center", keeps the main strip's slide active in it (at once the first time, on the spring after that), sets aria-current="true" on that thumbnail and sends the main strip to a clicked thumbnail's slide, announced. The returned function restores the alignment and removes the mark and the listener.

Entry point @reuse-sh/carousel/controls: bindCarouselControls(root: HTMLElement, carousel: Carousel, options?: { strings?: Partial<CarouselStrings>; dotsWindow?: number }): () => void binds, inside root and on elements whose data-carousel-controls is the viewport id:
- [data-carousel-prev], [data-carousel-next]: click, disabled (aria-disabled on other elements) at the ends, aria-controls, a label from strings when the element has no text or label
- [data-carousel-dots]: one button per page when it holds no buttons, its own buttons in page order otherwise; aria-current="true" on the active page; a click goes to the page, announced. dotsWindow: N shows at most N dots and moves the window only when the active dot would reach its outer two (for N of 3 or more) or leave it (N of 1 or 2); on a side with more pages, the outermost shown dot gets data-edge="far" and the next data-edge="near"
- [data-carousel-counter]: one text node with strings.counter(index, count), written only when the text changes; with data-roll each new text rolls in over 200ms, up going forward and down going back, and without the roll under reduced motion
- [data-carousel-play]: play() and pause() by the visitor, aria-pressed="true" and the strings.pause label while autoplay is requested, aria-pressed="false" and strings.play otherwise
- [data-carousel-progress]: role="slider" over pages (aria-valuemin 1, aria-valuemax pageCount, aria-valuenow pageIndex + 1, aria-valuetext strings.slide), --re-carousel-progress with the strip progress, a pointer drag that goes to the nearest page, ArrowRight, ArrowUp and PageUp forward, ArrowLeft, ArrowDown and PageDown back (left and right swap in right-to-left layouts), Home and End
Controls inside an element whose data-carousel-controls names another viewport are left to that one, unless that element also holds root. Announcements use the carousel's strings. The binder gives the viewport a generated id when it has none. The returned function removes every listener, created element and attribute it added and restores the ones it changed.

## Planned

The carousel and lightbox work in progress adds the names below. They are fixed now so the lightbox and the controls can be built against them. Each moves into the sections above once the code ships it.

### Effects, marquee and groups

CarouselState additions: seamSlides (readonly number[], slides seen while crossing the loop seam).

Carousel method additions:
- take(owner: string, options?: { onInterrupt?: () => void }): { setPosition(px: number): void; release(): void }. While taken, snapping, autoplay and the spring stop and setPosition wraps through the loop seam. A user drag or touch takes the position back and calls onInterrupt. release restores snapping. Under reduced motion setPosition does nothing.

Slide state: the loop shifts a slide through --re-carousel-shift (px), applied by the package CSS as translate, and leaves the slide's own transform and translate alone. data-re-cycle holds the period (-1, 0, 1). --re-carousel-offset is the slide center's distance from the alignment point in slide widths, updated every frame while the strip moves.

With group: N only the first slide of each group snaps; with group: "page" the first slide of each page does. Other slides get scroll-snap-align: none, restored on destroy.
