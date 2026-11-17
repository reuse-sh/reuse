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
- onChange?: (state: CarouselState) => void

CarouselState: index, count, progress, canPrev, canNext, isPlaying, isDragging, isLooping. index is zero-based; progress is 0..1. isLooping is true only while the slides can cover the viewport and the loop actually repeats them. getState returns a stable snapshot until something actually changes.

Carousel methods:
- next(), prev()
- goTo(index: number, behavior?: ScrollBehavior), defaults smooth except reduced motion
- getState(): CarouselState
- subscribe(listener: (state: CarouselState) => void): () => void
- refresh(): void, remeasure dynamic content while retaining the active element where possible
- setEnabled(enabled: boolean): void, temporarily suspend user scrolling and dragging, used for lightbox zoom
- play(), pause(), hold(reason: string, isHeld: boolean)
- destroy(): void, idempotent, restore owned DOM/style/listeners and cancel all pending work

A mouse drag past either end of a non-repeating strip stretches it with a rubber band curve through the slides' CSS translate, which replaces a slide's own translate while it lasts, and a spring brings it back after release or any interruption, native release included; reduced motion and an instant or auto goTo drop it at once. A wheel does not stop that return. A mouse press while the strip is visibly moving (a spring, or a scroll in the last 100ms) stops it and does not click. While a mouse drag can move the strip, the viewport cursor is grab, and grabbing during a drag; destroy restores both the transforms and the cursor.

When disabled, the current viewport position stays stable. No global keyboard interception. Keyboard controls only handle events within the viewport and prevent their own handled event so modal owners do not act twice.

The React adapter belongs to the package and uses this same controller, not a duplicate geometry implementation. Controls may be rendered by the owner. Native touch and trackpad scrolling remain browser scrolling. Looping must preserve original interactive slide behavior and must not leave duplicate ids or stale transformations on destroy.

## Planned

The carousel and lightbox work in progress adds the names below. They are fixed now so the lightbox and the controls can be built against them. Each moves into the sections above once the code ships it.

### One motion, DOM state and input

CarouselOptions:
- moveMotion?: "spring" | "native", default spring. next, prev, goTo, the arrow keys, Home and End travel on the same critically damped spring as a released drag, settling in 500ms; native keeps the browser smooth scroll. goTo(index, "instant") and reduced motion jump.
- wheel?: "vertical", off by default. A vertical mouse wheel (line or page deltaMode, or |deltaY| >= 50 per event) moves one slide per notch; trackpads stay native.

Viewport attributes: data-re-dragging while a mouse drag moves the strip (past 5px), data-re-scrolling during a fast scroll by the user, data-re-static when the content does not overflow, data-re-at-start and data-re-at-end at the edges (never while looping). The package CSS hides [data-carousel-prev], [data-carousel-next] and [data-carousel-dots] inside a container whose strip is static.

Custom properties: --re-carousel-press-scale (0.96, 1 turns it off) and --re-carousel-press-duration.

Scroll snap type is read on refresh: mandatory snaps as today, proximity snaps a released drag only near a snap point, none lets it glide and stop. Observers request a refresh, which runs at most once per animation frame; an explicit refresh() runs at once.

### Controls, state and events

CarouselOptions:
- strings?: Partial<CarouselStrings>

CarouselState additions: pageCount, pageIndex, visible (readonly number[], slides at least half visible), autoplayProgress (0..1).

Carousel method additions:
- setOptions(options: Pick<CarouselOptions, "autoplay" | "loop" | "group" | "align" | "drag">): void, keeps the position

CarouselStrings: previous ("Previous slide"), next ("Next slide"), goTo(index, count) ("Go to slide 3 of 8"), counter(index, count) ("3 / 8"), slide(index, count) ("3 of 8"), play ("Play slideshow"), pause ("Pause slideshow"), progress ("Slide position").

DOM events on the viewport, bubbling, with the state in detail: re-carousel:change, re-carousel:settle, re-carousel:play, re-carousel:pause.

Custom property: --re-carousel-autoplay-progress on the viewport.

A goTo before the strip overflows is kept and runs on the first refresh that finds overflow. pause() by the visitor outlasts every hold().

Entry point @reuse-sh/carousel/controls:
- bindCarouselControls(root: HTMLElement, carousel: Carousel, options?: { strings?: Partial<CarouselStrings>; dotsWindow?: number }): () => void. Binds [data-carousel-prev], [data-carousel-next], [data-carousel-dots], [data-carousel-counter] (data-roll), [data-carousel-play] and [data-carousel-progress], also outside root through data-carousel-controls="<viewport id>". The returned function removes every listener and created element.

Main entry addition:
- connectThumbnails(main: Carousel, thumbnails: Carousel): () => void. Keeps the active thumbnail visible and centered, sets aria-current="true" on it, and moves the main strip on a thumbnail click.

### Effects, marquee and groups

CarouselState additions: seamSlides (readonly number[], slides seen while crossing the loop seam).

Carousel method additions:
- take(owner: string, options?: { onInterrupt?: () => void }): { setPosition(px: number): void; release(): void }. While taken, snapping, autoplay and the spring stop and setPosition wraps through the loop seam. A user drag or touch takes the position back and calls onInterrupt. release restores snapping. Under reduced motion setPosition does nothing.

Slide state: the loop shifts a slide through --re-carousel-shift (px), applied by the package CSS as translate, and leaves the slide's own transform and translate alone. data-re-cycle holds the period (-1, 0, 1). --re-carousel-offset is the slide center's distance from the alignment point in slide widths, updated every frame while the strip moves.

With group: N only the first slide of each group snaps; with group: "page" the first slide of each page does. Other slides get scroll-snap-align: none, restored on destroy.
