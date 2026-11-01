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
- releaseMotion?: "spring" | "native", default spring. A released mouse drag travels to its snap point with a critically damped spring that starts at the drag speed; native uses the browser smooth scroll. Reduced motion jumps.
- releaseDuration?: number, milliseconds, default 260, the spring travel time
- onChange?: (state: CarouselState) => void

CarouselState: index, count, progress, canPrev, canNext, isPlaying, isDragging. index is zero-based; progress is 0..1. getState returns a stable snapshot until something actually changes.

Carousel methods:
- next(), prev()
- goTo(index: number, behavior?: ScrollBehavior), defaults smooth except reduced motion
- getState(): CarouselState
- subscribe(listener: (state: CarouselState) => void): () => void
- refresh(): void, remeasure dynamic content while retaining the active element where possible
- setEnabled(enabled: boolean): void, temporarily suspend user scrolling and dragging, used for lightbox zoom
- play(), pause(), hold(reason: string, isHeld: boolean)
- destroy(): void, idempotent, restore owned DOM/style/listeners and cancel all pending work

When disabled, the current viewport position stays stable. No global keyboard interception. Keyboard controls only handle events within the viewport and prevent their own handled event so modal owners do not act twice.

The React adapter belongs to the package and uses this same controller, not a duplicate geometry implementation. Controls may be rendered by the owner. Native touch and trackpad scrolling remain browser scrolling. Looping must preserve original interactive slide behavior and must not leave duplicate ids or stale transformations on destroy.
